import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

// ブラウザ（クライアントコンポーネント）用の Supabase クライアントを作成する
// Supabase の型定義 (src/types/database.ts) が揃ったらジェネリクスを追加する
export function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
