'use client'

import { Amplify } from 'aws-amplify'
import config from '@/amplify_outputs.json'

Amplify.configure(config)

export const AmplifyProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
