# 02 동물기록 복구작전 · 3D 달리기 스테이지 계획 · 2026-11-17

**현재 단계: 계획 문서.** 코드, 이미지, 배포는 손대지 않았다. 공통 규격은 [공통 계획](../../_shared/RUN-STAGE-3D-PLAN-20261117.md)에 있다.

## 한 줄 요약

3장 「생태의 물가」에 선택 도전 「세 곳 이어달리기」를 덧붙인다. 숲과 들, 연못과 물가, 하늘 구간마다 알맞은 동물을 골라 그 동물의 방식으로 건너간다.

## 넣을 자리

- 3학년 「동물의 생활」(4과02-01~03). 장소 5곳이고, 대상은 세 번째 장소 「생태의 물가」(4과02-02)다.
- 3장의 탐색 `3-0`·`3-2`(동물 세 마리를 찾아 움직이는 몸 부분을 예상하고 영상으로 확인해 사진으로 기록)는 **바꾸지 않는다.** 실제 영상을 보고 기록하는 것이 이 장의 학습이고, 달리기 그림이 그것을 대신하면 안 된다.
- 달리기는 3장 의뢰 뒤의 선택 도전 자리에 하나 더 넣는다. 기존 선택 도전 「다른 환경의 친구」(낙타·펭귄)는 그대로 둔다.
- 필수 흐름과 완료 조건에 영향이 없다.
- 관련 파일: `src/expedition.js`(장소 목록 14~18행, 3장 완료 판정 290행 부근), `src/campaign.js`(의뢰와 선택 도전 31~49행), `src/mission-views.js`(화면), `src/adventure-app.js`(이벤트, 완료 호출 `claimTask` 390행 부근).

### 여는 조건

3장의 탐색 `3-0`~`3-3`을 모두 마친 뒤에 열린다. 이 프로젝트는 예상을 고르기 전에 정답(움직이는 몸 부분)을 숨기게 되어 있다(`expedition.js` 103행 부근). 달리기가 먼저 열리면 정답이 미리 보이므로, 관찰 기록이 끝난 뒤에만 열어야 한다. 달리기에 나오는 동물도 학생이 이미 찾아 기록한 동물(`discovered`)만 쓴다.

## 하는 일

| 구간 | 고를 수 있는 동물 | 그 동물의 조작 |
|---|---|---|
| 숲과 들 | 토끼 | 점프 버튼을 누르면 뒷다리로 뛴다 |
| 연못과 물가 | 개구리, 오리 | 방향판으로 헤엄친다. 개구리는 물가 바위에서 뛰기도 한다 |
| 하늘 | 나비 | 점프 버튼을 누르고 있으면 날갯짓하며 떠 있는다 |
| 바다와 갯벌(마지막) | 게, 바다 물고기 | 게는 갯벌을 걷고, 물고기는 바닷속을 헤엄친다 |

구간에 들어가기 전에 동물 카드를 고른다. 고를 때 "이 동물은 어떤 몸 부분으로 움직일까"를 한 번 더 떠올리게 하고, 학생이 탐색에서 찍은 사진(`motionPhotos`)을 카드에 붙여 보여 준다. 맞지 않는 동물을 고르면 구간 입구에서 멈추고, 모리가 그 동물의 사는 곳과 몸 부분을 다시 보게 안내한다.

## 과학 개념과 조작

| 개념 | 달리기에서 하는 일 |
|---|---|
| 동물은 사는 곳에 따라 생김새와 움직이는 방식이 다르다 | 구간마다 그곳에 사는 동물을 고른다 |
| 움직일 때 쓰는 몸 부분이 다르다 | 동물마다 쓰는 버튼과 움직이는 모습이 다르고, 움직이는 몸 부분이 화면에 표시된다 |

### 지켜야 할 제한

