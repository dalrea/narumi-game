# 미연시 프로젝트 킥스타터 (Codex/Claude용) — “눈치 로그”

이 문서는 **SIMSIM 레포** 안에 새 폴더를 만들어 웹 기반 미연시(비주얼 노벨)를 즉시 개발 시작할 수 있도록,  
**명령어 + 작업 지시 프롬프트 + 초기 컨텐츠 포맷/샘플**을 한 번에 제공합니다.

- 목표: **20~30분 플레이**(최소 5챕터, 각 5~7분)  
- 플랫폼: **순수 HTML/CSS/JS** (빌드/번들러 없이도 동작)  
- 저장: `localStorage` (세이브/로드)  
- 로그: “해석 로그(메타 코멘트)” 챕터 종료 시 해금  
- 분기: 누적 변수(신뢰/눈치/피로 등) 기반 엔딩 4~6개

---

## 0) 새 폴더 생성 (레포 루트에서)

> 스샷 기준 `SIMSIM/` 루트에 폴더를 하나 더 만들고 그 안에서 개발합니다.

```bash
# 레포 루트(SIMSIM)에서 실행
mkdir -p girlanguage_vn
cd girlanguage_vn

# 기본 파일 생성
mkdir -p src assets data data/chapters data/logs
touch index.html src/style.css src/app.js src/engine.js src/storage.js src/audio.js
touch data/game.config.json data/chapters/ch1.json data/chapters/ch2.json data/chapters/ch3.json data/chapters/ch4.json data/chapters/ch5.json
touch data/logs/ch1.log.json data/logs/ch2.log.json data/logs/ch3.log.json data/logs/ch4.log.json data/logs/ch5.log.json
```

---

## 1) 개발 규칙 (Codex/Claude 공통)

1. **파일/폴더는 위 구조 유지**  
2. 모든 텍스트는 **JSON 시나리오**로 분리(코드에 하드코딩 금지)  
3. 선택지는 “의미 해석”이 아니라 **행동 선택**이어야 함  
4. 각 노드는 짧게(1~2문장) 끊고, 클릭으로 진행  
5. 챕터마다:
   - 20~35개 노드
   - 선택지 4~7회
   - 챕터 종료 시 로그 6~12개 해금

---

## 2) 게임 디자인 요약 (엔진이 구현해야 할 것)

### 변수(예시)
- `trust` (신뢰)
- `sense` (눈치)
- `fatigue` (피로/대화 피로도)
- `interest` (호감)
- `flags` (문자열 배열, 사건 플래그)

### 엔딩 판정(예시)
- `trust>=7 && sense>=7` → “솔직해진 관계”
- `trust>=7 && sense<5` → “착한데 답답”
- `trust<5 && interest>=6` → “타이밍 놓침”
- `fatigue>=8` → “대화 번아웃”
- etc.

### UI 요구사항
- 대사창(이름/대사)
- 배경/캐릭터(일단 텍스트/색상 패널로 대체 가능)
- 선택지 버튼
- 상단 HUD: 챕터, 진행도, 변수 요약(토글)
- 메뉴: 저장/불러오기/로그/설정(오토/스킵은 옵션)

---

## 3) 시나리오 포맷 (Claude가 작성, Codex가 로드)

### `data/game.config.json`
- 챕터 순서, 타이틀, 엔딩 룰, 초기 변수

### 챕터 파일 `data/chapters/chN.json`
```json
{
  "id": "ch1",
  "title": "프롤로그: 괜찮아의 온도",
  "start": "n1",
  "nodes": {
    "n1": { "type": "say", "who": "나", "text": "오늘도 지각… 아니, 간당간당." , "next": "n2" },
    "n2": { "type": "say", "who": "미나", "text": "왔네? 괜찮아ㅎㅎ", "next": "n3" },

    "n3": {
      "type": "choice",
      "prompt": "(어떻게 반응할까?)",
      "choices": [
        { "label": "웃고 넘긴다", "effects": [{"op":"add","var":"fatigue","val":1}], "next": "n4a" },
        { "label": "미안하다고 사과한다", "effects": [{"op":"add","var":"trust","val":1}], "next": "n4b" },
        { "label": "무슨 일 있었어? 하고 묻는다", "effects": [{"op":"add","var":"sense","val":1}], "next": "n4c" }
      ]
    }
  }
}
```

