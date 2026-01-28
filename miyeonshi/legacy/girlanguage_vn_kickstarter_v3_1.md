# 미연시 프로젝트 킥스타터 v3.1 (통합본) — “눈치 로그”

> **v2 + v3 병합 통합 문서**  
> 이 문서 하나만 읽어도 **엔진 구현(Codex)** 과 **시나리오 작성(Claude)** 이 가능합니다.  
> 다음 단계로 **Ch1 v3 스펙 리라이트**를 진행하기 위한 기준 문서입니다.

---

# PART A. 세계관 / 시나리오 기준 (v2 통합)

## A1. 캐릭터 바이블 (Character Bible)

### 히로인: 미나 (ID: `mina`)
- 나이: 24
- 관계: 동아리 운영진 / 플레이어는 실무 담당
- 성격:
  - 자존심 강함, 감정 간접 표현
  - 신뢰가 쌓이면 급격히 직설화
- 트라우마:
  - 과거 “너 왜 이렇게 예민해?”라는 말에 상처 → 감정을 질문/완곡어로 포장
- 말투 패턴:
  - 불편: “괜찮아ㅎㅎ”, “그냥 그렇다고”
  - 기대: 말하다 멈춤, 여지 남김
  - 상처: 단답, 이모지 감소
  - 신뢰: “나는 사실…”
- 좋아함: 기억해주는 행동
- 싫어함: 설명으로 밀어붙이기

### 주인공 (ID: `player`)
- 나이: 23
- 성격:
  - 착하지만 정답 찾기에 집착
  - 눈치 실패 경험으로 흔들림
- 약점:
  - 과도한 설명 → 상대 피로 누적

### 조연 ID 고정
| 캐릭터 | ID |
|------|----|
| 동아리 회장 | `leader` |
| 친구 | `bro` |

---

## A2. 챕터 시놉시스 (20~30분)

### Ch1 괜찮아의 온도
- 장소: 동아리방
- 갈등: “괜찮아ㅎㅎ”의 진짜 의미
- 핵심: 당장 해결 vs 기억 후 행동

### Ch2 아무거나의 반경
- 장소: 카페/밥집
- 핵심: 밈 과해석 실패 구간 필수

### Ch3 바빠
- 장소: 메신저
- 핵심: 패턴 해석 vs 불안 폭주
- **chat 노드 사용 필수**

### Ch4 됐어
- 장소: 행사 현장
- 핵심: 설명=변명 문제

### Ch5 말하지 않은 문장들
- 장소: 카페/벤치
- 핵심: 규칙 합의

---

## A3. 변수 설계 (범위/예산)

- trust / sense / interest / fatigue : 0~10 clamp
- fatigue >= 8 → 번아웃 위험

### 챕터별 예산 요약
- Ch1~3: +1~2 성장
- Ch4: 진폭 큼
- Ch5: 최종 보정

---

# PART B. 엔진 / 포맷 확정

## B1. 노드 ID 규칙
- `c{챕터}_n{번호}` (예: c1_n12)

---

## B2. effects 연산자 (확정)

flags는 **Set 기반**.

| op | 설명 |
|----|------|
| add | vars 증가 |
| set | vars 고정 |
| addFlag | flags.add |
| removeFlag | flags.delete |

### 예
```json
{"op":"add","var":"trust","val":1}
{"op":"addFlag","var":"flags","val":"dodged_once"}
```

---

## B3. when DSL (BNF)

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

- 산술 연산 없음
- 함수 호출 없음

---

## B4. if[] 오버라이드

- 허용 필드: `who`, `text`, `effects`, `next`

---

## B5. jump 노드
```json
{ "type":"jump", "target":"c1_n20" }
```
- 같은 챕터만 허용

---

## B6. chat 노드 (확정)

### 메시지 단위 출력
```json
{
  "type":"chat",
  "messages":[
    {"from":"mina","text":"오늘 좀 바빠…","side":"L","time":"22:41","delay":600},
    {"from":"player","text":"아, 알겠어","side":"R","time":"22:42","delay":800}
  ],
  "next":"c3_n5"
}
```

- 메시지는 **delay 순차 출력**
- 선택지는 **외부 choice 노드로 분리**
- chat 내부 if[] ❌ (단순화)

---

## B7. fatigue 회복 & 오토세이브 순서

1. end 노드 진입
2. fatigue 회복 (-2, Ch4→5는 -1)
3. autosave_chX 저장
4. 다음 챕터 start

---

## B8. 오토세이브 정책
- 챕터당 **최근 1개만 유지**
- 이전 플레이 상태로 돌아가는 기능은 제공하지 않음 (의도적)

---

## B9. 엔딩 조건 (전체 JSON 예시)

```json
[
  {"id":"E_BURN","when":"vars.fatigue >= 8"},
  {"id":"E_SOLID","when":"vars.trust>=7 && vars.sense>=7 && vars.fatigue<8"},
  {"id":"E_KIND","when":"vars.trust>=7 && vars.sense<5 && vars.fatigue<8"},
  {"id":"E_MISS","when":"vars.trust<5 && vars.interest>=6 && vars.fatigue<8"},
  {"id":"E_NEUTRAL","when":"true"}
]
```

---

## B10. 세이브 데이터 스키마

```json
{
  "chapter":"ch3",
  "node":"c3_n12",
  "vars":{},
  "flags":[],
  "visited":{},
  "unlockedLogs":{}
}
```

- settings는 전역 분리

---

## B11. validate_scenario.js (확장)
- 링크/루프 검사
- BFS 변수 범위 계산
- 엔딩 도달 가능성 검사

---

## B12. Codex / Claude 프롬프트 요약

### Codex
- DSL 파서 구현 (BNF 기준)
- chat UI
- autosave

### Claude
- 노드 ID 규칙 강제
- Ch3 chat 필수
- interest 매 챕터 변동

---

## 다음 단계
➡ **Ch1을 v3.1 기준으로 25~30노드 리라이트**

