# MonV2 Database Design

## 설계 목표

1. **확장성**: 몬스터 추가, 융합, 진화 시스템 대비
2. **마이그레이션 용이성**: 명확한 데이터 구조
3. **통계 분석**: 사용자별 포획 패턴, 인기 몬스터 등
4. **전투 시스템 대비**: 레벨, 경험치, 스탯 저장
5. **완벽한 동기화**: 로컬스토리지 ↔ DB 양방향 동기화

---

## 데이터베이스 스키마

### 1. monsters (몬스터 마스터 데이터)

**목적**: 게임에 존재하는 모든 몬스터의 기본 정보

```sql
CREATE TABLE monsters (
    id INTEGER PRIMARY KEY,                  -- 몬스터 번호 (1~50, 향후 확장)
    name TEXT NOT NULL,                      -- 이름
    icon TEXT NOT NULL,                      -- 이모지 아이콘
    type TEXT NOT NULL,                      -- 타입 (fire, water, grass 등)
    rarity TEXT NOT NULL,                    -- 등급 (common, rare, legendary 등)
    base_catch_rate INTEGER NOT NULL,        -- 기본 포획률 (%)
    description TEXT NOT NULL,               -- 설명

    -- 확장성 필드
    generation INTEGER DEFAULT 1,            -- 세대 (1세대, 2세대 등)
    can_evolve BOOLEAN DEFAULT false,        -- 진화 가능 여부
    evolve_to INTEGER REFERENCES monsters(id), -- 진화 대상
    evolve_level INTEGER,                    -- 진화 레벨

    -- 융합 시스템용
    can_fuse BOOLEAN DEFAULT false,          -- 융합 가능 여부
    fusion_recipe JSONB,                     -- 융합 레시피 {"requires": [1, 2], "result": 51}

    -- 전투 시스템용 (향후)
    base_hp INTEGER DEFAULT 100,             -- 기본 체력
    base_attack INTEGER DEFAULT 10,          -- 기본 공격력
    base_defense INTEGER DEFAULT 10,         -- 기본 방어력
    base_speed INTEGER DEFAULT 10,           -- 기본 스피드

    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**특징**:
- 게임 클라이언트의 `MONSTERS` 배열을 DB로 이동
- 몬스터 추가/수정 시 DB만 업데이트하면 됨
- 진화, 융합 확장 가능

---

### 2. user_monsters (사용자 소유 몬스터)

**목적**: 각 사용자가 포획한 몬스터의 개별 인스턴스

```sql
CREATE TABLE user_monsters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    monster_id INTEGER REFERENCES monsters(id) NOT NULL,

    -- 포획 정보
    caught_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    catch_stage INTEGER NOT NULL,            -- 몇 스테이지에서 잡았는지
    catch_count INTEGER DEFAULT 1,           -- 이 몬스터를 총 몇 번 잡았는지

    -- 향후 확장 필드
    level INTEGER DEFAULT 1,                 -- 레벨 (전투 시스템용)
    experience INTEGER DEFAULT 0,            -- 경험치

    -- 융합 관련
    is_fusion BOOLEAN DEFAULT false,         -- 융합으로 생성되었는지
    fusion_source_ids UUID[],                -- 융합에 사용된 몬스터 ID 배열

    -- 커스터마이징
    nickname TEXT,                           -- 별명 (선택)
    is_favorite BOOLEAN DEFAULT false,       -- 즐겨찾기

    -- 메타데이터
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_user_monsters_user ON user_monsters(user_id);
CREATE INDEX idx_user_monsters_monster ON user_monsters(monster_id);
CREATE INDEX idx_user_monsters_caught ON user_monsters(caught_at DESC);
```

**특징**:
- 각 포획마다 개별 레코드 생성
- 같은 몬스터를 여러 번 잡으면 `catch_count` 증가
- 융합, 레벨링 시스템 확장 가능

---

### 3. user_progress (사용자 게임 진행도)

**목적**: 사용자별 게임 진행 상태 및 통계

```sql
CREATE TABLE user_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    game_id TEXT NOT NULL DEFAULT 'monv2',

    -- 진행도
    current_stage INTEGER DEFAULT 1,
    highest_stage INTEGER DEFAULT 1,

    -- 통계
    total_catches INTEGER DEFAULT 0,         -- 총 포획 수
    unique_monsters INTEGER DEFAULT 0,       -- 고유 몬스터 수
    total_game_overs INTEGER DEFAULT 0,      -- 게임오버 횟수
    total_playtime_seconds INTEGER DEFAULT 0, -- 총 플레이 시간 (초)

    -- 게임 플레이 데이터
    last_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 기타 통계 (JSON)
    stats JSONB DEFAULT '{}'::jsonb,         -- { "pokeballs_collected": 0, "hearts_collected": 0, ... }

    -- 메타데이터
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_user_progress_stage ON user_progress(highest_stage DESC);
```

**특징**:
- 사용자당 1개 레코드
- 스테이지, 통계 등 게임 진행 정보
- 랭킹 쿼리 최적화

---

### 4. monster_catches (포획 이벤트 로그)

**목적**: 모든 포획 시도를 상세히 기록 (분석용, 옵셔널)

```sql
CREATE TABLE monster_catches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    monster_id INTEGER REFERENCES monsters(id) NOT NULL,

    -- 포획 정보
    stage INTEGER NOT NULL,
    success BOOLEAN NOT NULL,                -- 성공/실패
    pokeballs_used INTEGER DEFAULT 0,        -- 사용한 몬스터볼 개수
    catch_probability REAL,                  -- 계산된 포획 확률 (%)

    -- 게임 상태
    lives_remaining REAL,                    -- 남은 생명력

    -- 타임스탬프
    caught_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_catches_user ON monster_catches(user_id);
