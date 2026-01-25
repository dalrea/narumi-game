-- MonV2 Database Migration
-- Supabase Dashboard > SQL Editor에서 실행하세요
--
-- 목적: 확장 가능한 몬스터 수집 게임 데이터베이스 구조 생성
-- - 몬스터 추가, 융합, 진화 시스템 대비
-- - 전투 시스템 대비 (레벨, 스탯)
-- - 완벽한 데이터 추적 및 분석

-- ============================================
-- 1. MONSTERS (몬스터 마스터 데이터)
-- ============================================

CREATE TABLE IF NOT EXISTS monsters (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fire', 'water', 'grass', 'electric', 'ice', 'rock', 'ghost', 'dragon', 'dark', 'fairy', 'steel', 'psychic')),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    base_catch_rate INTEGER NOT NULL CHECK (base_catch_rate >= 0 AND base_catch_rate <= 100),
    description TEXT NOT NULL,

    -- 확장성 필드
    generation INTEGER DEFAULT 1 NOT NULL,
    can_evolve BOOLEAN DEFAULT false,
    evolve_to INTEGER REFERENCES monsters(id),
    evolve_level INTEGER CHECK (evolve_level > 0),

    -- 융합 시스템용
    can_fuse BOOLEAN DEFAULT false,
    fusion_recipe JSONB DEFAULT NULL,

    -- 전투 시스템용 (향후)
    base_hp INTEGER DEFAULT 100 CHECK (base_hp > 0),
    base_attack INTEGER DEFAULT 10 CHECK (base_attack > 0),
    base_defense INTEGER DEFAULT 10 CHECK (base_defense > 0),
    base_speed INTEGER DEFAULT 10 CHECK (base_speed > 0),

    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_monsters_type ON monsters(type);
CREATE INDEX IF NOT EXISTS idx_monsters_rarity ON monsters(rarity);
CREATE INDEX IF NOT EXISTS idx_monsters_generation ON monsters(generation);

COMMENT ON TABLE monsters IS '몬스터 마스터 데이터 - 게임에 존재하는 모든 몬스터의 기본 정보';
COMMENT ON COLUMN monsters.fusion_recipe IS '융합 레시피 JSON 예시: {"requires": [1, 2], "result": 51}';

-- ============================================
-- 2. USER_MONSTERS (사용자 소유 몬스터)
-- ============================================

CREATE TABLE IF NOT EXISTS user_monsters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    monster_id INTEGER REFERENCES monsters(id) NOT NULL,

    -- 포획 정보
    caught_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    catch_stage INTEGER NOT NULL CHECK (catch_stage > 0),
    catch_count INTEGER DEFAULT 1 CHECK (catch_count > 0),

    -- 향후 확장 필드
    level INTEGER DEFAULT 1 CHECK (level > 0 AND level <= 100),
    experience INTEGER DEFAULT 0 CHECK (experience >= 0),

    -- 융합 관련
    is_fusion BOOLEAN DEFAULT false,
    fusion_source_ids UUID[],

    -- 커스터마이징
    nickname TEXT,
    is_favorite BOOLEAN DEFAULT false,

    -- 메타데이터
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_monsters_user ON user_monsters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_monsters_monster ON user_monsters(monster_id);
CREATE INDEX IF NOT EXISTS idx_user_monsters_caught ON user_monsters(caught_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_monsters_favorite ON user_monsters(user_id, is_favorite) WHERE is_favorite = true;

COMMENT ON TABLE user_monsters IS '사용자가 소유한 몬스터 인스턴스';
COMMENT ON COLUMN user_monsters.catch_count IS '이 몬스터를 총 몇 번 포획했는지';
COMMENT ON COLUMN user_monsters.fusion_source_ids IS '융합에 사용된 몬스터들의 UUID 배열';

-- ============================================
-- 3. USER_PROGRESS (사용자 게임 진행도)
-- ============================================

CREATE TABLE IF NOT EXISTS user_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    game_id TEXT NOT NULL DEFAULT 'monv2',

    -- 진행도
    current_stage INTEGER DEFAULT 1 CHECK (current_stage > 0),
    highest_stage INTEGER DEFAULT 1 CHECK (highest_stage > 0),

    -- 통계
    total_catches INTEGER DEFAULT 0 CHECK (total_catches >= 0),
    unique_monsters INTEGER DEFAULT 0 CHECK (unique_monsters >= 0),
    total_game_overs INTEGER DEFAULT 0 CHECK (total_game_overs >= 0),
    total_playtime_seconds INTEGER DEFAULT 0 CHECK (total_playtime_seconds >= 0),

    -- 게임 플레이 데이터
    last_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 기타 통계 (JSON)
    stats JSONB DEFAULT '{}'::jsonb,

    -- 메타데이터
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_progress_stage ON user_progress(highest_stage DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_unique ON user_progress(unique_monsters DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_played ON user_progress(last_played_at DESC);

COMMENT ON TABLE user_progress IS '사용자별 게임 진행 상태 및 통계';
COMMENT ON COLUMN user_progress.stats IS '추가 통계 JSON: {"pokeballs_collected": 0, "hearts_collected": 0, "enemies_avoided": 0}';

-- ============================================
-- 4. MONSTER_CATCHES (포획 이벤트 로그)
-- ============================================

CREATE TABLE IF NOT EXISTS monster_catches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    monster_id INTEGER REFERENCES monsters(id) NOT NULL,

    -- 포획 정보
    stage INTEGER NOT NULL CHECK (stage > 0),
    success BOOLEAN NOT NULL,
    pokeballs_used INTEGER DEFAULT 0 CHECK (pokeballs_used >= 0),
    catch_probability REAL CHECK (catch_probability >= 0 AND catch_probability <= 100),

    -- 게임 상태
    lives_remaining REAL CHECK (lives_remaining >= 0 AND lives_remaining <= 3),

    -- 타임스탬프
    caught_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_catches_user ON monster_catches(user_id);
CREATE INDEX IF NOT EXISTS idx_catches_monster ON monster_catches(monster_id);
CREATE INDEX IF NOT EXISTS idx_catches_time ON monster_catches(caught_at DESC);
CREATE INDEX IF NOT EXISTS idx_catches_success ON monster_catches(success);

COMMENT ON TABLE monster_catches IS '모든 포획 시도 이벤트 로그 (분석용)';

-- ============================================
-- 5. RLS (Row Level Security) 정책
-- ============================================

-- monsters: 모두가 읽기 가능
ALTER TABLE monsters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view monsters" ON monsters
    FOR SELECT USING (true);

-- user_monsters: 본인 것만 조회/추가/수정
ALTER TABLE user_monsters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monsters" ON user_monsters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monsters" ON user_monsters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monsters" ON user_monsters
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own monsters" ON user_monsters
    FOR DELETE USING (auth.uid() = user_id);

-- user_progress: 본인 것만 조회/수정
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- monster_catches: 본인 것만 조회/추가
ALTER TABLE monster_catches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own catches" ON monster_catches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own catches" ON monster_catches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. 초기 몬스터 데이터 삽입
-- ============================================

INSERT INTO monsters (id, name, icon, type, rarity, base_catch_rate, description, generation) VALUES
-- Generation 1: Fire, Water, Grass (1-9)
(1, 'Flamby', '🔥', 'fire', 'common', 40, 'A small flame spirit that loves warm places.', 1),
(2, 'Blazecub', '🦁', 'fire', 'uncommon', 30, 'A lion cub with a fiery mane.', 1),
(3, 'Infernox', '🐉', 'fire', 'epic', 12, 'A dragon born from volcanic flames.', 1),
(4, 'Droplet', '💧', 'water', 'common', 40, 'A cheerful water drop that bounces around.', 1),
(5, 'Wavepup', '🐬', 'water', 'uncommon', 30, 'A playful dolphin that rides the waves.', 1),
(6, 'Tsunamor', '🐋', 'water', 'epic', 12, 'An ancient whale with power over tides.', 1),
(7, 'Sproutie', '🌱', 'grass', 'common', 40, 'A tiny sprout full of life energy.', 1),
(8, 'Florabun', '🐰', 'grass', 'uncommon', 30, 'A bunny with flowers growing on its ears.', 1),
(9, 'Naturon', '🌳', 'grass', 'epic', 12, 'A walking tree that protects the forest.', 1),

-- Electric, Ice, Rock (10-18)
(10, 'Sparkle', '⚡', 'electric', 'common', 38, 'A ball of static electricity.', 1),
(11, 'Voltiger', '🐯', 'electric', 'uncommon', 28, 'A tiger that crackles with lightning.', 1),
(12, 'Thundera', '🦅', 'electric', 'epic', 10, 'A majestic bird that commands storms.', 1),
(13, 'Snowfluff', '❄️', 'ice', 'common', 38, 'A fluffy snowball with a cold heart.', 1),
(14, 'Frostbear', '🐻‍❄️', 'ice', 'uncommon', 28, 'A polar bear that never feels cold.', 1),
(15, 'Glacior', '🏔️', 'ice', 'epic', 10, 'An ancient ice golem from frozen peaks.', 1),
(16, 'Pebble', '🪨', 'rock', 'common', 40, 'A small living rock with big dreams.', 1),
(17, 'Bouldog', '🐕', 'rock', 'uncommon', 30, 'A sturdy dog made of solid stone.', 1),
(18, 'Titanrock', '🗿', 'rock', 'epic', 12, 'A massive golem from ancient times.', 1),

-- Ghost, Dragon (19-24)
(19, 'Whisper', '👻', 'ghost', 'uncommon', 25, 'A shy ghost that only appears at night.', 1),
(20, 'Phantail', '🐈‍⬛', 'ghost', 'rare', 18, 'A spectral cat with nine ghostly tails.', 1),
(21, 'Dreadlord', '💀', 'ghost', 'epic', 8, 'A powerful spirit from the underworld.', 1),
(22, 'Drakeling', '🐲', 'dragon', 'rare', 15, 'A baby dragon learning to fly.', 1),
(23, 'Wyvernix', '🦎', 'dragon', 'epic', 8, 'A swift wyvern with razor-sharp claws.', 1),
(24, 'Celestrix', '✨', 'dragon', 'legendary', 3, 'A divine dragon said to grant wishes.', 1),

-- Legendary Guardians (25-30)
(25, 'Solarius', '☀️', 'fire', 'legendary', 3, 'The legendary sun guardian.', 1),
(26, 'Lunaris', '🌙', 'ice', 'legendary', 3, 'The legendary moon guardian.', 1),
(27, 'Terranos', '🌍', 'rock', 'legendary', 3, 'The legendary earth guardian.', 1),
(28, 'Tempestis', '🌪️', 'electric', 'legendary', 3, 'The legendary storm guardian.', 1),
(29, 'Oceanis', '🌊', 'water', 'legendary', 3, 'The legendary sea guardian.', 1),
(30, 'Floranis', '🌸', 'grass', 'legendary', 3, 'The legendary nature guardian.', 1),

-- Generation 2: Dark, Fairy, Steel, Psychic (31-50)
(31, 'Shadekit', '🐱', 'dark', 'common', 38, 'A mischievous kitten born from shadows.', 2),
(32, 'Umbrawolf', '🐺', 'dark', 'uncommon', 26, 'A wolf that hunts in complete darkness.', 2),
(33, 'Voidreaper', '🦇', 'dark', 'epic', 9, 'A bat creature that devours light itself.', 2),
(34, 'Pixibell', '🧚', 'fairy', 'common', 38, 'A tiny fairy that spreads magical dust.', 2),
(35, 'Glamourox', '🦄', 'fairy', 'uncommon', 26, 'A unicorn with a dazzling rainbow mane.', 2),
(36, 'Eternafae', '👸', 'fairy', 'epic', 9, 'The queen of all fairies, eternally young.', 2),
(37, 'Coglet', '⚙️', 'steel', 'common', 36, 'A small gear that spins endlessly.', 2),
(38, 'Ironhound', '🤖', 'steel', 'uncommon', 24, 'A mechanical dog with steel fangs.', 2),
(39, 'Titanmech', '🦾', 'steel', 'epic', 8, 'An ancient war machine awakened.', 2),
(40, 'Mindling', '🔮', 'psychic', 'common', 36, 'A floating orb of pure thought.', 2),
(41, 'Psycat', '😺', 'psychic', 'uncommon', 24, 'A cat that can read your mind.', 2),
(42, 'Cosmind', '🧠', 'psychic', 'epic', 8, 'A being of infinite intelligence.', 2),

-- Rare variants (43-46)
(43, 'Venomite', '🦂', 'dark', 'rare', 16, 'A scorpion with deadly poison.', 2),
(44, 'Crystawing', '🦋', 'fairy', 'rare', 16, 'A butterfly with crystal wings.', 2),
(45, 'Magnetron', '🧲', 'steel', 'rare', 14, 'A creature that controls magnetic fields.', 2),
(46, 'Dreamweaver', '💫', 'psychic', 'rare', 14, 'A spirit that walks through dreams.', 2),

-- Generation 2 Legendaries (47-50)
(47, 'Abyssion', '🕳️', 'dark', 'legendary', 2, 'The legendary void guardian.', 2),
(48, 'Seraphina', '👼', 'fairy', 'legendary', 2, 'The legendary light guardian.', 2),
(49, 'Mechagod', '⚔️', 'steel', 'legendary', 2, 'The legendary machine guardian.', 2),
(50, 'Omniscient', '👁️', 'psychic', 'legendary', 2, 'The legendary mind guardian.', 2)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    type = EXCLUDED.type,
    rarity = EXCLUDED.rarity,
    base_catch_rate = EXCLUDED.base_catch_rate,
    description = EXCLUDED.description,
    generation = EXCLUDED.generation,
    updated_at = NOW();

-- ============================================
-- 7. 유용한 뷰 생성
-- ============================================

-- 사용자별 수집 진행도 요약
CREATE OR REPLACE VIEW v_user_collection_summary AS
SELECT
    user_id,
    COUNT(DISTINCT monster_id) AS unique_monsters,
    SUM(catch_count) AS total_catches,
    MIN(caught_at) AS first_catch,
    MAX(caught_at) AS last_catch,
    COUNT(*) FILTER (WHERE monsters.rarity = 'legendary') AS legendary_count
FROM user_monsters
JOIN monsters ON user_monsters.monster_id = monsters.id
GROUP BY user_id;

-- 몬스터별 포획 통계
CREATE OR REPLACE VIEW v_monster_catch_stats AS
SELECT
    m.id,
    m.name,
    m.rarity,
    COUNT(um.id) AS times_caught,
    COUNT(DISTINCT um.user_id) AS unique_catchers,
    ROUND(AVG(mc.pokeballs_used), 2) AS avg_pokeballs_used,
    ROUND(AVG(CASE WHEN mc.success THEN 1.0 ELSE 0.0 END) * 100, 2) AS success_rate
FROM monsters m
LEFT JOIN user_monsters um ON m.id = um.monster_id
LEFT JOIN monster_catches mc ON m.id = mc.monster_id
GROUP BY m.id, m.name, m.rarity
ORDER BY times_caught DESC;

-- ============================================
-- 완료!
-- ============================================

-- 확인 쿼리
SELECT 'Monsters loaded: ' || COUNT(*) AS status FROM monsters;
SELECT 'Migration complete!' AS status;
