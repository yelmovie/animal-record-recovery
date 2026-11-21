# 02 동물기록 복구작전 · 새 그림이 필요한 자리 (2026-11-21)

**요약(2026-11-21 3-2a 갱신): (가) 0장 · (나) 0장 · (다) 0장 = 새 그림 0장.** 처음 적은 값은 (가) 1장(공유 미리보기 그림)이었는데, 사용자 확인(그림은 모두 Codex·유료 요금제, `_shared/CODEX-IMAGE-RECORDS-20261121.md`)으로 권리 장부에서 「확인됨(사용자 확인)」이 되어 다시 그릴 필요가 없어졌다. 아래 (가) 표는 기록으로 남긴다. 아래 「참고」 표는 사용자 자료가 오지 않을 때만 다시 그릴 후보라 장수에 넣지 않았다.

- 이 문서는 목록만이다. 그림은 만들지 않았다.
- 기준: `docs/RIGHTS-LEDGER-20261121.md`(권리 장부), `docs/reviews/SCORE-100-TODO-20261120.md`, `docs/reviews/RELEASE-REVIEW-20261120.md`, `_shared/SCORE-110-PLAN-20261121.md`, 운영 빌드 그림 144개(`dist/build-manifest.json`, 빌드 `0b0f5e2`)의 픽셀 크기(`sips`).
- 생성 규칙(사용자 지침): 글자는 그림에 넣지 않고 나중에 합성한다. 기존 화면 그림을 참고 이미지로 넣어 화풍을 맞춘다. 원본은 덮어쓰지 않는다.

## (가) 출처 미확인 그림

| 쓰이는 화면 | 지금 파일 | 필요한 크기·비율 | 화풍 참고 그림 경로 | 왜 필요한지 |
|---|---|---|---|---|
| 공유 미리보기(카카오톡·메신저 링크 썸네일, `index.html` `og:image`) | `assets/og/animal-record-recovery-pond-v2.jpg` (1200×600, 원본 `assets/og/animal-record-recovery-pond-v1.png`) | 1200×600(2:1, 지금 `og:image:width/height` 메타와 같음). JPEG 400KB 안팎. 왼쪽 위·가운데에 제목 자리 여백, 인물은 양쪽 3분의 1 안 | 인물·화풍: `assets/adventure/museum-opening.webp`, `assets/story/intro-01.webp`. 동물: `assets/generated/frog.webp`, `assets/adventure/duck.webp`. 제목은 그림에 그리지 않고 `assets/adventure/title-logo-light.webp`를 합성 | 권리 장부에서 유일한 「출처 미확인」 그림. 만든 도구·날짜 기록이 없다(2026-10-29 `5a0b85c`에 PNG로 들어옴). 제목 글자까지 그림에 생성돼 있어 글자 합성 규칙과도 다르다. 사용자가 원본 기록을 주면 교체하지 않고 장부에 연결한다(사용자 결정 7번) |

- 그림이 아닌 것(이 문서 범위 밖): 관찰 스캐너의 3D 거미·개미 모델(`assets/models/scan/{spider,ant}.glb`)도 출처 미확인이다. 새 그림으로는 풀리지 않으니 권리 장부 「사용자가 줘야 하는 자료」 5번으로 처리한다.

## (나) 화풍·해상도가 튀거나 임시로 넣은 그림

없음.

- `docs/reviews/`·`docs/`·`README.md`에서 「화풍」「임시」「저해상」「흐릿」「어울리지 않」을 찾았다. 그림 품질을 문제로 적은 기록은 없고, 2026-10-19 점검에 「주민이 하루와 같은 픽셀 화풍으로 통일됨」(`FINAL-CHECK-20261019.md`)이 있다. 출판사 의견(`PUBLISHER-FEEDBACK-20261110.md`)과 2026-11-20 성적표에도 그림 감점이 없다.
- 크기 표(그림 144개)에서 임시 그림으로 보이는 작은 파일은 없다. 가장 작은 것은 지도 표시 아이콘(54~62×72)과 픽셀 인물 시트(256~378px)인데, 지도가 1600×900 픽셀 그림을 `image-rendering: pixelated`로 키워 쓰는 설계(`docs/TRD.md` 42행)라 같은 비율이다.
- 화면에 실제로 띄운 크기와 기기 화소 밀도까지 대 본 것은 아니다. 3-5단계 「그림 완성도」(110점 항목 3)에서 화면별 표시 크기를 재면 다시 본다.

## (다) 할 일 목록의 게임성·화면 보강에 필요한 소품·배경

없음.

