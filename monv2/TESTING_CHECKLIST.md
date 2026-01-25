# MonV2 Testing Checklist

마이그레이션 완료 후 반드시 테스트해야 할 항목들입니다.

## 1. 데이터베이스 확인

### Supabase Dashboard에서 확인
```sql
-- 몬스터 데이터 확인
SELECT COUNT(*) FROM monsters;  -- 50개여야 함

-- 첫 번째 몬스터 확인
SELECT * FROM monsters WHERE id = 1;

-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename IN ('monsters', 'user_monsters', 'user_progress', 'monster_catches');
```

**예상 결과**:
- ✅ monsters 테이블에 50개 레코드
- ✅ RLS 정책이 모두 활성화됨
- ✅ 뷰 2개 생성됨 (v_user_collection_summary, v_monster_catch_stats)

---

## 2. 게임 초기 로드

### 2.1 비로그인 상태
- [ ] 게임 페이지 접속
- [ ] 콘솔에서 "Monsters loaded from DB: 50" 메시지 확인
- [ ] 메뉴 화면에서 "게임 시작" 버튼 클릭 가능
- [ ] 도감 보기 클릭 시 50종 몬스터 표시

**예상 동작**:
- DB에서 몬스터 로드 성공
- 로컬스토리지만 사용
- 닉네임 표시: "---"

### 2.2 로그인 상태
- [ ] 로그인 후 게임 접속
- [ ] 콘솔에서 "Synced with server" 메시지 확인
- [ ] 닉네임 표시됨
- [ ] 기존 진행도 로드 (있는 경우)

**예상 동작**:
- DB에서 몬스터 + 사용자 데이터 로드
- 로컬 ↔ DB 동기화 완료

---

## 3. 게임 플레이

### 3.1 미로 탐험
- [ ] 방향키/WASD로 이동 가능
- [ ] 벽 충돌 시 생명력 -0.5
- [ ] 적 충돌 시 생명력 -1
- [ ] 몬스터볼 획득 시 카운트 증가
- [ ] 하트 획득 시 생명력 회복
- [ ] 출구 도달 시 인카운터 화면 전환

**모바일 테스트** (중요!):
- [ ] 화면 D-pad 버튼 작동
- [ ] 스와이프 이동 작동
- [ ] 버튼 크기 충분히 큼 (48px 이상)
- [ ] 가로/세로 모드 모두 정상 작동

### 3.2 몬스터 포획
- [ ] "포획 시도" 버튼 클릭
- [ ] 성공 시: 도감에 추가됨
- [ ] 실패 시 (몬스터볼 있음): 재시도/도망 선택 가능
- [ ] 실패 시 (몬스터볼 없음): 다음 스테이지로

**로그인 상태에서**:
- [ ] 콘솔에서 "saved to DB!" 메시지 확인
- [ ] Supabase Dashboard에서 user_monsters 테이블 확인
- [ ] monster_catches 테이블에 로그 기록 확인

```sql
-- 포획 확인
SELECT * FROM user_monsters WHERE user_id = 'YOUR_USER_ID' ORDER BY caught_at DESC LIMIT 5;

-- 로그 확인
SELECT * FROM monster_catches WHERE user_id = 'YOUR_USER_ID' ORDER BY caught_at DESC LIMIT 10;
```

### 3.3 스테이지 진행
- [ ] "다음 스테이지" 버튼 클릭
- [ ] 스테이지 번호 증가
- [ ] 새 미로 생성
- [ ] 몬스터볼 초기화 (0개)

**로그인 상태에서**:
- [ ] user_progress 테이블에서 current_stage 업데이트 확인

```sql
SELECT * FROM user_progress WHERE user_id = 'YOUR_USER_ID';
```

### 3.4 게임 오버
- [ ] 생명력 0 도달
- [ ] 게임오버 화면 표시
- [ ] 도달 스테이지, 총 수집, 이번 게임 포획 수 표시

**로그인 상태에서**:
- [ ] user_progress 테이블에서 total_game_overs +1 확인

---

## 4. 데이터 동기화

### 4.1 로컬 → DB 동기화
**시나리오**: 비로그인 상태에서 플레이 → 로그인

1. [ ] 비로그인 상태에서 몬스터 3종 포획
2. [ ] 로그인
3. [ ] 로컬 데이터가 DB에 업로드되는지 확인

```sql
-- DB에 데이터 있는지 확인
SELECT COUNT(*) FROM user_monsters WHERE user_id = 'YOUR_USER_ID';
-- 3개여야 함
```

### 4.2 DB → 로컬 동기화
**시나리오**: 다른 기기에서 플레이 후 현재 기기 접속

1. [ ] Supabase Dashboard에서 수동으로 user_monsters에 데이터 추가
2. [ ] 게임 새로고침
3. [ ] 도감에서 추가한 몬스터 확인

### 4.3 병합 테스트
**시나리오**: 로컬에 A 몬스터, DB에 B 몬스터

1. [ ] 로컬스토리지 직접 수정: 몬스터 1번만 추가
2. [ ] DB에 수동으로 몬스터 2번 추가
3. [ ] 게임 새로고침
4. [ ] 도감에서 1번, 2번 몬스터 모두 표시되는지 확인

### 4.4 오프라인 대응
**시나리오**: 인터넷 연결 없음

1. [ ] 네트워크 끊기 (개발자 도구 → Offline)
2. [ ] 게임 플레이
3. [ ] 몬스터 포획
4. [ ] 로컬스토리지에 저장되는지 확인
5. [ ] 콘솔에 DB 저장 실패 메시지 있지만 게임은 계속됨

