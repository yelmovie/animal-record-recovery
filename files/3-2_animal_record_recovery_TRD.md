# TRD — 동물기록 복구작전

- 프로젝트: Animal Record Recovery
- Repository: `animal-record-recovery`
- 대상: 초등학교 3학년 과학
- 구조: 5 Stages / 10 Screens
- 플랫폼: Tablet-first Web / PWA
- 문서 버전: 1.0
- 작성일: 2026-08-24

---

## 1. 기술 목표

1. 학교 태블릿 브라우저에서 안정적으로 실행
2. 3D가 학습상 필요한 화면에서만 Three.js 사용
3. 분류·증거 조합·설계 등은 Phaser/DOM 중심으로 구현
4. Three.js와 Phaser의 불필요한 동시 렌더링 방지
5. 화면별 lazy loading 및 dispose
6. 새로고침/오프라인 상황에서도 진행도 보존
7. 한글 UI는 HTML/CSS/SVG로 분리
8. 외부 백엔드 없이도 단원 단독 실행 가능
9. 허브 통합 시 `MissionResult` 계약만 지키도록 모듈화
10. Android Chrome과 iPad Safari를 핵심 테스트 대상으로 설정

## 2. 권장 기술 스택

### Core
- Vite
- TypeScript
- Phaser 3
- Three.js

### UI
- HTML
- CSS
- SVG
- DOM Overlay

### Data
- JSON
- Typed interfaces
- JSON Schema 선택 적용

### Persistence
- IndexedDB 권장
- LocalStorage는 작은 설정/폴백 용도

### Optional APIs
- `navigator.mediaDevices.getUserMedia()` — Screen 02 선택적 현장 관찰
- `DeviceOrientationEvent` — Screen 06 선택적 센서 탐색
- `BarcodeDetector` — QR 스캔 지원 가능 기기에서 선택 사용
- Canvas API / Pointer Events — Screen 09 스케치

### 3D Asset
- GLB / glTF
- WebP
- KTX2 선택 적용
- Draco/Meshopt 선택 적용

### Audio
- OGG + MP3 또는 M4A fallback

## 3. 런타임 아키텍처

```text
AppShell
├─ ThreeRoot
├─ PhaserRoot
└─ UIOverlay
```

권장 DOM:

```html
<div id="game-shell">
  <div id="three-root"></div>
  <div id="phaser-root"></div>
  <div id="ui-overlay"></div>
</div>
```

### 실행 원칙

- Screen 02, 06: Three.js 활성
- Screen 03, 04, 05, 07, 08, 09, 10: Phaser 또는 DOM 활성
- 전환 시 사용하지 않는 렌더 루프는 중지
- 같은 화면에서 Three.js + Phaser를 동시에 계속 렌더하지 않음
- UIOverlay는 공통 DOM으로 유지
- Screen 01은 2.5D/DOM 또는 경량 프리렌더 배경으로 구현 권장

## 4. 화면별 구현 모드

| Screen | 구현 모드 | 주 엔진 | 비고 |
|---|---|---|---|
| 01 | 2.5D + DOM | DOM/Canvas | 메인, 코어 복구 연출 |
| 02 | 고정 카메라 3D Object Viewer | Three.js | 핵심 3D |
| 03 | 2D 카드 조합 | Phaser/DOM | 증거 비교 |
| 04 | 2D 분류 게임 | Phaser | Drag & Drop |
| 05 | 2D 시뮬레이션 | Phaser/DOM | 기준 검증 |
| 06 | 경량 실시간 3D Diorama | Three.js | 핵심 3D |
| 07 | 2D 관계 분석 | Phaser | 카드 체인 |
| 08 | 2D 추론 게임 | Phaser/DOM | 제한 조사 |
| 09 | 2D 설계 캔버스 | Phaser/Canvas | 드래그+스케치 |
| 10 | 2D 테스트 + 결과 연출 | Phaser/DOM | 결과 카드 |

## 5. 앱 폴더 구조

