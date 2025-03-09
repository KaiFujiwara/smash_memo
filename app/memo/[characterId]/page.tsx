"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { signOut } from 'aws-amplify/auth';

Amplify.configure(outputs);
const client = generateClient<Schema>();

export default function MemoPage() {
    const params = useParams();
    const router = useRouter();
    const characterId = params.characterId as string;
    
    const [character, setCharacter] = useState<any>(null);
    const [memoItems, setMemoItems] = useState<Array<any>>([]);
    const [memoContents, setMemoContents] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                
                // キャラクター情報を取得
                const characterResult = await client.models.Character.get({ id: characterId });
                if (!characterResult) {
                    router.push('/'); // キャラクターが見つからない場合はトップに戻る
                    return;
                }
                setCharacter(characterResult);
                
                // メモ項目を取得
                const memoItemsResult = await client.models.MemoItem.list();
                const sortedMemoItems = memoItemsResult.data.sort((a, b) => a.order - b.order);
                setMemoItems(sortedMemoItems);
                
                // このキャラクターのメモ内容を取得
                const contentsResult = await client.models.MemoContent.list({
                    filter: {
                        characterId: {
                            eq: characterId
                        }
                    }
                });
                
                // メモ項目IDをキーとしたオブジェクトに変換
                const contentsMap = contentsResult.data.reduce((acc, content) => {
                    acc[content.memoItemId] = content;
                    return acc;
                }, {} as Record<string, any>);
                
                setMemoContents(contentsMap);
                setLoading(false);
            } catch (error) {
                console.error("メモデータの取得中にエラーが発生しました", error);
                setLoading(false);
            }
        }
        
        fetchData();
    }, [characterId, router]);

    // メモ内容の保存
    async function saveMemoContent(memoItemId: string, content: string) {
        try {
            const existingContent = memoContents[memoItemId];
            
            if (existingContent) {
                // 既存のメモを更新
                await client.models.MemoContent.update({
                    id: existingContent.id,
                    content: content
                });
            } else {
                // 新しいメモを作成
                const newContent = await client.models.MemoContent.create({
                    characterId: characterId,
                    memoItemId: memoItemId,
                    content: content
                });
                
                // 状態を更新
                setMemoContents(prev => ({
                    ...prev,
                    [memoItemId]: newContent
                }));
            }
        } catch (error) {
            console.error("メモ内容の保存中にエラーが発生しました", error);
        }
    }

    // テキストエリアの内容が変更されたときの処理
    async function handleContentChange(memoItemId: string, content: string) {
        // 状態を更新
        setMemoContents(prev => ({
            ...prev,
            [memoItemId]: {
                ...(prev[memoItemId] || {}),
                content: content
            }
        }));
        
        // 自動保存（実際の実装では節約のためディバウンスを考慮）
        await saveMemoContent(memoItemId, content);
    }

    if (loading || !character) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-lg text-indigo-600 font-semibold">読み込み中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <header className="mb-10 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-4 mb-6">
                        <button 
                            onClick={() => router.push('/')}
                            className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 p-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            戻る
                        </button>
                        <h1 className="text-2xl font-bold text-indigo-700">
                            {character.name}の対策メモ
                        </h1>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 w-20 h-20 flex-shrink-0">
                            <img 
                                src={character.icon} 
                                alt={character.name} 
                                className="w-full h-full object-cover rounded"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow"
                            >
                                カテゴリ変更
                            </button>
                            <button 
                                className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow"
                                onClick={() => signOut().then(() => router.push('/'))}
                            >
                                ログアウト
                            </button>
                        </div>
                    </div>
                </header>

                <div className="space-y-8">
                    {memoItems.map(item => (
                        <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-100">{item.name}</h2>
                            <textarea
                                className="w-full p-4 border border-gray-200 rounded-md min-h-[120px] focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                                placeholder={`${item.name}に関する対策メモを入力...`}
                                value={memoContents[item.id]?.content || ''}
                                onChange={(e) => handleContentChange(item.id, e.target.value)}
                            />
                        </div>
                    ))}
                    
                    {memoItems.length === 0 && (
                        <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-100">
                            <p className="text-gray-600">メモ項目がありません。メモ項目設定から追加してください。</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 