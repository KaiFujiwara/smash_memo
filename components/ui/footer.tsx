"use client";

import { FC } from 'react';

type SupportedLocale = 'ja' | 'en' | 'zh';

interface FooterTexts {
  trademark: string;
  unofficial: string;
  noAffiliation: string;
  copyrightNotice: string;
  copyright: string;
}

const footerTexts: Record<SupportedLocale, FooterTexts> = {
  ja: {
    trademark: '大乱闘スマッシュブラザーズは、任天堂株式会社様の登録商標です。',
    unofficial: '当サイトは個人のスマブラファンが運営する非公式のWebサービスです。',
    noAffiliation: '任天堂株式会社様、他関連企業様とは一切関係ありません。',
    copyrightNotice: '下記はサイト独自の内容に関する著作権を示すものです。',
    copyright: 'Copyright © smashmemo All rights reserved.'
  },
  en: {
    trademark: 'Super Smash Bros. is a registered trademark of Nintendo Co., Ltd.',
    unofficial: 'This site is an unofficial web service operated by an individual Smash Bros. fan.',
    noAffiliation: 'We have no affiliation with Nintendo Co., Ltd. or any other related companies.',
    copyrightNotice: 'The following copyright notice applies to the original content of this site.',
    copyright: 'Copyright © smashmemo All rights reserved.'
  },
  zh: {
    trademark: '《任天堂明星大乱斗》是任天堂株式会社的注册商标。',
    unofficial: '本网站由《大乱斗》粉丝个人运营，为非官方Web服务。',
    noAffiliation: '与任天堂株式会社及其他相关企业没有任何关联。',
    copyrightNotice: '以下内容的著作权归本网站所有。',
    copyright: 'Copyright © smashmemo All rights reserved.'
  }
};

interface FooterProps {
  locale: SupportedLocale;
}

const Footer: FC<FooterProps> = ({ locale }) => {
  const texts = footerTexts[locale];

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <p className="text-[10px] text-gray-600 text-center leading-relaxed">
          {texts.trademark}
          <br />
          {texts.unofficial}
          <br />
          {texts.noAffiliation}
          <br />
          {texts.copyrightNotice}
          <br />
          {texts.copyright}
        </p>
      </div>
    </footer>
  )
}

export default Footer