CREATE INDEX idx_catches_monster ON monster_catches(monster_id);
CREATE INDEX idx_catches_time ON monster_catches(caught_at DESC);
```

**특징**:
- 모든 포획 시도 기록 (성공/실패 모두)
- 데이터 분석, 밸런싱 조정에 활용
- 옵셔널: 트래픽이 많으면 생략 가능

---

## RLS (Row Level Security) 정책

### user_monsters
```sql
-- 조회: 본인 것만
CREATE POLICY "Users can view own monsters" ON user_monsters
    FOR SELECT USING (auth.uid() = user_id);

-- 삽입: 본인 것만
CREATE POLICY "Users can insert own monsters" ON user_monsters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 수정: 본인 것만
CREATE POLICY "Users can update own monsters" ON user_monsters
    FOR UPDATE USING (auth.uid() = user_id);
```

### user_progress
```sql
-- 조회: 본인 것만 (랭킹 제외)
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

-- 삽입/수정: 본인 것만
CREATE POLICY "Users can upsert own progress" ON user_progress
    FOR ALL USING (auth.uid() = user_id);
```

### monsters (마스터 데이터)
```sql
-- 모두가 조회 가능 (읽기 전용)
CREATE POLICY "Everyone can view monsters" ON monsters
    FOR SELECT USING (true);
```

---

## 데이터 마이그레이션 전략

### 기존 game_collections에서 새 스키마로

```sql
-- 1. 기존 데이터 읽기
SELECT user_id, collection_data, current_stage
FROM game_collections
WHERE game_id = 'monster-collection';

-- 2. user_progress로 변환
INSERT INTO user_progress (user_id, game_id, current_stage, unique_monsters, total_catches)
SELECT
    user_id,
    'monv2',
    current_stage,
    jsonb_object_keys(collection_data)::int AS unique_monsters,
    (SELECT SUM((value->>'count')::int) FROM jsonb_each(collection_data)) AS total_catches
FROM game_collections
WHERE game_id = 'monster-collection';

-- 3. user_monsters로 변환
INSERT INTO user_monsters (user_id, monster_id, caught_at, catch_count, catch_stage)
SELECT
    gc.user_id,
    key::int AS monster_id,
    (value->>'firstCaught')::timestamp,
    (value->>'count')::int,
    1 -- 기존 데이터는 스테이지 정보 없음
FROM game_collections gc,
     jsonb_each(gc.collection_data)
WHERE gc.game_id = 'monster-collection';
```

---

## API 함수 설계

### Supabase.js 새 함수

```javascript
// 1. 몬스터 마스터 데이터 로드
async function getMonsters() {
    const { data, error } = await supabase
        .from('monsters')
        .select('*')
        .order('id');
    return data;
}

// 2. 사용자 몬스터 조회
async function getUserMonsters(userId) {
    const { data, error } = await supabase
        .from('user_monsters')
        .select(`
            *,
            monsters (*)
        `)
        .eq('user_id', userId)
        .order('caught_at', { ascending: false });
    return data;
}

// 3. 몬스터 포획 기록
async function catchMonster(monsterId, stage, pokeballs, success) {
    const user = await getCurrentUser();
    if (!user) return;

    // user_monsters에 추가 또는 업데이트
    const { data: existing } = await supabase
        .from('user_monsters')
        .select('*')
        .eq('user_id', user.id)
        .eq('monster_id', monsterId)
        .single();

    if (existing) {
        // 이미 있으면 catch_count 증가
        await supabase
            .from('user_monsters')
            .update({
                catch_count: existing.catch_count + 1,
                last_updated: new Date().toISOString()
            })
            .eq('id', existing.id);
    } else {
        // 새로 추가
        await supabase
            .from('user_monsters')
            .insert({
                user_id: user.id,
                monster_id: monsterId,
                catch_stage: stage,
                catch_count: 1
            });
    }

    // user_progress 업데이트
    await updateUserProgress(stage);

    // (옵셔널) monster_catches 로그 기록
    await supabase
        .from('monster_catches')
        .insert({
            user_id: user.id,
            monster_id: monsterId,
            stage: stage,
            success: success,
            pokeballs_used: pokeballs
        });
}

// 4. 진행도 업데이트
async function updateUserProgress(currentStage) {
    const user = await getCurrentUser();
    if (!user) return;

    const { data: monsters } = await supabase
        .from('user_monsters')
        .select('monster_id')
        .eq('user_id', user.id);

    const uniqueMonsters = new Set(monsters.map(m => m.monster_id)).size;

    await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            game_id: 'monv2',
            current_stage: currentStage,
            highest_stage: currentStage, // MAX 함수 사용
            unique_monsters: uniqueMonsters,
            total_catches: monsters.length,
            last_played_at: new Date().toISOString()
        });
}

// 5. 전체 진행도 로드
async function loadUserProgress() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', 'monv2')
        .single();

    return data;
}
```

---

## 로컬스토리지 ↔ DB 동기화 전략

### 1. 초기 로드
```
1. 로컬스토리지에서 데이터 읽기
2. 로그인 상태 확인
3. DB에서 데이터 로드
4. 병합 (서버 우선, 최신 데이터)
5. 로컬에 저장
```

### 2. 포획 이벤트
```
1. 로컬에 즉시 반영
2. DB에 비동기 저장 (await)
3. 실패 시 재시도 큐에 추가
```

### 3. 주기적 동기화
```
- 게임 종료 시
- 스테이지 클리어 시
- 5분마다 자동 (옵셔널)
```

---

## 모바일 최적화

### 1. 터치 이벤트
- ✅ 이미 D-pad, 스와이프 지원 완료

### 2. 데이터 최적화
- 초기 로드 시 필요한 데이터만 가져오기
- 이미지 lazy loading
- 로컬 캐싱 적극 활용

### 3. UI 최적화
- ✅ 반응형 디자인 완료
- 버튼 크기 충분히 크게 (최소 48px)
- 스크롤 영역 명확히

---

## 다음 단계

1. ✅ 스키마 설계 완료
2. ⏳ SQL 마이그레이션 파일 작성
3. ⏳ supabase.js에 새 API 함수 추가
4. ⏳ game.html 코드 수정
5. ⏳ 테스트 및 검증

---

## 호환성

- **기존 monster 게임**: 영향 없음 (별도 테이블 사용)
- **기존 monv2**: 마이그레이션 스크립트로 전환
- **로컬 전용 플레이**: 로그인 없어도 작동 (로컬스토리지만 사용)
