/**
 * ダッシュボードデータ管理カスタムフック
 * 
 * ダッシュボード画面で使用するキャラクターとカテゴリーデータの
 * 読み込み・状態管理を行います。
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Character, CharacterCategory } from '@/types'
import type { DashboardMode } from '../types'
import { fetchSortedCharacters } from '@/services/characterService'

/**
 * ダッシュボードデータの状態
 */
interface DashboardDataState {
  /** キャラクター一覧 */
  characters: Character[]
  /** カテゴリー一覧 */
  categories: CharacterCategory[]
  /** データ読み込み中フラグ */
  isLoading: boolean
  /** 表示モード */
  mode: DashboardMode
}

/**
 * ダッシュボードデータフックの戻り値
 */
interface UseDashboardDataReturn {
  /** 現在の状態 */
  state: DashboardDataState
  /** 指定カテゴリーのキャラクター取得 */
  getCharactersInCategory: (categoryId: string) => Character[]
  /** カテゴリなしのキャラクター取得 */
  getUncategorizedCharacters: () => Character[]
  /** カテゴリー一覧更新 */
  updateCategories: (categories: CharacterCategory[]) => void
  /** 表示モード切り替え */
  setMode: (mode: DashboardMode) => void
  /** データ再読み込み */
  refetch: () => Promise<void>
}

/**
 * ダッシュボードデータ管理フック
 * 
 * @returns ダッシュボードデータと操作機能
 */
export function useDashboardData(): UseDashboardDataReturn {
  const [state, setState] = useState<DashboardDataState>({
    characters: [],
    categories: [],
    isLoading: true,
    mode: 'view'
  })

  /**
   * データ読み込み
   */
  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // シーディングしたキャラクターデータを取得
      const characters = await fetchSortedCharacters()
      
      setState(prev => ({
        ...prev,
        characters,
        categories: [], // カテゴリなしで表示
        isLoading: false
      }))
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  /**
   * 初期データ読み込み
   */
  useEffect(() => {
    loadData()
  }, [loadData])

  /**
   * 指定カテゴリーのキャラクター取得
   */
  const getCharactersInCategory = useCallback((categoryId: string): Character[] => {
    return state.characters
      .filter(char => char.categoryId === categoryId)
      .sort((a, b) => a.order - b.order)
  }, [state.characters])

  /**
   * カテゴリなしのキャラクター取得
   */
  const getUncategorizedCharacters = useCallback((): Character[] => {
    return state.characters
      .filter(char => !char.categoryId)
      .sort((a, b) => a.order - b.order)
  }, [state.characters])

  /**
   * カテゴリー一覧更新
   */
  const updateCategories = useCallback((categories: CharacterCategory[]) => {
    setState(prev => ({ ...prev, categories: categories.sort((a, b) => a.order - b.order) }))
  }, [])

  /**
   * 表示モード切り替え
   */
  const setMode = useCallback((mode: DashboardMode) => {
    setState(prev => ({ ...prev, mode }))
  }, [])

  /**
   * データ再読み込み
   */
  const refetch = useCallback(async () => {
    await loadData()
  }, [loadData])

  return {
    state,
    getCharactersInCategory,
    getUncategorizedCharacters,
    updateCategories,
    setMode,
    refetch
  }
}