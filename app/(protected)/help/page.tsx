'use client'

import { ExternalLink, Mail, FileText, Shield } from 'lucide-react'

export default function HelpPage() {
  const contactFormUrl = process.env.NEXT_PUBLIC_CONTACT_FORM_URL

  const handleContactClick = () => {
    if (contactFormUrl) {
      window.open(contactFormUrl, '_blank')
    } else {
      alert('お問い合わせフォームのURLが設定されていません。')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* お問い合わせセクション */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail size={24} />
          お問い合わせ
        </h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            ご質問やご要望、不具合報告などがございましたら、お気軽にお問い合わせください。
          </p>
          <button
            onClick={handleContactClick}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Mail size={20} />
            お問い合わせフォームを開く
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {/* 利用規約・プライバシーポリシーセクション */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={24} />
          規約・ポリシー
        </h2>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <FileText size={20} className="text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">利用規約</h3>
                <p className="text-sm text-gray-600">サービスの利用規約</p>
              </div>
              <ExternalLink size={16} className="text-gray-400 ml-auto" />
            </a>
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Shield size={20} className="text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">プライバシーポリシー</h3>
                <p className="text-sm text-gray-600">個人情報の取り扱い</p>
              </div>
              <ExternalLink size={16} className="text-gray-400 ml-auto" />
            </a>
          </div>
        </div>
      </div>

      {/* 免責事項セクション */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">免責事項</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
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
    </div>
  )
}