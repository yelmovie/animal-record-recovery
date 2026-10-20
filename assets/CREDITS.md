# 이미지·글꼴·소리 출처

## 도구·라이선스 검토 (상업 배포 기준) · 2026-10-19

| 도구·자료 | 쓰는 곳 | 상업 이용 판단 | 근거 |
|---|---|---|---|
| Suno (Pro·Premier 구독) | 배경 음악 2곡 | 가능 | 사용자 확인: 두 곡(2026-10-19 18:40 생성) 모두 유료 구독 중 생성. 무료 요금제 곡은 비상업만 가능하므로 앞으로도 유료 구독 상태에서만 생성 |
| Higgsfield (Basic 유료 요금제) | 주민 스프라이트·장면 배경·동물 그림·영상 | 가능 | 유료 크레딧으로 생성 |
| Meshy (유료 요금제) | 동물 3D 모형 | 가능 | 유료 크레딧으로 생성(무료 요금제 결과물은 CC BY 4.0이라 해당 없음) |
| OpenAI 이미지 생성(ChatGPT image_gen) | 지도·장면 그림 | 가능 | OpenAI 이용약관상 출력물 권리는 사용자에게 |
| Pixabay 효과음 11종 | 효과음 | 가능 | Pixabay Content License(출처 표기 불필요·상업 이용 가능) |
| Jua·Pretendard | 글꼴 | 가능 | SIL OFL 1.1, 원문 `fonts/*-OFL.txt` 동봉 |
| three.js | 3D 표시 | 가능 | MIT License |
| Remotion | 쓰지 않음 | 해당 없음 | `package.json`·백업 package.json·코드에 사용 흔적 없음(영상은 ffmpeg로 편집) |
| CC BY-NC·ND 자료, 유료 폰트 | 쓰지 않음 | 해당 없음 | — |

AI로만 만든 결과물은 저작권 보호가 제한될 수 있다. 상업 이용 가능 여부와 저작권 등록 가능 여부는 별개다.

- 2026-10-15 `adventure/`: 지도·하루·장비 상자·작업대·오리·나비·금붕어 총 7종을 OpenAI 기본 이미지 생성 도구로 제작. 생성 입력은 `docs/ADVENTURE-ASSET-PROMPTS.json`, 적용 위치는 `docs/ASSETS.md` 참고. PNG 원본은 D: 프로젝트에 보관한다.
- 게임 기획·제작 표시는 동일 사용자의 참고 프로젝트 `1udangtangtang`과 같이 옐샘으로 정리했다. 계약상 권리 범위 확인 기록을 대신하는 것은 아니다.

- 기존 연구소·모리·동물 시트·생태 배경: 사용자가 제공한 ChatGPT 이미지 파일. 원본 대응은 `docs/ASSETS.md` 참고. 계약상 권리 주체와 상업적 납품 범위는 확인 전이다.
- `generated/*.png`: 2026-10-14 OpenAI 이미지 생성 도구로 이 프로젝트를 위해 생성한 기본 이미지 11종. 정확한 원생물 표본 대신 쓰는 자료가 아니다.
- WebP: 위 원본을 sharp로 변환. 별도의 외부 스톡 다운로드 없음.
- 지도·아이콘·연못 물 모양: 프로젝트 Canvas/SVG 코드로 제작.
- 글꼴(본문): Pretendard 1.3.9 — Copyright (c) 2021 Kil Hyung-jin, SIL Open Font License 1.1, Reserved Font Name "Pretendard". 2026-10-16 공식 npm 패키지 `pretendard@1.3.9`(github.com/orioncactus/pretendard)의 배포본 `Pretendard-Regular/Bold.subset.woff2`(KS X 1001 한글 2,350자 서브셋, 수정 없음)를 `fonts/`에 셀프호스팅하고 라이선스 원문 `fonts/Pretendard-OFL.txt`를 함께 둔다. 서브셋에 없는 글자는 운영체제 기본 한글 글꼴로 표시된다.
- 글꼴(제목·버튼): Jua — Copyright (c) 2017 Woowahan Brothers Corp., SIL Open Font License 1.1, Reserved Font Name "Jua". Google Fonts 배포본(korean/latin 서브셋, 수정 없음)을 `fonts/`에 셀프호스팅하고 라이선스 원문 `fonts/Jua-OFL.txt`를 함께 둔다. 외부 CDN 요청 없음. (배달의민족 주아체와는 다른 Google Fonts 배포본)
- 초기 효과음: Web Audio 합성. 현재는 아래 Pixabay 음원과 로딩 실패 시 합성 대체음을 사용한다.

