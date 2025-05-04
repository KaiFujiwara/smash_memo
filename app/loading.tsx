import { FC } from 'react'

const Loading: FC = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white">
      <div className="space-y-4 text-center">
        <div className="inline-block">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 transition-all duration-300" />
        </div>
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    </div>
  )
}

export default Loading