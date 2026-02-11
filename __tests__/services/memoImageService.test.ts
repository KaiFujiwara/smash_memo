/**
 * memoImageService のテスト
 *
 * メモ画像サービスのビジネスロジックをテストします。
 * AWS Amplify Data/Storage APIのモックを使用しています。
 */

import {
  MAX_IMAGES_PER_MEMO,
  MAX_FILE_SIZE_BYTES,
} from '@/types/memoImage'

// モックの実装を保持するオブジェクト
const mocks = {
  memoImagesByMemoContent: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  uploadData: jest.fn(),
  remove: jest.fn(),
  getUrl: jest.fn(),
}

// Amplify Data クライアントのモック
jest.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      MemoImage: {
        memoImagesByMemoContent: (...args: unknown[]) => mocks.memoImagesByMemoContent(...args),
        create: (...args: unknown[]) => mocks.create(...args),
        delete: (...args: unknown[]) => mocks.delete(...args),
      },
    },
  }),
}))

// Amplify Storage のモック
jest.mock('aws-amplify/storage', () => ({
  uploadData: (...args: unknown[]) => {
    mocks.uploadData(...args)
    return { result: Promise.resolve() }
  },
  remove: (...args: unknown[]) => mocks.remove(...args),
  getUrl: (...args: unknown[]) => mocks.getUrl(...args),
}))

// Amplify Auth のモック
jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn().mockResolvedValue({
    identityId: 'mock-identity-id',
  }),
}))

// UUID のモック
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}))

// サービスのインポート
import {
  getMemoImagesByContent,
  getMemoImageUrl,
  validateImageFile,
  uploadMemoImage,
  deleteMemoImage,
  deleteMemoImagesByContent,
  clearUrlCache,
} from '@/services/memoImageService'

