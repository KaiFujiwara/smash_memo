import type { Metadata } from "next";
import { withSiteTitle } from '@/lib/metadata'

export const metadata: Metadata = {
  title: withSiteTitle('アカウント設定'),
};

export default function AccountSettingayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
