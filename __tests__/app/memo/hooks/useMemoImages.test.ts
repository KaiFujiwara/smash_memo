/**
 * useMemoImagesフックのテスト
 *
 * 画像の追加・削除・保存処理のロジックをテストします。
 */

import { renderHook, act, waitFor } from '@testing-library/react'

// モックの実装を保持するオブジェクト
const mocks = {
  getMemoImagesByContent: jest.fn(),
  getMemoImageUrl: jest.fn(),
  uploadMemoImage: jest.fn(),
  deleteMemoImage: jest.fn(),
  validateImageFile: jest.fn(),
}

// memoImageServiceのモック
jest.mock('@/services/memoImageService', () => ({
  getMemoImagesByContent: (...args: unknown[]) => mocks.getMemoImagesByContent(...args),
  getMemoImageUrl: (...args: unknown[]) => mocks.getMemoImageUrl(...args),
  uploadMemoImage: (...args: unknown[]) => mocks.uploadMemoImage(...args),
  deleteMemoImage: (...args: unknown[]) => mocks.deleteMemoImage(...args),
  validateImageFile: (...args: unknown[]) => mocks.validateImageFile(...args),
}))

// UUIDのモック
let uuidCounter = 0
jest.mock('uuid', () => ({
  v4: () => `mock-uuid-${++uuidCounter}`,
}))

// URL.createObjectURL / revokeObjectURLのモック
const mockCreateObjectURL = jest.fn((file: File) => `blob:${file.name}`)
const mockRevokeObjectURL = jest.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

// フックのインポート
import { useMemoImages } from '@/app/(protected)/memo/[characterId]/hooks/useMemoImages'

