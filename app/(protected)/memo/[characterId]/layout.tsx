import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'キャラクターメモ ',
}

export default function CharacterMemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}