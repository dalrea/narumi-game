# 미연시 프로젝트 킥스타터 v3 (엔진/시나리오 확정판) — “눈치 로그”

> v2에 대한 추가 리뷰(보안/엔진/밸런스/연출)를 **명세 수준에서 해결**한 최종 설계 문서입니다.  
> 이 문서를 기준으로 **Codex는 엔진 구현**, **Claude는 시나리오 작성**을 진행하면 됩니다.

---

## 변경 요약 (v2 → v3)
- when 표현식 **화이트리스트 DSL 명세 확정** (eval 제거 기준)
- if[] 오버라이드 가능 필드 확장
- **조연 캐릭터 ID 고정**
- **노드 ID 네이밍 컨벤션 공식화**
- jump 노드 타입 명세 추가
- E_BURN 엔딩 **우선순위/조건 수정**
- fatigue **챕터 이월/회복 규칙 명시**
- 챕터 선택(리플레이) **상태 초기화 규칙 확정**
- Ch3 메신저 **chat 노드 타입 정의**
- 오토 세이브 슬롯/설정 저장 분리
- validate_scenario.js에 **밸런스 검증 추가**
- 에셋 네이밍 규칙 고정
- 언어 정책: **한국어 전용(확정)**

---

## 1) when 표현식 DSL (보안/파서 명세)

### 1.1 허용 문법 (화이트리스트)
when 문자열은 **아래 문법만 허용**한다.

#### 허용 연산자
- 비교: `>`, `<`, `>=`, `<=`, `===`
- 논리: `&&`, `||`, `!`
- 괄호: `(` `)`

#### 허용 식별자
- 변수 접근: `vars.<name>`  
  - 예: `vars.trust`, `vars.fatigue`
- 플래그 확인:
  - `flags.has('<flag>')`
- 방문 노드:
  - `visited.<nodeId>`

#### 허용 리터럴
- 숫자: 정수(0~10)
- 불리언: `true`, `false`
- 문자열: `'single-quoted'` (flag 이름만)

#### ❌ 금지
- 함수 호출(whitelist 외)
- 배열/객체 리터럴
- 산술 연산(`+ - * /`)
- 임의 JS 키워드(`new`, `this`, `window` 등)

### 1.2 엔진 구현 기준
- 문자열 → 토큰화 → AST → 평가
- MVP에서는 **정규식 기반 파서 + 재귀 평가기**로 충분
- `flags.includes()` **사용 금지**, 반드시 `flags.has()` 사용

---

## 2) if[] 오버라이드 스펙 확장

### 2.1 오버라이드 가능 필드
if 블록에서는 아래 필드를 덮어쓸 수 있다:
- `who`
- `text`
- `effects`
- `next`

### 2.2 예시
```json
{
  "type": "say",
  "who": "mina",
  "text": "…",
  "if": [
    {
      "when": "vars.sense >= 6",
      "text": "괜찮아. 근데 다음엔 미리 말해줘.",
      "effects": [{"op":"add","var":"trust","val":1}]
    },
    {
      "when": "true",
      "who": "leader",
      "text": "야, 지금 회의부터 하자."
    }
  ],
  "next": "c1_n20"
}
```

---

## 3) 캐릭터 ID 고정

| 캐릭터 | ID |
|------|----|
| 미나 | `mina` |
| 주인공 | `player` |
| 동아리 회장 | `leader` |
| 친구 | `bro` |

- who 필드는 반드시 위 ID 중 하나 사용

---

## 4) 노드 ID 네이밍 컨벤션 (필수)

### 4.1 규칙
- 형식: `c{챕터번호}_n{번호}`
- 예:
  - Ch1: `c1_n1`, `c1_n2`
  - Ch2: `c2_n1`, `c2_n15`

### 4.2 visited 접근
- `visited.c2_n14 === true` 형태로 사용

---

## 5) jump 노드 타입 명세

### 5.1 목적
- **챕터 내부 분기 점프** 또는 **특정 노드로 강제 이동**
- end / nextChapter와 역할 분리

### 5.2 포맷
```json
{
  "type": "jump",
  "target": "c3_n12"
}
```

### 5.3 제약
- jump는 **같은 챕터 내 노드만 허용**
- 다른 챕터 이동은 반드시 `end` + `nextChapter`

---

## 6) 엔딩 조건 우선순위/중복 해결