---

## 5. 도감 기능

### 5.1 필터링
- [ ] "전체" 탭: 50종 모두 표시
- [ ] "보유" 탭: 포획한 몬스터만 표시
- [ ] "미보유" 탭: 포획하지 않은 몬스터만 표시

### 5.2 몬스터 상세
- [ ] 몬스터 카드 클릭
- [ ] 모달 팝업 표시
- [ ] 아이콘, 이름, 타입, 등급, 설명 표시
- [ ] 포획한 경우: 포획 횟수, 첫 포획 날짜 표시
- [ ] 미포획: "아직 발견하지 못한 몬스터" 메시지

---

## 6. 모바일 최적화

### 6.1 반응형 디자인
**테스트 해상도**:
- [ ] iPhone SE (375px)
- [ ] iPhone 12 (390px)
- [ ] iPad (768px)
- [ ] Desktop (1920px)

**확인 사항**:
- [ ] 모든 해상도에서 레이아웃 깨지지 않음
- [ ] 텍스트 읽기 쉬움
- [ ] 버튼 터치 가능 크기

### 6.2 터치 입력
- [ ] D-pad 버튼 반응 빠름
- [ ] 스와이프 감도 적절
- [ ] 우발적 터치 방지 (버튼 간격)

### 6.3 성능
- [ ] 게임 시작 3초 이내
- [ ] 미로 렌더링 부드러움 (60fps)
- [ ] 적 이동 자연스러움
- [ ] 화면 전환 지연 없음

---

## 7. 브라우저 호환성

**테스트 브라우저**:
- [ ] Chrome (최신)
- [ ] Safari (모바일)
- [ ] Firefox
- [ ] Edge

**확인**:
- [ ] 모든 브라우저에서 정상 작동
- [ ] 픽셀 폰트 제대로 표시
- [ ] 이모지 렌더링 정상

---

## 8. 에러 처리

### 8.1 DB 연결 실패
**시나리오**: Supabase 다운

1. [ ] 게임 접속
2. [ ] 폴백 몬스터 데이터 사용
3. [ ] 로컬 플레이 가능
4. [ ] 콘솔 에러 메시지 확인

### 8.2 API 호출 실패
**시나리오**: RLS 정책 문제

1. [ ] 포획 성공
2. [ ] DB 저장 실패해도 로컬에는 저장됨
3. [ ] 게임 계속 진행 가능
4. [ ] 콘솔에 에러 로그

---

## 9. 데이터 무결성

### 9.1 중복 방지
- [ ] 같은 몬스터 여러 번 포획 시 catch_count만 증가
- [ ] user_monsters 테이블에 중복 레코드 없음

```sql
-- 중복 확인
SELECT monster_id, COUNT(*)
FROM user_monsters
WHERE user_id = 'YOUR_USER_ID'
GROUP BY monster_id
HAVING COUNT(*) > 1;
-- 결과 없어야 함
```

### 9.2 통계 정확성
- [ ] user_progress.unique_monsters = 실제 보유 몬스터 수
- [ ] user_progress.total_catches = 모든 catch_count 합계
- [ ] user_progress.highest_stage >= current_stage

```sql
-- 통계 확인
SELECT
    up.unique_monsters,
    COUNT(DISTINCT um.monster_id) AS actual_unique,
    up.total_catches,
    SUM(um.catch_count) AS actual_total
FROM user_progress up
LEFT JOIN user_monsters um ON up.user_id = um.user_id
WHERE up.user_id = 'YOUR_USER_ID'
GROUP BY up.unique_monsters, up.total_catches;
-- unique_monsters와 actual_unique 일치
-- total_catches와 actual_total 일치
```

---

## 10. 성능 테스트

### 10.1 로딩 시간
- [ ] 초기 페이지 로드: < 2초
- [ ] DB 몬스터 로드: < 1초
- [ ] 사용자 데이터 동기화: < 2초

### 10.2 메모리
- [ ] 장시간 플레이 후 메모리 누수 없음
- [ ] 개발자 도구 → Performance 모니터링
- [ ] Heap size 증가 안정적

### 10.3 네트워크
- [ ] API 호출 횟수 최소화
- [ ] 불필요한 중복 호출 없음
- [ ] 개발자 도구 → Network 탭 확인

---

## 체크리스트 요약

### 필수 (Must Have)
- [x] DB 마이그레이션 완료
- [ ] 몬스터 50종 DB 로드
- [ ] 포획 시 DB 저장
- [ ] 로컬 ↔ DB 동기화
- [ ] 모바일 D-pad 작동
- [ ] 게임 오버 시 통계 업데이트

### 권장 (Should Have)
- [ ] 오프라인 플레이 가능
- [ ] 에러 처리 적절
- [ ] 브라우저 호환성
- [ ] 성능 최적화

### 선택 (Nice to Have)
- [ ] 로그 데이터 분석
- [ ] 랭킹 시스템 연동
- [ ] 푸시 알림 (진행도 저장)

---

## 발견된 버그 기록

**버그 템플릿**:
```
날짜:
환경: (브라우저, 기기)
재현 단계:
1.
2.
3.

예상 결과:
실제 결과:
스크린샷:
콘솔 에러:
```

---

## 다음 단계

테스트 완료 후:
1. [ ] 발견된 버그 수정
2. [ ] index.html에서 "개발 중" 표시 제거
3. [ ] 공지사항에 MonV2 오픈 안내
4. [ ] 사용자 피드백 수집
5. [ ] 성능 모니터링

---

**테스트 완료 시 이 파일에 체크 완료 날짜 기록**: _____년 __월 __일