```text
src/
├─ app/
│  ├─ App.ts
│  ├─ router.ts
│  └─ lifecycle.ts
├─ lessons/
│  └─ animal-record-recovery/
│     ├─ index.ts
│     ├─ manifest.json
│     ├─ screens/
│     │  ├─ screen01-main/
│     │  ├─ screen02-observer-3d/
│     │  ├─ screen03-compare/
│     │  ├─ screen04-classify/
│     │  ├─ screen05-criteria-verify/
│     │  ├─ screen06-habitat-dome-3d/
│     │  ├─ screen07-relation/
│     │  ├─ screen08-investigation/
│     │  ├─ screen09-designer/
│     │  └─ screen10-test-result/
│     ├─ content/
│     │  ├─ animals.json
│     │  ├─ observations.json
│     │  ├─ habitats.json
│     │  ├─ classification-criteria.json
│     │  ├─ investigation-cases.json
│     │  ├─ design-problems.json
│     │  └─ glossary.json
│     ├─ state/
│     │  ├─ animalLessonStore.ts
│     │  └─ selectors.ts
│     ├─ events/
│     │  └─ animalLessonEvents.ts
│     ├─ three/
│     │  ├─ AnimalViewer.ts
│     │  ├─ HabitatDome.ts
│     │  ├─ AssetManager.ts
│     │  └─ dispose.ts
│     ├─ phaser/
│     │  ├─ scenes/
│     │  └─ phaserConfig.ts
│     ├─ ui/
│     │  ├─ components/
│     │  └─ styles/
│     └─ assessment/
│        ├─ scoring.ts
│        └─ missionResult.ts
├─ shared/
│  ├─ event-bus/
│  ├─ persistence/
│  ├─ audio/
│  └─ accessibility/
└─ assets/
```

## 6. 라우팅 제안

```text
/animal-record-recovery
/animal-record-recovery/01
/animal-record-recovery/02
...
/animal-record-recovery/10
```

허브 통합 시에는 실제 URL 라우팅이 아니라 lesson adapter 내부 상태 라우팅으로 바꿔도 된다.

## 7. 상태 모델

```ts
type StageId = "stage-1" | "stage-2" | "stage-3" | "stage-4" | "stage-5";

interface AnimalLessonState {
  version: 1;
  currentScreen: number;
  unlockedScreens: number[];
  completedStages: StageId[];
  coreFragments: number;

  observations: Record<string, ObservationRecord>;
  comparisonResults: ComparisonResult[];
  classificationAttempts: ClassificationAttempt[];
  habitatEvidence: HabitatEvidence[];
  investigationCases: InvestigationCaseResult[];
  designDraft?: DesignDraft;
  designResult?: DesignResult;

  codex: Record<string, CodexEntryState>;

  accessibility: {
    reducedMotion: boolean;
    bgmMuted: boolean;
    sfxMuted: boolean;
    textScale: "normal" | "large";
  };

  devicePermissions: {
    camera: "unknown" | "granted" | "denied" | "unsupported";
    orientation: "unknown" | "granted" | "denied" | "unsupported";
  };
}
```

## 8. MissionResult 계약

단원은 허브의 재화/인벤토리를 직접 수정하지 않는다.

```ts
interface MissionResult {
  topicId: "topic-02-animal";
  attemptId: string;
  completed: boolean;
  score: number;
  stars: 1 | 2 | 3;
  stageResults: {
    stageId: string;
    passed: boolean;
    score: number;
  }[];
  unlocks: string[];
  completedAt: string;
}
```

Standalone 모드에서는 MissionResult를 로컬 저장하고 결과 화면에만 표시한다.

## 9. EventBus 이벤트

```text
lesson:screen-enter
lesson:screen-exit
lesson:stage-complete
lesson:save-request

observation:pin-added
observation:evidence-earned
observation:camera-open
observation:camera-closed

classification:criterion-created
classification:animal-moved
classification:submitted
classification:verification-failed
classification:verification-passed

habitat:animal-found
habitat:evidence-earned
habitat:relation-submitted

investigation:clue-opened
investigation:guess-submitted
investigation:evidence-submitted

design:feature-selected
design:part-added
design:drawing-updated
design:test-run
design:revision-requested
design:completed

lesson:mission-result
```

