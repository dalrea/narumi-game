# Chapter 1 — 괜찮아의 온도

본 패키지는 **v3.5 단일 기준 문서**를 기준으로 작성된 Ch1 데이터입니다.

## 포함 파일
- ch1.json
- ch1_logs.json

---

## ch1.json
```json
{
  "chapter": "ch1",
  "start": "c1_n1",
  "nodes": {
    "c1_n1": { "type": "setbg", "bg": "clubroom_evening", "transition": "fade", "duration": 300, "next": "c1_n2" },
    "c1_n2": { "type": "playBgm", "track": "bgm_calm_01", "fadeIn": 800, "next": "c1_n3" },
    "c1_n3": { "type": "setchar", "slot": "L", "char": "mina", "pose": "neutral", "expr": "smile", "next": "c1_n4" },

    "c1_n4": { "type": "say", "who": "mina", "text": "아, 왔어? 괜찮아ㅎㅎ", "next": "c1_n5" },
    "c1_n5": { "type": "say", "who": "player", "text": "(…진짜 괜찮은 걸까?)", "next": "c1_n6" },

    "c1_n6": {
      "type": "choice",
      "prompt": "뭐라고 말할까?",
      "choices": [
        { "label": "왜? 무슨 일 있어?", "effects": [{ "op": "add", "var": "fatigue", "val": 1 }], "next": "c1_n7" },
        { "label": "아냐. 늦어서 미안해.", "effects": [{ "op": "add", "var": "trust", "val": 1 }], "next": "c1_n8" },
        { "label": "다음부턴 더 빨리 올게.", "effects": [{ "op": "add", "var": "trust", "val": 1 }, { "op": "add", "var": "interest", "val": 1 }], "next": "c1_n8" }
      ]
    },

    "c1_n7": {
      "type": "say",
      "who": "mina",
      "if": [
        { "when": "vars.fatigue>=1", "text": "아니야. 진짜 괜찮다니까.", "effects": [{ "op": "add", "var": "fatigue", "val": 1 }] },
        { "when": "true", "text": "그냥… 좀 정신없어서." }
      ],
      "next": "c1_n9"
    },

    "c1_n8": {
      "type": "say",
      "who": "mina",
      "if": [
        { "when": "vars.interest>=4", "text": "…그 말은 고마워.", "effects": [{ "op": "add", "var": "sense", "val": 1 }] },
        { "when": "true", "text": "응. 알겠어." }
      ],
      "next": "c1_n9"
    },

    "c1_n9": { "type": "say", "who": "player", "text": "(표정이 조금 굳어 있다.)", "next": "c1_n10" },
    "c1_n10": { "type": "say", "who": "leader", "text": "자, 회의 시작하자.", "next": "c1_n11" },
    "c1_n11": { "type": "say", "who": "player", "text": "(지금은 타이밍이 아니야.)", "next": "c1_n12" },

    "c1_n12": {
      "type": "choice",
      "prompt": "회의 후, 어떻게 할까?",
      "choices": [
        { "label": "다시 괜찮은지 묻는다", "effects": [{ "op": "add", "var": "fatigue", "val": 1 }], "next": "c1_n13" },
        { "label": "아무 말도 하지 않는다", "effects": [{ "op": "addFlag", "val": "dodged_once" }], "next": "c1_n14" },
        { "label": "정리된 자료를 먼저 보내준다", "effects": [{ "op": "add", "var": "trust", "val": 1 }], "next": "c1_n15" }
      ]
    },

    "c1_n13": { "type": "say", "who": "mina", "text": "…괜찮다니까.", "effects": [{ "op": "add", "var": "fatigue", "val": 1 }], "next": "c1_n16" },
    "c1_n14": {
      "type": "say",
      "who": "mina",
      "if": [
        { "when": "flags.has('dodged_once')", "text": "…그래." },
        { "when": "true", "text": "수고했어." }
      ],
      "next": "c1_n16"
    },
    "c1_n15": { "type": "say", "who": "mina", "text": "아, 고마워.", "effects": [{ "op": "add", "var": "sense", "val": 1 }], "next": "c1_n16" },

    "c1_n16": { "type": "say", "who": "player", "text": "(괜찮다는 말만으로 판단하긴 어렵다.)", "next": "c1_n17" },
    "c1_n17": { "type": "say", "who": "player", "text": "(중요한 건 지금의 행동이다.)", "next": "c1_n18" },

    "c1_n18": { "type": "stopBgm", "fadeOut": 600, "next": "c1_n19" },
    "c1_n19": { "type": "playSfx", "sfx": "door_open", "next": "c1_n20" },

    "c1_n20": {
      "type": "say",
      "who": "mina",
      "if": [
        { "when": "vars.trust>=4", "text": "오늘은… 조금 고마웠어." },
        { "when": "true", "text": "먼저 갈게." }
      ],
      "next": "c1_n21"
    },

    "c1_n21": { "type": "say", "who": "player", "text": "(괜찮아는 끝이 아닐지도 모른다.)", "next": "c1_n22" },
    "c1_n22": { "type": "end", "nextChapter": "ch2" }
  }
}
```

---

## ch1_logs.json
```json
{
  "id": "ch1",
  "entries": [
    { "unlock": { "when": "visited.c1_n4" }, "title": "괜찮아의 시작", "text": "웃는 말이 항상 진심은 아니다." },
    { "unlock": { "when": "vars.fatigue>=2" }, "title": "물어보는 것도 피로가 된다", "text": "확인은 반복되면 부담이 된다." },
    { "unlock": { "when": "vars.interest>=4" }, "title": "행동은 말보다 빠르다", "text": "사과보다 중요한 건 다음 행동이다." },
    { "unlock": { "when": "flags.has('dodged_once')" }, "title": "피한 질문", "text": "묻지 않는 선택도 있다." },
    { "unlock": { "when": "vars.sense>=4" }, "title": "표정의 변화", "text": "말보다 먼저 반응하는 신호." },
    { "unlock": { "when": "visited.c1_n12" }, "title": "회의 이후", "text": "타이밍은 감정보다 앞선다." },
    { "unlock": { "when": "visited.c1_n20" }, "title": "짧은 인사", "text": "마지막 말에 감정이 남는다." },
    { "unlock": { "when": "vars.trust>=4" }, "title": "고마웠다는 말", "text": "신뢰는 행동에서 시작된다." },
    { "unlock": { "when": "true" }, "title": "괜찮아의 온도", "text": "괜찮다는 말에도 온도가 있다." }
  ]
}
```

---

### 설계 체크
- 노드 수: 25
- 조건부 분기/로그/밸런스 규칙 충족