describe('useMemoImages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    uuidCounter = 0
    // デフォルトのモック設定
    mocks.getMemoImagesByContent.mockResolvedValue([])
    mocks.getMemoImageUrl.mockResolvedValue('https://example.com/image.jpg')
    mocks.validateImageFile.mockReturnValue({ valid: true })
    mocks.uploadMemoImage.mockResolvedValue({ success: true, image: { id: 'new-image' } })
    mocks.deleteMemoImage.mockResolvedValue({ success: true })
  })

  describe('初期化', () => {
    it('memoContentIdがundefinedの場合、空の状態で初期化される', async () => {
      const { result } = renderHook(() => useMemoImages(undefined))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.existingImages).toEqual([])
      expect(result.current.pendingAdds).toEqual([])
      expect(result.current.pendingDeletes).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('memoContentIdがある場合、画像を読み込む', async () => {
      const mockImages = [
        { id: 'img-1', s3Key: 'key-1', fileName: 'test.jpg', fileSize: 1000, mimeType: 'image/jpeg', order: 1 },
      ]
      mocks.getMemoImagesByContent.mockResolvedValue(mockImages)
      mocks.getMemoImageUrl.mockResolvedValue('https://example.com/signed-url')

      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mocks.getMemoImagesByContent).toHaveBeenCalledWith('content-1')
      expect(result.current.existingImages).toHaveLength(1)
      expect(result.current.existingImages[0].url).toBe('https://example.com/signed-url')
    })

    it('画像読み込みに失敗した場合、エラーが設定される', async () => {
      mocks.getMemoImagesByContent.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('画像の読み込みに失敗しました')
    })
  })

  describe('addPending', () => {
    it('有効なファイルを追加できる', async () => {
      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        const addResult = result.current.addPending(file)
        expect(addResult.success).toBe(true)
      })

      expect(result.current.pendingAdds).toHaveLength(1)
      expect(result.current.pendingAdds[0].fileName).toBe('test.jpg')
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file)
    })

    it('バリデーションに失敗した場合、エラーを返す', async () => {
      mocks.validateImageFile.mockReturnValue({ valid: false, error: 'ファイルサイズが大きすぎます' })

      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const file = new File(['test'], 'large.jpg', { type: 'image/jpeg' })

      act(() => {
        const addResult = result.current.addPending(file)
        expect(addResult.success).toBe(false)
        expect(addResult.error).toBe('ファイルサイズが大きすぎます')
      })

      expect(result.current.pendingAdds).toHaveLength(0)
    })

    it('100件制限を超える場合、エラーを返す', async () => {
      // 既存画像が99件ある状態を作成
      const mockImages = Array.from({ length: 99 }, (_, i) => ({
        id: `img-${i}`,
        s3Key: `key-${i}`,
        fileName: `test${i}.jpg`,
        fileSize: 1000,
        mimeType: 'image/jpeg',
        order: i,
      }))
      mocks.getMemoImagesByContent.mockResolvedValue(mockImages)

      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.existingImages).toHaveLength(99)
      })

      // 1件追加（100件目）
      const file1 = new File(['test'], 'test1.jpg', { type: 'image/jpeg' })
      act(() => {
        const addResult = result.current.addPending(file1)
        expect(addResult.success).toBe(true)
      })

      // 2件目追加（101件目）- 失敗するはず
      const file2 = new File(['test'], 'test2.jpg', { type: 'image/jpeg' })
      act(() => {
        const addResult = result.current.addPending(file2)
        expect(addResult.success).toBe(false)
        expect(addResult.error).toBe('画像は100件まで添付できます')
      })
    })
  })

  describe('cancelPendingAdd', () => {
    it('追加予定の画像をキャンセルできる', async () => {
      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.addPending(file)
      })

      const tempId = result.current.pendingAdds[0].tempId

      act(() => {
        result.current.cancelPendingAdd(tempId)
      })

      expect(result.current.pendingAdds).toHaveLength(0)
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('markForDelete / cancelPendingDelete', () => {
    it('既存画像を削除予定にマークできる', async () => {
      const mockImages = [
        { id: 'img-1', s3Key: 'key-1', fileName: 'test.jpg', fileSize: 1000, mimeType: 'image/jpeg', order: 1 },
      ]
      mocks.getMemoImagesByContent.mockResolvedValue(mockImages)

      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.existingImages).toHaveLength(1)
      })

      act(() => {
        result.current.markForDelete('img-1', 'key-1')
      })

      expect(result.current.pendingDeletes).toHaveLength(1)
      expect(result.current.pendingDeletes[0].imageId).toBe('img-1')
    })

    it('削除予定をキャンセルできる', async () => {
      const mockImages = [
        { id: 'img-1', s3Key: 'key-1', fileName: 'test.jpg', fileSize: 1000, mimeType: 'image/jpeg', order: 1 },
      ]
      mocks.getMemoImagesByContent.mockResolvedValue(mockImages)

      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.existingImages).toHaveLength(1)
      })

      act(() => {
        result.current.markForDelete('img-1', 'key-1')
      })

      act(() => {
        result.current.cancelPendingDelete('img-1')
      })

      expect(result.current.pendingDeletes).toHaveLength(0)
    })

    it('同じ画像を複数回マークしても1件のみ', async () => {
      const mockImages = [
        { id: 'img-1', s3Key: 'key-1', fileName: 'test.jpg', fileSize: 1000, mimeType: 'image/jpeg', order: 1 },
      ]
      mocks.getMemoImagesByContent.mockResolvedValue(mockImages)

      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.existingImages).toHaveLength(1)
      })

      act(() => {
        result.current.markForDelete('img-1', 'key-1')
        result.current.markForDelete('img-1', 'key-1')
      })

      expect(result.current.pendingDeletes).toHaveLength(1)
    })
  })

  describe('save', () => {
    it('追加と削除を正常に保存できる', async () => {
      const mockImages = [
        { id: 'img-1', s3Key: 'key-1', fileName: 'existing.jpg', fileSize: 1000, mimeType: 'image/jpeg', order: 1 },
      ]
      mocks.getMemoImagesByContent.mockResolvedValue(mockImages)

      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.existingImages).toHaveLength(1)
      })

      // 画像を追加
      const file = new File(['test'], 'new.jpg', { type: 'image/jpeg' })
      act(() => {
        result.current.addPending(file)
      })

      // 画像を削除予定にマーク
      act(() => {
        result.current.markForDelete('img-1', 'key-1')
      })

      // 保存
      let saveResult: Awaited<ReturnType<typeof result.current.save>>
      await act(async () => {
        saveResult = await result.current.save()
      })

      expect(saveResult!.success).toBe(true)
      expect(saveResult!.uploadedCount).toBe(1)
      expect(saveResult!.deletedCount).toBe(1)
      expect(mocks.uploadMemoImage).toHaveBeenCalled()
      expect(mocks.deleteMemoImage).toHaveBeenCalledWith('img-1', 'key-1')
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })

    it('memoContentIdがundefinedの場合、エラーを返す', async () => {
      const { result } = renderHook(() => useMemoImages(undefined))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let saveResult: Awaited<ReturnType<typeof result.current.save>>
      await act(async () => {
        saveResult = await result.current.save()
      })

      expect(saveResult!.success).toBe(false)
      expect(saveResult!.error).toBe('メモが保存されていません')
    })

    it('二重保存を防止する', async () => {
      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      act(() => {
        result.current.addPending(file)
      })

      // uploadMemoImageを遅延させる
      mocks.uploadMemoImage.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

      // 1回目の保存を開始
      let firstSavePromise: Promise<unknown>
      act(() => {
        firstSavePromise = result.current.save()
      })

      // 2回目の保存を試行（ガードされるはず）
      let secondSaveResult: Awaited<ReturnType<typeof result.current.save>>
      await act(async () => {
        secondSaveResult = await result.current.save()
      })

      expect(secondSaveResult!.success).toBe(false)
      expect(secondSaveResult!.error).toBe('保存処理中です')

      // 1回目の保存を待つ
      await act(async () => {
        await firstSavePromise
      })
    })

    it('アップロード失敗時もURLを解放する', async () => {
      mocks.uploadMemoImage.mockResolvedValue({ success: false, error: 'Upload failed' })

      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      act(() => {
        result.current.addPending(file)
      })

      await act(async () => {
        const saveResult = await result.current.save()
        expect(saveResult.success).toBe(false)
        expect(saveResult.uploadFailedCount).toBe(1)
      })

      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })

    it('削除がthrowしても全件処理される', async () => {
      const mockImages = [
        { id: 'img-1', s3Key: 'key-1', fileName: 'test1.jpg', fileSize: 1000, mimeType: 'image/jpeg', order: 1 },
        { id: 'img-2', s3Key: 'key-2', fileName: 'test2.jpg', fileSize: 1000, mimeType: 'image/jpeg', order: 2 },
      ]
      mocks.getMemoImagesByContent.mockResolvedValue(mockImages)

      // 1件目はthrow、2件目は成功
      mocks.deleteMemoImage
        .mockRejectedValueOnce(new Error('Delete failed'))
        .mockResolvedValueOnce({ success: true })

      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.existingImages).toHaveLength(2)
      })

      act(() => {
        result.current.markForDelete('img-1', 'key-1')
        result.current.markForDelete('img-2', 'key-2')
      })

      let saveResult: Awaited<ReturnType<typeof result.current.save>>
      await act(async () => {
        saveResult = await result.current.save()
      })

      expect(saveResult!.deletedCount).toBe(1)
      expect(saveResult!.deleteFailedCount).toBe(1)
      expect(mocks.deleteMemoImage).toHaveBeenCalledTimes(2)
    })

    it('スナップショットに含まれないpendingは残る', async () => {
      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })
      act(() => {
        result.current.addPending(file1)
      })

      // uploadMemoImageを遅延させる
      mocks.uploadMemoImage.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50)))

      // 保存を開始
      let savePromise: Promise<unknown>
      act(() => {
        savePromise = result.current.save()
      })

      // 保存中に新しいファイルを追加
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      act(() => {
        result.current.addPending(file2)
      })

      // 保存を待つ
      await act(async () => {
        await savePromise
      })

      // 保存中に追加されたファイルは残っているはず
      expect(result.current.pendingAdds).toHaveLength(1)
      expect(result.current.pendingAdds[0].fileName).toBe('test2.jpg')
    })
  })

  describe('reset', () => {
    it('すべてのpending状態をリセットする', async () => {
      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      act(() => {
        result.current.addPending(file)
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.pendingAdds).toHaveLength(0)
      expect(result.current.pendingDeletes).toHaveLength(0)
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('memoContentId変更時', () => {
    it('pending状態がリセットされる', async () => {
      const { result, rerender } = renderHook(
        ({ memoContentId }) => useMemoImages(memoContentId),
        { initialProps: { memoContentId: 'content-1' } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      act(() => {
        result.current.addPending(file)
      })

      expect(result.current.pendingAdds).toHaveLength(1)

      // memoContentIdを変更
      rerender({ memoContentId: 'content-2' })

      await waitFor(() => {
        expect(result.current.pendingAdds).toHaveLength(0)
      })

      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })

    it('existingImagesがクリアされる', async () => {
      const mockImages = [
        { id: 'img-1', s3Key: 'key-1', fileName: 'test.jpg', fileSize: 1000, mimeType: 'image/jpeg', order: 1 },
      ]
      mocks.getMemoImagesByContent.mockResolvedValue(mockImages)

      const { result, rerender } = renderHook(
        ({ memoContentId }) => useMemoImages(memoContentId),
        { initialProps: { memoContentId: 'content-1' } }
      )

      await waitFor(() => {
        expect(result.current.existingImages).toHaveLength(1)
      })

      // memoContentIdを変更
      mocks.getMemoImagesByContent.mockResolvedValue([])
      rerender({ memoContentId: 'content-2' })

      // 即座にクリアされる
      expect(result.current.existingImages).toHaveLength(0)
    })
  })

  describe('changes', () => {
    it('変更がない場合、hasChangesはfalse', async () => {
      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.changes.hasChanges).toBe(false)
      expect(result.current.changes.addCount).toBe(0)
      expect(result.current.changes.deleteCount).toBe(0)
    })

    it('追加がある場合、正しくカウントされる', async () => {
      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      act(() => {
        result.current.addPending(file)
      })

      expect(result.current.changes.hasChanges).toBe(true)
      expect(result.current.changes.addCount).toBe(1)
    })

    it('削除がある場合、正しくカウントされる', async () => {
      const mockImages = [
        { id: 'img-1', s3Key: 'key-1', fileName: 'test.jpg', fileSize: 1000, mimeType: 'image/jpeg', order: 1 },
      ]
      mocks.getMemoImagesByContent.mockResolvedValue(mockImages)

      const { result } = renderHook(() => useMemoImages('content-1'))

      await waitFor(() => {
        expect(result.current.existingImages).toHaveLength(1)
      })

      act(() => {
        result.current.markForDelete('img-1', 'key-1')
      })

      expect(result.current.changes.hasChanges).toBe(true)
      expect(result.current.changes.deleteCount).toBe(1)
    })
  })
})