- `src/inquiry.js` 1행: "Values are diagram positions, not measured performance."
- README: "시험은 정성적인 설명 모형이며 실제 물리 성능·안전성 측정이 아니다."
- 그래서 동물끼리 빠르기나 뛰는 높이를 겨루게 하지 않는다. 시간 기록, 순위, 거리 수치를 보여 주지 않는다.
- 개구리와 오리처럼 땅과 물을 모두 다니는 동물이 있다. "한 동물은 한 곳에서만 산다"로 읽히지 않게, 두 구간에서 고를 수 있는 동물은 둘 다 고를 수 있게 한다.
- 동물이 다치거나 잡아먹히는 표현을 넣지 않는다. 이 프로젝트의 방해꾼(지도 악당)에 닿으면 동물이 놀라 멈추는 연출만 한다.

## 연결과 저장

- 저장 키는 localStorage `animal-record-recovery:v1`(상태 버전 4)이다.
- 선택 도전의 완료 기록은 기존 `campaign.records`에 새 항목으로 남긴다. 기존 저장에 이 항목이 없어도 그대로 열리게 하고, 상태 버전을 올려야 하는지는 `src/campaign.js`의 복원 코드를 보고 정한다.
- 대체 화면: 이 도전은 선택이므로, 3D를 쓸 수 없으면 도전 카드에 "이 기기에서는 열 수 없어"를 보여 주고 나머지 진행은 그대로 둔다. 기존 3D 화면처럼 주소에 `?2d`가 있으면 열지 않는다.

## 이미지 생성·적용 목록

지도만 픽셀아트이고 학습 화면은 일러스트다. 달리기 그림은 일러스트로 맞춘다. 참고 그림은 `assets/village/haru.webp`, `assets/village/mori.webp`, `assets/raccoon-web.webp`와 3장의 동물 그림이다.

| 번호 | 그림 | 종류 | 적용 위치 |
|---|---|---|---|
| 1 | 토끼 뛰기 | 캐릭터 동작 줄 | 숲과 들 |
| 2 | 개구리 헤엄, 개구리 뛰기 | 캐릭터 동작 줄 2장 | 연못과 물가 |
| 3 | 오리 헤엄 | 캐릭터 동작 줄 | 연못과 물가 |
| 4 | 나비 날기 | 캐릭터 동작 줄 | 하늘 |
| 5 | 게 걷기 | 캐릭터 동작 줄 | 바다와 갯벌 |
| 6 | 바다 물고기 헤엄 | 캐릭터 동작 줄 | 바다와 갯벌 |
| 7 | 하루 응원 | 캐릭터 동작 줄 | 구간 사이 |
| 8 | 모리 안내 | 캐릭터 동작 줄 | 동물 고를 때 |
| 9 | 풀밭, 물가 진흙, 갯벌 바닥 무늬 | 바닥 무늬 3장 | 구간 바닥 |
| 10 | 수면 무늬 | 바닥 무늬 | 연못, 바다 |
| 11 | 구간 원경(숲, 연못, 하늘, 바다) | 원경 4장 | 배경 |
| 12 | 시작 카드 그림 | 시작 카드 | 도전 들어갈 때 |

**동물 그림은 생김새가 맞는지 한 장씩 확인한다.** 토끼의 긴 뒷다리, 개구리 뒷발의 물갈퀴, 오리 발의 물갈퀴, 나비의 날개 네 장과 다리 여섯 개, 게의 다리 열 개(집게발 포함), 물고기의 지느러미가 그림에 제대로 있어야 한다. 틀리면 다시 생성한다. 이 프로젝트의 3장 동물 영상·그림과 종류가 같은지도 본다. 예상 20장.

## 기술, 검증, 배포

