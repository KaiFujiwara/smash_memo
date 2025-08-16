import type { Metadata } from "next";
import { withSiteTitle } from '@/lib/metadata'

export const metadata: Metadata = {
  title: withSiteTitle('キャラクターリスト'),
};

export default function CharacterListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