- `SCORE-100-TODO-20261120.md`의 「수정으로 풀 것」(C9·G19·D8)은 2026-11-21 모두 고쳐 배포됐고 그림이 필요 없었다. 「사용자 결정이 필요한 것」(A8 반복 선택, B18 진행 버튼 위치, E2 큰 파일)도 문구·진행 로직·코드 구조라 새 그림이 없다.
- A17(난이도 상승 구조)과 C14(한글 조사)는 `RELEASE-REVIEW-20261120.md`에서 PASS(추정)이고 할 일이 없다.
- `_shared/SCORE-110-PLAN-20261121.md`의 묶음 ④(게임성·화면 보강, 새 조작·새 그림)는 03·04·05·13·15번만 대상이고 02는 없다. 02에 정해진 다음 단계(결정 4번 「첫 시도에 맞힌 것만 따로 표시」, 묶음 ⑤ 완료 버튼 위치)는 코드로 표시하는 일이다.

## 참고: 사용자 자료가 안 오면 다시 그려야 하는 그림 (장수에 넣지 않음)

권리 장부에서 「근거 약함」인 그림이다. 만든 곳은 적혀 있지만 계정·요금제·계약 기록이 없다. 자료가 오면 장부에 연결하고 끝난다. 자료가 없으면 3-3단계에서 교체한다(사용자 결정 7번). 대부분 같은 원본(2026-09-23·10-07 ChatGPT 그림)에서 나왔으니 그 원본 기록 하나로 한꺼번에 풀린다.

| 쓰이는 화면 | 지금 파일 | 필요한 크기·비율 | 화풍 참고 그림 경로 | 왜 필요한지 |
|---|---|---|---|---|
| 마을 지도(메인 허브) | `assets/village/map-base-light.webp` | 1600×900(16:9) 픽셀 아트, 길·건물 자리는 `assets/village/village.json` 좌표와 같아야 함 | 지금 지도 자체(구도·건물 배치), 인물 화풍 `assets/village/npc-researcher.webp` | 사용자 제공 ChatGPT 그림(`latest_01`)이 뿌리. 지도를 바꾸면 아래 덮개·장면도 같이 바꿔야 한다 |
| 마을 지도 위 건물 복구 덮개 | `assets/village/restore-{1,2,3,4,5,core,gallery}.webp` (305~420px) | 지금 파일과 같은 크기, `village.json` rect 자리에 맞춤 | 새 지도와 같은 그림에서 잘라냄 | `latest_02`가 뿌리 |
| 복구 완료 장면 | `assets/village/recovery-{1..5}-v2.webp` (800×620) | 800×620 | 새 복구 지도에서 잘라냄 | `map-restored.webp`(사용자 제공)에서 잘라낸 것 |
| 마을 지도 걷기 인물(하루·모리·주민 3) | `assets/village/{haru,mori,researcher,ranger,engineer}.webp` (256~378px 시트) | 지금 시트와 같은 칸 배열·발 기준선 | `assets/village/npc-*.webp`(Higgsfield, 같은 픽셀 화풍) | `latest_04`·`latest_05`가 뿌리. 하루 시트는 `npc-*`·지도 악당 스프라이트의 화풍 참고로도 쓰였다 |
| 마을 지도 표시 아이콘 | `assets/village/marker-{talk,enter,lock,unlock,sparkle}.webp` (54~62×72) | 같은 크기, 바닥 링 기준점 유지(`village.json` `markers.anchor`) | `assets/village/npc-*.webp` | `latest_10`이 뿌리 |
| 모리 표정·행동 그림(학습 화면 스프라이트) | `assets/raccoon-web.webp` (1448×1086, 4×3 시트) | 같은 시트 배열 | `assets/adventure/museum-opening.webp`의 모리, `assets/residents/dialogue/mori.webp` | 2026-09-23 사용자 제공 ChatGPT 그림 |
| 서식지 디오라마(생태 화면) | `assets/biomes-web.webp` (1448×1086 시트) | 같은 시트 배열 | `assets/scenes/link.webp`, `assets/adventure/dome-ground-web.webp` | 같음 |
| 증거 사진 판 배경(미확인 기록 수사실) | `assets/investigation.webp` (1672×941) | 16:9 | `assets/scenes/verify.webp` | 같음 |

- 대화창 초상 6개(`assets/residents/dialogue/`)와 지도 악당·반응 스프라이트 4개(`assets/village/map-*-v2.webp`)도 근거 약함이지만, 만든 기록(「GPT 이미지」·프롬프트·원본)이 저장소 밖 `_scratch`에 있다. 다시 그릴 필요 없이 `assets/CREDITS.md`에 그 기록을 옮기면 된다.
- 움직임 영상 6편(`assets/videos/motion/`)도 근거 약함이지만 그림이 아니라 영상이라 이 표에서 뺐다.