## 10. 데이터 설계 — animals.json

동물 사실은 코드에 하드코딩하지 않는다.

```json
{
  "id": "frog",
  "nameKo": "개구리",
  "model": "animal_frog.glb",
  "thumbnail": "animal_frog.webp",
  "observableFeatures": [
    {
      "id": "frog_hind_leg",
      "labelKo": "길고 튼튼한 뒷다리",
      "hotspot": "hind_leg"
    }
  ],
  "habitats": ["freshwater_edge"],
  "lifeBehaviors": ["jumping", "swimming"],
  "sourceNote": "콘텐츠 검수 후 출처 기입"
}
```

주의:
- “adaptation” 같은 필드를 학습 개념 필드로 만들지 않는다.
- `relationNotes`는 환경과 관찰된 생김새·생활 방식의 관계를 설명하는 수준으로 제한.
- `sourceNote` 또는 `sourceId` 필수.

## 11. Screen 02 — 3D 동물 관찰기

### 클래스 구조

```text
AnimalViewer
├─ Scene
├─ PerspectiveCamera
├─ WebGLRenderer
├─ OrbitController(custom touch tuned)
├─ GLTFLoader
├─ Raycaster
├─ HotspotManager
└─ AnnotationOverlay(DOM)
```

### 카메라
- 자유 이동 없음
- 오브젝트 중심 Orbit
- min/max distance 제한
- zoom 범위 제한
- polar angle 제한으로 모델 뒤집힘 방지

### 핫스팟
- GLB의 bone/node 이름에 직접 종속되지 않도록 logical hotspot map 사용
- 예: `head`, `wing`, `leg`, `hind_leg`, `body_surface`
- 파일: `animal-hotspots.json`

### 터치
- 1 finger drag: orbit
- 2 finger pinch: zoom
- tap: raycast hotspot
- hotspot hit 시 DOM label 표시

### 카메라 기능
선택 기능.
- HTTPS 필요
- 사진은 기본적으로 서버 업로드 금지
- 가능하면 브라우저 메모리 또는 IndexedDB에만 저장
- 외부 전송 시 별도 동의 필요

### 3D 성능 목표
- 동시에 로드하는 동물 1마리
- 모델 권장 8k~20k triangles
- 텍스처 1024 이하 우선
- 재질 슬롯 최소화
- 그림자 0~1
- HDR 1K 이하 또는 hemisphere/directional light 사용
- 후처리 없음

## 12. Screen 06 — 3D 생태 돔

### 목표
자유 이동 RPG가 아니라 **작은 3D 디오라마를 회전 탐색**하는 구조.

### 클래스

```text
HabitatDome
├─ Scene
├─ OrbitCamera
├─ DioramaRoot
├─ InstancedVegetation
├─ AnimalMarkers
├─ ScanReticle
├─ LightRig
└─ SensorController(optional)
```

### 환경
한 번에 1개 환경만 로드.

예:
- `habitat_forest.glb`
- `habitat_freshwater.glb`
- `habitat_ocean.glb`
- `habitat_dry.glb`
- `habitat_cold.glb`

가능하면 환경 전체를 GLB 하나로 만들기보다 ground, tree/rock, water plane, animal props를 조합한다.

### 반복 오브젝트
InstancedMesh 사용:
- 나무
- 풀
- 돌

### 동물
멀리 있는 동물은 full rigged model 불필요.
- static GLB
- sprite/impostor
- 간단한 idle animation
중 하나 사용.

### Device Orientation
선택 기능.
- iOS는 사용자 제스처 뒤 권한 요청
- 권한이 없으면 드래그 탐색 사용
- 센서 없이는 완주 불가한 미션 금지

