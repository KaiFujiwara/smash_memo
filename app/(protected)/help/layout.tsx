import type { Metadata } from 'next'
import { withSiteTitle } from '@/lib/metadata'

export const metadata: Metadata = {
  title: withSiteTitle('ヘルプ'),
  description: 'よくある質問やお問い合わせについて',
}

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}