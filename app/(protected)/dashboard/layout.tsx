import type { Metadata } from "next";
import { withSiteTitle } from '@/lib/metadata'

export const metadata: Metadata = {
  title: withSiteTitle('ダッシュボード'),
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