### 성능 목표
- visible triangles: low 100k~150k 목표
- 일반 150k~200k 이하 목표
- pixel ratio cap: low 1.0 / medium 1.25 / high 1.5
- dynamic shadow: low off
- particle 최소
- post-processing 기본 off

## 13. Phaser 화면 구현

### Screen 03
- 카드 기반 drag/drop
- 증거 카드의 출처 동물 id 유지
- drop target은 같은점/다른점
- 제출 시 rule evaluator 실행

### Screen 04
- 동물 카드 최대 12
- pointerdown/pointermove/pointerup
- 중복 배치 방지
- 누락 카드 제출 방지

### Screen 05
- 가상 연구원 결과는 애니메이션 연출
- 실제 결과 계산은 deterministic rule
- ambiguous criterion은 content data에서 사전 정의

### Screen 07
- 3개의 슬롯 기반 relation chain
- drag/drop 후 relation evaluator
- distractor 카드 포함

### Screen 08
- clue energy = 3
- clue open event 시 즉시 저장
- 답을 바꾸더라도 사용한 에너지는 유지
- 정답 외에 근거 2개 제출 필수

### Screen 09
- 설계 캔버스
- parts layer + drawing layer + annotation layer
- 스케치는 Pointer Events 또는 Canvas
- Undo/Redo 최소 10 step

### Screen 10
- design rule evaluator
- 조건 미충족 시 `failedRules` 반환
- Screen 09로 돌아갈 때 `designDraft` 복원

## 14. 분류 기준 검증 엔진

```ts
type CriterionType =
  | "observable_boolean"
  | "observable_count"
  | "ambiguous_subjective";
```

예:
- 날개가 있나요? → observable_boolean
- 다리가 있나요? → observable_boolean
- 빠른가요? → ambiguous_subjective

### 검증 로직
1. 기준에 필요한 observable field 확인
2. 모든 대상 동물에 값이 존재하는지 확인
3. 값이 deterministic인지 확인
4. ambiguous_subjective이면 가상 연구원 결과를 일부 다르게 시각화
5. 학생이 더 명확한 기준을 선택/생성하도록 유도

학생에게 내부 타입명은 노출하지 않는다.

## 15. 관계 분석 엔진

```ts
interface RelationTriplet {
  animalId: string;
  habitatEvidenceId: string;
  featureEvidenceId: string;
  behaviorEvidenceId: string;
}
```

검증:
- 세 카드가 같은 동물 또는 사전에 연결된 관계 세트에 속하는지 확인
- “환경 때문에 이런 몸이 되었다” 같은 직접 인과 문장 자동 생성 금지
- UI 문장은 관련성 중심으로 템플릿 처리

## 16. 조사 추론 엔진

```ts
interface InvestigationCase {
  id: string;
  targetAnimalId: string;
  clueBudget: 3;
  clues: {
    id: string;
    category: "place" | "body" | "movement" | "foot" | "life";
    value: string;
  }[];
  candidates: string[];
  validEvidenceIds: string[];
}
```

정답 조건:
- targetAnimalId 선택
- validEvidenceIds 중 최소 2개 제출

## 17. 설계·테스트 엔진

```ts
interface DesignProblem {
  id: string;
  problemKo: string;
  requiredFunctions: string[];
}

interface AnimalFeature {
  id: string;
  animalId: string;
  labelKo: string;
  functionTags: string[];
}

interface DesignDraft {
  problemId: string;
  selectedFeatureIds: string[];
  placedParts: PlacedPart[];
  drawingData?: string;
  titleKo: string;
  explanationKo: string;
}
```

### 테스트 원칙
복잡한 물리 시뮬레이션을 필수로 만들지 않는다. 초등 3학년 설계 평가 목적에 맞게 **규칙 기반 기능 점검**을 우선한다.

예:
- 보호 문제 → 보호 기능 태그 + 보호 영역 부품 필요
- 붙이는 문제 → 부착 기능 태그 + 접촉 부품 필요

물리 연출은 결과 시각화 역할만 담당한다.

## 18. 스케치 데이터