- Three.js는 로컬 파일 `src/vendor/three/`가 이미 있다(파일 안의 문자열로 보아 r181로 추정). `src/view3d.js`가 열 때만 불러오고, WebGL이 없거나 `?2d`이거나 불러오기에 실패하면 2D로 넘긴다. 같은 방식을 쓴다.
- 3장 관찰 돔(`src/dome3d.js`, `stage3d.js`)이 이미 three로 디오라마를 그린다. 무대를 만들고 해제하는 방식을 여기서 참고한다.
- 설치 없는 구조다. `scripts/build.mjs`가 필요한 파일만 `dist/`로 복사하므로 새 파일과 새 그림 폴더가 복사 대상에 들어가는지 확인한다. 서비스워커는 없다.
- 방향판은 `src/map-controls.js`의 `bindDirectionPad`를 다시 쓴다.
- 검증 명령: `npm test`(`node --test tests/*.test.mjs`), `npm run check`, `npm run build`.
- 운영 주소는 https://animal-record-recovery.yelsam.workers.dev/ 이고 `npm run deploy`(`npm run build && wrangler deploy`)로 올린다.

## 작업 순서

1. 선택 도전 항목 추가, 여는 조건(3장 탐색 4개 완료)과 테스트
2. 규칙 연결: 구간과 고른 동물이 맞는지 보는 표(사는 곳, 움직임, 몸 부분)를 3장 자료에서 읽어 오는 부분
3. 기본 도형으로 네 구간을 만들어 끝까지 해 보기
4. 이미지 생성·적용(동물 생김새 확인 포함)
5. `build.mjs` 복사 대상 확인
6. 3D를 쓸 수 없는 경우, 새로고침 후 이어 하기 확인
7. 검증 명령 → 커밋·푸시 → 운영 배포 → 운영 주소 확인

## 시작 전에 확인할 것

- 3장의 동물 여섯 마리와 사는 곳·움직임 자료가 어느 파일에 어떤 이름으로 있는지 확인해 그대로 읽어 쓴다. 달리기용 표를 따로 만들어 내용이 갈라지지 않게 한다.
- 동물이 일곱 종류라 그림이 다른 프로젝트보다 많다. 숲·물·하늘 세 구간만 먼저 만들고 갯벌 구간은 뒤에 붙이는 방법도 있다.
- 운영 시트 G·H열의 주소와 저장소를 대조한다.

---

## 계획 확정 (2026-11-17, 구현 세션)

**진행 상황: 2단계(계획 확정) 끝. 3단계(구현 1차) 시작.** 중간에 멈추면 이 절 아래 「진행 기록」의 마지막 줄부터 이어 간다.

### 코드와 대조해 바로잡은 것

- 3장 동물 자료는 `src/expedition.js`의 `DISCOVERIES`(동물·만난 곳·문장), `HABITATS`(곳 이름), `ANIMALS`(이름)와 `src/inquiry.js`의 `MOTIONS`(움직이는 몸 부분 `part`, 움직임 종류 `kind`)에 있다. 달리기는 이 표만 읽는다. 동물별 표를 새로 만들지 않는다.
- 자료에 있는 곳은 숲과 들·연못과 물가·바다와 갯벌 **세 곳**이다. '하늘'은 따로 없고, 나비의 사는 곳은 숲과 들(꽃이 핀 풀밭)이다. 그래서 구간을 "곳(`habitat`) + 지나가는 방법(`kind`)"으로 정했다. 하늘 구간은 「꽃밭 위 하늘길」(숲과 들, 날기)이다.
- 저장: `campaign.records`는 `1-0`~`5-2` 열쇠만 복원하고(`normalizeCampaign`), `commissionCount`가 열쇠 수를 센다. 여기에 달리기 항목을 넣으면 복원 때 지워지고 의뢰 수가 틀어진다. 그래서 최상위에 선택 필드 `relay: {picks:{구간:동물}, done}`를 새로 두었다. 기존 필드는 그대로이고 상태 버전도 4 그대로다(없으면 빈 값으로 채운다).
- 기존 「마지막 도전」(`challenge`, 3장은 「다른 환경의 친구」)은 의뢰 두 개 뒤에 바로 이어지는 흐름이라 그대로 둔다. 달리기는 그 자리에 끼우지 않고 따로 여는 버튼으로 둔다: 3장 「활동 선택」 창, 지도 장소 패널, 3장 복구 완료 화면.
- three는 r181이 맞다. `Octree.js`·`Capsule.js`는 저장소에 없고 새로 내려받아야 해서 쓰지 않는다. 길이 상자 발판뿐이라 `games_fps`의 뼈대(프레임 시간 0.05초 자르기, 5번 나눠 계산, 바닥에 섰을 때만 점프, 공중에서만 중력, 떨어지면 되돌리기)를 상자 판정으로 직접 썼다.
- 동물 그림: 3장이 쓰는 그림 6장(`assets/generated/rabbit·frog·crab·marine_fish.webp`, `assets/adventure/duck·butterfly.webp`)이 이미 투명 배경이고 생김새 검수를 거친 그림이다. 달리기 캐릭터는 이 그림을 세워 쓰고(추가 다운로드 0), 움직임은 코드로 준다(뛸 때 기울기·늘어남, 날갯짓, 물결). 새로 생성하는 그림은 1차 구현을 화면에서 본 뒤 꼭 필요한 것만 정한다.
- 카메라는 길을 옆에서 비스듬히 따라간다(길이 화면 오른쪽으로 이어짐). 동물 그림이 옆모습이라 뒤에서 따라가는 시점보다 뛰기·헤엄·날기가 잘 보인다. 방향판 위쪽은 화면 위쪽(안쪽)이다.
- 방해꾼(지도 악당)은 넣지 않았다. 이 도전은 "사는 곳과 움직이는 방법 맞추기"만 다루고, 동물이 놀라거나 쫓기는 장면이 필요 없다.

