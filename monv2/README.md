# 몬브 투 (MonV2) - Monster Collection Game v2.0

스타듀밸리 스타일의 픽셀 아트 몬스터 수집 게임

## 프로젝트 개요

### 주요 특징
- 🎨 **스타듀밸리 UI**: 따뜻한 픽셀 아트 스타일
- 🐲 **50종 몬스터**: 12가지 타입, 5가지 등급
- 🗺️ **절차적 미로 생성**: 수집 진행도에 따라 크기 증가
- 👻 **팩맨 스타일 적**: 추격 AI
- 💾 **완벽한 데이터 동기화**: 로컬스토리지 ↔ Supabase
- 📱 **모바일 지원**: 터치, 스와이프, D-pad

### 기술 스택
- **Frontend**: Vanilla HTML5/CSS3/JavaScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **Rendering**: HTML5 Canvas 2D
- **Font**: Press Start 2P (Google Fonts)

---

## 파일 구조

```
monv2/
├── game.html                # 메인 게임 파일
├── assets/
│   ├── monsters/            # 몬스터 스프라이트 (향후)
│   ├── ui/                  # UI 프레임 (향후)
│   ├── tiles/               # 미로 타일셋 (향후)
│   ├── fonts/               # 픽셀 폰트 (향후)
│   └── README.md            # 에셋 가이드
├── DATABASE_DESIGN.md       # DB 스키마 설계 문서
├── TESTING_CHECKLIST.md     # 테스트 체크리스트
└── README.md                # 이 파일
```

**프로젝트 루트 파일**:
- `monv2_migration.sql` - DB 마이그레이션 스크립트
- `js/supabase.js` - API 함수 (MonV2 전용 추가)

---

## 게임 플레이

### 기본 룰
1. 미로를 탐험하며 **몬스터볼(🔴)**과 **하트(💊)** 수집
2. **적(👻)**을 피해 **출구(🚪)**에 도달
3. 야생 몬스터와 조우하여 포획 시도
4. 50종 몬스터 도감 완성이 목표

### 조작법
- **PC**: 방향키 또는 WASD
- **모바일**: 화면 D-pad 또는 스와이프

### 게임 시스템
- **생명력**: 3개 (❤️), 벽 충돌 -0.5, 적 충돌 -1
- **포획 확률**: 기본 확률 + (몬스터볼 × 5%)
- **미로 크기**: 9×9 ~ 41×41 (수집 수에 따라 증가)
- **적 속도**: 스테이지가 올라갈수록 빨라짐

---

## 데이터베이스 구조

### 주요 테이블

#### 1. monsters (몬스터 마스터 데이터)
- 게임에 존재하는 모든 몬스터 정보
- 진화, 융합, 전투 시스템 확장 가능

#### 2. user_monsters (사용자 소유 몬스터)
- 각 포획마다 개별 레코드
- 포획 횟수, 날짜, 스테이지 기록
- 레벨, 경험치 필드 (향후 사용)

#### 3. user_progress (게임 진행도)
- 현재/최고 스테이지
- 통계 (총 포획 수, 고유 몬스터 수, 게임오버 횟수)
- 플레이 시간 추적

#### 4. monster_catches (포획 로그)
- 모든 포획 시도 기록 (성공/실패)
- 데이터 분석, 밸런싱 조정용

자세한 내용: [DATABASE_DESIGN.md](DATABASE_DESIGN.md)

---

## 설치 및 실행

### 1. Supabase 마이그레이션

```bash
# Supabase Dashboard → SQL Editor에서 실행
# d:/simsim/monv2_migration.sql 내용 복사 & 실행
```

**확인**:
```sql
SELECT COUNT(*) FROM monsters;  -- 50개
SELECT COUNT(*) FROM pg_policies WHERE tablename LIKE '%monster%';  -- 12개
```

### 2. 게임 접속

```
http://your-domain/monv2/game.html
```

또는 메인 페이지에서 "몬브 투 (MonV2)" 카드 클릭

### 3. 로그인 (선택)

- 계정 생성 후 로그인하면 **클라우드 동기화** 활성화
- 비로그인 시 로컬스토리지만 사용

---

## API 함수

### 몬스터 관련
```javascript
await getMonsters()                  // 몬스터 마스터 데이터 로드
await getUserMonsters()              // 내가 소유한 몬스터 조회
```

### 포획 관련
```javascript
await catchMonster(monsterId, stage, pokeballs, catchProb, lives)
await logCatchAttempt(monsterId, stage, pokeballs, catchProb, lives, success)
```

### 진행도 관련
```javascript
await loadUserProgress()             // 진행도 로드
await updateUserProgress(stage, isGameOver)
await getCollectionSummary()         // 수집 요약
await getMonV2Leaderboard(limit)     // 랭킹
```

자세한 API 문서: [js/supabase.js](../js/supabase.js) 참고

---

## 데이터 동기화 흐름

### 초기 로드
```
1. DB에서 몬스터 마스터 데이터 로드
2. 로컬스토리지에서 collection 로드
3. 로그인 상태면 DB와 동기화
   - getUserMonsters()로 DB 데이터 가져오기
   - 로컬과 병합 (서버 우선)
   - 로컬스토리지 업데이트
```

### 포획 성공 시
```
1. 로컬 collection 업데이트
2. 로컬스토리지 저장
3. (로그인 시) catchMonster() API 호출
   - user_monsters 테이블 INSERT/UPDATE
   - monster_catches 로그 기록
   - user_progress 자동 업데이트
```

### 오프라인 대응
- 인터넷 연결 없어도 로컬 플레이 가능
- DB 저장 실패 시 콘솔 로그만 출력, 게임 계속 진행
- 다음 로그인 시 수동 동기화 필요 (현재 자동화 안 됨)

---

## 확장 계획

### Phase 1: 현재 (v2.0)
- ✅ 50종 몬스터 수집
- ✅ 미로 탐험
- ✅ DB 동기화

### Phase 2: 전투 시스템
- [ ] 몬스터 레벨링
- [ ] 스킬 시스템
- [ ] 필드 전투 (스타듀밸리 스타일)
- [ ] 턴제 전투 (포켓몬 스타일)

### Phase 3: 몬스터 확장
- [ ] 진화 시스템 (`evolve_to`, `evolve_level`)
- [ ] 융합 시스템 (`fusion_recipe`)
- [ ] 3세대 몬스터 추가 (51~100)

### Phase 4: 소셜 기능
- [ ] 랭킹 시스템
- [ ] 몬스터 교환
- [ ] 길드/친구 시스템

### Phase 5: 픽셀 아트
- [ ] 몬스터 스프라이트 제작
- [ ] UI 프레임 교체
- [ ] 미로 타일셋 적용
- [ ] 애니메이션 추가

---

## 디버깅

### 콘솔 로그 확인
```javascript
// 초기화 시
"MonV2 initialized! Monsters loaded: 50"

// 동기화 시
"Synced with server. Collected: X"

// 포획 성공 시
"[MonsterName] saved to DB!"
```

### 주요 에러
- **"Failed to load monsters from DB"**: Supabase 연결 실패 → 폴백 데이터 사용
- **"Failed to save catch to DB"**: RLS 정책 또는 네트워크 문제 → 로컬에만 저장
- **"Sync error"**: 인증 만료 → 재로그인 필요

### 데이터 초기화
```javascript
// 로컬 데이터 삭제
localStorage.removeItem('monv2-collection');

// DB 데이터 삭제 (Supabase Dashboard)
DELETE FROM user_monsters WHERE user_id = 'YOUR_USER_ID';
DELETE FROM user_progress WHERE user_id = 'YOUR_USER_ID';
DELETE FROM monster_catches WHERE user_id = 'YOUR_USER_ID';
```

---

## 트러블슈팅

### Q1. 몬스터가 50종이 아니라 1종만 표시됩니다.
**A**: DB 로드 실패. 콘솔 확인 후 Supabase 연결 상태 체크.

### Q2. 포획한 몬스터가 DB에 저장 안 됩니다.
**A**: RLS 정책 확인. `auth.uid() = user_id` 조건 필요.

### Q3. 모바일에서 D-pad가 안 보입니다.
**A**: 화면 너비 500px 이하에서만 표시. CSS 미디어 쿼리 확인.

### Q4. 다른 기기에서 진행도가 안 나옵니다.
**A**: 동일 계정으로 로그인했는지 확인. `syncWithServer()` 수동 호출 시도.

---

## 기여 가이드

### 버그 리포트
- [GitHub Issues](https://github.com/yourusername/simsim-games/issues)
- 또는 게임 내 "💌 편지" 버튼 사용

### 개발 환경
```bash
# 로컬 서버 실행 (옵셔널)
npx http-server -p 8000

# 브라우저에서 접속
http://localhost:8000/monv2/game.html
```

---

## 라이선스

© 2025 Simsim Games. All rights reserved.

---

## 변경 이력

### v2.0.0 (2026-01-25)
- 🎉 초기 릴리스
- 스타듀밸리 스타일 UI
- 50종 몬스터
- Supabase DB 통합
- 모바일 지원

### v1.0.0 (이전 버전)
- `monster/game.html` (30종 몬스터)
- 레거시 버전, 유지보수 중단 예정

---

**Made with ❤️ by Simsim Games**
