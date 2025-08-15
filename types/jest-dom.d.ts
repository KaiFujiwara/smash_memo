/**
 * Jest DOM カスタムマッチャーの型定義
 * @testing-library/jest-dom の型エラーを解消するためのファイル
 */

import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toBeVisible(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toBeChecked(): R
      toBeUnchecked(): R
      toHaveClass(...classes: string[]): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveTextContent(text: string | RegExp): R
      toHaveValue(value: string | number | string[]): R
      toHaveDisplayValue(value: string | string[]): R
      toBeRequired(): R
      toBeInvalid(): R
      toBeValid(): R
      toHaveStyle(style: Record<string, any> | string): R
      toHaveFocus(): R
      toHaveAccessibleName(name?: string | RegExp): R
      toHaveAccessibleDescription(description?: string | RegExp): R
      toHaveErrorMessage(message?: string | RegExp): R
    }
  }
}