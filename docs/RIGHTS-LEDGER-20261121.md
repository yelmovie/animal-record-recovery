# 02 동물기록 복구작전 · 권리 장부 (2026-11-21)

**요약: 54줄 중 확인됨 39줄 · 근거 약함 13줄 · 출처 미확인 2줄** (배포 파일 기준 346개 중 확인됨 287개 · 근거 약함 56개 · 출처 미확인 3개)

- 대상: 운영 빌드에 들어가는 그림·영상·음악·효과음·목소리·글꼴·3D 모델. 목록은 `scripts/build.mjs`와 `dist/build-manifest.json`(빌드 `0b0f5e2`, `assets/` 파일 346개)으로 뽑았다. 지금 `HEAD`(`12d00e3`)와 빌드 목록 차이는 `src/print.css` 한 줄뿐이라 에셋 목록은 같다.
- 근거로 읽은 것: `assets/CREDITS.md`(주 근거), `ASSETS.md`, `docs/ASSETS.md`, `docs/AUDIO-PROVENANCE-20261109.md`, `docs/npc-dialogue-voice.json`, `docs/VOICE-FILL-20261118.json`, `docs/MODELS-20261018.md`, `docs/RUN-STAGE-3D-PLAN-20261117.md`, `README.md`, `scripts/prepare-*.{mjs,py}`, `assets/fonts/*`, `src/vendor/three/LICENSE.txt`, `_shared/voice-provenance-20261118.md`, `_shared/FULLSCREEN-CAPTION-*.md`, `_shared/fonts/README.md`, `_scratch/`의 작업 기록, git 기록.
- 이 문서는 기록을 모은 것이다. 새로운 이용 허락을 주지 않고, 법률 판단도 아니다. AI로만 만든 결과물은 상업 이용이 가능해도 저작권 보호가 제한될 수 있다(`assets/CREDITS.md`와 같은 입장).

## 상태 기준

| 상태 | 뜻 |
|---|---|
| 확인됨 | 저장소 기록에 파일(묶음)·만든 도구가 있고, 그 도구·자료의 이용 조건 근거(라이선스 원문, 요금제 사용자 확인, `CREDITS.md` 도구 검토표)가 있다 |
| 근거 약함 | 만든 곳은 어딘가에 적혀 있지만 이용 조건(요금제·약관·계약)이나 권리 주체 기록이 없다. 또는 기록이 저장소 밖 작업 메모에만 있거나 도구 이름이 없다 |
| 출처 미확인 | 만든 곳 기록을 찾지 못했다 |

도구별 이용 조건 근거(아래 표에서 줄여 씀):

| 줄임 | 이용 조건 | 근거 |
|---|---|---|
| OpenAI | OpenAI 이용약관상 출력물 권리는 사용자에게. 상업 이용 가능으로 판단. 생성 계정의 요금제 기록은 없음 | `assets/CREDITS.md` 검토표 「OpenAI 이미지 생성」 줄 |
| Higgsfield(그림·영상) | Basic 유료 요금제, 유료 크레딧으로 생성, 상업 이용 가능으로 판단 | `assets/CREDITS.md` 검토표 「Higgsfield」 줄 |
| Meshy | 유료 요금제·유료 크레딧, 상업 이용 가능(무료 요금제 결과물은 CC BY 4.0이라 해당 없음) | `assets/CREDITS.md` 검토표 「Meshy」 줄 |
| Suno | Premier 유료 구독 중 생성(사용자 확인 2026-10-19, 2026-11-18) | `assets/CREDITS.md`, `_shared/voice-provenance-20261118.md` |
| EL | ElevenLabs `eleven_v4`. 11-17까지 Starter, 11-18 Creator(둘 다 유료, 사용자 확인) | `_shared/voice-provenance-20261118.md`, `docs/VOICE-FILL-20261118.json` `provider` |
| Pixabay | Pixabay Content License(출처 표기 불필요·상업 이용 가능), 원본 URL 기록 | `assets/CREDITS.md` 「효과음」 |
| CC0 | CC0 1.0, 원본 페이지에서 라이선스 재확인(2026-11-17) | `assets/CREDITS.md`, `_shared/sfx-library-20261117/` |
| OFL | SIL Open Font License 1.1 원문 동봉 | `assets/fonts/*-OFL.txt`, `_shared/fonts/README.md` |

