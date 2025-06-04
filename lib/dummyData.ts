/**
 * ダミーデータ
 * 
 * 開発・テスト用のサンプルデータを提供します。
 */

import { Character, CharacterCategory } from '@/types'

/**
 * ダミーのキャラクターカテゴリー
 */
export const dummyCategories: CharacterCategory[] = [
  {
    id: 'category-1',
    name: 'よく使うキャラ',
    order: 1,
    color: '#3B82F6', // blue-500
    userId: 'user-1'
  },
  {
    id: 'category-2',
    name: 'サブキャラ',
    order: 2,
    color: '#10B981', // emerald-500
    userId: 'user-1'
  },
  {
    id: 'category-3',
    name: '研究中',
    order: 3,
    color: '#F59E0B', // amber-500
    userId: 'user-1'
  },
  {
    id: 'category-4',
    name: '対策必要',
    order: 4,
    color: '#EF4444', // red-500
    userId: 'user-1'
  }
]

/**
 * ダミーのキャラクターデータ
 */
export const dummyCharacters: Character[] = [
  // よく使うキャラ
  {
    id: 'char-1',
    name: 'マリオ',
    imageUrl: '/characters/mario.png',
    order: 1,
    categoryId: 'category-1'
  },
  {
    id: 'char-2',
    name: 'ピカチュウ',
    imageUrl: '/characters/pikachu.png',
    order: 2,
    categoryId: 'category-1'
  },
  {
    id: 'char-3',
    name: 'リンク',
    imageUrl: '/characters/link.png',
    order: 3,
    categoryId: 'category-1'
  },
  
  // サブキャラ
  {
    id: 'char-4',
    name: 'サムス',
    imageUrl: '/characters/samus.png',
    order: 1,
    categoryId: 'category-2'
  },
  {
    id: 'char-5',
    name: 'フォックス',
    imageUrl: '/characters/fox.png',
    order: 2,
    categoryId: 'category-2'
  },
  
  // 研究中
  {
    id: 'char-6',
    name: 'ファルコン',
    imageUrl: '/characters/falcon.png',
    order: 1,
    categoryId: 'category-3'
  },
  {
    id: 'char-7',
    name: 'ガノンドロフ',
    imageUrl: '/characters/ganondorf.png',
    order: 2,
    categoryId: 'category-3'
  },
  {
    id: 'char-8',
    name: 'ルイージ',
    imageUrl: '/characters/luigi.png',
    order: 3,
    categoryId: 'category-3'
  },
  
  // 対策必要
  {
    id: 'char-9',
    name: 'ジョーカー',
    imageUrl: '/characters/joker.png',
    order: 1,
    categoryId: 'category-4'
  },
  {
    id: 'char-10',
    name: 'スティーブ',
    imageUrl: '/characters/steve.png',
    order: 2,
    categoryId: 'category-4'
  },
  {
    id: 'char-11',
    name: 'ピーチ',
    imageUrl: '/characters/peach.png',
    order: 3,
    categoryId: 'category-4'
  },
  {
    id: 'char-12',
    name: 'カズヤ',
    imageUrl: '/characters/kazuya.png',
    order: 4,
    categoryId: 'category-4'
  }
]

/**
 * カテゴリーごとにキャラクターを取得
 */
export function getCharactersByCategory(categoryId: string): Character[] {
  return dummyCharacters
    .filter(char => char.categoryId === categoryId)
    .sort((a, b) => a.order - b.order)
}

/**
 * すべてのカテゴリーをソート済みで取得
 */
export function getSortedCategories(): CharacterCategory[] {
  return [...dummyCategories].sort((a, b) => a.order - b.order)
}