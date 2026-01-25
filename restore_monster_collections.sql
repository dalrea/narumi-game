-- Monster Maze 컬렉션 데이터 복구 SQL
-- Supabase Dashboard > SQL Editor에서 실행하세요
--
-- 주의: game_collections 테이블이 먼저 생성되어 있어야 합니다.
-- supabase_setup.sql의 6-9번 항목을 먼저 실행하세요.

-- 사용자 1: 3f994cfb-eb13-4f12-9bce-5c0dc3f27abe
-- 사용자 2: bfb805c2-51fb-4464-8fb2-dc876886e06a
-- 복구 내용: 몬스터 1-30번 전체 수집 완료, 스테이지 31

INSERT INTO game_collections (user_id, game_id, collection_data, current_stage, updated_at)
VALUES (
    '3f994cfb-eb13-4f12-9bce-5c0dc3f27abe',
    'monster-maze',
    '{
        "1": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "2": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "3": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "4": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "5": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "6": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "7": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "8": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "9": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "10": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "11": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "12": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "13": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "14": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "15": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "16": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "17": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "18": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "19": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "20": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "21": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "22": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "23": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "24": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "25": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "26": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "27": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "28": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "29": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "30": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"}
    }'::jsonb,
    31,
    NOW()
)
ON CONFLICT (user_id, game_id)
DO UPDATE SET
    collection_data = EXCLUDED.collection_data,
    current_stage = EXCLUDED.current_stage,
    updated_at = NOW();

INSERT INTO game_collections (user_id, game_id, collection_data, current_stage, updated_at)
VALUES (
    'bfb805c2-51fb-4464-8fb2-dc876886e06a',
    'monster-maze',
    '{
        "1": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "2": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "3": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "4": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "5": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "6": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "7": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "8": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "9": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "10": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "11": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "12": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "13": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "14": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "15": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "16": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "17": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "18": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "19": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "20": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "21": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "22": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "23": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "24": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "25": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "26": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "27": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "28": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "29": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"},
        "30": {"count": 1, "firstCaught": "2026-01-15T00:00:00.000Z"}
    }'::jsonb,
    31,
    NOW()
)
ON CONFLICT (user_id, game_id)
DO UPDATE SET
    collection_data = EXCLUDED.collection_data,
    current_stage = EXCLUDED.current_stage,
    updated_at = NOW();
