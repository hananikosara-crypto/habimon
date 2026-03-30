-- ============================================================
-- HabiMon データベーススキーマ
-- Supabase SQL Editor にコピー＆ペーストして実行してください
-- ============================================================

-- ============================================================
-- 1. profiles テーブル
--    Supabase Auth の auth.users と 1:1 で紐づく
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  display_name text       NOT NULL DEFAULT '',
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ユーザー登録時に profiles レコードを自動作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. goals テーブル
--    目標 1件 = モンスター 1体 に紐づく
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  category    text        NOT NULL CHECK (category IN ('学習', '健康', '仕事', '生活', '趣味', 'その他')),
  course_type text        NOT NULL CHECK (course_type IN ('1年', '3年')),
  start_date  date        NOT NULL DEFAULT CURRENT_DATE,
  target_date date,
  status      text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. habits テーブル
--    goal に紐づく習慣。frequency は毎日/週次/カスタム
-- ============================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id       uuid        NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text        NOT NULL,
  frequency     text        NOT NULL CHECK (frequency IN ('毎日', '週次', 'カスタム')),
  -- カスタム頻度の場合は曜日ビット列（例: "1111100" = 月〜金）
  schedule_type text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. habit_logs テーブル
--    習慣完了の記録。1回完了 = 10pt（ボーナスは別途加算）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id      uuid        NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_at  timestamptz NOT NULL DEFAULT now(),
  points_earned integer     NOT NULL DEFAULT 10
);

-- ============================================================
-- 5. monsters テーブル
--    goal と 1:1。stage 1=たまご 〜 7or11=最終形態
-- ============================================================
CREATE TABLE IF NOT EXISTS public.monsters (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id      uuid        NOT NULL UNIQUE REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         text        NOT NULL DEFAULT 'ハビモン',
  stage        smallint    NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 11),
  total_points integer     NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  level        integer     NOT NULL DEFAULT 1 CHECK (level >= 1),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER monsters_updated_at
  BEFORE UPDATE ON public.monsters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. monster_stats テーブル
--    モンスターの5能力値（int は予約語なので int_val と命名）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.monster_stats (
  id         uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  monster_id uuid     NOT NULL UNIQUE REFERENCES public.monsters(id) ON DELETE CASCADE,
  int_val    smallint NOT NULL DEFAULT 1 CHECK (int_val >= 1),  -- 知性
  str_val    smallint NOT NULL DEFAULT 1 CHECK (str_val >= 1),  -- 力
  mnd_val    smallint NOT NULL DEFAULT 1 CHECK (mnd_val >= 1),  -- 精神
  dex_val    smallint NOT NULL DEFAULT 1 CHECK (dex_val >= 1),  -- 器用
  cha_val    smallint NOT NULL DEFAULT 1 CHECK (cha_val >= 1)   -- 魅力
);

-- ============================================================
-- RLS（Row Level Security）設定
-- 全テーブル：自分のデータだけ操作できる
-- ============================================================

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monsters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monster_stats ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: 自分のレコードのみ参照・更新"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- goals
CREATE POLICY "goals: 自分のレコードのみ操作"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- habits
CREATE POLICY "habits: 自分のレコードのみ操作"
  ON public.habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- habit_logs
CREATE POLICY "habit_logs: 自分のレコードのみ操作"
  ON public.habit_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- monsters
CREATE POLICY "monsters: 自分のレコードのみ操作"
  ON public.monsters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- monster_stats（user_idがないため monsters 経由で確認）
CREATE POLICY "monster_stats: 自分のモンスターのみ操作"
  ON public.monster_stats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.monsters m
      WHERE m.id = monster_stats.monster_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.monsters m
      WHERE m.id = monster_stats.monster_id
        AND m.user_id = auth.uid()
    )
  );

-- ============================================================
-- 追加マイグレーション: habits テーブルに category カラムを追加
-- Supabase SQL Editor で実行してください
-- ============================================================

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS category text
  CHECK (category IN ('学習', '健康', '仕事', '生活', '趣味', 'その他'));

-- 既存レコードのデフォルト値を設定（NULLのままでも可）
-- UPDATE public.habits SET category = 'その他' WHERE category IS NULL;
