import { FC } from 'react'

const Footer: FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <p className="text-[10px] text-gray-600 text-center leading-relaxed">
          大乱闘スマッシュブラザーズは、任天堂株式会社様の登録商標です。
          <br />
          当サイトは個人のスマブラファンが運営する非公式のWebサービスです。
          <br />
          任天堂株式会社様、他関連企業様とは一切関係ありません。
          <br />
          下記はサイト独自の内容に関する著作権を示すものです。
          <br />
          Copyright © 2025 smashmemo All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer