# 02 동물기록 복구작전 · 3D 달리기 스테이지 계획 · 2026-11-17

**현재 단계: 구현·운영 배포 끝(2026-11-17).** 아래 계획은 처음 쓴 그대로 두었고, 코드를 읽고 바꾼 결정은 「계획 확정」에, 결과는 문서 끝 「구현 결과」에 있다. 공통 규격은 [공통 계획](../../_shared/RUN-STAGE-3D-PLAN-20261117.md)에 있다.

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

- 2026-11-17 12:26 사용량 한도로 한 번 멈췄다가 이어서 진행. 12:31 운영 배포, 12:33 운영 주소 확인 끝.

## 구현 결과 (2026-11-17)

**상태: `main` 푸시와 운영 배포까지 끝.** 3장 「생태의 물가」의 탐색 네 개를 마치면 선택 도전 「세 곳 이어달리기」가 열린다.

### 한 일

- 네 구간을 모두 구현했다: 숲과 들 길(토끼·나비), 연못 물길(개구리·오리), 꽃밭 위 하늘길(나비), 바다와 갯벌 길(게·바다 물고기). 갯벌 구간까지 붙였다.
- 판정은 3장 자료(`DISCOVERIES`·`MOTIONS`)만 읽는다. 빠르기·높이·시간·순위는 어디에도 없다.
- 생성 그림 14개 파일을 적용했다(`assets/relay/`, 합계 약 1.2MB): 배경 3(숲·연못·바다), 바닥 무늬 4(풀·갯벌·모래·꽃 울타리), 소품 7(소나무·참나무·꽃덤불·이끼 바위·바닷가 바위·해초·도착 아치). 동물은 3장의 기존 그림 6장을 그대로 세워 썼다(새로 그리지 않았으므로 생김새는 기존 검수 그대로다).
- 겹침·잘림·물리 점검으로 고친 것: 동물이 갈대·바위 앞뒤로 제대로 가려짐, 물에 빠지면 바로 쉼터로 돌아옴, 그림자가 물 위에 뜨지 않음, 헤엄치는 동물의 몸 아래쪽이 물에 잠겨 비침, 바닷속 바위를 낮은 바위로, 하늘길의 잎 덩어리는 나비가 밑을 지날 때 비쳐 보임, 연못·바다 길의 보이지 않는 벽을 연잎 줄·유목·모래톱으로 눈에 보이게, 출발 앞과 도착 뒤에 풀밭을 이어 화면 끝이 비지 않음, 넓은 화면에서 배경이 끊기지 않음, 낮은 화면(960×540)에서 고르기 창과 아래 안내가 겹치지 않음.

### 바뀐 파일

- 새 파일: `src/relay.js`, `src/relay-course.js`, `src/relay3d.js`, `src/relay-views.js`, `src/relay.css`, `scripts/prepare-relay-art.mjs`, `tests/relay.test.mjs`, `tests/relay-course.test.mjs`, `assets/relay/*.webp`(14개)
- 고친 파일: `src/expedition.js`(`relay` 필드 추가·복원), `src/adventure-app.js`(화면 `relay`, 동작 6개, 3D 연결), `src/shell-views.js`(화면 등록, 지도 장소 패널·복구 완료 화면의 버튼), `src/view3d.js`(종류 `relay`), `scripts/build.mjs`, `index.html`, `tests/adventure-app.test.mjs`, `README.md`
- 기존 탐험 `3-0`·`3-2`, 완료 조건, 자동 진행, 기존 저장 필드는 바꾸지 않았다.

### 검증 (macOS arm64, Node 24.22.2)

