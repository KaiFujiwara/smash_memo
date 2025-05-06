import type { Metadata } from "next";
import { withSiteTitle } from '@/lib/metadata'

export const metadata: Metadata = {
  title: withSiteTitle('ログイン'),
};

export default function AccountSettingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