권장:
- draw strokes를 벡터 포인트 배열로 저장
- PNG는 최종 export 시 생성

```ts
interface Stroke {
  points: { x: number; y: number }[];
  width: number;
}
```

## 19. QR 공유

MVP에서 선택 기능.

원칙:
- 학생 이름, 학번 등 개인정보를 QR에 넣지 않음
- 결과 payload 최소화
- 가능하면 compact JSON → base64url
- 데이터 크기 초과 시 이미지 저장 공유로 대체

실서비스에서 학생 식별 공유가 필요하면 별도 서버 정책 필요.

## 20. 퍼시스턴스

### IndexedDB Stores
```text
lesson_state
design_drafts
camera_observations
mission_results
```

### 저장 타이밍
- screen exit
- stage complete
- clue opened
- design changed (debounce)
- app background (`visibilitychange`)

state schema version을 저장하여 이후 마이그레이션 가능하게 한다.

## 21. 오프라인

### 필수 캐시
- 앱 shell
- 현재 Stage 코드
- 현재 Stage 핵심 이미지/GLB

### 금지
- 모든 5개 생태 돔과 모든 동물 GLB를 최초 Service Worker precache

Stage 진입 시 필요한 자산을 lazy load.

## 22. AssetManager

```ts
class AssetManager {
  loadGroup(groupId: string): Promise<void>;
  retain(assetId: string): void;
  release(assetId: string): void;
  disposeGroup(groupId: string): void;
}
```

그룹 예:
- `screen02-animal-frog`
- `screen06-habitat-forest`
- `screen09-designer-common`

장면 종료 후 전용 geometry/material/texture dispose.

## 23. 에셋 파일명 규칙

영문 소문자 snake_case.

### 3D
```text
animal_frog.glb
animal_crab.glb
animal_fish.glb
animal_bee.glb
animal_deer.glb
animal_snail.glb

habitat_forest.glb
habitat_freshwater.glb
habitat_ocean.glb
habitat_dry.glb
habitat_cold.glb

prop_scanner.glb
prop_data_core.glb
```

### 2D
```text
bg_lab_main.webp
bg_compare_board.webp
bg_classification_gate.webp
bg_investigation_lab.webp
bg_design_lab.webp
fx_core_restore.webp
```

### UI
```text
icon_observation.svg
icon_classification.svg
icon_habitat.svg
icon_evidence.svg
icon_design.svg
```

## 24. 3D 모델 제작 목표

### 동물
- 8k~20k triangles 권장
- 1024 texture 우선
- 재질 슬롯 1~3
- 눈, 털, 비늘 등 과도한 투명/쉐이더 금지
- 관찰에 필요한 특징이 실루엣에서 분명해야 함

### 생태 돔
- 환경 전체 visible 150k~200k triangles 이하 목표
- 반복 자연물은 InstancedMesh
- 동적 그림자 최소화
- water shader는 저사양 프로필에서 단순 plane으로 대체

## 25. 품질 프로필

### Low
```text
fps cap: 30
pixel ratio: 1.0
shadow: off
post: off
particles: low
texture max: 1024
```

### Medium
```text
fps target: 45~60
pixel ratio: 1.25
shadow: one key object
post: off
particles: medium
```

### High
```text
fps target: 60
pixel ratio: max 1.5
shadow: limited
optional weak bloom
particles: medium-high
```

## 26. 카메라 권한

- 사용자가 버튼을 눌렀을 때만 요청
- HTTPS에서만 사용
- 거절해도 Stage 완주 가능
- 사진 서버 업로드 기본값 금지
- 카메라가 없거나 권한 거부면 3D 표본 관찰로 폴백

## 27. 접근성

- touch target 44~48 CSS px 이상
- 색상 + 아이콘 + 텍스트로 상태 표시
- reduce motion
- BGM/SFX 개별 음소거
- 큰 글씨 옵션
- 키보드/마우스 기본 조작도 가능하도록 Pointer Events 중심 설계
- 중요한 조작을 hover에만 두지 않음