### 로그 파일 `data/logs/chN.log.json`
```json
{
  "id": "ch1",
  "entries": [
    {
      "unlock": {"nodeVisited":"n2"},
      "title": "‘괜찮아ㅎㅎ’의 표정",
      "text": "문장 자체는 괜찮지만, 뒤에 붙은 ㅎㅎ는 ‘진짜 괜찮음’이 아니라 ‘더 얘기하고 싶지는 않음’일 때도 있다."
    }
  ]
}
```

---

## 4) Codex에게 바로 붙여 넣을 “개발 지시 프롬프트”

아래 프롬프트를 **그대로 Codex**에 전달하세요.

### 4.1 1단계 — 스캐폴딩 + 엔진
**Prompt (Codex):**
- 목표: `girlanguage_vn/` 안에 웹 기반 VN 엔진을 구현한다.
- 제약:
  - 외부 라이브러리 없이 순수 JS.
  - 시나리오/로그는 JSON 파일로 로드(fetch).
  - 라우팅 없음. `index.html` 하나로 실행.
- 구현해야 할 파일:
  1) `index.html` : 기본 레이아웃(대사창, 선택지 영역, HUD, 메뉴 모달)
  2) `src/style.css` : 최소 스타일(읽기 좋은 폰트/대비/버튼)
  3) `src/engine.js` :
     - `loadConfig()`, `loadChapter(id)`
     - 노드 타입 처리: `say`, `choice`, `setbg`, `setchar`, `jump`, `end`
     - effects 처리: `add/set/toggleFlag/pushFlag/popFlag`
     - 방문 노드 기록(로그 해금 조건용)
  4) `src/app.js` :
     - 초기 부팅, UI 이벤트, 챕터 진행, 메뉴 열기/닫기
  5) `src/storage.js` :
     - localStorage save 슬롯 3개(타임스탬프 포함)
     - 설정(텍스트 속도/자동 진행 on/off)
  6) `src/audio.js` :
     - BGM/효과음 훅(현재는 더미 구현 OK)
- 완료 조건:
  - `python -m http.server`로 실행 시 ch1이 플레이 가능.
  - 선택지/변수/로그 모달이 동작.
  - 저장/불러오기 정상 동작.

**실행 확인 명령:**
```bash
cd SIMSIM/girlanguage_vn
python -m http.server 5173
# 브라우저에서 http://localhost:5173
```

### 4.2 2단계 — 엔딩 룰/리플레이
**Prompt (Codex):**
- `data/game.config.json`에 엔딩 룰을 추가하고,
- 마지막 챕터 종료 시 변수에 따라 엔딩 화면을 출력.
- 엔딩 화면에서:
  - “해금된 로그 전체 보기”
  - “챕터 선택(해금된 챕터만)”
  - “리셋” 버튼 제공

---

## 5) Claude에게 바로 붙여 넣을 “시나리오/로그 작성 프롬프트”

아래 프롬프트를 **그대로 Claude**에 전달하세요.

### 5.1 전체 시나리오 설계(5챕터)
**Prompt (Claude):**
- 장르: 현대 일상 연애/커뮤니케이션 드라마(코미디 40, 현실 40, 메타 20).
- 히로인 1명: “미나”(22~26), 직설 못하는 이유가 존재(자존심/과거/성격).
- 플레이어(나): 말은 착한데 눈치가 흔들린다.
- ‘여자어’는 밈으로 소비되지만, 게임은 밈 맹신을 깨는 장면을 반드시 포함.
- 챕터 구성(각 20~35 노드, 선택지 4~7회):
  1) 프롤로그: “괜찮아ㅎㅎ”
  2) 친해짐: “아무거나”
  3) 미묘함: “바빠”
  4) 갈등: “됐어”
  5) 결말: 솔직함/번아웃/타이밍/무난 등 4~6 엔딩 분기
- 산출물:
  - `data/chapters/ch1.json` ~ `ch5.json` : 위 포맷 준수
  - `data/logs/ch1.log.json` ~ `ch5.log.json` : 챕터당 6~12개 엔트리
- 금지:
  - “정답은 여자어 해석이다” 같은 단선적 교훈 금지
  - 선택지를 “해석 A/B”로 주지 말고 “행동”으로만 구성
- 필수 장치:
  - 어떤 장면은 밈대로 해석하면 실패하고, 문자 그대로 받아야 성공
  - 플레이어의 이전 선택이 같은 문장을 다른 의미로 바꾸게 설계(플래그 활용)

---

## 6) 초기 컨텐츠(Ch1) — 바로 사용 가능한 샘플 (축약판)

> 아래 샘플은 “작동 테스트용” 짧은 버전입니다.  
> Claude 산출물로 **노드 수를 25~30개**로 늘리면 됩니다.