describe('memoImageService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // URLキャッシュをクリア
    clearUrlCache()
  })

  describe('getMemoImagesByContent', () => {
    it('指定されたMemoContentの画像一覧を取得する', async () => {
      const mockImages = [
        {
          id: 'image-1',
          memoContentId: 'content-1',
          s3Key: 'memo-images/user/content-1/img1.jpg',
          fileName: 'test1.jpg',
          fileSize: 1000,
          mimeType: 'image/jpeg',
          order: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          owner: 'user-1',
        },
        {
          id: 'image-2',
          memoContentId: 'content-1',
          s3Key: 'memo-images/user/content-1/img2.png',
          fileName: 'test2.png',
          fileSize: 2000,
          mimeType: 'image/png',
          order: 2,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          owner: 'user-1',
        },
      ]

      mocks.memoImagesByMemoContent.mockResolvedValue({
        data: mockImages,
        errors: null,
      })

      const result = await getMemoImagesByContent('content-1')

      expect(mocks.memoImagesByMemoContent).toHaveBeenCalledWith({
        memoContentId: 'content-1',
      })
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('image-1')
      expect(result[1].id).toBe('image-2')
    })

    it('画像がない場合は空配列を返す', async () => {
      mocks.memoImagesByMemoContent.mockResolvedValue({
        data: [],
        errors: null,
      })

      const result = await getMemoImagesByContent('content-empty')

      expect(result).toEqual([])
    })

    it('エラーが発生した場合は例外をスローする', async () => {
      mocks.memoImagesByMemoContent.mockResolvedValue({
        data: null,
        errors: [{ message: 'Database error' }],
      })

      await expect(getMemoImagesByContent('content-1')).rejects.toThrow(
        'メモ画像の取得に失敗しました'
      )
    })
  })

  describe('getMemoImageUrl', () => {
    it('署名付きURLを取得する', async () => {
      const mockUrl = new URL('https://s3.amazonaws.com/bucket/image.jpg?signature=xxx')
      mocks.getUrl.mockResolvedValue({ url: mockUrl })

      const result = await getMemoImageUrl('memo-images/user/content-1/img.jpg')

      expect(mocks.getUrl).toHaveBeenCalledWith({
        path: 'memo-images/user/content-1/img.jpg',
        options: { expiresIn: 3600 },
      })
      expect(result).toBe(mockUrl.toString())
    })

    it('カスタムの有効期限を指定できる', async () => {
      const mockUrl = new URL('https://s3.amazonaws.com/bucket/image.jpg')
      mocks.getUrl.mockResolvedValue({ url: mockUrl })

      await getMemoImageUrl('memo-images/user/content-1/img.jpg', 7200)

      expect(mocks.getUrl).toHaveBeenCalledWith({
        path: 'memo-images/user/content-1/img.jpg',
        options: { expiresIn: 7200 },
      })
    })

    it('エラーが発生した場合は例外をスローする', async () => {
      mocks.getUrl.mockRejectedValue(new Error('S3 error'))

      await expect(getMemoImageUrl('invalid-key')).rejects.toThrow(
        '画像URLの取得に失敗しました'
      )
    })

    it('キャッシュされたURLを返す（2回目はAPIを呼ばない）', async () => {
      const mockUrl = new URL('https://s3.amazonaws.com/bucket/cached.jpg')
      mocks.getUrl.mockResolvedValue({ url: mockUrl })

      // 1回目の呼び出し
      const result1 = await getMemoImageUrl('memo-images/cached/img.jpg')
      expect(mocks.getUrl).toHaveBeenCalledTimes(1)
      expect(result1).toBe(mockUrl.toString())

      // 2回目の呼び出し（キャッシュから取得）
      const result2 = await getMemoImageUrl('memo-images/cached/img.jpg')
      expect(mocks.getUrl).toHaveBeenCalledTimes(1) // 呼び出し回数は増えない
      expect(result2).toBe(mockUrl.toString())
    })

    it('clearUrlCacheでキャッシュをクリアできる', async () => {
      const mockUrl = new URL('https://s3.amazonaws.com/bucket/clear.jpg')
      mocks.getUrl.mockResolvedValue({ url: mockUrl })

      // 1回目の呼び出し
      await getMemoImageUrl('memo-images/clear/img.jpg')
      expect(mocks.getUrl).toHaveBeenCalledTimes(1)

      // キャッシュクリア
      clearUrlCache('memo-images/clear/img.jpg')

      // 2回目の呼び出し（キャッシュがクリアされたのでAPIを呼ぶ）
      await getMemoImageUrl('memo-images/clear/img.jpg')
      expect(mocks.getUrl).toHaveBeenCalledTimes(2)
    })
  })

  describe('validateImageFile', () => {
    const createMockFile = (
      name: string,
      size: number,
      type: string
    ): File => {
      const file = new File([''], name, { type })
      Object.defineProperty(file, 'size', { value: size, writable: false })
      return file
    }

    describe('MIMEタイプのバリデーション', () => {
      it('JPEGファイルは有効', () => {
        const file = createMockFile('test.jpg', 1000, 'image/jpeg')
        const result = validateImageFile(file)
        expect(result.valid).toBe(true)
      })

      it('PNGファイルは有効', () => {
        const file = createMockFile('test.png', 1000, 'image/png')
        const result = validateImageFile(file)
        expect(result.valid).toBe(true)
      })

      it('GIFファイルは有効', () => {
        const file = createMockFile('test.gif', 1000, 'image/gif')
        const result = validateImageFile(file)
        expect(result.valid).toBe(true)
      })

      it('WebPファイルは有効', () => {
        const file = createMockFile('test.webp', 1000, 'image/webp')
        const result = validateImageFile(file)
        expect(result.valid).toBe(true)
      })

      it('サポートされていないMIMEタイプはエラー', () => {
        const file = createMockFile('test.bmp', 1000, 'image/bmp')
        const result = validateImageFile(file)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('サポートされていない画像形式')
      })

      it('PDFファイルはエラー', () => {
        const file = createMockFile('test.pdf', 1000, 'application/pdf')
        const result = validateImageFile(file)
        expect(result.valid).toBe(false)
      })
    })

    describe('ファイルサイズのバリデーション', () => {
      it('5MB以下のファイルは有効', () => {
        const file = createMockFile('test.jpg', MAX_FILE_SIZE_BYTES, 'image/jpeg')
        const result = validateImageFile(file)
        expect(result.valid).toBe(true)
      })

      it('5MBを超えるファイルはエラー', () => {
        const file = createMockFile('test.jpg', MAX_FILE_SIZE_BYTES + 1, 'image/jpeg')
        const result = validateImageFile(file)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('5MB以下')
      })

      it('1バイトのファイルは有効', () => {
        const file = createMockFile('test.jpg', 1, 'image/jpeg')
        const result = validateImageFile(file)
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('uploadMemoImage', () => {
    const createMockFile = (
      name: string,
      size: number,
      type: string
    ): File => {
      const file = new File(['test content'], name, { type })
      Object.defineProperty(file, 'size', { value: size, writable: false })
      return file
    }

    it('画像を正常にアップロードする', async () => {
      const file = createMockFile('test.jpg', 1000, 'image/jpeg')
      const mockCreatedImage = {
        id: 'new-image-id',
        memoContentId: 'content-1',
        s3Key: 'memo-images/mock-identity-id/content-1/mock-uuid.jpg',
        fileName: 'test.jpg',
        fileSize: 1000,
        mimeType: 'image/jpeg',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      mocks.create.mockResolvedValue({
        data: mockCreatedImage,
        errors: null,
      })

      const result = await uploadMemoImage('content-1', file, 0)

      expect(result.success).toBe(true)
      expect(result.image).toBeDefined()
      expect(result.image?.id).toBe('new-image-id')
      expect(mocks.uploadData).toHaveBeenCalled()
      expect(mocks.create).toHaveBeenCalled()
    })

    it('ファイルバリデーションに失敗した場合はエラーを返す', async () => {
      const file = createMockFile('test.bmp', 1000, 'image/bmp')

      const result = await uploadMemoImage('content-1', file, 0)

      expect(result.success).toBe(false)
      expect(result.error).toContain('サポートされていない画像形式')
      expect(mocks.uploadData).not.toHaveBeenCalled()
    })

    it('100件制限を超えた場合はエラーを返す', async () => {
      const file = createMockFile('test.jpg', 1000, 'image/jpeg')

      const result = await uploadMemoImage('content-1', file, MAX_IMAGES_PER_MEMO)

      expect(result.success).toBe(false)
      expect(result.error).toContain('100件まで')
      expect(mocks.uploadData).not.toHaveBeenCalled()
    })

    it('メタデータ保存に失敗した場合はS3ファイルを削除する', async () => {
      const file = createMockFile('test.jpg', 1000, 'image/jpeg')

      mocks.create.mockResolvedValue({
        data: null,
        errors: [{ message: 'Database error' }],
      })

      const result = await uploadMemoImage('content-1', file, 0)

      expect(result.success).toBe(false)
      expect(mocks.remove).toHaveBeenCalled() // ロールバック
    })
  })

  describe('deleteMemoImage', () => {
    it('画像を正常に削除する', async () => {
      mocks.delete.mockResolvedValue({ errors: null })
      mocks.remove.mockResolvedValue(undefined)

      const result = await deleteMemoImage('image-1', 'memo-images/user/content-1/img.jpg')

      expect(result.success).toBe(true)
      expect(mocks.delete).toHaveBeenCalledWith({ id: 'image-1' })
      expect(mocks.remove).toHaveBeenCalledWith({
        path: 'memo-images/user/content-1/img.jpg',
      })
    })

    it('メタデータ削除に失敗した場合はエラーを返す', async () => {
      mocks.delete.mockResolvedValue({
        errors: [{ message: 'Delete error' }],
      })

      const result = await deleteMemoImage('image-1', 'memo-images/user/content-1/img.jpg')

      expect(result.success).toBe(false)
      expect(mocks.remove).not.toHaveBeenCalled()
    })
  })

  describe('deleteMemoImagesByContent', () => {
    it('MemoContentに関連する全画像を削除する', async () => {
      const mockImages = [
        {
          id: 'image-1',
          memoContentId: 'content-1',
          s3Key: 'memo-images/user/content-1/img1.jpg',
          fileName: 'test1.jpg',
          fileSize: 1000,
          mimeType: 'image/jpeg',
          order: 1,
        },
        {
          id: 'image-2',
          memoContentId: 'content-1',
          s3Key: 'memo-images/user/content-1/img2.png',
          fileName: 'test2.png',
          fileSize: 2000,
          mimeType: 'image/png',
          order: 2,
        },
      ]

      mocks.memoImagesByMemoContent.mockResolvedValue({
        data: mockImages,
        errors: null,
      })
      mocks.delete.mockResolvedValue({ errors: null })
      mocks.remove.mockResolvedValue(undefined)

      const result = await deleteMemoImagesByContent('content-1')

      expect(result.success).toBe(true)
      expect(result.deletedCount).toBe(2)
      expect(mocks.delete).toHaveBeenCalledTimes(2)
      expect(mocks.remove).toHaveBeenCalledTimes(2)
    })

    it('画像がない場合は成功を返す', async () => {
      mocks.memoImagesByMemoContent.mockResolvedValue({
        data: [],
        errors: null,
      })

      const result = await deleteMemoImagesByContent('content-empty')

      expect(result.success).toBe(true)
      expect(result.deletedCount).toBe(0)
    })

    it('一部の削除に失敗した場合はエラーを含む結果を返す', async () => {
      const mockImages = [
        {
          id: 'image-1',
          memoContentId: 'content-1',
          s3Key: 'memo-images/user/content-1/img1.jpg',
          fileName: 'test1.jpg',
          fileSize: 1000,
          mimeType: 'image/jpeg',
          order: 1,
        },
        {
          id: 'image-2',
          memoContentId: 'content-1',
          s3Key: 'memo-images/user/content-1/img2.png',
          fileName: 'test2.png',
          fileSize: 2000,
          mimeType: 'image/png',
          order: 2,
        },
      ]

      mocks.memoImagesByMemoContent.mockResolvedValue({
        data: mockImages,
        errors: null,
      })
      // 1つ目は成功、2つ目は失敗
      mocks.delete
        .mockResolvedValueOnce({ errors: null })
        .mockResolvedValueOnce({ errors: [{ message: 'Error' }] })
      mocks.remove.mockResolvedValue(undefined)

      const result = await deleteMemoImagesByContent('content-1')

      expect(result.success).toBe(false)
      expect(result.deletedCount).toBe(1)
      expect(result.error).toContain('1件の画像削除に失敗')
    })
  })
})
