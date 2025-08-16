import type { Metadata } from "next";
import { withSiteTitle } from '@/lib/metadata'

export const metadata: Metadata = {
  title: withSiteTitle('メモ項目設定'),
};

export default function MemoSettingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