- `npm run check` 통과, `npm test` 299개 통과(이번에 추가한 것 20개: 규칙·저장 10, 길·이동 8, 앱 흐름 2), `npm run build` 통과.
- 로컬 미리보기(127.0.0.1:4173, 앱 안 브라우저, 1280×800·1024×768·960×540): 키보드와 터치 방향판·동작 버튼(포인터 이벤트)으로 네 구간 완주, 다른 동물 조합으로 다시 완주, 기록 저장과 새로고침 뒤 이어 하기, 3장 전에는 버튼·글자가 화면 어디에도 없음, `?2d`에서 버튼이 안내만 함, 교사 미리보기에서 여섯 동물이 나오고 학생 기록에 남지 않음, 같은 곳에서 세 번 떨어지면 모리 힌트, 설정 창이 열리면 멈춤, 그만하기로 나가면 3D 해제, 움직임 줄이기에서 완주, 화면 요소 겹침·잘림·44px 미만 버튼 없음, 콘솔 오류 없음.
- 운영 주소: 아래 「배포」 참고.

### 배포

- 커밋: `b1770b9`(달리기 본체), `6943074`(바닷가 소품·양 끝 풀밭). `main`에 푸시했다(`05ec136..6943074`).
- 운영: Cloudflare Worker `animal-record-recovery`, 버전 `be56aaec-32eb-4602-a7cb-9309c25d3924`, https://animal-record-recovery.yelsam.workers.dev (SSD의 wrangler 4.154.0으로 `wrangler deploy`).
- 운영 확인(2026-11-17 12:33): `build-info.js`와 `build-manifest.json`의 커밋이 `6943074`, `dirty:false`. `src/relay3d.js`·`relay-course.js`·`relay.js`·`relay-views.js`·`adventure-app.js`와 그림 2개의 SHA-256이 `dist/`와 같다. 운영 주소에서 3장을 마친 시험 기록으로 버튼이 보이고 네 구간(토끼→오리→나비→게)을 끝까지 지나 `relay.done`이 저장됐다. 시험 뒤 그 브라우저에 원래 있던 기록(활동 0개)으로 되돌렸고, 그 상태에서는 지도와 3장 패널 어디에도 버튼이 없다.

### 확인하지 못한 것

- 실제 태블릿(iPad Safari·Android Chrome)의 터치·성능. 화면 버튼은 포인터 이벤트를 보내는 방식으로만 확인했다.
- 앱 안 브라우저 창이 숨겨져 있어 화면 갱신(requestAnimationFrame)을 타이머로 바꿔 끼워 검사했고, 자동 주행은 길 정보를 읽는 봇이 키·포인터 이벤트를 보내는 방식이다. 초당 프레임 수는 재지 않았다.
- Windows에서의 테스트·빌드.

### 남은 일

- 없음(코드·그림·배포 기준). `backdrop-coast`는 12:34에 생성돼 같은 날 추가 배포로 넣었다(아래 「추가 배포」). 바다 원경은 수평선이 그림 아래쪽에 있어 잘라내는 띠를 17% 낮췄다.
- `props-shore` 넷째 소품(들꽃)은 줄기 사이에 흰 얼룩이 남아 쓰지 않았다.
- 내장 임시 원본 정리는 끝났다(아래 「추가 배포」 끝).

### 추가 배포 (2026-11-17 12:37)

- 커밋 `768690a`(바다 원경 `assets/relay/backdrop-coast.webp`), `main` 푸시. 운영 버전 `60f685bf-e9dc-40a2-848d-ca7572a38faa`.
- 운영 확인: `build-info.js` 커밋 `768690a`·`dirty:false`, `src/relay3d.js`·`src/relay-course.js`·`backdrop-coast.webp`의 SHA-256이 `dist/`와 같음. 운영 주소에서 갯벌 구간을 열어 바다·모래언덕 원경이 보이고 콘솔 오류가 없는 것을 확인했다. 시험 뒤 그 브라우저의 기록은 원래대로(활동 0개) 되돌렸다.
- 검증: `npm run check` 통과, `npm test` 299개 통과, `npm run build` 통과.
- 내장 임시 원본: 10장(`backdrop-forest·pond·coast`, `tile-grass·mud·sand·hedge`, `props-trees`, `props-shore`, `prop-arch`)을 잠금 래퍼로 `gpt-image.sh -c` 해서 모두 지웠다(12:58 끝). `gpt-image.sh -l`에 이 프로젝트 원본이 0개인 것을 확인했다. 외장 원본 10장은 `image/relay-20261117/`에 그대로 있다.