## 1. 그림 (28줄 · 파일 144개)

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|
| `og/animal-record-recovery-pond-v2.jpg` (공유 미리보기, 1200×600, 제목 글자가 그림에 들어 있음) | 기록 없음. v1 PNG를 2026-11-19 JPEG로 다시 인코딩한 것만 기록됨 | v1 추가 2026-10-29 커밋 `5a0b85c`(메시지에 출처 없음), v2 변환 `8e70204`, `README.md` 71행 | 기록 없음 | `README.md`, git 기록 | **출처 미확인** |
| `adventure/title-logo-light.webp` (첫 화면 제목) | OpenAI(Codex 내장 image_gen). `title-logo-v1.webp`의 960px 사본(2026-11-12 `11e7940`에서 v1을 대체, 두 파일을 눈으로 대조해 같은 그림 확인) | 2026-10-19, 원본·프롬프트 `output/imagegen/animal-record-title-concept-v1.*`, `docs/landing-title.md` | OpenAI | `assets/CREDITS.md` 「첫 화면 제목 그림」 | 확인됨 |
| `adventure/museum-opening.webp`, `museum-opening-light.webp` (첫 화면·전시관 머리) | OpenAI image_gen. `-light`는 같은 그림의 1440px 사본(눈 대조) | 2026-10-18, `docs/MUSEUM-ASSET-PROMPT-20261018.json` | OpenAI | `assets/CREDITS.md` 「전시관 메인 이미지」 「태블릿·발명 화면 보강」 | 확인됨 |
| `adventure/{explorer,trail-map,field-kit,field-desk-web,duck,butterfly,goldfish}.webp` (7) | OpenAI 기본 image_gen | 2026-10-15, `docs/ADVENTURE-ASSET-PROMPTS.json` | OpenAI | `assets/CREDITS.md` 23행, `docs/ASSETS.md` 「2026-10-15 탐험형 개편」 | 확인됨 |
| `adventure/{bee,snail,bat,hen}.webp` (4) | Higgsfield GPT Image 2.5, 화풍 참고 `generated/frog.png` | 2026-10-17, 원본 `_scratch/hf-animals/` | Higgsfield | `assets/CREDITS.md` 「동물 그림 추가」 | 확인됨 |
| `adventure/{sparrow,spider,ant,penguin,ostrich,dolphin,mole}.webp` (7) | 사용자가 내장 image_gen(OpenAI)으로 만들어 전달 | 2026-10-26, 원본 `_scratch/new-animals/generation-prompts.json`, `docs/new-animal-prompts.html` | OpenAI | `assets/CREDITS.md` 「2026-10-26 새 동물 7종」 | 확인됨 |
| `adventure/{workshop-atlas,terrain-atlas-web,dome-ground-web,nature-materials-web}.webp` (4) | OpenAI 내장 image_gen | 2026-10-18 | OpenAI | `assets/CREDITS.md` 「태블릿·발명 화면 보강」 「생태돔 자연물」 | 확인됨 |
| `adventure/swim-shoe-v2.webp`, `swim-blade-v2.webp` (2) | OpenAI 기본 image_gen, 참고 `workshop-atlas.webp` | 2026-10-21, `docs/SWIM-ARTWORK-20261021.md` | OpenAI | `assets/CREDITS.md` 「수영 오리발 그림」 | 확인됨 |
| `generated/{crab,frog,rabbit,marine_fish,flipper,helmet,coat,lotus_leaf,reed}.webp`, `{pond_base,lotus_leaf,reed}-web.webp` (12) | OpenAI 이미지 생성 | 2026-10-14, `docs/GENERATED-PROMPTS.json`. `-web`은 2026-11-13 같은 그림 축소본 | OpenAI | `assets/CREDITS.md` 27·31행, `docs/ASSETS.md` 「새 기본 이미지」 | 확인됨 |
| `raccoon-web.webp`(모리 표정 시트), `biomes-web.webp`(서식지 디오라마), `investigation.webp`(수사실 배경) (3) | 사용자가 넣어 준 ChatGPT 그림(`ChatGPT Image 2026년 9월 23일 …png`) | 원본 2026-09-23, 원본 PNG는 2026-10-18 정리 때 삭제(`docs/ASSET-CLEANUP-20261018.json`) | 기록 없음: 만든 계정·요금제·계약상 권리 주체가 없음(CREDITS에 「확인 필요」) | `assets/CREDITS.md` 「첫 버전 사용자 제공 그림」, `ASSETS.md` | 근거 약함 |
| `village/map-base-light.webp`(마을 지도) + `village/restore-{1,2,3,4,5,core,gallery}.webp`(건물 복구 덮개) (8) | 사용자가 넣어 준 ChatGPT 그림 `chatgpt_2026-10-07_latest_01·02`를 Pillow 스크립트로 가공 | 2026-10-17 `224bc68`, 역할 변경 2026-10-18, 지붕 보정 2026-10-18, 재인코딩 2026-11-19 `8e70204` | 기록 없음(CREDITS에 「확인 필요」) | `assets/CREDITS.md` 「픽셀 마을」 「건물 역할 변경」 | 근거 약함 |
| `village/{haru,mori,researcher,ranger,engineer}.webp` (픽셀 걷기 시트 5) | 같은 ChatGPT 그림 `latest_04`(하루), `latest_05`(주민 시트)를 잘라 정리 | 2026-10-17 | 기록 없음(「확인 필요」) | `assets/CREDITS.md` 「픽셀 마을」 | 근거 약함 |
| `village/marker-{talk,enter,lock,unlock,sparkle}.webp` (지도 표시 5) | 같은 ChatGPT 그림 `latest_10`에서 잘라냄 | 2026-10-17 | 기록 없음(「확인 필요」) | `assets/CREDITS.md` 「픽셀 마을」 | 근거 약함 |
| `village/recovery-{1..5}-v2.webp` (복구 장면 5) | 새로 생성하지 않음. 사용자 제공 ChatGPT 그림에서 나온 `map-restored.webp`를 잘라냄 | 2026-10-19 `b6ea22a`, `docs/visual-polish-v2.md` | 원본과 같음(「확인 필요」) | `assets/CREDITS.md` 「주민 초상화·도구 그림·복구 장면 v2」 | 근거 약함 |
| `village/npc-{researcher,curator,ranger,detective,engineer}.webp` (지도 주민 5) | Higgsfield GPT Image 2.5, 참고 `village/haru.webp`(화풍)·`residents/*-v2.webp`(외형) | 2026-10-19, 작업 ID 5개, 원본 `_scratch/npc/` | Higgsfield. 화풍 참고로 쓴 `haru.webp`는 위 근거 약함 묶음 | `assets/CREDITS.md` 「마을 주민 픽셀 스프라이트」 | 확인됨 |
| `residents/{researcher,curator,ranger,detective,engineer}-v2.webp` (주민 초상 5) | OpenAI(Codex 내장 image_gen), 한 장 시트를 잘라냄 | 2026-10-19, 프롬프트 `docs/visual-polish-v2.md`, 원본 `output/residents-source-v2.png` | OpenAI | `assets/CREDITS.md` 「주민 초상화·도구 그림·복구 장면 v2」 | 확인됨 |
| `tools/{1..5}-v2.webp` (탐사 도구 5) | OpenAI(Codex 내장 image_gen) | 2026-10-19, `docs/visual-polish-v2.md`, `output/tools-source-v2.png` | OpenAI | 같은 절 | 확인됨 |
| `residents/dialogue/{mori,researcher,curator,ranger,detective,engineer}.webp` (대화창 큰 초상 6, 입 닫힘·열림 2칸) | 「GPT 이미지」(기존 외형 참고). 저장소 안에는 기록 없음 | 2026-11-13 `1b04313`. 기록은 `_scratch/npc-1-2-20261113/HANDOFF.md`(저장소 밖) 한 줄뿐, 프롬프트·원본 `raw/` | 저장소에 이용 조건 기록 없음(OpenAI 도구라면 OpenAI 조건) | `_scratch/npc-1-2-20261113/HANDOFF.md` | 근거 약함 |
| `village/map-villain-{left,right}-v2.webp`, `map-hero-reaction-v2.webp`, `map-ally-reaction-v2.webp` (지도 악당·반응 스프라이트 4) | 생성형 이미지(도구 이름 기록 없음). 하루·모리 외형은 위 사용자 제공 픽셀 시트를 참고 | 2026-11-14 `320023d`, 프롬프트 `_scratch/redraw-02-05-20261114/prompts.json`, 원본 `raw-2.png`, 납품 기록 `DELIVERY.md`(저장소 밖). 같은 날 악당 시안은 「Codex 기본 이미지 생성 도구」(`_scratch/villain-concepts-20261114/prompts-v2.md`) | 기록 없음 | 위 `_scratch` 경로 | 근거 약함 |
| `scenes/{compare,sorting,verify,link,experiment,showcase}.webp` (활동 배경 6) | Higgsfield GPT Image 2.5, 참고 `investigation.webp`·`museum-opening.webp` | 2026-10-19, 작업 ID 6개, 원본 `_scratch/scenes/` | Higgsfield | `assets/CREDITS.md` 「활동 장면 배경」 | 확인됨 |
| `scenes/{letter-paper,museum-wall,request-hall,exhibit-plaque}.webp` (4) | Higgsfield GPT Image 2.5, 참고 없이 프롬프트만 | 2026-10-20, 작업 ID 4개, 원본 `_scratch/hf/` | Higgsfield | 같은 절 | 확인됨 |
| `scenes/museum-gallery-v2.webp` (전시관 실내) | OpenAI 기본 image_gen | 2026-10-22, `docs/MUSEUM-GALLERY-ASSET-20261022.json` | OpenAI | `assets/CREDITS.md` 「자연사 전시관 실내」 | 확인됨 |
| `museum/{observation-notebook,museum-placard,museum-pedestal}.webp` (3) | Higgsfield gpt_image_2_5 | 2026-10-26, 원본 `_scratch/hf-museum/` | Higgsfield | `assets/CREDITS.md` 「관찰 노트·전시대·설명판」 | 확인됨 |
| `story/intro-0{1..4}.webp`, `story/outro-0{1..4}.webp` (이야기 장면 8) | OpenAI image_gen, 기존 하루·모리·건물 참고 | 2026-10-18, `docs/INTRO-OUTRO-VIDEO-PROMPTS.md` | OpenAI | `assets/CREDITS.md` 「마을 인트로·아웃트로」 | 확인됨 |
| `story/intro-poster-light.webp` (인트로 영상 포스터) | `story/intro-01.webp`의 1280px 사본(두 파일을 눈으로 대조해 같은 그림 확인). 변환 기록은 없음 | 2026-11-12 `11e7940` | OpenAI(원본과 같음) | 위 줄 + git 기록 | 확인됨 |
| `relay/{backdrop-*,tile-*,prop-*}.webp` (이어달리기 배경·바닥·소품 14) | gpt-imagegen(Codex 내장 GPT 이미지) | 2026-11-17, 프롬프트 전문 `docs/RUN-STAGE-3D-PLAN-20261117.md` 「생성 그림 기록」, 원본 `image/relay-20261117/`, 가공 `scripts/prepare-relay-art.mjs` | OpenAI. `CREDITS.md`에는 아직 줄 없음 | `docs/RUN-STAGE-3D-PLAN-20261117.md` 152~166행 | 확인됨 |
| `relay/sprite-{rabbit,frog,duck,butterfly,crab,marine}.webp` (움직임 4칸 띠 6) | 「GPT 이미지」, 기존 동물 그림 참고 | 2026-11-18 `44c3b96`, 원본 `image/relay-sprites-20261118/`, 가공 `scripts/prepare-relay-sprites.mjs`. 프롬프트 기록 없음 | OpenAI. `CREDITS.md`에는 아직 줄 없음 | `docs/RUN-STAGE-3D-PLAN-20261117.md` 271행 | 확인됨 |
| `reward-cards/{card,thumb}-{1..5}-*.webp` (성취 카드 10) | ChatGPT 앱 Codex 내장 이미지 도구(GPT 이미지), 글자 없이 생성, 테두리·글자는 코드 | 2026-11-18, 원본 `_scratch/reward-cards-20261118/gen/02/` | OpenAI | `assets/CREDITS.md` 「성취 카드」 | 확인됨 |