앱 화면에 생성형 AI 이미지 안내가 있다. 권리 귀속·표시 주체·배포 플랫폼은 납품 계약으로 확정해야 하며 이 문서는 새로운 이용 허락을 부여하지 않는다.

## 효과음 (2026-10-17 추가)

위의 "효과음: 사인파 합성, 외부 음원 없음" 항목은 이제 맞지 않는다. 아래 Pixabay 효과음 6종을 쓰고, `src/audio.js`의 합성음은 파일을 불러오지 못했을 때만 대신 나온다. 6종 모두 Pixabay Content License(출처 표기 불필요, 상업적 사용 가능)이며 원본을 수정하지 않았다.

| 파일 | 쓰는 곳 | 출처 | 제작자 | 확보일 |
|---|---|---|---|---|
| sfx/tap.mp3 | 버튼 누를 때 | https://pixabay.com/sound-effects/film-special-effects-bubble-pop-06-351337/ | Universfield | 2026-10-17 |
| sfx/correct.mp3 | 활동 완료 | https://pixabay.com/sound-effects/technology-puzzle-game-correct-answer-508718/ | cartoon_music | 2026-10-17 |
| sfx/retry.mp3 | 다시 살펴보기(오답·힌트) | https://pixabay.com/sound-effects/technology-notification-wrong-answer-508690/ | cartoon_music | 2026-10-17 |
| sfx/star.mp3 | 별이 위쪽 별 칸에 도착 | https://pixabay.com/sound-effects/film-special-effects-collect-points-190037/ | Liecio | 2026-10-17 |
| sfx/stamp.mp3 | 복구 완료 도장 | https://pixabay.com/sound-effects/film-special-effects-stamp-81635/ | freesound_community | 2026-10-17 |
| sfx/fanfare.mp3 | 장소 복구 팡파르 | https://pixabay.com/sound-effects/musical-level-up-fanfare-151765/ | Universfield | 2026-10-17 |
| sfx/talk.mp3 | 마을 주민에게 말 걸기 | https://pixabay.com/sound-effects/film-special-effects-retro-blip-236676/ | driken5482 | 2026-10-19 |
| sfx/step.mp3 | 마을에서 하루가 걸을 때 발걸음 | https://pixabay.com/sound-effects/film-special-effects-walk-on-grass-1-291984/ | joentnt | 2026-10-19 |
| sfx/door.mp3 | 건물(활동)에 들어갈 때 | https://pixabay.com/sound-effects/household-opening-door-411632/ | soundreality | 2026-10-19 |
| sfx/page.mp3 | 가방·설정·도구 창 열기 | https://pixabay.com/sound-effects/film-special-effects-turn-a-page-336933/ | creatorshome | 2026-10-19 |
| ~~sfx/drop.mp3~~ (2026-10-20 사용 중지 → `_unused/sfx/`, 틀린 소리처럼 들려 합성음으로 교체) | 카드를 끌어다 놓을 때 | https://pixabay.com/sound-effects/film-special-effects-ui-drop-success-521938/ | soundshelfstudio | 2026-10-19 |

## 동물 그림 추가 (2026-10-17)

`adventure/bee.webp`, `snail.webp`, `bat.webp`, `hen.webp`: Higgsfield의 GPT Image 2.5 모델로 이 프로젝트를 위해 생성했다. 기존 `generated/frog.png`를 화풍 참고 이미지로 넣었다. 흰 배경은 프로젝트 스크립트로 투명하게 바꾸고 WebP로 줄였다. 투명 PNG 원본은 `D:/iscreammedia_sc34/_scratch/hf-animals/`에 있다. 분류 게이트·미확인 기록 수사실의 후보 동물로 쓴다.

## three.js (2026-10-17 추가)

