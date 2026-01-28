# 미연시 프로젝트 킥스타터 v3.4 FULL (단일 기준 최종본) — 『눈치 로그』

> ⚠️ **Single Source of Truth 보장 버전**  
> 이 문서는 v3.2 FULL의 본문을 **전부 포함**하고,  
> v3.3에서 추가·확정된 시스템 항목을 **누락 없이 병합**한 최종본입니다.  
> 다른 버전을 병행 참조할 필요가 없습니다.

---

# PART A. 캐릭터 & 톤 (시나리오 기준)

## A1. 캐릭터 바이블

### 히로인: 미나 (ID: `mina`)
- **나이**: 24  
- **관계**: 동아리 운영진 / 플레이어는 실무 담당
- **외형 키워드**
  - 단정한 캐주얼, 셔츠+가디건
  - 손목시계
  - 어깨선 정도의 머리카락
- **감정 표현 방식**
  - 감정이 말보다 먼저 얼굴과 호흡에 나타난다  
    (시선 회피 → 고정 미소 → 숨이 길어짐)
- **성격**
  - 자존심이 강하고 책임감이 높다
  - 일이 꼬이면 감정보다 업무를 우선시
  - 신뢰가 쌓이면 표현이 급격히 직설화
- **직설을 못 하는 이유**
  - 과거 솔직한 감정 표현 후  
    “왜 이렇게 예민해?”라는 말을 듣고 깊이 상처
- **말투 패턴**
  - 불편: “아니야~ 괜찮아ㅎㅎ”, “그냥 그렇다고”, “됐어.”
  - 기대: “너 요즘… (멈춤)”, “아무거나~”(표정으로 제외항목 제시)
  - 상처: 단답, 이모지 감소
  - 신뢰: “나는 사실…”
- **좋아하는 것**: 기억해주는 행동
- **싫어하는 것**
  - 설명으로 밀어붙이기
  - 약속/연락 패턴 붕괴 → 관계 안전감 상실

### 주인공: 플레이어 (ID: `player`)
- **나이**: 23
- **성격**
  - 착하지만 “정답 찾기”에 집착
  - 눈치를 보려다 타이밍을 놓침
- **대사 톤**
  - 마음속 독백 많음
  - 설명으로 만회하려는 경향
- **과거 경험**
  - “너 너무 계산적이야”라는 말을 들은 경험

### 조연
| 캐릭터 | ID | 역할 |
|------|----|------|
| 동아리 회장 | `leader` | “그냥 말로 하자” → 미나 트라우마 자극 |
| 친구 | `bro` | 밈 과몰입 조언자 |

---

# PART B. 챕터 설계

## B1. 챕터별 시놉시스

### Ch1. 괜찮아의 온도
- **시간/장소**: 평일 저녁, 동아리방
- **갈등**: “괜찮아ㅎㅎ”의 진짜 의미
- **클라이맥스**: 즉시 해결 vs 기억 후 행동
- **로그 테마**: 종결이 아닌 신호 / 웃고 넘기기의 비용

### Ch2. 아무거나의 반경
- **시간/장소**: 주말 오후, 카페 → 밥집
- **핵심**: 밈 과해석 실패 장면 필수
- **클라이맥스**: 메뉴 결정 방식
- **로그 테마**: 선택 피로 / 배려와 강요

### Ch3. 바빠
- **시간/장소**: 평일 밤 메신저 → 다음날 캠퍼스
- **핵심**: 패턴 기반 해석
- **클라이맥스**: 공간 / 확인 / 구체 제안
- **로그 테마**: 문장보다 반복

### Ch4. 됐어
- **시간/장소**: 행사 현장 → 귀가길
- **핵심**: 설명이 변명으로 들리는 순간
- **클라이맥스**: 사과 타이밍/방식
- **로그 테마**: 지금은 말이 아니라 안전감

### Ch5. 말하지 않은 문장들
- **시간/장소**: 비 오는 카페/벤치
- **핵심**: 규칙 합의
- **로그 테마**: 누적된 행동의 결과

## B2. 시나리오 필수 장치 체크리스트
- Ch2: 밈대로 해석하면 실패
- Ch3: 패턴 기반 해석
- Ch4: 설명=변명 장면
- Ch5: 언어 규칙 합의

---

# PART C. 변수 & 밸런스

## C1. 변수 범위
- trust / sense / interest / fatigue : 0~10 (clamp)

## C2. 챕터별 예산
| 챕터 | trust | sense | interest | fatigue |
|----|------|-------|----------|---------|
| Ch1 | +0~+2 | +0~+2 | +0~+1 | +0~+2 |
| Ch2 | +0~+2 | +0~+2 | +0~+2 | +0~+2 |
| Ch3 | +0~+2 | +0~+2 | +0~+2 | +0~+3 |
| Ch4 | -2~+2 | +0~+2 | -2~+2 | +0~+3 |
| Ch5 | 보정 | 보정 | 보정 | 보정 |

## C3. interest 규칙
- 행동/기억/일관성 → +1
- 과도한 설명 → -1 가능

## C4. 밸런스 검증
- 베스트 루트: trust ≥ 7
- 워스트 루트: fatigue ≥ 8

---

# PART D. 엔진 / DSL / 시스템 규칙