## 2. 영상 (5줄 · 파일 33개)

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|
| `videos/motion/{frog,crab,duck,rabbit,butterfly,marine}-web.mp4` + 같은 이름 `.webp` 포스터 (12) | 사용자가 준 생성 영상 `gemini_generated_video_*.mp4`. 생성 모델·요금제 확인 안 함 | 2026-10-18 정리, `docs/MOTION-VIDEOS-20261018.json`, 원본 `files/videos/source-20261018/`(Git 제외), 2026-11-13 웹 재압축 | 기록 없음(CREDITS에 「확인 필요」). 원본의 표식은 유지했다고 기록 | `assets/CREDITS.md` 「사용자 제공 동물 움직임 영상」 | 근거 약함 |
| `videos/motion/{camel,penguin}-web.mp4` + `.webp` (4) | Higgsfield Kling v3.0 Pro, 텍스트로 생성 | 2026-10-18, `docs/EXTRA-MOTION-VIDEO-JOBS-20261018.json` | Higgsfield | `assets/CREDITS.md` 「사용자 제공 동물 움직임 영상」 아래 줄 | 확인됨 |
| `videos/story/intro-light-web.mp4`, `outro-web.mp4` (인트로·파이널 24초 2) | 그림: Higgsfield Kling v3.0 Pro 8컷. 대사: Higgsfield 경유 ElevenLabs v4(하루 Dylan, 모리 Maeve). 음악: Suno 2곡. 자막: 주아체로 영상에 구워 넣음(2026-11-18) | 2026-10-18 `docs/STORY-VIDEO-RESULTS-20261018.json`, 대사 2026-11-13 `docs/npc-dialogue-voice.json` `characterVoiceUpdate`, 자막 `docs/film-captions-20261118/`, 원본 `files/videos/story-source-20261018/` | 그림·음악·글꼴은 근거 있음. **Higgsfield 경유 음성은 요금제·이용 조건 문구 없음** | `assets/CREDITS.md` 「마을 인트로·아웃트로」 「진행 음성」, `_shared/voice-provenance-20261118.md` 「납품 전에 메워야 할 빈칸」 3번 | 근거 약함 |
| `concepts/{warm-fur,webbed-foot,shell-helmet,sort-criteria}.{webm,mp4,webp}` (개념 영상 4편 12) | 자체 SVG 렌더러(`tools/concept-clips/`, sharp·FFmpeg), 외부 소재·생성형 AI 없음. 자막은 주아체로 구워 넣음(2026-11-19) | 2026-10-21, 자막 `docs/concept-captions-20261118/` | 자체 제작 + OFL 글꼴 | `assets/CREDITS.md` 「개념 영상 5편」, `_shared/FULLSCREEN-CAPTION-CONCEPTS-20261118.md` | 확인됨 |
| `concepts/habitat-life.{webm,mp4,webp}` (3) | 움직임 영상 `camel`·`penguin`·`duck`을 4.3초씩 이어 붙임 | 2026-10-21 | 낙타·펭귄은 Higgsfield, **오리는 위 사용자 제공 생성 영상(근거 약함)** | `assets/CREDITS.md` 「개념 영상 5편」 | 근거 약함 |

