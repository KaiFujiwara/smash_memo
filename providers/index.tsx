'use client'

import { ReactNode } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { AmplifyProvider } from "@/providers/amplify-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AmplifyProvider>
      <AuthProvider>{children}</AuthProvider>
    </AmplifyProvider>
  )
}