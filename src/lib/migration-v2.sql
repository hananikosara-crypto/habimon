-- ============================================================
-- HabiMon migration-v2.sql
-- 実行場所: Supabase Dashboard > SQL Editor
-- ============================================================

-- --------------------------------------------------------
-- 1. habits テーブルに category カラムを追加
-- --------------------------------------------------------
ALTER TABLE habits ADD COLUMN IF NOT EXISTS category text DEFAULT 'other'
  CHECK (category IN ('learning','health','work','lifestyle','hobby','other'));

-- --------------------------------------------------------
-- 2. habit_logs テーブルに status カラムを追加
-- --------------------------------------------------------
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed'
  CHECK (status IN ('completed','skipped'));

-- --------------------------------------------------------
-- 3. goals.category の制約を緩和
--    カテゴリは習慣単位に移動したため、goals では不要
-- --------------------------------------------------------
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_category_check;
ALTER TABLE goals ALTER COLUMN category DROP NOT NULL;
ALTER TABLE goals ALTER COLUMN category SET DEFAULT 'other';

-- --------------------------------------------------------
-- 4. RLS ポリシー補完
--    各テーブルで INSERT / SELECT / UPDATE / DELETE を保証
--    ※ IF NOT EXISTS は PostgreSQL 17 / Supabase で利用可能
-- --------------------------------------------------------

-- ---- profiles ----
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_insert_own'
  ) THEN
    CREATE POLICY profiles_insert_own ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_select_own'
  ) THEN
    CREATE POLICY profiles_select_own ON profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_update_own'
  ) THEN
    CREATE POLICY profiles_update_own ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_delete_own'
  ) THEN
    CREATE POLICY profiles_delete_own ON profiles
      FOR DELETE USING (auth.uid() = id);
  END IF;
END $$;

-- ---- goals ----
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='goals' AND policyname='goals_insert_own'
  ) THEN
    CREATE POLICY goals_insert_own ON goals
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='goals' AND policyname='goals_select_own'
  ) THEN
    CREATE POLICY goals_select_own ON goals
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='goals' AND policyname='goals_update_own'
  ) THEN
    CREATE POLICY goals_update_own ON goals
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='goals' AND policyname='goals_delete_own'
  ) THEN
    CREATE POLICY goals_delete_own ON goals
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---- habits ----
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='habits' AND policyname='habits_insert_own'
  ) THEN
    CREATE POLICY habits_insert_own ON habits
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='habits' AND policyname='habits_select_own'
  ) THEN
    CREATE POLICY habits_select_own ON habits
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='habits' AND policyname='habits_update_own'
  ) THEN
    CREATE POLICY habits_update_own ON habits
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='habits' AND policyname='habits_delete_own'
  ) THEN
    CREATE POLICY habits_delete_own ON habits
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---- monsters ----
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='monsters' AND policyname='monsters_insert_own'
  ) THEN
    CREATE POLICY monsters_insert_own ON monsters
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='monsters' AND policyname='monsters_select_own'
  ) THEN
    CREATE POLICY monsters_select_own ON monsters
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='monsters' AND policyname='monsters_update_own'
  ) THEN
    CREATE POLICY monsters_update_own ON monsters
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='monsters' AND policyname='monsters_delete_own'
  ) THEN
    CREATE POLICY monsters_delete_own ON monsters
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---- monster_stats（monsters 経由でユーザー確認） ----
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='monster_stats' AND policyname='monster_stats_insert_own'
  ) THEN
    CREATE POLICY monster_stats_insert_own ON monster_stats
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM monsters
          WHERE monsters.id = monster_stats.monster_id
            AND monsters.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='monster_stats' AND policyname='monster_stats_select_own'
  ) THEN
    CREATE POLICY monster_stats_select_own ON monster_stats
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM monsters
          WHERE monsters.id = monster_stats.monster_id
            AND monsters.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='monster_stats' AND policyname='monster_stats_update_own'
  ) THEN
    CREATE POLICY monster_stats_update_own ON monster_stats
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM monsters
          WHERE monsters.id = monster_stats.monster_id
            AND monsters.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='monster_stats' AND policyname='monster_stats_delete_own'
  ) THEN
    CREATE POLICY monster_stats_delete_own ON monster_stats
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM monsters
          WHERE monsters.id = monster_stats.monster_id
            AND monsters.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ---- habit_logs ----
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='habit_logs' AND policyname='habit_logs_insert_own'
  ) THEN
    CREATE POLICY habit_logs_insert_own ON habit_logs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='habit_logs' AND policyname='habit_logs_select_own'
  ) THEN
    CREATE POLICY habit_logs_select_own ON habit_logs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='habit_logs' AND policyname='habit_logs_update_own'
  ) THEN
    CREATE POLICY habit_logs_update_own ON habit_logs
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='habit_logs' AND policyname='habit_logs_delete_own'
  ) THEN
    CREATE POLICY habit_logs_delete_own ON habit_logs
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- ⚠️  完全リセット用 SQL（開発時のみ使用）
-- 本番環境では絶対に実行しないこと！
-- 全ユーザーデータが消去されます。
--
-- 使い方: コメントを外してから SQL Editor で実行
-- ============================================================

/*
-- 既存テーブルを全て削除（依存関係順）
DROP TABLE IF EXISTS monster_stats CASCADE;
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS monsters CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- トリガーと関数も削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
*/