## 3. 음악 (1줄 · 파일 2개)

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|
| `music/village-theme.mp3`(Curious Little Step), `music/finale-theme.mp3`(Laid-Back Groove) | Suno, 사용자가 만들어 넣어 줌 | 2026-10-19 18:40 생성, 원본 `files/music-source-20261019/`(Git 제외) | Suno | `assets/CREDITS.md` 「배경음」, `_shared/voice-provenance-20261118.md` 요금제 표 | 확인됨 |

## 4. 효과음 (4줄 · 파일 26개)

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|
| `sfx/{tap,correct,retry,star,stamp,fanfare,talk,step,door,page}.mp3` (10) | Pixabay, 파일마다 원본 URL·제작자 | 2026-10-17, 2026-10-19 | Pixabay | `assets/CREDITS.md` 「효과음」 | 확인됨 |
| `sfx/encounter-{swing,one,two,heavy,exit,appear,contact,victory}.mp3` (8) | 과학34 공통 효과음 라이브러리(freesound 원본, 파일마다 원본 페이지·제작자) | 2026-11-17 | CC0 | `assets/CREDITS.md` 「지도 악당 효과음」 | 확인됨 |
| `sfx/card-{whoosh,reveal,epic,slot,complete}.mp3` (5) | 같은 라이브러리(freesound) | 2026-11-18 | CC0 | `assets/CREDITS.md` 「성취 카드」 | 확인됨 |
| `sfx/{unlock,unlock-sparkle,jump}.mp3` (3) | 같은 라이브러리(Kenney Interface Sounds, freesound) | 2026-11-19 | CC0 | `assets/CREDITS.md` 「성취 카드」 아래 2026-11-19 표 | 확인됨 |

