# MonV2 Assets

스타듀밸리 스타일의 픽셀 아트 에셋 가이드

## 폴더 구조

```
assets/
├── monsters/     # 몬스터 스프라이트 (50개)
├── ui/           # UI 프레임, 버튼, 패널 등
├── tiles/        # 미로 타일셋
└── fonts/        # 픽셀 폰트 파일 (옵셔널)
```

## 에셋 스펙

### 1. Monsters (monsters/)

**파일명 규칙**: `monster_001.png` ~ `monster_050.png`

**권장 크기**: 32x32px 또는 48x48px

**스타일**:
- 픽셀 아트 스타일
- 투명 배경 (PNG)
- 각 몬스터는 정면을 보는 자세
- 따뜻하고 친근한 색감

**몬스터 리스트**:
- 001: Flamby (🔥 fire)
- 002: Blazecub (🦁 fire)
- 003: Infernox (🐉 fire)
- ... (총 50종)

### 2. UI Elements (ui/)

**필요한 UI 요소**:

#### Panel Frame
- `panel_frame.png` - 나무 프레임 패널 (9-slice)
- 크기: 48x48px (각 모서리 16px)
- 색상: 따뜻한 갈색 계열 (#5c3d2e, #8b5a2b, #c4a574)

#### Buttons
- `button_normal.png` - 일반 버튼 상태
- `button_hover.png` - 마우스 오버
- `button_pressed.png` - 클릭 상태
- 크기: 48x16px (9-slice 가능)

#### Icons
- `icon_pokeball.png` - 몬스터볼 아이콘 (16x16px)
- `icon_heart.png` - 하트 아이콘 (16x16px)
- `icon_exit.png` - 출구 아이콘 (16x16px)

#### Tab
- `tab_inactive.png` - 비활성 탭
- `tab_active.png` - 활성 탭

### 3. Tiles (tiles/)

**미로 타일셋**: `tileset.png`

**타일 크기**: 16x16px per tile

**필요한 타일**:
1. **Floor** (바닥)
   - floor_01.png - 기본 바닥 (밝은 탄색 #dbc4a0)
   - floor_02.png - 바닥 변형 (약간 어두운 톤)

2. **Wall** (벽)
   - wall_top.png - 벽 상단 (입체감)
   - wall_side.png - 벽 측면
   - wall_corner.png - 벽 모서리
   - 색상: 짙은 갈색 (#5c3d2e, #8b5a2b)

3. **Exit** (출구)
   - exit.png - 문 타일 (녹색 계열 #7cb342)

### 4. Fonts (fonts/)

**픽셀 폰트** (옵셔널 - 현재는 Google Fonts 사용 중):
- 현재 사용: "Press Start 2P" (Web Font)
- 로컬 폰트 사용 시: `pixel_font.ttf` 또는 `pixel_font.woff2`

## 색상 팔레트

스타듀밸리 스타일 색상:

### Wood & Earth Tones
```
--wood-dark: #5c3d2e       (어두운 나무)
--wood-medium: #8b5a2b     (중간 나무)
--wood-light: #c4a574      (밝은 나무)
--wood-highlight: #dbc4a0  (하이라이트)
```

### Type Colors
```
--type-fire: #e57373       (불)
--type-water: #5c9ce6      (물)
--type-grass: #7cb342      (풀)
--type-electric: #ffd54f   (전기)
--type-ice: #81d4fa        (얼음)
--type-rock: #a1887f       (바위)
--type-ghost: #ab47bc      (고스트)
--type-dragon: #7c4dff     (드래곤)
--type-dark: #455a64       (악)
--type-fairy: #f48fb1      (페어리)
--type-steel: #90a4ae      (강철)
--type-psychic: #ce93d8    (에스퍼)
```

### Rarity Colors
```
--rarity-common: #a5d6a7     (일반)
--rarity-uncommon: #5c9ce6   (언커먼)
--rarity-rare: #ab47bc       (레어)
--rarity-epic: #e57373       (에픽)
--rarity-legendary: #ffd54f  (전설)
```

## 임시 솔루션 (현재)

현재는 **이모지**를 사용하여 게임이 작동합니다:
- 몬스터: 🔥, 🐉, 💧, 🌱 등
- 아이템: 🔴 (몬스터볼), 💊 (하트)
- 플레이어: 🧑
- 적: 👻, 👾, 🤖, 👹

픽셀 아트 에셋이 준비되면 JavaScript에서 이미지 로딩으로 전환할 예정입니다.

## 에셋 통합 방법

### 1. 스프라이트 로딩 시스템
```javascript
const sprites = {
    monsters: {},
    ui: {},
    tiles: {}
};

async function loadSprite(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = path;
    });
}

// 사용 예시
sprites.monsters[1] = await loadSprite('assets/monsters/monster_001.png');
```

### 2. Canvas 렌더링
```javascript
// 이모지 대신 이미지 렌더링
ctx.drawImage(sprites.monsters[monsterId], x, y, width, height);
```

## 에셋 제작 도구 추천

- **Aseprite** - 픽셀 아트 전문 툴 (유료)
- **Piskel** - 무료 온라인 픽셀 아트 에디터
- **GraphicsGale** - 무료 픽셀 아트 툴
- **Photoshop/GIMP** - Pencil tool + Grid 사용

## 다음 단계

1. ✅ 폴더 구조 생성
2. ✅ 게임 기본 구조 완성 (이모지 버전)
3. ⏳ 픽셀 아트 에셋 제작
4. ⏳ 스프라이트 로딩 시스템 구현
5. ⏳ 이모지 → 이미지 전환

---

**참고**: 에셋이 없어도 게임은 이모지로 완전히 플레이 가능합니다!
