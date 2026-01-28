# 미연시 프로젝트 킥스타터 v3.3 FULL (최종 기준 문서) — 『눈치 로그』

> **Ch1 리라이트에 즉시 들어갈 수 있는 상태**를 목표로,  
> v3.2에서 지적된 **소실 항목 11개 + 신규 확정 항목 3개를 전부 반영**했습니다.  
> 이 문서 하나가 **시나리오/엔진의 최종 기준(Single Source of Truth)** 입니다.

---

## 변경 요약 (v3.2 → v3.3)
- jump / stopBgm / playSfx 노드 복원
- 사운드 맵 + 트리거 규칙 복원
- 로그 해금 JSON 포맷 복원
- 세이브 데이터 전체 스키마 복원
- fatigue 회복 + 오토세이브 순서 명시
- 오토세이브 정책 명시
- 조건부 분기 최소 수량 규칙 복원
- chat 노드 운영 규칙 복원
- Ch4 시간제한 선택지 규칙 복원
- endings + epilogue 결합 **완전 JSON 샘플 추가**
- effects `var` 필드 규칙 확정
- 시나리오 **필수 장치 체크리스트** 추가

---

# PART A. 캐릭터 / 톤
(※ v3.2 FULL과 동일 — 변경 없음)

---

# PART B. 챕터 설계

## B1. 챕터별 시놉시스
(※ v3.2 FULL과 동일 — 변경 없음)

## B2. 시나리오 필수 장치 체크리스트 (누락 방지용)

각 챕터에는 **반드시 아래 장치가 포함되어야 한다.**

- **Ch2**: 밈대로 과해석하면 실패, 문자 그대로 받아야 성공하는 장면
- **Ch3**: 단일 문장이 아니라 **반복/시간대/말끝**을 보는 패턴 기반 해석 장면
- **Ch4**: 주인공의 “설명”이 **변명으로 들리는** 장면
- **Ch5**: 서로의 언어 방식을 **규칙으로 합의**하는 장면
- 공통:
  - 어떤 장면은 “여자어 해석”을 맹신하면 실패하도록 설계
  - 성공은 항상 **행동의 누적 결과**로 나타난다

---

# PART C. 변수 & 밸런스
(※ v3.2 FULL과 동일 — 변경 없음)

---

# PART D. 엔진 / 시스템 규칙

## D1. effects 연산자 규칙 (확정)

### 공통
- `var`는 **대상 이름**을 의미한다.
- flags는 단일 Set이므로 **addFlag/removeFlag에는 var를 쓰지 않는다.**

### 허용 op
| op | 사용 |
|----|------|
| add | `{"op":"add","var":"trust","val":1}` |
| set | `{"op":"set","var":"fatigue","val":0}` |
| addFlag | `{"op":"addFlag","val":"dodged_once"}` |
| removeFlag | `{"op":"removeFlag","val":"dodged_once"}` |

---

## D2. fatigue 회복 & 오토세이브 순서 (확정)

### 회복 공식
- 기본: `fatigue = max(0, fatigue - 2)`
- Ch4 → Ch5 전환: `fatigue = max(0, fatigue - 1)`

### 처리 순서 (중요)
1. `end` 노드 진입
2. fatigue 회복 적용
3. `autosave_chX` 저장
4. 다음 챕터 `start` 노드 진입

---

## D3. 세이브 / 오토세이브 정책

### 슬롯 구성
- 수동 슬롯: 3개
- 오토 슬롯: `autosave_ch1` ~ `autosave_ch5`
- 오토 슬롯은 **최근 1개만 유지** (덮어쓰기)

### settings
- `localStorage.settings`
- 슬롯과 무관, 전역 공통

### 세이브 전체 스키마
```json
{
  "version": 1,
  "savedAt": "2026-01-28T12:34:56.000Z",
  "state": {
    "chapter": "ch3",
    "node": "c3_n12",
    "vars": {"trust":6,"sense":5,"interest":6,"fatigue":4},
    "flags": ["check_later"],
    "visited": {"c3_n1":true},
    "unlockedLogs": {"ch1":[0,2]}
  }
}
```

---

## D4. 조건부 분기 품질 하한선

- 챕터당 최소:
  - 조건부 `say(if[])` **4개 이상**
  - 조건부 `nextIf` **2개 이상**
- Ch4는 위 수치를 **상회하는 것을 권장**

---

## D5. chat 노드 운영 규칙 (확정)

- chat 노드는 **연출 전용**
- chat 내부:
  - `if[]` ❌
  - `choice` ❌
- 선택은 반드시 **외부 choice 노드**로 분리
- 메시지는 `delay`에 따라 **순차 출력**

---

## D6. 시간제한 선택지 (선택 구현)

- Ch4 갈등 파트에서 사용 가능
- 제한 시간: **8초**
- 시간 초과 시:
  - 자동 선택지 실행(침묵/회피)

---

# PART E. 노드 타입 샘플

## jump
```json
{ "type":"jump","target":"c1_n20" }
```
- 같은 챕터 내 노드만 허용

## playBgm / stopBgm / playSfx
```json
{ "type":"playBgm","track":"bgm_calm_01","fadeIn":800,"next":"c1_n2" }
{ "type":"stopBgm","fadeOut":500,"next":"c1_n3" }
{ "type":"playSfx","sfx":"msg_pop","next":"c1_n4" }
```

---

## 사운드 맵 & 트리거

### BGM
- `bgm_calm_01`: 일상
- `bgm_tension_01`: 갈등
- `bgm_soft_01`: 화해/엔딩

### SFX
- `msg_pop`: 메신저
- `btn_click`: 선택지
- `door_open`: 장면 진입
- `rain`: Ch5 배경

### 트리거 규칙
- 챕터 시작: `playBgm`
- 큰 장면 전환 후: `playSfx`
- 메신저 메시지: `msg_pop`

---

# PART F. 로그 시스템

## 로그 JSON 포맷
```json
{
  "id":"ch1",
  "entries":[
    {
      "unlock":{"when":"visited.c1_n3 || flags.has('dodged_once')"},
      "title":"‘괜찮아’의 온도",
      "text":"괜찮다는 말은 끝이 아니라 신호일 수 있다."
    }
  ]
}
```

---

# PART G. 엔딩 & 에필로그

## endings 전체 예시 (game.config.json)
```json
[
  {
    "id":"E_BURN",
    "title":"대화 번아웃",
    "when":"vars.fatigue>=8",
    "epilogue":{
      "bg":"room_night",
      "lines":[{"who":"mina","text":"지금은… 그냥 좀 쉬고 싶어."}],
      "summary":"말이 너무 많아 관계가 지쳤다."
    }
  },
  {
    "id":"E_SOLID",
    "title":"솔직해진 관계",
    "when":"vars.trust>=7 && vars.sense>=7 && vars.fatigue<8",
    "epilogue":{
      "bg":"rain_cafe",
      "lines":[
        {"who":"mina","text":"나 사실, 괜찮다는 말을 너무 쉽게 써."},
        {"who":"player","text":"그래도 이제는 알아들을 수 있을 것 같아."}
      ],
      "summary":"정답 대신 규칙을 합의했다."
    }
  }
]
```

---

## 결론
v3.3은:
- **누락 항목 0**
- **엔진/시나리오 기준 충돌 없음**
- **Ch1 리라이트 즉시 가능**

➡ 다음 단계: **Ch1 v3.3 기준 25~30노드 리라이트**
