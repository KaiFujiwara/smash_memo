'use client'

import { ExternalLink, Mail, FileText, Shield } from 'lucide-react'
import { useProtectedTranslations } from '@/hooks/useProtectedTranslations'
import jaTranslations from './locales/ja.json'
import enTranslations from './locales/en.json'
import zhTranslations from './locales/zh.json'

export default function HelpPage() {
  // 言語検出と翻訳テキスト取得（メタデータはlayoutで処理）
  const { t } = useProtectedTranslations(jaTranslations, enTranslations, zhTranslations)
  const handleTwitterContact = () => {
    window.open('https://x.com/minaissb', '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* お問い合わせセクション */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail size={24} />
          {t.contact.title}
        </h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            {t.contact.description}
          </p>
          <button
            onClick={handleTwitterContact}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Mail size={20} />
            {t.contact.button}
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {/* 利用規約・プライバシーポリシーセクション */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={24} />
          {t.policies.title}
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
                <h3 className="font-medium text-gray-900">{t.policies.terms.title}</h3>
                <p className="text-sm text-gray-600">{t.policies.terms.description}</p>
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
                <h3 className="font-medium text-gray-900">{t.policies.privacy.title}</h3>
                <p className="text-sm text-gray-600">{t.policies.privacy.description}</p>
              </div>
              <ExternalLink size={16} className="text-gray-400 ml-auto" />
            </a>
          </div>
        </div>
      </div>

      {/* 免責事項セクション */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.disclaimer.title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {t.disclaimer.content}
        </p>
      </div>
    </div>
  )
}