### 여는 조건과 판정

- `relayOpen(s)`: `3-0`~`3-3`이 모두 `activities`에 있을 때만 참. 그 전에는 버튼을 아예 그리지 않는다. 교사용 전체 해금에서는 열리고(미리보기 사본이라 학생 기록에 남지 않음), 이때만 여섯 동물을 모두 고를 수 있다.
- 고를 수 있는 동물: `DISCOVERIES` 중 `discovered`에 있는 것.
- `relayCheck(구간, 동물)`: 그 동물의 `DISCOVERIES.habitat`가 구간의 곳과 같고 `MOTIONS.kind`가 구간의 방법에 들어 있으면 통과. 아니면 모리가 그 동물을 만난 곳과 움직이는 몸 부분을 다시 말해 준다(문장도 같은 표에서 만든다).
- 빠르기·높이·시간·순위·거리 수치는 어디에도 없다. 화면에 "학습용 모형" 안내를 둔다.

### 코스 설계표

| 구간 | 곳 · 방법 | 통과하는 동물 | 조작 | 길 |
|---|---|---|---|---|
| 1 숲과 들 길 | forest · jump/fly | 토끼, 나비 | 토끼: 방향판 + 「뛰기」(바닥에서만). 나비: 방향판 + 「날갯짓」(누르는 동안 떠오름) | 풀밭 발판 4개, 물길 틈 3곳, 바위 턱 1곳 |
| 2 연못 물길 | pond · swim | 개구리, 오리 | 방향판으로 헤엄(동작 버튼 없음) | 연잎·갈대 무리를 돌아가는 물길 |
| 3 꽃밭 위 하늘길 | forest · fly | 나비 | 방향판 + 「날갯짓」 | 바닥 없는 꽃 골짜기, 높은 꽃 울타리는 위로·나뭇가지는 아래로 |
| 4 바다와 갯벌 길 | coast · walk/swim | 게(갯벌 쪽), 바다 물고기(바닷물 쪽) | 방향판으로 걷기/헤엄 | 갯벌 길과 바닷물 길이 나란히, 바위·해초를 돌아감 |

