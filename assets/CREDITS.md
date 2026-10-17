# 이미지·글꼴·소리 출처

- 2026-10-15 `adventure/`: 지도·하루·장비 상자·작업대·오리·나비·금붕어 총 7종을 OpenAI 기본 이미지 생성 도구로 제작. 생성 입력은 `docs/ADVENTURE-ASSET-PROMPTS.json`, 적용 위치는 `docs/ASSETS.md` 참고. PNG 원본은 D: 프로젝트에 보관한다.
- 게임 기획·제작 표시는 동일 사용자의 참고 프로젝트 `1udangtangtang`과 같이 옐샘으로 정리했다. 계약상 권리 범위 확인 기록을 대신하는 것은 아니다.

- 기존 연구소·모리·동물 시트·생태 배경: 사용자가 제공한 ChatGPT 이미지 파일. 원본 대응은 `docs/ASSETS.md` 참고. 계약상 권리 주체와 상업적 납품 범위는 확인 전이다.
- `generated/*.png`: 2026-10-14 OpenAI 이미지 생성 도구로 이 프로젝트를 위해 생성한 기본 이미지 11종. 정확한 원생물 표본 대신 쓰는 자료가 아니다.
- WebP: 위 원본을 sharp로 변환. 별도의 외부 스톡 다운로드 없음.
- 지도·아이콘·연못 물 모양: 프로젝트 Canvas/SVG 코드로 제작.
- 글꼴(본문): Pretendard 1.3.9 — Copyright (c) 2021 Kil Hyung-jin, SIL Open Font License 1.1, Reserved Font Name "Pretendard". 2026-10-16 공식 npm 패키지 `pretendard@1.3.9`(github.com/orioncactus/pretendard)의 배포본 `Pretendard-Regular/Bold.subset.woff2`(KS X 1001 한글 2,350자 서브셋, 수정 없음)를 `fonts/`에 셀프호스팅하고 라이선스 원문 `fonts/Pretendard-OFL.txt`를 함께 둔다. 서브셋에 없는 글자는 운영체제 기본 한글 글꼴로 표시된다.
- 글꼴(제목·버튼): Jua — Copyright (c) 2017 Woowahan Brothers Corp., SIL Open Font License 1.1, Reserved Font Name "Jua". Google Fonts 배포본(korean/latin 서브셋, 수정 없음)을 `fonts/`에 셀프호스팅하고 라이선스 원문 `fonts/Jua-OFL.txt`를 함께 둔다. 외부 CDN 요청 없음. (배달의민족 주아체와는 다른 Google Fonts 배포본)
- 효과음: `src/audio.js`의 Web Audio 사인파 합성. 외부 음원 없음.

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

## 동물 그림 추가 (2026-10-17)

`adventure/bee.webp`, `snail.webp`, `bat.webp`, `hen.webp`: Higgsfield의 GPT Image 2.5 모델로 이 프로젝트를 위해 생성했다. 기존 `generated/frog.png`를 화풍 참고 이미지로 넣었다. 흰 배경은 프로젝트 스크립트로 투명하게 바꾸고 WebP로 줄였다. 투명 PNG 원본은 `D:/iscreammedia_sc34/_scratch/hf-animals/`에 있다. 분류 게이트·미확인 기록 수사실의 후보 동물로 쓴다.

## three.js (2026-10-17 추가)

- `src/vendor/three/three.module.min.js`, `three.core.min.js`: three.js r181(0.181.1), MIT License, Copyright 2010-2025 three.js authors. 공식 npm 패키지 `three@0.181.1` 배포본을 수정 없이 넣었고 라이선스 원문은 같은 폴더 `LICENSE.txt`. 학교망에서 CDN이 막혀도 되도록 외부 요청 없이 프로젝트 안에서 불러온다.
- 02 관찰 스캐너의 3D 동물(개구리·게·오리·토끼)은 외부 모델 없이 `src/scanner3d.js` 코드로 만든 도형 조합이고, 표면 무늬도 코드로 그린 캔버스 텍스처다.
- (2026-10-17 추가) `src/vendor/three/GLTFLoader.js`, `BufferGeometryUtils.js`: 같은 three.js r181 배포본의 `examples/jsm`에서 가져와 `import` 경로만 프로젝트 안 파일로 바꿨다(MIT).

## 3D 동물 모델 (2026-10-17 추가)

`models/*.glb` 6종(개구리·게·오리·토끼·나비·바다 물고기)은 Meshy API(image-to-3D, 모델 `latest`=Meshy 7.1, 2K 텍스처, 1개당 30크레딧, 합계 180크레딧)로 이 프로젝트를 위해 생성했다. 입력 이미지는 이 프로젝트의 기존 생성 그림이다: `generated/frog.png`, `generated/crab.png`, `generated/rabbit.png`, `adventure/duck.png`, `adventure/butterfly.png`, `generated/marine_fish.png`. 생성 원본(수십만 삼각형, 20~120MB)은 `D:\iscreammedia_sc34\_scratch\meshy\out`에 두고, Blender 5.2를 창 없이 돌려(`_scratch\meshy\tidy.py`) 메시를 하나로 합치고, 삼각형을 줄이고(관찰 동물 1만2천, 돔 전용 나비·물고기 6천), 텍스처를 1024/512 WebP로 줄여 GLB로 내보냈다. 압축(Draco 등)은 디코더 파일이 따로 필요해서 쓰지 않았다. 코드로 만든 도형 동물(`src/scanner3d.js`의 MODELS)은 GLB를 불러오는 동안과 불러오지 못했을 때만 보인다.