## 바꾼 결정: 선택 도전 → 3장 생활 잇기 활동 자체를 3D로 (2026-11-17 오후, 사용자 지시)

사용자 지시: "여기(개구리의 생활 카드 화면) 카드 선택 로직 제거하고, 선택으로 넣지 말고 3D 게임이 여기서 이어지게 해 줘."

- **넣은 자리**: 3장 둘째·넷째 활동 `3-1` 「개구리의 생활」, `3-3` 「게의 생활」. 영상 관찰 활동 `3-0`·`3-2`는 그대로다. 이제 필수 활동이므로 학습 완료 흐름 안에 있다.
- **하는 일**: 길에 줄이 셋(사는 곳 → 몸의 특징 → 움직이는 방법), 줄마다 기존 카드 세 장이 이름표 붙은 문 세 개가 된다. 맞는 문을 지나면 위쪽 칸이 채워지고, 틀린 문은 닫히며 한 걸음 물러난다. 정답 문은 줄마다 다른 길에 있다(개구리 3·1·2번째, 게 2·3·1번째 줄).
- **판정·저장**: 문을 지나는 순간 기존 카드 동작(`act('link')`)을 그대로 불러 `links.frog`·`links.crab`에 남기고, 틀리면 기존 `taskMistake` 문장을 보여 준다. 완료는 기존 `taskReady`/`claimTask`가 정한다. 저장 형식은 바뀌지 않았다(선택 도전용 `relay` 필드만 없앴다. 그 필드는 같은 날 한 시간 남짓만 있었고 다른 곳에서 읽지 않는다).
- **카드 화면**: 3D가 되는 기기에서는 보이지 않는다. WebGL이 없거나 `?2d`이거나 3D가 끊기면 원래 카드 화면이 나온다. 카드를 완전히 지우면 그런 기기에서 3장을 끝낼 수 없어서 대체 화면으로만 남겼다(공통 지침의 "기존 2D 화면은 대체 화면으로 남김").
- **없앤 것**: 「세 곳 이어달리기」(`src/relay.js`, `relay-views.js`, `relay3d.js`, `relay-course.js`, `relay.css`와 테스트), 지도·활동 선택·복구 완료 화면의 버튼, `relay` 저장 필드.
- **새 파일**: `src/link-course.js`(줄·문 배치와 이동, three 없음), `src/link-run3d.js`(3D), `src/link-run.css`, `tests/link-course.test.mjs`. 고친 파일: `src/mission-views.js`(3D일 때 `linkRunView`), `src/adventure-app.js`(`use3d`를 3장 홀수 활동까지, `opts3d('linkrun')`), `src/shell-views.js`(안내 문장), `src/view3d.js`, `src/expedition.js`, `scripts/build.mjs`, `index.html`, `tests/adventure-app.test.mjs`, `README.md`. 생성 그림(`assets/relay/`)은 그대로 다시 썼다.
- **점검해서 고친 것**: 3D가 활동 영역 전체를 차지하게, 틀린 칸 안내를 말풍선으로(위쪽 칸이 길을 가리지 않게), 문 이름표가 동물을 가리지 않게 문 위로, 지나온 줄 이름표는 숨김(위쪽 칸에 표시), 화면 끝에서 잘리는 이름표는 감춤, 세 갈래 오솔길로 문마다 길이 이어지게, 카메라를 조금 높여 세 갈래가 겹치지 않게, 한 문을 두 번 지난 것으로 세던 오류 수정.
- **검증(로컬, macOS)**: `npm run check` 통과, `npm test` 287개 통과, `npm run build` 통과. 미리보기 1280×800·1024×768·960×540에서 키보드와 화면 방향판(포인터 이벤트)으로 개구리·게 길 완주 → `links` 기록, `3-1`·`3-3` 완료, 3장 복구와 주민 의뢰로 이어짐. 틀린 문 → 물러남과 모리 안내, `?2d`에서 카드 화면, 움직임 줄이기에서 완주, 콘솔 오류 없음. 실제 태블릿은 확인하지 못했다.
- **배포**: 커밋 `48b287a`를 `main`에 푸시, 운영 Worker 버전 `a16783ca-3788-43ea-8d8a-336883660a49`. (그 직전에 커밋이 빠진 채 한 번 배포돼 운영 빌드 정보가 `2a2d24f`+`dirty:true`였던 버전 `0f7a2dda…`가 약 1분 있었고, 바로 커밋 기준으로 다시 배포했다.)
- **운영 확인**: `build-info.js` 커밋 `48b287a`·`dirty:false`, `link-run3d.js`·`link-course.js`·`mission-views.js`·`adventure-app.js`·`app.css`의 SHA-256이 `dist/`와 같고 `relay3d.js`는 404. 운영 주소에서 3장 `3-0`까지 한 시험 기록으로 개구리 길 세 줄을 지나 `links.frog`가 `pond·web·swim`으로 남고 `3-1` 완료 뒤 「새 동물 세 마리」로 넘어가는 것, 카드 화면이 보이지 않는 것, 콘솔 오류 없음을 확인했다. 시험 뒤 그 브라우저의 기록은 원래대로 되돌렸다.