## 5. 목소리 (7줄 · 파일 115개 + 영상 안 대사)

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|
| `audio/broadcast/*.mp3` (생태 방송 8) | EL, Aria | 2026-11-13, `docs/npc-dialogue-voice.json` `broadcast`(생성 ID·flow ID) | EL(Starter, 사용자 확인 2026-11-18) | `assets/CREDITS.md` 「진행 음성」 | 확인됨 |
| `audio/npc-dialogue/{5명}-{before,after}.mp3` (주민 대화 10) | EL, 주민별 목소리(Sora, Taek, Aria, Eunhye, NUHA) | 2026-11-13, `docs/npc-dialogue-voice.json` `voices` | EL(Starter) | `_shared/voice-provenance-20261118.md` 2번 표 | 확인됨 |
| `audio/npc-dialogue/{5명}-{before,after}-expanded-v2.mp3`, `curator-after-v2.mp3` (11) | EL, 같은 주민 목소리 | 2026-11-18, `docs/VOICE-FILL-20261118.json`(줄마다 생성 ID·받아쓰기·해시) | EL(Creator) | 같음 | 확인됨 |
| `audio/npc-dialogue/mori-welcome.mp3` (모리 인사 1) | Higgsfield 경유 ElevenLabs `elevenlabs_v4`, Maeve 프리셋 | 2026-11-13, `docs/npc-dialogue-voice.json` | **Higgsfield 경유 음성의 요금제·이용 조건 문구 없음** | `_shared/voice-provenance-20261118.md` 「납품 전에 메워야 할 빈칸」 3번 | 근거 약함 |
| `audio/intro/{letter,request,reward}-*.mp3` (편지·부탁·복구 안내 24) | EL, 해설 Sara Kim + 주민 5명 목소리 | 2026-11-18, `docs/VOICE-FILL-20261118.json` | EL(Creator) | 같음 | 확인됨 |
| `audio/concept/*.mp3` (개념·움직임 영상 자막 37) | EL, Sara Kim | 2026-11-18, `docs/VOICE-FILL-20261118.json` | EL(Creator) | 같음 | 확인됨 |
| `audio/villain/{1..5}-{1..5}.mp3` (지도 악당 25) | EL, Deok su | 2026-11-18, `docs/VOICE-FILL-20261118.json` `voices` 「기록 도둑(악당)」 | EL(Creator) | 같음. `_shared/voice-provenance-20261118.md` 2번 표에는 악당 줄이 빠져 있다(색인 누락) | 확인됨 |