### 6.1 `data/game.config.json` (초안)
```json
{
  "title": "눈치 로그",
  "chapters": [
    {"id":"ch1","file":"data/chapters/ch1.json"},
    {"id":"ch2","file":"data/chapters/ch2.json"},
    {"id":"ch3","file":"data/chapters/ch3.json"},
    {"id":"ch4","file":"data/chapters/ch4.json"},
    {"id":"ch5","file":"data/chapters/ch5.json"}
  ],
  "initialState": {
    "chapter": "ch1",
    "node": "n1",
    "vars": {"trust": 3, "sense": 3, "fatigue": 0, "interest": 3},
    "flags": [],
    "visited": {}
  },
  "endings": [
    {
      "id": "E_SOLID",
      "title": "솔직해진 관계",
      "when": "vars.trust>=7 && vars.sense>=7 && vars.fatigue<8"
    },
    {
      "id": "E_KIND",
      "title": "착한데 답답",
      "when": "vars.trust>=7 && vars.sense<5"
    },
    {
      "id": "E_MISS",
      "title": "타이밍을 놓침",
      "when": "vars.trust<5 && vars.interest>=6"
    },
    {
      "id": "E_BURN",
      "title": "대화 번아웃",
      "when": "vars.fatigue>=8"
    },
    {
      "id": "E_NEUTRAL",
      "title": "무난한 결말",
      "when": "true"
    }
  ]
}
```

### 6.2 `data/chapters/ch1.json` (작동 테스트용 축약)
```json
{
  "id": "ch1",
  "title": "프롤로그: 괜찮아의 온도",
  "start": "n1",
  "nodes": {
    "n1": {"type":"setbg","bg":"campus_evening","next":"n2"},
    "n2": {"type":"say","who":"나","text":"(동아리방 문 앞에서 숨을 고른다.)","next":"n3"},
    "n3": {"type":"say","who":"미나","text":"왔네? 괜찮아ㅎㅎ","next":"n4"},

    "n4": {
      "type":"choice",
      "prompt":"(어떻게 반응할까?)",
      "choices":[
        {"label":"웃고 넘긴다","effects":[{"op":"add","var":"fatigue","val":1},{"op":"pushFlag","var":"flags","val":"dodged_once"}],"next":"n5a"},
        {"label":"미안하다고 사과한다","effects":[{"op":"add","var":"trust","val":1}],"next":"n5b"},
        {"label":"무슨 일 있었어? 하고 묻는다","effects":[{"op":"add","var":"sense","val":1}],"next":"n5c"}
      ]
    },

    "n5a": {"type":"say","who":"나","text":"하하… 오늘 길이 좀 막히더라.","next":"n6"},
    "n5b": {"type":"say","who":"나","text":"미안. 기다렸지?","next":"n6"},
    "n5c": {"type":"say","who":"나","text":"괜찮다는 말, 진짜야? 표정이…","next":"n6"},

    "n6": {"type":"say","who":"미나","text":"아니 진짜 괜찮아. 그냥… 오늘 좀 피곤해서.","next":"n7"},

    "n7": {
      "type":"choice",
      "prompt":"(다음 행동은?)",
      "choices":[
        {"label":"간식/음료를 사온다","effects":[{"op":"add","var":"trust","val":1},{"op":"add","var":"fatigue","val":1}],"next":"n8a"},
        {"label":"바로 본론(회의)을 시작한다","effects":[{"op":"add","var":"fatigue","val":2}],"next":"n8b"},
        {"label":"피곤하면 쉬자고 제안한다","effects":[{"op":"add","var":"sense","val":1},{"op":"add","var":"trust","val":1}],"next":"n8c"}
      ]
    },

    "n8a": {"type":"say","who":"미나","text":"…고마워. 이런 거, 은근 기억하고 있었구나.","next":"n9"},
    "n8b": {"type":"say","who":"미나","text":"응. 회의하자. (말은 그런데 눈이 살짝 풀린다.)","next":"n9"},
    "n8c": {"type":"say","who":"미나","text":"조금만 쉬었다 하자. …네가 그렇게 말해주니까 좋네.","next":"n9"},

    "n9": {"type":"say","who":"나","text":"(‘괜찮아’는 끝이 아니라, 시작일 수도.)","next":"n10"},
    "n10": {"type":"say","who":"미나","text":"근데 너, 요즘 단톡 답이 좀 늦더라?","next":"n11"},

    "n11": {
      "type":"choice",
      "prompt":"(이 질문의 온도는?)",
      "choices":[
        {"label":"가볍게 농담한다","effects":[{"op":"add","var":"fatigue","val":1}],"next":"n12a"},
        {"label":"솔직히 바빴다고 말한다","effects":[{"op":"add","var":"trust","val":1},{"op":"add","var":"sense","val":1}],"next":"n12b"},
        {"label":"왜? 무슨 일 있었어?로 돌린다","effects":[{"op":"add","var":"sense","val":1}],"next":"n12c"}
      ]
    },

    "n12a": {"type":"say","who":"나","text":"내가 좀… 인기인이잖아.","next":"n13"},
    "n12b": {"type":"say","who":"나","text":"미안. 요즘 과제 몰려서 폰을 잘 못 봤어.","next":"n13"},
    "n12c": {"type":"say","who":"나","text":"내가 늦었어? 무슨 일 있었어?","next":"n13"},

    "n13": {"type":"say","who":"미나","text":"아니야. 그냥… 그렇다고.","next":"n14"},

    "n14": {
      "type":"choice",
      "prompt":"(여기서 더 파고들까?)",
      "choices":[
        {"label":"더 묻는다","effects":[{"op":"add","var":"sense","val":1},{"op":"add","var":"fatigue","val":1}],"next":"n15a"},
        {"label":"일단 넘기고 다음에 챙긴다","effects":[{"op":"add","var":"trust","val":1},{"op":"pushFlag","var":"flags","val":"check_later"}],"next":"n15b"}
      ]
    },

    "n15a": {"type":"say","who":"나","text":"‘그렇다’는 게 뭐야. 말해줘.","next":"n16"},
    "n15b": {"type":"say","who":"나","text":"알겠어. 오늘 끝나고 내가 먼저 연락할게.","next":"n16"},

    "n16": {"type":"say","who":"미나","text":"…응. (숨이 아주 조금 가벼워진다.)","next":"n17"},
    "n17": {"type":"end","nextChapter":"ch2"}
  }
}
```

