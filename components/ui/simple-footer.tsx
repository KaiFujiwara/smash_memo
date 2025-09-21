import { FC } from 'react'

const SimpleFooter: FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-4 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <p className="text-[10px] text-gray-600 text-center">
          Copyright © smashmemo All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default SimpleFooter