## 28. 오디오

추천 파일:
```text
bgm_animal_lab.ogg
bgm_animal_lab.mp3
bgm_observation.ogg
bgm_observation.mp3
bgm_habitat.ogg
bgm_habitat.mp3
bgm_design.ogg
bgm_design.mp3
sfx_scan.ogg
sfx_scan.mp3
sfx_core_restore.ogg
sfx_core_restore.mp3
```

첫 사용자 제스처 이후 AudioContext 활성화.

## 29. 개인정보·보안

- 카메라 촬영물은 기본적으로 로컬 저장
- 학생 이름·학번 입력 기능을 기본 요구사항으로 두지 않음
- QR payload에 개인정보 금지
- 외부 링크/외부 업로드는 교사 설정 없이는 사용하지 않음
- 생성형 AI API 키를 클라이언트에 포함하지 않음
- 허브 보상 권한은 hub/RewardService 계약에 맡김

## 30. 브라우저 지원 우선순위

1. Chrome Android Tablet
2. Safari iPadOS
3. ChromeOS/Chromebook
4. Desktop Chrome/Edge

주의:
- DeviceOrientation은 권한/지원 차이가 크므로 optional
- BarcodeDetector 미지원 시 수동 코드/이미지 공유 폴백
- WebXR은 MVP 필수 아님

## 31. 테스트 계획

### 기능
- Stage lock/unlock
- save/resume
- 3D hotspot
- classification drag/drop
- ambiguous criterion verification
- relation chain
- clue budget
- design restore after revision
- MissionResult

### 3D
- GLB missing fallback
- repeated enter/exit 5회 후 메모리 증가
- dispose 확인
- devicePixelRatio cap
- low quality 30fps 목표 확인

### 권한
- camera granted/denied
- orientation granted/denied
- no sensor

### 브라우저
- Android Chrome
- iPad Safari
- Chromebook Chrome
- Desktop Chrome/Edge

## 32. 분석 이벤트 제안

개인정보 없이 학습 흐름만 기록.

```text
screen_enter
stage_complete
observation_hotspot_success
classification_criterion_created
classification_revision_count
relation_attempt_count
investigation_clues_used
investigation_evidence_count
design_revision_count
lesson_complete
```

## 33. 구현 우선순위

### Vertical Slice
Screen 01
→ Screen 02 개구리 3D 관찰
→ Screen 03 비교
→ Screen 04~05 분류/검증
→ 저장
→ Screen 01 복귀

검증 후:
Screen 06~07
→ Screen 08
→ Screen 09~10

## 34. 완료 조건

- TypeScript strict 모드 에러 없음
- JSON content validation 통과
- 10 Screen route 연결
- 3D 자산 lazy load
- Three.js 장면 종료 시 dispose
- Phaser 장면 종료 시 event/timer/audio 정리
- 새로고침 후 state 복원
- 카메라/센서 거부 시 진행 가능
- 최종 MissionResult 생성
- Android/iPad 핵심 경로 테스트

## 35. GitHub

Repository:
`animal-record-recovery`

Description:
`A tablet-first educational science game for elementary students to restore animal records through observation, classification, habitat analysis, evidence-based reasoning, and bio-inspired design.`

## 36. 기술 근거로 사용한 첨부 자료

- `tablet-web-3d-architect_SKILL.md`
  - Three.js/Phaser 분리
  - 30fps 저사양 목표
  - 일반 텍스처 512/1024
  - 3D 장면 lazy load/dispose
  - UI HTML/CSS/SVG
  - 실시간 3D를 필요한 화면에만 사용
- `PROJECT_RULES.md`
  - Three.js/Phaser 렌더 분리
  - 저사양 30fps
  - visible triangles 보수적 관리
  - post-processing 기본 off
- `CLAUDE_CODE_MASTER_PROMPT_V3_KO.md`
  - Vite + TypeScript SPA/PWA
  - 단원 동적 import
  - typed store + EventBus
  - IndexedDB
  - MissionResult/RewardService 경계
