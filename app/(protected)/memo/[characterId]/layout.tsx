import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'キャラクターメモ - すまめも！',
  description: 'スマッシュブラザーズのキャラクター別対戦メモ',
}

export default function CharacterMemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}