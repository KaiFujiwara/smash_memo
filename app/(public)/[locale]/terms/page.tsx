import React from 'react';
import jaTranslations from './locales/ja.json';
import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  
  const translationsMap = {
    ja: jaTranslations,
    en: enTranslations,
    zh: zhTranslations
  };
  const translations = translationsMap[locale as keyof typeof translationsMap] || jaTranslations;
  const t = translations;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* コンテンツ */}
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{t.title}</h1>
          
          <div className="space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed">
            {t.sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h2>
                <p>{section.content}</p>
                {section.list && (
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {section.list.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500">
                {t.footer.enacted}<br />
                {t.footer.updated}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}