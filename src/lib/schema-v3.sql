-- ============================================================
-- HabiMon schema-v3.sql  — 完全スキーマ定義
-- 実行場所: Supabase Dashboard > SQL Editor
-- 前提: テーブルが全て削除済みの状態（完全クリーン）
-- ============================================================

-- --------------------------------------------------------
-- 拡張機能
-- --------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------
-- profiles
-- --------------------------------------------------------
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  display_name text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_delete ON profiles FOR DELETE USING (auth.uid() = id);

-- auth.users に新規ユーザー作成時に profiles を自動 INSERT するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------
-- goals
-- --------------------------------------------------------
CREATE TABLE goals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  course_type text NOT NULL CHECK (course_type IN ('1year','3year')),
  start_date  date NOT NULL DEFAULT CURRENT_DATE,
  target_date date,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY goals_insert ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY goals_select ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY goals_update ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY goals_delete ON goals FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- habits
-- --------------------------------------------------------
CREATE TABLE habits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id       uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text NOT NULL,
  category      text NOT NULL DEFAULT 'other'
                  CHECK (category IN ('learning','health','work','lifestyle','hobby','other')),
  frequency     text NOT NULL DEFAULT 'daily'
                  CHECK (frequency IN ('daily','weekdays','custom')),
  schedule_days jsonb NOT NULL DEFAULT '[]',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY habits_insert ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY habits_select ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY habits_update ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY habits_delete ON habits FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- habit_logs
-- --------------------------------------------------------
CREATE TABLE habit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id      uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at  date NOT NULL DEFAULT CURRENT_DATE,
  status        text NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('completed','skipped')),
  points_earned integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, completed_at)   -- 1習慣につき1日1件のみ
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY habit_logs_insert ON habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY habit_logs_select ON habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY habit_logs_update ON habit_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY habit_logs_delete ON habit_logs FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- monsters
-- --------------------------------------------------------
CREATE TABLE monsters (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id      uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE UNIQUE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL DEFAULT 'ハビモン',
  stage        integer NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 11),
  total_points integer NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  level        integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE monsters ENABLE ROW LEVEL SECURITY;
CREATE POLICY monsters_insert ON monsters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY monsters_select ON monsters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY monsters_update ON monsters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY monsters_delete ON monsters FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- monster_stats
-- --------------------------------------------------------
CREATE TABLE monster_stats (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monster_id uuid NOT NULL REFERENCES monsters(id) ON DELETE CASCADE UNIQUE,
  int_val    integer NOT NULL DEFAULT 0 CHECK (int_val >= 0),
  str_val    integer NOT NULL DEFAULT 0 CHECK (str_val >= 0),
  mnd_val    integer NOT NULL DEFAULT 0 CHECK (mnd_val >= 0),
  dex_val    integer NOT NULL DEFAULT 0 CHECK (dex_val >= 0),
  cha_val    integer NOT NULL DEFAULT 0 CHECK (cha_val >= 0)
);

ALTER TABLE monster_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY monster_stats_insert ON monster_stats
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM monsters WHERE monsters.id = monster_stats.monster_id AND monsters.user_id = auth.uid())
  );
CREATE POLICY monster_stats_select ON monster_stats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM monsters WHERE monsters.id = monster_stats.monster_id AND monsters.user_id = auth.uid())
  );
CREATE POLICY monster_stats_update ON monster_stats
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM monsters WHERE monsters.id = monster_stats.monster_id AND monsters.user_id = auth.uid())
  );
CREATE POLICY monster_stats_delete ON monster_stats
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM monsters WHERE monsters.id = monster_stats.monster_id AND monsters.user_id = auth.uid())
  );