- 실제 사람 목소리를 복제한 음성은 없다고 기록돼 있다(`_shared/voice-provenance-20261118.md`). 브라우저 음성 합성은 쓰지 않는다.
- 인트로·파이널 영상 안의 하루·모리 대사 10줄은 2장 영상 줄에 포함했다.

## 6. 글꼴 (2줄 · 파일 8개)

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|
| `fonts/NanumSquareNeoTTF-{bRg,cBd}.woff2`, 서브셋 `fonts/{landing,ui}-{regular,bold}.woff2`, `NanumSquareNeo-OFL.txt`, `NanumSquareNeo-SOURCE.json` | NAVER 나눔스퀘어 네오, 공식 배포 ZIP. 서브셋은 내부 이름을 Animal Record Landing·UI로 바꿈(OFL 예약 이름 규칙) | 2026-11-10 원문 확보, 원본 URL·해시 `NanumSquareNeo-SOURCE.json` | OFL(예약 이름 NanumSquareNeo — 서브셋은 이름 바꿈) | `assets/fonts/NanumSquareNeo-OFL.txt`, `assets/CREDITS.md` 30·32행 | 확인됨 |
| 주아체(Jua) — 파일로 배포하지 않고 인트로·파이널·개념 영상 자막에 그림으로 구워 넣음 | Woowahan Brothers, Google Fonts 배포본 `_shared/caption-motion-20261118/fonts/Jua-Regular.ttf` | 2026-11-18~19 | OFL(원문 `_shared/caption-motion-20261118/fonts/OFL.txt`) | `_shared/fonts/README.md`, `assets/fonts/Jua-OFL.txt` | 확인됨 |

