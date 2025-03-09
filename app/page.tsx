"use client";
import {useState, useEffect} from "react";
import { getCurrentUser, signInWithRedirect, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import {generateClient} from "aws-amplify/data";
import type {Schema} from "@/amplify/data/resource";
import {Amplify} from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import {messages} from './translations';
import { IntlProvider, FormattedMessage, useIntl } from "react-intl"; 
import { useRouter } from "next/navigation";

Amplify.configure(outputs);
const client = generateClient<Schema>();

function App() {
    const [characters, setCharacters] = useState<Array<any>>([]);
    const [userSettings, setUserSettings] = useState<Record<string, any>>({});
    const [categories, setCategories] = useState<Array<any>>([]);
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const intl = useIntl();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    async function listCharacters() {
        try {
            setLoading(true);
            // デバッグログを詳細化
            console.log('キャラクターデータ取得開始');
            
            const result = await client.models.Character.list();
            // より詳細なデバッグ情報
            console.log('API応答の詳細:', {
                status: result?.status,
                data: result?.data,
                errors: result?.errors
            });
            
            if (!result?.data) {
                setError('データの形式が不正です');
                console.warn('データ形式エラー:', result);
                return;
            }
            
            if (result.data.length === 0) {
                setError('キャラクターデータがありません。データ投入を確認してください。');
                console.warn('キャラクターデータが0件です');
                return;
            }
            
            // 順番でソート
            const sortedCharacters = result.data.sort((a, b) => a.order - b.order);
            setCharacters(sortedCharacters);
            setError(null); // エラーをクリア
        } catch (err) {
            console.error('データ取得エラー:', err);
            setError('データ取得中にエラーが発生しました。');
        } finally {
            setLoading(false);
        }
    }

    async function listUserSettings() {
        try {
            const result = await client.models.UserCharacterSetting.list();
            // キャラクターIDをキーとしたオブジェクトに変換
            const settingsMap = result.data.reduce((acc, setting) => {
                acc[setting.characterId] = setting;
                return acc;
            }, {} as Record<string, any>);
            setUserSettings(settingsMap);
        } catch (error) {
            console.error("エラー発生: ユーザー設定の取得中", error);
        }
    }

    async function listCategories() {
        try {
            const result = await client.models.Category.list();
            setCategories(result.data.sort((a, b) => a.order - b.order));
            
            // カテゴリがない場合は初期カテゴリを作成
            if (result.data.length === 0) {
                await createDefaultCategories();
            }
        } catch (error) {
            console.error("エラー発生: カテゴリ情報の取得中", error);
        }
    }

    async function createDefaultCategories() {
        try {
            const defaultCategories = [
                { name: "トップ/ハイ", color: "#FFD700", order: 1 },
                { name: "ミドル", color: "#C0C0C0", order: 2 },
                { name: "ロー", color: "#CD7F32", order: 3 }
            ];
            
            for (const category of defaultCategories) {
                await client.models.Category.create(category);
            }
            
            // カテゴリリストを再取得
            await listCategories();
        } catch (error) {
            console.error("デフォルトカテゴリの作成中にエラーが発生しました", error);
        }
    }

    async function assignCharacterCategory(characterId: string, categoryId: string) {
        try {
            const existingSetting = userSettings[characterId];
            
            if (existingSetting) {
                // 既存の設定を更新
                await client.models.UserCharacterSetting.update({
                    id: existingSetting.id,
                    categoryId: categoryId
                });
            } else {
                // 新しい設定を作成
                await client.models.UserCharacterSetting.create({
                    characterId: characterId,
                    categoryId: categoryId,
                    customOrder: 0 // デフォルト値
                });
            }
            
            // 設定を再取得
            await listUserSettings();
        } catch (error) {
            console.error("キャラクターカテゴリの更新中にエラーが発生しました", error);
        }
    }

    async function checkUserAuthentication() {
        try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                const attributes = await fetchUserAttributes();        
                const displayName = attributes.email || currentUser.username || currentUser.userId;
                setUsername(displayName);
                return true;
            }
        } catch (error){
            console.error("エラー：ユーザー認証中", error);
            setUsername(null);
            return false;
        }
        return false;
    }

    useEffect(() => {
        async function initializeApp() {
            setLoading(true);
            const isAuthenticated = await checkUserAuthentication();
            
            if (isAuthenticated) {
                await Promise.all([
                    listCharacters(),
                    listUserSettings(),
                    listCategories()
                ]);
            }
            
            setLoading(false);
        }
        
        initializeApp();
    }, []);

    // カテゴリーIDに基づいてキャラクターをソート・グループ化
    const getCategorizedCharacters = () => {
        // カテゴリなしのキャラクター
        const uncategorized = characters.filter(char => {
            const setting = userSettings[char.id];
            return !setting || !setting.categoryId;
        });
        
        // カテゴリごとにグループ化
        const categorized = categories.map(category => {
            const categoryChars = characters.filter(char => {
                const setting = userSettings[char.id];
                return setting && setting.categoryId === category.id;
            });
            
            return {
                category,
                characters: categoryChars.sort((a, b) => {
                    // カスタム順序があれば使用、なければマスターの順序を使用
                    const settingA = userSettings[a.id];
                    const settingB = userSettings[b.id];
                    const orderA = settingA?.customOrder ?? a.order;
                    const orderB = settingB?.customOrder ?? b.order;
                    return orderA - orderB;
                })
            };
        });
        
        return { uncategorized, categorized };
    };
    
    const { uncategorized, categorized } = getCategorizedCharacters();

    // レンダリング
    return (
        <main className="min-h-screen bg-gray-50 pb-10">
            {loading ? (
                <div className="flex justify-center items-center h-screen">
                    <p className="text-xl text-indigo-600 font-semibold">読み込み中...</p>
                </div>
            ) : username ? (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <header className="py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-indigo-600">スマブラ対策メモ</h1>
                            <p className="text-gray-600 mt-1">
                                <FormattedMessage 
                                    id="welcome" 
                                    values={{ username }}
                                />
                            </p>
                        </div>
                        <nav className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow">
                                カテゴリ設定
                            </button>
                            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow">
                                メモ項目設定
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => signOut()}
                            >
                                <FormattedMessage id="signOut" />
                            </button>
                        </nav>
                    </header>

                    <div>
                        {/* 未分類キャラクター */}
                        {uncategorized.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-xl font-semibold mb-6 bg-gray-100 p-3 rounded-lg shadow-sm border-l-4 border-indigo-400">未分類</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
                                    {uncategorized.map(character => (
                                        <div 
                                            key={character.id} 
                                            className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer border border-gray-100"
                                            onClick={() => {
                                                if (categories.length > 0) {
                                                    assignCharacterCategory(character.id, categories[0].id);
                                                }
                                            }}
                                        >
                                            <div className="bg-gray-50 p-1">
                                                <img 
                                                    src={character.icon} 
                                                    alt={character.name} 
                                                    className="w-full aspect-square object-cover rounded"
                                                />
                                            </div>
                                            <p className="p-3 text-center text-sm font-medium truncate">{character.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* カテゴリごとのキャラクター */}
                        {categorized.map(item => (
                            item.characters.length > 0 && (
                                <div key={item.category.id} className="mb-12">
                                    <h2 
                                        className="text-xl font-semibold mb-6 p-3 rounded-lg shadow-sm border-l-4"
                                        style={{ 
                                            backgroundColor: `${item.category.color}20` || '#f3f4f6',
                                            borderLeftColor: item.category.color || '#6366f1'
                                        }}
                                    >
                                        {item.category.name}
                                    </h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
                                        {item.characters.map(character => (
                                            <div 
                                                key={character.id} 
                                                className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer border border-gray-100"
                                                onClick={() => {
                                                    // 実際には次のページに遷移する処理
                                                    router.push(`/memo/${character.id}`);
                                                }}
                                            >
                                                <div className="bg-gray-50 p-1">
                                                    <img 
                                                        src={character.icon} 
                                                        alt={character.name} 
                                                        className="w-full aspect-square object-cover rounded"
                                                    />
                                                </div>
                                                <p className="p-3 text-center text-sm font-medium truncate">{character.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                        
                        {/* キャラクターがない場合 */}
                        {characters.length === 0 && (
                            <div className="text-center p-12 bg-white rounded-lg shadow border border-gray-100">
                                <p className="mb-4 text-gray-600">キャラクターデータがありません。システム管理者に連絡してください。</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-screen p-4 text-center bg-gradient-to-b from-indigo-50 to-white">
                    <h1 className="text-4xl font-bold text-indigo-600 mb-3">スマブラ対策メモ</h1>
                    <p className="mb-8 text-gray-600 max-w-md">対戦相手の特徴や対策をカテゴリ別に整理できるメモアプリです</p>
                    <button 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-all shadow-md hover:shadow-lg"
                        onClick={() => signInWithRedirect({
                            provider: {custom: 'Auth0'}
                        })}
                    >
                        ログイン
                    </button>
                </div>
            )}
        </main>
    );
}

export default function IntlApp() {
    return (
        <IntlProvider messages={messages['ja']} locale="ja" defaultLocale="ja">
            <App />
        </IntlProvider>
    );
}