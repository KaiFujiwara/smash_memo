/**
 * Jestセットアップファイル
 * 
 * テスト実行前に必要な設定を行います。
 * testing-libraryのカスタムマッチャーやモックの設定などを含みます。
 */

// Testing Library のカスタムマッチャーを有効にする
// toBeInTheDocument() などの便利なマッチャーが使用可能になります
import '@testing-library/jest-dom' 