- 구간 사이에 쉼터 발판이 있고 거기가 체크포인트다. 구간 끝에 닿으면 기록(`relay.picks`)을 남기고 다음 구간의 동물을 고른다. 네 구간을 모두 지나면 `relay.done`.
- 떨어지면(1구간) 마지막 체크포인트로 돌아온다. 같은 곳에서 세 번이면 모리가 조작 힌트를 준다. 목숨·시간 제한 없음.
- 3D를 못 쓰는 기기(`can3d()` 거짓, `?2d`, 불러오기 실패): 버튼은 보이되 눌러도 "이 기기에서는 열 수 없어" 안내만 한다. 앱의 나머지는 그대로다.
- 움직임 줄이기(OS 설정): 이 도전은 선택이고 2D 대체가 없다. 들어갈 수는 있게 두되 카메라 따라가기를 부드럽게 하지 않고 장식 움직임(물결·날갯짓 흔들림·반짝임)을 끈다.

### 구현 작업 목록

1. `src/relay.js`(규칙·저장, 순수 함수) + `tests/relay.test.mjs` 먼저
2. `src/relay-course.js`(길 도형·이동 계산, three 없음) + 테스트
3. `src/relay3d.js`(무대·캐릭터·입력·카메라), `src/view3d.js`에 종류 추가
4. `src/relay-views.js`·`src/relay.css`(동물 고르기, 방향판, 안내), `shell-views.js`·`adventure-app.js` 연결
5. `scripts/build.mjs` 복사 목록, `index.html` 스타일 연결
6. 브라우저에서 끝까지 플레이 → 필요한 그림만 생성 → 검증 → 커밋·푸시·배포

### 진행 기록

- 2026-11-17 계획 확정. 코드 수정 전.
- 2026-11-17 구현 1차 끝: `src/relay.js`(규칙·저장), `src/relay-course.js`(길·이동), `src/relay3d.js`(3D), `src/relay-views.js`·`src/relay.css`(화면), `expedition.js`(`relay` 필드), `adventure-app.js`·`shell-views.js`·`view3d.js`(연결), `build.mjs`·`index.html`. 네 구간 모두 구현했다(갯벌 포함). 로컬 미리보기에서 키보드·터치 방향판으로 네 구간 완주, `relay.done` 저장, 새로고침 뒤 이어 하기, 3장 전 숨김, `?2d` 안내, 교사 미리보기 비저장을 확인했다.
- 2026-11-17 사용자 추가 요청: 생성 그림으로 화면을 예쁘게(배경·바닥·소품), 겹침·잘림·물리적으로 어색한 곳 점검. → 동물이 사물 앞뒤로 제대로 가려지게 깊이 판정으로 바꿈, 물에 빠지면 바로 체크포인트로, 그림자가 물 위에 뜨지 않게, 바닷속 바위를 기둥 모양에서 낮은 바위로, 하늘길의 떠 있는 상자를 나뭇가지+잎 덩어리로(나비가 밑을 지날 때 비쳐 보임), 도착 아치를 길 뒤에 세움. 그림 생성 대기열 실행 중(`image/relay-20261117/`, 가공 `scripts/prepare-relay-art.mjs` → `assets/relay/`).

### 생성 그림 기록 (2026-11-17, gpt-imagegen · 잠금 래퍼로 한 장씩)

- 원본: `image/relay-20261117/<이름>.png`(Git 제외, SSD에만 있음). 실행 파일: `assets/relay/*.webp`. 가공: `node scripts/prepare-relay-art.mjs <sharp 경로>`(배경은 위쪽 띠만 잘라 1536×553, 바닥 무늬 512×512, 소품은 투명 틈에서 나눠 테두리 빛을 벗겨 냄, 모래·갯벌 무늬는 채도를 낮춤).
- 참고 그림(`-i`)은 붙이지 않았다(다른 세션에서 `Bad Request`가 난 기록이 있어서). 그림체는 프롬프트로 맞췄다.
- 공통 꼬리말: `Hand-painted storybook nature illustration for a children's science learning app, lush, cozy and charming, soft warm daylight, gentle rounded shapes, rich natural colours, detailed but clean, in the style of a painterly natural-history picture book with lifelike plants and soft detailed brushwork. No animals, no people, no buildings, no text, no letters, no logo, no watermark.`