### 6.1 수정된 엔딩 우선순위
1. **E_BURN (번아웃)**  
2. E_SOLID  
3. E_KIND  
4. E_MISS  
5. E_NEUTRAL  

### 6.2 조건 수정
- E_KIND / E_SOLID / E_MISS 모두에 `vars.fatigue < 8` 암묵 조건 적용
- E_BURN:
```json
{ "id":"E_BURN", "when":"vars.fatigue >= 8" }
```

→ 번아웃 상태에서는 **무조건 번아웃 엔딩**

---

## 7) 챕터 간 변수 이월 / 회복 규칙

### 7.1 기본 규칙
- trust / sense / interest: **그대로 이월**
- fatigue: 챕터 종료 시 자동 회복

### 7.2 fatigue 회복 공식
- 챕터 종료 시:
```text
fatigue = max(0, fatigue - 2)
```

- 단, Ch4 → Ch5 전환에서는 회복량 `-1` (갈등 여파)

---

## 8) 챕터 선택(리플레이) 상태 규칙

### 8.1 방식: **챕터 시작 오토 세이브**
- 각 챕터 시작 시:
  - `autosave_chX` 슬롯에 상태 저장
- 챕터 선택 시:
  - 해당 autosave를 로드

### 8.2 장점
- 시나리오 작성자가 별도 초기값 관리 불필요
- 플레이어도 자연스럽게 이해 가능

---

## 9) 메신저(chat) 노드 타입 (Ch3 전용 핵심)

### 9.1 목적
- 말풍선 좌/우 배치, 타임스탬프, 읽음 연출

### 9.2 포맷
```json
{
  "type": "chat",
  "messages": [
    {"from":"mina","text":"오늘 좀 바빠…","side":"L","time":"22:41"},
    {"from":"player","text":"아, 알겠어","side":"R","time":"22:42"}
  ],
  "sfx": "msg_pop",
  "next": "c3_n12"
}
```

### 9.3 UI 규칙
- chat 노드 동안:
  - 일반 대사창 숨김
  - 채팅 패널 표시
- 종료 시 자동 복귀

---

## 10) 오토 세이브 / 설정 저장 분리

### 10.1 세이브 슬롯
- 수동 슬롯: 3개
- 오토 슬롯: `autosave_ch1` ~ `autosave_ch5`

### 10.2 settings 저장
- `localStorage.settings`
```json
{"typing":false,"typingSpeed":20,"fontSize":"M"}
```
- 슬롯과 무관, 항상 공통 적용

---

## 11) validate_scenario.js 확장 (밸런스 포함)

### 11.1 추가 검증 항목
- 모든 경로에 대해 변수 범위 계산(BFS)
- 챕터 종료 시:
  - trust/sense 최대값 ≥ 7 가능한지
  - fatigue 최대값 ≥ 8 가능한지
- 불가능하면 **WARNING 출력**

### 11.2 출력 예
```
[WARN][Ch4] fatigue max = 6 → 번아웃 엔딩 도달 불가
[OK][Ch5] trust max = 8
```

---

## 12) 에셋 관리 규칙

### 12.1 폴더
```
assets/
 ├─ bg/
 ├─ char/
 ├─ sfx/
 └─ bgm/
```

### 12.2 네이밍
- 배경: `bg_<place>_<time>.png`  
  - 예: `bg_cafe_rain.png`
- 캐릭터: `char_<id>_<pose>_<expr>.png`  
  - 예: `char_mina_neutral_smile.png`
- 해상도: 1920x1080(bg), 1024x2048(char)

---

## 13) 언어 정책
- **한국어 전용**
- i18n 추상화 없음 (불필요한 복잡성 방지)

---

## 14) 최종 실행 지침

### Codex
- 이 문서 기준으로 엔진/파서/노드 타입 구현
- eval/Function 사용 금지
- validate_scenario.js 밸런스 검증 포함

### Claude
- 노드 ID: `cX_nY` 강제
- when DSL 규칙 준수
- Ch3은 반드시 chat 노드 사용
- fatigue 회복 전제 하에 밸런스 설계

---

## 결론

v3부터는:
- **엔진 구현 기준이 명확**
- **시나리오 작성 자유도는 높되, 위험 요소는 차단**
- **20~30분 분량 밸런스가 자동 검증 가능**

이 문서를 기준으로 바로 제작에 들어가면 됩니다.
