import type { Metadata } from "next";
import { withSiteTitle } from '@/lib/metadata'

export const metadata: Metadata = {
  title: withSiteTitle('利用規約'),
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