- `src/vendor/three/three.module.min.js`, `three.core.min.js`: three.js r181(0.181.1), MIT License, Copyright 2010-2025 three.js authors. 공식 npm 패키지 `three@0.181.1` 배포본을 수정 없이 넣었고 라이선스 원문은 같은 폴더 `LICENSE.txt`. 학교망에서 CDN이 막혀도 되도록 외부 요청 없이 프로젝트 안에서 불러온다.
- 02 관찰 스캐너의 3D 동물(개구리·게·오리·토끼)은 외부 모델 없이 `src/scanner3d.js` 코드로 만든 도형 조합이고, 표면 무늬도 코드로 그린 캔버스 텍스처다.
- (2026-10-17 추가) `src/vendor/three/GLTFLoader.js`, `BufferGeometryUtils.js`: 같은 three.js r181 배포본의 `examples/jsm`에서 가져와 `import` 경로만 프로젝트 안 파일로 바꿨다(MIT).

## 3D 동물 모델 (2026-10-17 추가)

`models/*.glb` 6종(개구리·게·오리·토끼·나비·바다 물고기)은 Meshy API(image-to-3D, 모델 `latest`=Meshy 7.1, 2K 텍스처, 1개당 30크레딧, 합계 180크레딧)로 이 프로젝트를 위해 생성했다. 입력 이미지는 이 프로젝트의 기존 생성 그림이다: `generated/frog.png`, `generated/crab.png`, `generated/rabbit.png`, `adventure/duck.png`, `adventure/butterfly.png`, `generated/marine_fish.png`. 생성 원본(수십만 삼각형, 20~120MB)은 `D:\iscreammedia_sc34\_scratch\meshy\out`에 두고, Blender 5.2를 창 없이 돌려(`_scratch\meshy\tidy.py`) 메시를 하나로 합치고, 삼각형을 줄이고(관찰 동물 1만2천, 돔 전용 나비·물고기 6천), 텍스처를 1024/512 WebP로 줄여 GLB로 내보냈다. 압축(Draco 등)은 디코더 파일이 따로 필요해서 쓰지 않았다. 코드로 만든 도형 동물(`src/scanner3d.js`의 MODELS)은 GLB를 불러오는 동안과 불러오지 못했을 때만 보인다.
- (추가) 낙타·펭귄(`models/camel.glb`, `penguin.glb`, 06 돔 전용)은 기존 그림이 없어서 Meshy text-to-image(`nano-banana-2`, 배경 제거, 1장 6크레딧)로 기존 그림과 같은 사실적 도감풍 그림을 먼저 만들고, 그 그림으로 image-to-3D(30크레딧)를 돌렸다. 블렌더로 6천 삼각형·512 텍스처로 줄였다. 입력 그림은 `D:\iscreammedia_sc34\_scratch\meshy\out\*-input.png`. 3D 동물 8종 전체 Meshy 사용량 252크레딧.

## 전시관 메인 이미지 · 2026-10-18

`assets/adventure/museum-opening.png`는 OpenAI 기본 이미지 생성 도구(image_gen)로 생성했다. WebP 배포본은 같은 폴더의 `museum-opening.webp`이며, 기존 sharp를 사용해 quality 88로 인코딩했다. 원본은 유지했다. 메인 화면과 개인 전시관 헤더에 사용한다. 프롬프트와 경로는 `docs/MUSEUM-ASSET-PROMPT-20261018.json`에 보관했다. 주민 스프라이트·동물 도감·복구 지도는 기존 자산을 재사용했다.


## 사용자 제공 교체 모델 · 2026-10-18

개구리·게·토끼·물고기·오리·낙타·펭귄의 기존 GLB를 사용자가 새로 제공한 Meshy GLB로 교체했다. 원본은 `models/source/20261018/`, 이전 모델은 `docs/backups/models-before-20261018/`에 보관한다. 세부 변환 설정·출처 파일명·SHA256은 `docs/MODELS-20261018.json`과 안내 문서에 기록했다. 위 2026-10-17의 축소 수치는 이전 버전에 대한 기록이다. 새 밑그림 3종은 내장 image_gen으로 생성했으며 `assets/model-references-20261018/`에 저장했다.


