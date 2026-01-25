-- Flappy Bird 아이템 시스템 Migration
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- ============================================
-- 1. FLAPPY_ITEMS (아이템 마스터 데이터)
-- ============================================

CREATE TABLE IF NOT EXISTS flappy_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('hat', 'glasses', 'accessory', 'skin')),
    unlock_type TEXT NOT NULL CHECK (unlock_type IN ('score', 'cumulative_score', 'cumulative_games', 'cumulative_pipes', 'default')),
    unlock_value INTEGER NOT NULL DEFAULT 0,
    unlock_description TEXT NOT NULL,
    rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_flappy_items_type ON flappy_items(type);
CREATE INDEX IF NOT EXISTS idx_flappy_items_rarity ON flappy_items(rarity);

COMMENT ON TABLE flappy_items IS 'Flappy Bird 커스터마이징 아이템 마스터 데이터';

-- ============================================
-- 2. USER_FLAPPY_ITEMS (사용자 보유 아이템)
-- ============================================

CREATE TABLE IF NOT EXISTS user_flappy_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id INTEGER REFERENCES flappy_items(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_flappy_items_user ON user_flappy_items(user_id);

COMMENT ON TABLE user_flappy_items IS '사용자가 해금한 Flappy Bird 아이템';

-- ============================================
-- 3. USER_FLAPPY_PROGRESS (사용자 진행 상황)
-- ============================================

CREATE TABLE IF NOT EXISTS user_flappy_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

    -- 장착 중인 아이템 ID
    equipped_hat INTEGER REFERENCES flappy_items(id),
    equipped_glasses INTEGER REFERENCES flappy_items(id),
    equipped_accessory INTEGER REFERENCES flappy_items(id),
    equipped_skin INTEGER REFERENCES flappy_items(id),

    -- 누적 통계
    total_games INTEGER DEFAULT 0 CHECK (total_games >= 0),
    total_score INTEGER DEFAULT 0 CHECK (total_score >= 0),
    total_pipes INTEGER DEFAULT 0 CHECK (total_pipes >= 0),
    best_score INTEGER DEFAULT 0 CHECK (best_score >= 0),

    -- 메타
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE user_flappy_progress IS '사용자별 Flappy Bird 진행 상황 및 장착 아이템';

-- ============================================
-- 4. RLS (Row Level Security) 정책
-- ============================================

-- flappy_items: 모두가 읽기 가능
ALTER TABLE flappy_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view flappy items" ON flappy_items;
CREATE POLICY "Everyone can view flappy items" ON flappy_items
    FOR SELECT USING (true);

-- user_flappy_items: 본인 것만 조회/추가
ALTER TABLE user_flappy_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own flappy items" ON user_flappy_items;
CREATE POLICY "Users can view own flappy items" ON user_flappy_items
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own flappy items" ON user_flappy_items;
CREATE POLICY "Users can insert own flappy items" ON user_flappy_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_flappy_progress: 본인 것만 조회/수정
ALTER TABLE user_flappy_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own flappy progress" ON user_flappy_progress;
CREATE POLICY "Users can view own flappy progress" ON user_flappy_progress
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own flappy progress" ON user_flappy_progress;
CREATE POLICY "Users can insert own flappy progress" ON user_flappy_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own flappy progress" ON user_flappy_progress;
CREATE POLICY "Users can update own flappy progress" ON user_flappy_progress
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. 초기 아이템 데이터 삽입
-- ============================================

INSERT INTO flappy_items (id, name, icon, type, unlock_type, unlock_value, unlock_description, rarity, sort_order) VALUES
-- 기본 아이템 (무조건 해금)
(1, '기본', '🐦', 'skin', 'default', 0, '기본 새', 'common', 0),

-- 모자 (Hat)
(10, '왕관', '👑', 'hat', 'score', 50, '한 판에 50점 달성', 'legendary', 1),
(11, '산타모자', '🎅', 'hat', 'cumulative_games', 100, '100게임 플레이', 'epic', 2),
(12, '마법사모자', '🧙', 'hat', 'score', 30, '한 판에 30점 달성', 'rare', 3),
(13, '파티모자', '🎉', 'hat', 'cumulative_games', 10, '10게임 플레이', 'common', 4),
(14, '카우보이', '🤠', 'hat', 'cumulative_pipes', 500, '총 500개 파이프 통과', 'uncommon', 5),
(15, '졸업모', '🎓', 'hat', 'score', 100, '한 판에 100점 달성', 'legendary', 6),

-- 안경 (Glasses)
(20, '선글라스', '🕶️', 'glasses', 'score', 10, '한 판에 10점 달성', 'common', 1),
(21, '하트안경', '💕', 'glasses', 'cumulative_score', 500, '총 500점 달성', 'uncommon', 2),
(22, '별안경', '⭐', 'glasses', 'score', 20, '한 판에 20점 달성', 'uncommon', 3),
(23, '무지개안경', '🌈', 'glasses', 'cumulative_score', 2000, '총 2000점 달성', 'rare', 4),
(24, '다이아안경', '💎', 'glasses', 'score', 70, '한 판에 70점 달성', 'epic', 5),

-- 악세서리 (Accessory)
(30, '리본', '🎀', 'accessory', 'cumulative_games', 1, '첫 게임 플레이', 'common', 1),
(31, '날개', '🪽', 'accessory', 'score', 25, '한 판에 25점 달성', 'uncommon', 2),
(32, '하트', '❤️', 'accessory', 'cumulative_score', 1000, '총 1000점 달성', 'rare', 3),
(33, '별', '✨', 'accessory', 'cumulative_pipes', 1000, '총 1000개 파이프 통과', 'rare', 4),
(34, '천사날개', '😇', 'accessory', 'score', 80, '한 판에 80점 달성', 'epic', 5),

-- 스킨 (Skin)
(40, '골드버드', '🌟', 'skin', 'score', 40, '한 판에 40점 달성', 'rare', 1),
(41, '피닉스', '🔥', 'skin', 'cumulative_score', 3000, '총 3000점 달성', 'epic', 2),
(42, '아이스버드', '❄️', 'skin', 'cumulative_games', 50, '50게임 플레이', 'uncommon', 3),
(43, '레인보우', '🌈', 'skin', 'score', 150, '한 판에 150점 달성', 'legendary', 4)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    type = EXCLUDED.type,
    unlock_type = EXCLUDED.unlock_type,
    unlock_value = EXCLUDED.unlock_value,
    unlock_description = EXCLUDED.unlock_description,
    rarity = EXCLUDED.rarity,
    sort_order = EXCLUDED.sort_order;

-- ============================================
-- 완료!
-- ============================================

SELECT 'Flappy items loaded: ' || COUNT(*) AS status FROM flappy_items;
SELECT 'Migration complete!' AS status;
