import type { Metadata } from "next";
import { withSiteTitle } from '@/lib/metadata'

export const metadata: Metadata = {
  title: withSiteTitle('プライバシーポリシー'),
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
