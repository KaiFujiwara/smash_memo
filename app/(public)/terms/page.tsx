import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '利用規約 | スマメモ',
  description: 'スマメモの利用規約',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">利用規約</h1>
        
        <div className="space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">第1条（適用）</h2>
            <p>
              本規約は、当サービス「スマメモ」の利用に関して、当サービス運営者（以下「当方」といいます）と利用者（以下「ユーザー」といいます）との間の権利義務関係を定めるものです。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">第2条（利用登録）</h2>
            <p>
              当サービスの利用には、Googleアカウントによる認証が必要です。利用登録をもって本規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">第3条（禁止事項）</h2>
            <p>ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当サービスのサーバーやネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>その他、当方が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">第4条（当サービスの提供の停止等）</h2>
            <p>
              当方は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく当サービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>当サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災、停電または天災などの不可抗力により、当サービスの提供が困難となった場合</li>
              <li>その他、当方が当サービスの提供が困難と判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">第5条（免責事項）</h2>
            <p>
              当方は、当サービスに関して、明示または黙示を問わず、完全性、正確性、確実性、有用性等について、いかなる保証もするものではありません。
              当サービスの利用によってユーザーに生じたあらゆる損害について、当方は一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">第6条（サービス内容の変更等）</h2>
            <p>
              当方は、ユーザーに通知することなく、当サービスの内容を変更または終了することができるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">第7条（利用規約の変更）</h2>
            <p>
              当方は、ユーザーに通知することなく、いつでも本規約を変更することができるものとします。
              なお、本規約の変更後、当サービスの利用を継続した場合には、変更後の規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">第8条（準拠法・裁判管轄）</h2>
            <p>
              本規約の解釈にあたっては、日本法を準拠法とします。
              当サービスに関して紛争が生じた場合には、当方の所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>

          <div className="border-t border-gray-200 pt-6 mt-8">
            <p className="text-sm text-gray-500">
              制定日：2025年1月1日<br />
              最終更新：2025年1月1日
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}