### 고친 것: 방향 버튼을 톡 누르면 멈춘 것처럼 보이던 문제 (2026-11-17 저녁)

- 증상(사용자 제보): 영상 보고 사진을 다 찍은 뒤 3D 길로 넘어가면 조작이 안 되고 멈춰 있다.
- 재현: 실제 화면(앱 안 브라우저, 실제 애니메이션 프레임)에서 3장 `3-0`을 영상 재생 → 사진 찍기로 세 마리 끝내고 `3-1`로 넘어간 뒤, 방향 버튼을 한 번 누르거나 방향키를 짧게 누르면 개구리가 거의 움직이지 않았다(방향키 30번에 0.005칸). 누르고 있는 동안에만 걷고, 눌렀다 떼는 사이에 화면이 한 번도 그려지지 않으면 움직임이 0이 되는 구조였다.
- 수정: 방향 버튼·방향키를 짧게 눌러도 그 방향을 최소 0.42초 유지해 한 번에 약 1.4칸 걷게 했다. 출발·멈춤도 빨라지게 했다(`src/link-run3d.js` 입력, `src/link-course.js` 가속).
- 확인(로컬 미리보기, 실제 프레임 60fps): 화면 방향 버튼 한 번 클릭에 1.0~1.45칸 이동, 방향키 짧게 눌러도 이동. 3장을 처음부터 실제로 진행했다: `3-0` 영상 재생·사진 세 장 → `3-1` 개구리 길(화면 방향판을 누르고 있기·톡 누르기) 완주 → `3-2` 영상·사진 세 장 → `3-3` 게 길 완주 → 3장 복구와 주민 의뢰 화면까지. 콘솔 오류 없음.
- 배포: 커밋 `3124ef8` 푸시, 운영 Worker 버전 `484396bc-068b-4128-bda8-ce075b167eb5`. 운영 `build-info.js` 커밋 `3124ef8`·`dirty:false`, `link-run3d.js`·`link-course.js` 해시가 `dist/`와 같음. 운영 주소에서 화면 방향 버튼 한 번 클릭과 방향키 한 번으로 개구리가 약 2.9칸 움직이는 것을 확인했고, 시험 뒤 그 브라우저 기록은 원래대로 되돌렸다.