## 태블릿·발명 화면 보강 · 2026-10-18

현재 `adventure/museum-opening.webp`는 기존 남자아이 탐험가를 참고해 image_gen으로 다시 그린 버전이다. `adventure/terrain-atlas.webp`는 숲·풀·모래·눈·물·나무껍질 6개 표면, `adventure/workshop-atlas.webp`는 바탕 제품·부품·동물 특징 9개를 위한 image_gen 생성 이미지다. 공방 이미지는 균일한 아이보리 바탕으로 재생성해 외곽 잔여색을 없앴다. WebP 변환은 Pillow로 색상 편집 없이 수행했다. UI의 부품 이동, 도해 화살표와 글자는 코드로 유지했다. 기존 3D 8종 교체 결과는 유지하며 새로운 Meshy 생성은 실행하지 않았다.

2026-10-18 로딩 변경: 관찰·생태돔의 임시 도형 선표시를 제거했다. 실제 GLB가 준비되기 전에는 로딩 안내를 사용하고, 불러오기 실패 시 2D 학습 화면으로 전환한다.

## 생태돔 자연물·공방 지붕 보정 · 2026-10-18

`adventure/dome-ground.webp`(연속된 다섯 환경의 바닥), `adventure/nature-materials.webp`(바위·얼음·선인장·흙 2×2 표면)는 내장 image_gen으로 생성하고 sharp로 WebP 변환했다. 연잎과 갈대는 기존 `generated/lotus_leaf.webp`, `generated/reed.webp`를 재사용했다. 바위·얼음·선인장의 입체 형태는 코드로 만들었다.

공방 지붕은 기존 지도에 대한 image_gen 편집 결과에서 지붕 영역만 합성했다. `village/map-base.webp`, `map-restored.webp`, `restore-5.webp`에 같은 지붕을 반영했으며 원본은 `docs/backups/roof-before-20261018/`에 보관했다. 지붕 밖 픽셀은 유지했다.

## 사용자 제공 동물 움직임 영상 · 2026-10-18

`videos/motion/*.mp4` 6종은 사용자가 제공한 생성 영상이다. 파일명은 `gemini_generated_video_*.mp4`이며 생성 모델·과금 내역은 확인하지 않았다. 원본은 `files/videos/source-20261018/`에 보관했다. 관찰 가능한 앞부분을 추출하여 H.264 CRF 20·720p·무음·faststart로 변환했고 원본의 표식은 유지했다. 나비가 화면 밖으로 사라지는 후반부는 배포본에서 제외했다. 원본 SHA256과 대응표는 `docs/MOTION-VIDEOS-20261018.json`에 있다. 위 사용자 제공 6종의 정리 과정에서는 생성 API를 호출하지 않았다. 이후 추가 생성한 낙타·펭귄·이야기 영상은 아래 별도 기록을 따른다.

건물 역할 변경: 기존 책 건물 복구 이미지는 `village/restore-gallery.webp`, 기존 왼쪽 공방 복구 이미지는 `restore-4.webp`로 재사용했다. 새 5장 플라스크 건물 복구 이미지는 기존 `map-restored.webp`의 해당 영역에서 추출했다.

- 낙타·펭귄 움직임 영상(`videos/motion/camel.*`, `penguin.*`): 2026-10-18 사용자의 추가 요청으로 Higgsfield Kling v3.0 Pro에서 각각 5초, 무음으로 생성. 기존 3D 동물의 외형을 확인해 텍스트에 반영했으며 원본 입력 이미지를 사용한 생성은 아님. 생성 요청 및 작업 ID: `docs/EXTRA-MOTION-VIDEO-JOBS-20261018.json`. 로컬 H.264/faststart 변환, 실제 프레임을 확인한 관찰 시점 적용. 과학 측정 영상이 아닌 AI 생성 관찰 자료.

## 마을 인트로·아웃트로 · 2026-10-18