### 6.3 `data/logs/ch1.log.json` (축약)
```json
{
  "id": "ch1",
  "entries": [
    {
      "unlock": {"nodeVisited":"n3"},
      "title": "‘괜찮아ㅎㅎ’는 결론이 아니다",
      "text": "상대가 ‘괜찮아’라고 말해도 대화가 끝났다는 뜻은 아니다. 더 말하고 싶지 않다는 신호일 때도, 알아주길 바라는 시작일 때도 있다."
    },
    {
      "unlock": {"flag":"dodged_once"},
      "title": "웃고 넘기기의 비용",
      "text": "유머는 긴장을 풀지만, 감정을 ‘회피했다’는 인상을 주기도 한다. 같은 농담도 타이밍이 핵심이다."
    },
    {
      "unlock": {"nodeVisited":"n10"},
      "title": "질문처럼 들리는 확인",
      "text": "‘요즘 답이 늦더라’는 정보 전달이 아니라 관계의 온도를 확인하는 말일 수 있다. 정답은 해석이 아니라 행동의 누적에 있다."
    },
    {
      "unlock": {"flag":"check_later"},
      "title": "‘나중에 챙길게’의 신뢰",
      "text": "바로 해결하지 못해도, ‘내가 기억하고 있다’는 신호가 신뢰를 만든다. 단, 실제로 실행하지 않으면 역효과가 크다."
    }
  ]
}
```

---

## 7) 테스트 체크리스트 (완료 기준)

- [ ] `index.html` 단독 실행(서버 필요)에서 첫 챕터 진행 가능
- [ ] 선택지 누르면 변수 변화가 HUD에 반영
- [ ] 챕터 끝나면 로그 해금, 로그 모달에서 확인 가능
- [ ] 저장 3슬롯/불러오기 정상
- [ ] `game.config.json` 엔딩 룰대로 엔딩 화면 진입
- [ ] 리셋/챕터 선택으로 재플레이 가능

---

## 8) 후속 확장 아이디어 (선택)

- 오토 진행/스킵/읽은 텍스트 스킵
- 대사 타자 효과(텍스트 속도 설정)
- 간단한 초상화/배경 이미지(assets) 추가
- “그때 그녀가 왜 저 말을 했는지” 메타 로그를 엔딩 후 추가 해금
- 밈 맹신을 깨는 반전 챕터(문자 그대로가 정답인 구간 강화)

---

## 9) 빠른 시작 요약

1) 폴더 생성 + 파일 생성  
2) Codex로 엔진/저장/UI 구현  
3) Claude로 5챕터 JSON + 로그 JSON 생성  
4) `python -m http.server`로 로컬 플레이 테스트  
5) 분기/로그/엔딩 밸런싱

