-- Supabase 테이블 설정 SQL
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. scores 테이블 생성
CREATE TABLE IF NOT EXISTS scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    nickname TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_scores_game_id ON scores(game_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 설정
-- 누구나 점수 조회 가능
CREATE POLICY "Anyone can view scores" ON scores
    FOR SELECT USING (true);

-- 로그인한 사용자만 자신의 점수 추가 가능
CREATE POLICY "Users can insert own scores" ON scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. 게임별 최고 점수 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW leaderboard AS
SELECT DISTINCT ON (game_id, user_id)
    game_id,
    user_id,
    nickname,
    score,
    created_at
FROM scores
ORDER BY game_id, user_id, score DESC;