## 7. 3D 모델 (5줄 · 파일 16개)

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|
| `models/dome/{frog,crab,duck,rabbit,butterfly,marine,camel,penguin}.glb` (생태돔 8) | 사용자가 준 Meshy GLB(2026-10-18 교체)를 Blender·glTF Transform으로 줄인 사본 | 2026-10-18 `docs/MODELS-20261018.md`·`.json`, 2026-10-26 `scripts/prepare-dome-models.py`, 펭귄 2026-11-13 | Meshy | `assets/CREDITS.md` 「사용자 제공 교체 모델」 「생태돔용 가벼운 모델」 | 확인됨 |
| `models/scan/{frog,crab,duck,rabbit}.glb` (관찰 스캐너 4) | 같은 Meshy 모델을 줄인 사본(토끼는 2026-11-12 `scripts/prepare-scanner-models.py`로 다시) | 2026-10-26 `fde2de6`, 2026-11-12 | Meshy | `assets/CREDITS.md` 「관찰 스캐너용 박쥐·토끼·참새 3D」, git 기록 | 확인됨 |
| `models/scan/bat.glb` | 사용자가 전달한 `Small_Brown_Bat.glb`(원본 `assets/models/source/20261112/bat.glb`, Git 제외). 만든 도구·제공처 기록 없음 | 2026-11-12 `5226b0c` | 기록 없음 | `assets/CREDITS.md` 같은 절, `scripts/prepare-scanner-models.py` | 근거 약함 |
| `models/scan/sparrow.glb` | 원본 `assets/models/source/20261112/sparrow.glb`. 누가 무엇으로 만들었는지 기록 없음(GLB 메타데이터는 `pygltflib`만) | 2026-11-12 `5226b0c` | 기록 없음 | 같은 절 | 근거 약함 |
| `models/scan/{spider,ant}.glb` (거미·개미 2) | 기록 없음. 원본 `assets/models/source/20261112/{spider,ant}.glb`가 있으나 `CREDITS.md`·문서·스크립트에 언급 없음(GLB 메타데이터 `pygltflib`만) | 2026-11-12 `5226b0c`(메시지 「Add four scanner animals」) | 기록 없음 | git 기록뿐 | **출처 미확인** |