## D1. 노드 ID 규칙
- `c{챕터}_n{번호}` (예: `c3_n12`)
- visited는 **플랫 구조**: `{ "c3_n12": true }`

## D2. effects 연산자
| op | 규칙 |
|----|------|
| add | `{"op":"add","var":"trust","val":1}` |
| set | `{"op":"set","var":"fatigue","val":0}` |
| addFlag | `{"op":"addFlag","val":"dodged_once"}` |
| removeFlag | `{"op":"removeFlag","val":"dodged_once"}` |

- flags는 런타임에서 **Set**
- 저장 시 배열로 직렬화, 로드 시 Set으로 복원

## D3. when DSL (BNF)
```
expr     := orExpr
orExpr   := andExpr ("||" andExpr)*
andExpr  := notExpr ("&&" notExpr)*
notExpr  := "!" atom | atom
atom     := compare | flag | visit | BOOL | "(" expr ")"
compare  := "vars." IDENT CMP NUMBER
flag     := "flags.has(" STRING ")"
visit    := "visited." NODE_ID
CMP      := ">=" | "<=" | ">" | "<" | "==="
```

## D4. if[] 오버라이드
- 허용 필드: `who`, `text`, `effects`, `next`

```json
{
  "type":"say",
  "who":"mina",
  "text":"…",
  "if":[
    {"when":"vars.sense>=6","text":"괜찮아. 다음엔 말해줘."},
    {"when":"true","who":"leader","text":"회의부터 하자."}
  ],
  "next":"c1_n10"
}
```

## D5. fatigue 회복 & 오토세이브
- 회복: `max(0, fatigue-2)` / Ch4→5는 `-1`
- 순서: end → 회복 → autosave → next chapter

## D6. 세이브 스키마
```json
{
  "version":1,
  "savedAt":"ISO",
  "state":{
    "chapter":"ch3",
    "node":"c3_n12",
    "vars":{},
    "flags":["check_later"],
    "visited":{"c3_n1":true},
    "unlockedLogs":{"ch1":[0]}
  }
}
```

---

# PART E. 노드 타입 샘플

## setchar / setbg / chat
```json
{ "type":"setchar","slot":"L","char":"mina","pose":"neutral","expr":"smile","next":"c1_n2" }
{ "type":"setbg","bg":"cafe_day","transition":"fade","duration":250,"next":"c1_n3" }
{
  "type":"chat",
  "messages":[
    {"from":"mina","text":"오늘 좀 바빠…","side":"L","time":"22:41","delay":600}
  ],
  "next":"c3_n5"
}
```

## jump
```json
{ "type":"jump","target":"c1_n20" }
```
- 같은 챕터 내만 허용

## 사운드
```json
{ "type":"playBgm","track":"bgm_calm_01","fadeIn":800,"next":"c1_n2" }
{ "type":"stopBgm","fadeOut":500,"next":"c1_n3" }
{ "type":"playSfx","sfx":"msg_pop","next":"c1_n4" }
```

### 사운드 맵
- bgm_calm_01 / bgm_tension_01 / bgm_soft_01
- msg_pop / btn_click / door_open / rain

---

# PART F. 로그 시스템

```json
{
  "unlock":{"when":"visited.c1_n3 || flags.has('dodged_once')"},
  "title":"괜찮아의 온도",
  "text":"괜찮다는 말은 끝이 아닐 수 있다."
}
```

---

# PART G. 엔딩 & UI

## endings 전체 예시
```json
[
  {
    "id":"E_BURN",
    "title":"번아웃",
    "when":"vars.fatigue>=8",
    "epilogue":{"bg":"room","lines":[{"who":"mina","text":"지금은 쉬고 싶어."}],"summary":"지쳤다."}
  },
  {
    "id":"E_SOLID",
    "title":"솔직해진 관계",
    "when":"vars.trust>=7 && vars.sense>=7 && vars.fatigue<8",
    "epilogue":{"bg":"rain_cafe","lines":[{"who":"mina","text":"이제 말할게."}],"summary":"규칙 합의"}
  },
  {
    "id":"E_KIND",
    "title":"착한데 답답",
    "when":"vars.trust>=7 && vars.sense<5 && vars.fatigue<8",
    "epilogue":{"bg":"street","lines":[{"who":"mina","text":"좋은 사람인 건 알겠어."}],"summary":"온도차"}
  },
  {
    "id":"E_MISS",
    "title":"타이밍을 놓침",
    "when":"vars.trust<5 && vars.interest>=6 && vars.fatigue<8",
    "epilogue":{"bg":"campus","lines":[{"who":"mina","text":"조금 늦었네."}],"summary":"어긋남"}
  },
  {
    "id":"E_NEUTRAL",
    "title":"무난한 결말",
    "when":"true",
    "epilogue":{"bg":"cafe","lines":[{"who":"mina","text":"그래도 괜찮았어."}],"summary":"무난"}
  }
]
```

## 엔딩 화면 UI 요구
- 엔딩 타이틀
- 에필로그(3~8줄)
- 변수 요약(trust/sense/interest/fatigue)
- 로그 보기 버튼
- 리플레이(챕터 선택/리셋)

---

## 결론
이 문서는:
- **참조 문구 없음**
- **모든 규칙 명시**
- **Ch1 리라이트 즉시 가능**

➡ 다음 단계: **Ch1 v3.4 기준 25~30노드 리라이트**
