# 문장 줄바꿈 균형 점검·수정 (2026-11-19)

공통 기준: `_shared/LINEBREAK-BALANCE-20261119.md`. 측정 도구 `_scratch/linebreak-audit-20261119/measure.js`.
이 저장소의 스윕·로그·스크린샷: `.tmp/linebreak-20261119/` (`sweep.mjs`, `before/`, `common/`, `after/`, `*.log`).

## 1. 측정 방법

- 운영 자동 탐색: `run.mjs 02 - 18`(1280×800, 1920×1080). 첫 화면 → 인트로 → 지도 → 모리 대화까지만 닿는다.
- 주요 화면 스윕: `sweep.mjs`가 `scripts/preview-tablet.mjs`(교사 해금·기록 심기)로 38개 화면에 직접 들어가 `measure.js`를 돌린다. 1~5장 활동 전 단계, 지도·설정·모리 대화·가방·부탁 목록·잠긴 장소 안내, 주민 부탁(1·2·5)·편지, 복구 보상(1·5), 전시관·인증서, 인트로·아웃트로. 1280×800·1920×1080.
- 변경 전은 같은 스윕에서 `korean-linebreak.css` 요청만 빈 파일로 돌려받아(`LB_DISABLE=1`) 쟀다. 그 밖의 소스는 같다.

## 2. 결과

| 단계 | 1280×800 | 1920×1080 | 합계 |
|---|---|---|---|
| 운영 자동 탐색(변경 전) | 0 | 0 | 0 |
| 주요 화면 변경 전 | 34 | 23 | **57** |
| 공통 규칙만 적용 | 17 | 13 | 30 |
| 프로젝트 보정 후 | 8 | 7 | **15** (모두 아래 「남은 것」) |
| 운영 자동 탐색(배포 후, 1280×800) | 0 | — | 0 |

## 3. 고친 곳

- `src/korean-linebreak.css`(신규): 공통 규칙 그대로 + 「프로젝트 보정」 절.
  - `text-wrap: balance`: `.motion-legacy-record`, `.motion-photo-toolbar > p`, `.link-run-help`, `.relay-panel.relay-pick > p`, `.journey-evidence-text`, `.flashlight-note b`, `.studio-poster > p`, `.studio-next-hint`, `.studio-drawing-footer > span`, `.forest-reward-note`, `.commission-thanks p`, `.client-card p`, `.letter-reward`, `.museum-notes`, `.museum-restored`, `.ending-banner p`
    - 예: 「…새 전시 사진도 남겨 / 봐.」, 「…필요한 기록을 완성해 / 줘.」, 「…이 길을 지나갈 동물을 골라 / 줘.」, 「…맨살이 드러나 / 있어」처럼 끝줄에 한두 낱말만 떨어지던 안내·카드·편지 문장.
  - `.ending-banner h1 { text-wrap: pretty }`: 전시회 띠 제목 「…되찾은 자연의 / 기록.」.
  - `.retest-table th .choice > span { text-wrap: wrap }`: 표 머리 「위·옆· / 뒤 덮개」(가운뎃점 뒤 끊김) → 「위·옆·뒤 / 덮개」.
- `index.html`: 다른 스타일보다 먼저 `./src/korean-linebreak.css` 링크.
- `scripts/build.mjs`: 파일 목록에 `src/korean-linebreak.css` 추가(빌드는 링크된 CSS를 `app.css`로 묶으며, 목록에 없으면 빌드가 멈춘다). 묶인 `app.css` 맨 앞에 들어간 것 확인.

문구·대사·정답·진행 로직, 글꼴 크기, 상자 크기는 바꾸지 않았다. `<br>` 위치도 그대로다.

## 4. 남은 것 (15건, 수정 대상 아님)

- 두 낱말 짧은 이름이 좁은 버튼·칸에서 한 줄에 한 낱말씩 나뉨(줄 길이 균형, 더 나은 배치 없음): 설계 단계 탭 「특징 / 관찰」·「부품 / 붙이기」, 이어달리기 카드 「바다 / 물고기」, 다시 시험 표 머리 「손님에게 / 보낼 모양」·「위와 옆 / 덮개」·「위·옆·뒤 / 덮개」. 끝줄 4자 이하 규칙에 걸린 것뿐이다.
- 측정 도구 오탐: 부탁 목록 「연구원 소라의 선택 의뢰 / 선택 활동 · …」, 답장 머리 「기술자 도윤의 답장 / 생활 발명가 배지 · …」. `<small>`과 `<h3>` 등 따로 놓인 줄을 한 덩어리로 읽어 「단어 끊김」으로 잡은 것.
- 범위 밖: 캔버스·3D 안 글(지도·스캐너·이어달리기 표시), 영상에 박힌 자막은 측정하지 않았다.
- 실기기(iPad Safari·Android Chrome)에서는 확인하지 않았다. 측정은 크롬 헤드리스 창 크기 조절로만 했다. `text-wrap: balance/pretty`를 지원하지 않는 브라우저에서는 예전처럼 보통 줄바꿈으로 보인다.