## 8. 기타 (2줄)

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|
| `src/vendor/three/*` (three.js r181 코드, 에셋 수에는 안 셈) | three.js authors, npm `three@0.181.1` 수정 없이 + `examples/jsm` 2개는 import 경로만 수정 | 2026-10-17 | MIT(원문 `src/vendor/three/LICENSE.txt` 동봉) | `assets/CREDITS.md` 「three.js」 | 확인됨 |
| `village/village.json` (지도 길·건물·주민 자리 데이터) | 프로젝트 스크립트·코드로 만든 자체 데이터 | 2026-10-17 | 자체 제작 | `assets/CREDITS.md` 「픽셀 마을」 표 | 확인됨 |

## 사용자가 줘야 하는 자료

1. **2026-09-23·10-07 ChatGPT 그림의 생성 기록** (근거 약함 그림 5줄·26개 파일의 뿌리: 마을 지도·건물 덮개·픽셀 인물 시트·지도 표시·복구 장면·모리 시트·서식지 시트·수사실 배경): 누가 어느 계정·요금제로 만들었는지, 또는 업체(아이스크림미디어)가 준 자료라면 이용 근거가 적힌 계약서·메일. 없으면 3-3단계에서 새로 그려 교체한다(사용자 결정 7번).
2. **움직임 영상 6편 `gemini_generated_video_*.mp4`의 출처**: 어느 서비스(Gemini·Veo 등)·어느 요금제로 만들었는지, 또는 업체 제공이면 그 근거. 개념 영상 `habitat-life`의 오리 부분도 이 기록에 달려 있다.
3. **Higgsfield 요금제 화면과 음성 이용 조건**: 모리 인사, 인트로·파이널 영상의 하루·모리 대사(Higgsfield 경유 ElevenLabs 프리셋 Dylan·Maeve)를 만들 때의 요금제와, 그 음성을 상업 배포에 쓸 수 있다는 약관 화면. 그림·영상 쪽 「Basic 유료」 기록도 같은 화면으로 보강된다.
4. **공유 미리보기 그림(OG) 원본 기록**: `og/animal-record-recovery-pond-v1.png`(2026-10-29)을 무엇으로 만들었는지. 없으면 새로 만들어 교체한다.
5. **3D 박쥐·참새·거미·개미 원본 출처**: `assets/models/source/20261112/`의 네 GLB를 어디서 받았는지(Meshy 등 생성 도구면 계정·요금제 화면, 마켓 구매면 라이선스·영수증, 무료 배포본이면 라이선스 원문). Meshy 무료 요금제 결과물이면 CC BY 4.0이라 출처 표기가 필요하다.
6. **생성 도구 요금제 화면(보관용)**: ChatGPT(이미지 생성 계정), Suno(Premier), ElevenLabs(Starter→Creator), Meshy. 지금은 사용자 확인 문장으로만 남아 있다. 약관 원문(또는 캡처)을 함께 두면 「확인됨」 줄의 근거가 단단해진다.
7. **납품 계약상 권리 귀속**: 홈 표기 「기획·제작: 옐샘 & ⓒ 아이스크림미디어」와 맞는 계약 조항(저작권 귀속·생성형 AI 자료 사용 허용 여부·표시 의무).

## 정리할 기록 (자료가 아니라 문서 보강, 이번엔 고치지 않음)

- `assets/CREDITS.md`에 줄이 없는 것: 이어달리기 그림 20개(`relay/`), 대화창 초상 6개(`residents/dialogue/`), 지도 악당·반응 스프라이트 4개, 첫 화면 `-light` 사본 4개, 공유 미리보기 그림.
- `_shared/voice-provenance-20261118.md` 2번 표에 지도 악당 목소리(Deok su, 25줄)가 빠져 있다.