`story/intro-01.webp`~`outro-04.webp` 초기 이미지 8장은 기존 하루·모리와 마을 건물을 참고해 image_gen으로 생성했다. 이후 사용자 요청으로 Higgsfield Kling v3.0 Pro에서 8컷을 생성해 인트로·아웃트로 각 24초로 편집했다. 전신·얼굴·의상과 건물 역할의 일관성을 프롬프트에 고정했고, 영상 내 UI·한글 글자는 생성하지 않았다. 자막은 앱 코드에서 표시한다. 원본은 `files/videos/story-source-20261018/`, 완료 작업 ID·결과 URL은 `docs/STORY-VIDEO-RESULTS-20261018.json`에 보관한다. 자세한 구성은 `docs/INTRO-OUTRO-VIDEO-PROMPTS.md`를 참고한다.

## 마을 주민 픽셀 스프라이트 · 2026-10-19

`village/npc-{researcher,curator,ranger,detective,engineer}.webp`: 마을 지도에서 3D 느낌 초상화가 픽셀 마을과 어울리지 않아 Higgsfield GPT Image 2.5(high, 투명 배경)로 다시 생성했다. 참고 이미지는 하루 스프라이트 시트(`village/haru.webp`, 화풍)와 기존 주민 초상화(`residents/*-v2.webp`, 인물 외형) 두 장. 생성 후 여백을 자르고 높이 220px 무손실 webp로 저장. 의뢰 화면의 큰 초상화는 기존 `residents/*-v2.webp`를 그대로 쓴다. 작업 ID: researcher 20412e09, curator fe7a3328, ranger 417ff23d, detective 03b97afb, engineer 6282499f. 원본 PNG는 `D:/iscreammedia_sc34/_scratch/npc/`.

## 배경음 · 2026-10-19

사용자가 Suno로 만들어 프로젝트에 넣어 준 곡 2개. 원본은 `files/music-source-20261019/`(깃 제외), 웹용은 앞뒤 무음 제거·음량 맞춤(-20 LUFS)·112kbps로 다시 인코딩했다.

| 파일 | 원래 제목 | 쓰는 곳 |
|---|---|---|
| music/village-theme.mp3 | Curious Little Step (Suno, seoulmovie) | 게임 전체 배경음(아웃트로 제외) |
| videos/story/outro.mp4 음성 트랙 | Laid-Back Groove (Suno, seoulmovie) 2:26~2:50 | 아웃트로(파이널) 음악. 조용한 구간이 끝나고 커지는 순간이 16초 "드디어 문이 열렸어!"에 오도록 잘라 영상에 합침. 무음 원본은 `files/videos/outro-silent-20261018.mp4` |

설정 창의 배경음·효과음 슬라이더로 따로 조절하고, '소리' 스위치를 끄면 둘 다 멈춘다. 상업적 사용 가능 여부는 Suno 계정 요금제를 따른다(유료 요금제에서 만든 곡만 상업 이용 가능).

## 활동 장면 배경 · 2026-10-19

`scenes/{compare,sorting,verify,link,experiment,showcase}.webp`: 그림 없이 CSS 칸만 있던 활동 6개(1장 비교, 2장 분류·검증, 3장 생활 잇기, 5장 실험 비교·작품 소개)의 배경. Higgsfield GPT Image 2.5(high, 16:9)로 생성, 참고 이미지는 `investigation.webp`·`adventure/museum-opening.webp`(화풍). 1600px WebP(q80)로 줄임. 작업 ID: compare 2ab985e8, sorting c80aba04, verify cc9a7d40, link b49a89a3, experiment e207af88, showcase 1a34fd86. 원본 PNG는 `D:/iscreammedia_sc34/_scratch/scenes/`.

`scenes/{letter-paper,museum-wall,request-hall,exhibit-plaque}.webp` (2026-10-20): 주민 편지지, 전시관 벽, 주민의 부탁 전시실 배경, 전시 설명판(나무 액자). Higgsfield GPT Image 2.5(글자 없음 지시)로 생성, 참고 이미지 없이 프롬프트만. 편지지 900px·배경 1920px WebP(q82), 설명판은 초록 벽을 지워 투명 처리 후 900px WebP. 작업 ID: letter 4e37e378, museum-wall 101baa77, request-hall 1927a1ab, plaque 148c6b26. 원본 PNG는 `D:/iscreammedia_sc34/_scratch/hf/`.
