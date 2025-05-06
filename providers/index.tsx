'use client'

import { ReactNode } from "react";
import { AuthProvider } from "@/providers/AuthProvider";
import { AmplifyProvider } from "@/providers/AmplifyProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AmplifyProvider>
      <AuthProvider>{children}</AuthProvider>
    </AmplifyProvider>
  )
}