| 이름 | 프롬프트(꼬리말 앞부분) | 쓰는 곳 |
|---|---|---|
| `backdrop-forest` | Wide landscape backdrop for a side-view game, 3:2. Rolling green hills, a distant pine and birch forest, scattered wildflowers, pale blue sky with a few fluffy clouds. The horizon sits a little below the middle. The bottom quarter of the picture is plain soft meadow grass with no objects, so it can blend into a grassy playfield in front. Left and right edges are calm and similar. | 숲과 들 길·하늘길 원경(하늘길은 좌우 뒤집음) |
| `backdrop-pond` | Wide landscape backdrop for a side-view game, 3:2. A quiet pond shore seen from across the water: a far bank lined with reeds, cattails and two willow trees, soft misty green hills behind, pale blue sky with a few fluffy clouds. The horizon sits a little below the middle. The bottom quarter of the picture is plain low green marsh grass with no objects, so it can blend into a grassy bank in front. Left and right edges are calm and similar. | 연못 물길 원경 |
| `backdrop-coast` | Wide landscape backdrop for a side-view game, 3:2. A calm seaside at low tide: pale sand dunes with tufts of beach grass, a strip of turquoise sea and a distant green headland beyond, pale blue sky with a few fluffy clouds. The horizon sits a little below the middle. The bottom quarter of the picture is plain wet grey-brown tidal mudflat with no objects, so it can blend into a mudflat playfield in front. Left and right edges are calm and similar. | 바다와 갯벌 길 원경 |
| `tile-grass` | Seamless tileable square texture, straight top-down view, flat even lighting, no shadows, no perspective, no horizon: short meadow grass with tiny clover leaves and a few very small white and yellow wildflowers, evenly scattered so all four edges wrap seamlessly. | 풀밭 바닥 |
| `tile-mud` | Seamless tileable square texture, straight top-down view, flat even lighting, no shadows, no perspective, no horizon: wet tidal mudflat, smooth grey-brown mud with soft ripple marks, a few tiny shells and small round holes, evenly scattered so all four edges wrap seamlessly. | 연못 바닥·갯벌 바닥 |
| `tile-sand` | Seamless tileable square texture, straight top-down view, flat even lighting, no shadows, no perspective, no horizon: a packed pale sandy footpath with small rounded pebbles and a few tiny fallen leaves, evenly scattered so all four edges wrap seamlessly. | 쉼터 길·모래톱·바위 턱 |
| `tile-hedge` | Seamless tileable square texture, straight front view, flat even lighting, no perspective: a dense leafy green hedge wall covered with many small pink, white and yellow blossoms, evenly scattered so all four edges wrap seamlessly. | 하늘길 꽃 울타리·나뭇잎 덩어리 |
| `props-trees` | Three separate objects in one row on a fully transparent background, evenly spaced with wide clear gaps between them, each one whole and uncropped, straight front view, no ground, no cast shadow: on the left a tall pine tree, in the middle a round leafy oak tree, on the right a low round flowering bush with pink blossoms. All three bases sit on the same bottom line. | 소나무·참나무·꽃덤불(3개로 나눔) |
| `props-shore` | Isolated cut-out sticker sheet with a real alpha channel: the whole canvas outside the four objects is 100% transparent, with no backdrop panel, no coloured band, no glow and no haze. Four separate objects in one row on a fully transparent background, evenly spaced with wide clear gaps between them, each one whole and uncropped, straight front view, no ground, no cast shadow: first a mossy grey boulder, second a seaside rock with barnacles and a little seaweed, third an upright clump of green kelp seaweed fronds, fourth a cluster of tall cosmos and daisy wildflowers on thin stems. All four bases sit on the same bottom line. | 이끼 바위·바닷가 바위·해초·들꽃(4개로 나눔) |
| `prop-arch` | One object on a fully transparent background, whole and uncropped, straight front view, no ground, no cast shadow: a rustic wooden garden arch gate made of two posts and a curved top, wrapped in a leafy green garland with small white and yellow flowers. The opening under the arch is empty and transparent. | 도착 아치 |