## 5. 검증

- `npm run check` 통과, `npm test` 326/326 통과(macOS).
- `npm run build` 성공, `dist/src/app.css` 맨 앞에 공통 규칙.
- 레이아웃 회귀: `.tmp/layout-balance-20261118/final-check.mjs`(18화면 × 1280·1920·1024·915×412 + 손상 기록 4종)를 다시 돌려 오늘 낮 기준선 `final-20261119`와 72개 항목(놀이 영역·가로 스크롤·작은 글자·가림·주 버튼·오류) 모두 같음.

## 6. 커밋·운영 배포

- 코드 커밋 `07c18cb`(main 푸시). 다른 세션의 미커밋 변경(소리·이어달리기 등)은 넣지 않았다. `scripts/build.mjs`는 다른 세션 변경이 함께 있어 이번 한 줄만 커밋했다.
- `deploy.sh 02 "2 animal" worker-own animal-record-recovery`(차로 `lbk-deploy-2`) → Workers 버전 `c0a4f7f5-ca99-440c-8e43-9f5abd2189a2`.
- 운영 `build-manifest.json` sha `07c18cb…`, dirty false. `cmp.sh`: `src/korean-linebreak.css` MATCH, `index.html` MATCH. 운영 `src/app.css` 해시도 빌드와 같음.

## 7. 추가 수정 (2026-11-20, 공통 기준 8절)

- 성취 카드 보관함의 잠긴 카드 문구 「악당을 물리치면 / 열려요」(끝줄 세 글자): `src/reward-cards.css` `.rc-locked small` 아래에 공통 네 줄(`.rc-locked` 컨테이너, 높이 600px 이상·카드 안쪽 152px 이하면 `max-width: 4.6em`) 추가. 문구 그대로. 확인(`.tmp/linebreak-20261119/album.mjs`, 잠긴 카드 5장): 1280×800·1920×1080 한 줄, 1024×768 세 줄 「악당을 / 물리치면 / 열려요」, 카드 넘침 없음. `npm run check`·`npm test` 334/334 통과. 커밋 `4ad0d84` → Workers 버전 `707dd996-b17d-4fcd-a061-8d023438f6b2`, 운영 manifest sha `4ad0d84`, `cmp.sh` `src/reward-cards.css`·`index.html` MATCH.

## 8. 남은 것 정리 (2026-11-20, 공통 기준 9절)

스크립트·캡처: `.tmp/linebreak-20261119/leftover.mjs`(`leftover-before/`, `leftover-after/`), `canvas.mjs`. 1280×800·1024×768.

| 대상 | 잰 방법 | 전 | 후 |
|---|---|---|---|
| 지도 악당 말풍선 `.map-encounter-say`(대사 25줄 전부: 첫 대사·다시·명중 2·물러남, 5곳) | 기록 심은 지도에서 실제 주입 스타일(최대 184px, 13px)로 같은 클래스 요소를 띄워 한 줄씩 `measure.js` | 크기마다 1건 「내 기준은 간단해. 내 편, 내 편 / 아닌 편!」 | 0 |
| 처치 안내 `.map-encounter-clear`(5줄), 공격 안내 `.map-attack-hint` | 같은 방식 | 0 | 0 |
| 성취 카드 획득 장면(첫 카드·마지막 카드) | 앱과 같은 모듈 `village-rewards.js`의 `awardRewardCard`로 띄움 | 0 | 0 |
| 발명 포스터 저장 그림(캔버스, 26px·1224px) | 코드 점검 + 실제 글꼴로 줄 비교 | 글자 단위로 잘라 「…비 / 가 많이 오는」「물갈퀴처럼 펴 / 지는」처럼 낱말 안에서 끊김 | 낱말 단위 + 줄 수를 유지하는 가장 좁은 폭으로 고르게(예: 933 / 883px) |

- 고친 곳: `src/korean-linebreak.css` 「프로젝트 보정」에 `.map-encounter-say { text-wrap: balance; }`. `src/studio-runtime.js`의 포스터 글 `wrap()`을 낱말 단위(한 줄보다 긴 낱말만 글자 단위) + 줄 길이 고르게로 바꿈, 문구·글꼴·폭 그대로. 테스트 `tests/canvas-wrap.test.mjs` 추가.
- 확인함, 문제없음: 3D 무대(`stage3d.js`)의 캔버스 텍스처는 털·깃털 무늬뿐이고 글이 없다. 스캐너 부위 표시·연결 달리기 문·지도 건물 이름은 DOM 이름표라 1차 스윕에서 이미 쟀다.
- 그대로 둔 것: 두 낱말 버튼·칸 15건(공통 기준 9절 결정).
- 검증: `npm run check` 통과, `npm test` 337/337 통과, 빌드 성공. 커밋 `8951ef9` → Workers 버전 `92cd732a-c495-4848-89d5-3cf5c0af5fcd`, 운영 manifest sha `8951ef9`, `cmp.sh` `src/studio-runtime.js`·`src/korean-linebreak.css`·`index.html` MATCH.