- 2026-11-17 12:26 사용량 한도로 여기서 멈춤. **커밋까지 함, 푸시·운영 배포는 아직.**

## 구현 결과 (2026-11-17, 중간 기록 — 배포 전)

- 한 일: 선택 도전 「세 곳 이어달리기」 네 구간(숲과 들 길·연못 물길·꽃밭 위 하늘길·바다와 갯벌 길) 구현. 갯벌 구간까지 붙였다. 생성 그림 10개 파일(`assets/relay/`: 배경 2, 바닥 무늬 4, 소나무·참나무·꽃덤불, 도착 아치) 적용.
- 바뀐 파일: 새 파일 `src/relay.js`, `src/relay-course.js`, `src/relay3d.js`, `src/relay-views.js`, `src/relay.css`, `scripts/prepare-relay-art.mjs`, `tests/relay.test.mjs`, `tests/relay-course.test.mjs`, `assets/relay/*.webp`. 고친 파일 `src/expedition.js`(`relay` 필드), `src/adventure-app.js`, `src/shell-views.js`, `src/view3d.js`, `scripts/build.mjs`, `index.html`, `tests/adventure-app.test.mjs`, `README.md`.
- 실행한 검증(macOS, Node 24): `npm run check` 통과, `npm test` 299개 통과, `npm run build` 통과(달리기 모듈·그림이 `dist/`에 복사됨). 로컬 미리보기(127.0.0.1:4173, 앱 안 브라우저)에서 1280×800·1024×768·960×540으로 키보드와 터치 방향판(포인터 이벤트) 완주, 기록 저장, 새로고침 뒤 이어 하기, 3장 전 숨김, `?2d` 안내, 교사 미리보기 비저장, 세 번 떨어지면 힌트, 설정 창이 열리면 멈춤, 움직임 줄이기, 화면 요소 겹침·잘림 없음, 콘솔 오류 없음을 확인했다.
- 확인 방법의 한계: 앱 안 브라우저 창이 숨겨져 있어 화면 갱신(requestAnimationFrame)을 타이머로 바꿔 끼워 검사했다. 자동 주행은 길 정보를 읽는 봇이 키·포인터 이벤트를 보내는 방식이다. 실제 태블릿 터치와 성능(30fps)은 확인하지 못했다.
- **남은 일(이어서 할 순서)**
  1. 그림 두 장: `backdrop-coast`(첫 시도 실패), `props-shore`(첫 결과는 배경이 반투명 흰색이라 반려, `props-shore-rejected.png`). 12:19에 다시 걸어 둔 대기열이 끝났으면 `image/relay-20261117/`에 있다. 있으면 `node scripts/prepare-relay-art.mjs "/Volumes/T7 Shield/DevCaches/tools/wrangler-4.154.0/node_modules/sharp"` 실행 → `src/relay-course.js`의 `RELAY_ART`에 `backdrop-coast`, `prop-boulder`, `prop-searock`, `prop-kelp`, `prop-flowers` 추가 → 화면 확인. 없으면 `.tmp/relay-qa/gen.sh backdrop-coast props-shore < /dev/null`.
  2. `npm run check && npm test && npm run build` → 커밋 → `main` 푸시 → 운영 배포(`wrangler deploy`, SSD의 wrangler 4.154.0) → https://animal-record-recovery.yelsam.workers.dev 에서 `build-manifest.json`의 커밋과 달리기 화면 확인.
  3. 내장 임시 원본 정리: 적용을 확인한 그림마다 잠금 래퍼로 `gpt-image.sh -c "<image/relay-20261117/이름.png>"`, 끝에 `-l`로 남은 것 확인(반려한 그림 포함).
  4. 이 절을 최종 결과(커밋 해시·배포 버전)로 고치고 `graphify update .` 실행.
- 미리보기 브라우저의 127.0.0.1:4173 저장소에 QA용 열쇠 `qa.boot`와 시험용 진행 기록을 넣어 두었다(운영 주소와 무관).
