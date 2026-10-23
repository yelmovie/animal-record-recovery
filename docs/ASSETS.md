# 참고 에셋 사용 기록

2026-10-18: 사용자 요청으로 현재 실행·배포에 쓰이지 않는 이미지와 원본·백업 GLB 357개(924.16 MiB)를 삭제했다. 아래 PNG·검토 이미지 경로는 제작 당시 기록이며, 현재 실행용 WebP와 GLB는 유지했다. 삭제 목록과 유지 파일 SHA256은 `ASSET-CLEANUP-20261018.json`에 있다. 정리 후 92개 테스트와 빌드를 통과했다.

## 2026-10-15 탐험형 개편

`assets/adventure/`에 새 이미지 7종을 생성하고 적용했다. 프롬프트는 `ADVENTURE-ASSET-PROMPTS.json`에 보관했다.

| 파일 | 적용 |
|---|---|
| trail-map.png / .webp | 첫 화면·실제 길을 따라 이동하는 지도·복구 배경 |
| explorer-source.png / explorer.webp | 사람 탐험가 하루, 지도·소개·복구·엔딩 |
| field-kit.png / .webp | 장소 완료 시 획득하는 탐사 장비 보상 |
| field-desk.png / .webp | 관찰·발명·시험의 숲속 작업대 |
| duck.png / .webp | 새 관찰·분류·환경·4장 사진과 도감 |
| butterfly.png / .webp | 분류·두 번째 환경 탐사·도감 |
| goldfish.png / .webp | 분류·동물 명찰 후보·도감 |

기존 모리 시트와 생태 디오라마, 새 동물·제품 원본을 재사용한다. 디오라마의 실제 3열×4행 시트 규격에 맞춰 표시 좌표를 수정했다. PNG 원본을 보관하고 WebP만 런타임에 사용한다. 기존 이미지·이전 빌드 ZIP을 삭제하지 않았다. 실시간 3D는 이후 교체 범위다.

아래 표와 첫 생성 기록은 이전 버전 이력이다. 현재 배포 파일 목록은 `dist/build-manifest.json`이 기준이며 사용하지 않는 이전 그림·시트는 포함하지 않는다.

기존 PNG는 사용자가 프로젝트 폴더에 넣어 준 `ChatGPT Image 2026년 9월 23일 오후 … .png`의 복사본이다. 사용자 원본은 그대로 보존했다. 2026-10-14에 요청에 따라 11종의 투명 배경 기본 이미지를 추가 생성했다. 런타임은 압축한 WebP만 사용한다.

| 런타임 파일 | 원본 파일명 끝부분 | 사용 |
|---|---|---|
| assets/lab.png | 07_00_45 (1).png | 메인과 관찰 연구소 |
| assets/habitat.png | 07_00_51 (5).png | 생태 돔 배경 |
| assets/investigation.png | 07_00_52 (7).png | 수사실 배경 |
| assets/raccoon.png | 07_01_41 (2).png | 현장기록관 표정·행동 |
| assets/frog.png | 07_01_41 (1).png | 개구리 관찰·비교 |
| assets/animals-a.png | 07_02_25 (2).png | 오리·토끼·금붕어·나비 |
| assets/crab.png | 07_02_02 (3).png | 게 관찰·비교 |
| assets/biomes.png | 07_02_48 (2).png | 숲·연못·해안 디오라마 |
| assets/marine.png | 07_02_49 (4).png | 바다 물고기 |
| assets/animals-b.png | 07_02_25 (3).png | 검토용 복사본, 현재 미사용 |
| assets/workshop.png | 07_00_55 (9).png | 검토용 복사본, 현재 미사용 |

위 표는 최초 원본 대응 기록이다. 현재 개구리·게·토끼·바다 물고기와 제품은 아래 새 이미지로 교체했다. `frog`, `crab`, `marine`, `animals-b`, `workshop`의 기존 PNG/WebP는 보존용이며 배포에서 제외한다. 사용하지 않는 원본은 삭제하지 않았다.

## 새 기본 이미지

| 파일명 (assets/generated/) | 적용 위치 | 향후 3D 단위 |
|---|---|---|
| crab | 관찰·비교·분류 | 게 표본 |
| frog | 관찰·비교·분류·연못·관계 연결 | 개구리 표본 |
| rabbit | 분류·숲·추리 후보 | 토끼 |
| marine_fish | 바다 탐사 | 바다 물고기 |
| flipper | 발명 선택·시험·인증서 | 오리발 |
| helmet | 발명 선택·시험·인증서 | 안전모 |
| coat | 발명 선택·시험·인증서 | 방한 외투 |
| pond_base | 연못 탐사 | 지형 베이스 |
| lotus_leaf | 연못 탐사 | 연잎 |
| reed | 연못 탐사 | 갈대 |
| evidence_case | 미확인 동물 조사 | 기록철·돋보기 장식 |

각각 `.png` 원본과 `.webp` 배포본을 보관한다. OpenAI 이미지 생성 도구를 사용했으며 생성 입력은 `GENERATED-PROMPTS.json`에 기록했다. 게의 눈 개수와 연잎의 불투명한 테두리를 재검토하여 교체했다. 프롬프트 기록은 생성 요청의 보관본이며 출력의 해부학적 정확성을 보증하지 않는다.

WebP 변환: `scripts/prepare-assets.mjs`에 설치된 sharp 모듈 경로를 인수로 전달한다. 일반 실행과 빌드에는 sharp 설치가 필요 없다. 원본을 덮어쓰지 않는다.

메인·학습 화면의 글자는 이미지에 구워 넣지 않고 HTML로 구현했다. 픽셀 지도와 아이콘은 Canvas/SVG 코드다. AI 그림은 실사 관찰 자료나 정확한 해부도가 아니므로 교사의 표본·사진 비교가 필요하다. 제공된 원본의 권리 및 납품 계약상 이용 범위는 발주 측 확인 사항이다. `assets/CREDITS.md` 참고.

## 0.5 전시관 이미지

메인과 전시관 배경: `assets/adventure/museum-opening.png` / `museum-opening.webp` (1672×941). OpenAI 기본 image_gen 도구로 생성, WebP quality 88 인코딩. 입력 프롬프트는 `MUSEUM-ASSET-PROMPT-20261018.json`에 보관했다. 글자는 이미지 위에 HTML로 표시한다. 기존 주민·동물·지도 이미지를 새 의뢰에 재사용한다.


## 현재 태블릿 화면의 추가 자산

- `adventure/museum-opening.webp`: 기존 남자아이 탐험가 외형으로 교체.
- `adventure/terrain-atlas.webp`: 2열×3행 지형 표면. `dome3d.js`에서 재질로 사용.
- `adventure/workshop-atlas.webp`: 3열×3행. 첫 행 신발·모자·외투, 둘째 행 넓은 면·덮개·여러 겹, 셋째 행 물갈퀴·등딱지·털. `assets.js`의 명시적 영역으로 잘라 표시하며 원본 전체를 화면에 노출하지 않는다.
- 영상 시작 이미지/영상 프롬프트: `MOTION-VIDEO-PROMPTS.md`. 사용자가 제공한 6종 MP4를 `assets/videos/motion/`에 정리해 움직임 관찰에 연결했다.
- `adventure/dome-ground.webp`: 생태돔의 연속된 바닥 이미지. 겹치는 부채꼴 지형을 하나의 표면으로 바꿔 틈과 깜빡임을 제거했다.
- `adventure/nature-materials.webp`: 바위·얼음·선인장·흙의 2열×2행 표면. 연잎·갈대는 기존 투명 이미지를 입체 장면에 적용했다.
- `village/map-base.webp`, `map-restored.webp`, `restore-5.webp`: 공방 왼쪽 지붕의 파란 얼룩을 주황 기와로 보정했다. 지붕 영역 밖 변경은 없다.

## 영상·건물 역할 변경 (2026-10-18)

- 동물 영상 6종: 1280×720 H.264, 첫 관찰 동작 5초(나비 4.25초), 무음·faststart. 첫 프레임 WebP를 로딩 포스터로 사용. 원본 10초 영상은 `files/videos/source-20261018/`에 보관.
- 책 건물(오른쪽 위): 내 전시관, 항상 입장 가능. `restore-gallery.webp`는 기존 책 건물 복구 이미지 재사용.
- 플라스크 건물(오른쪽 아래): 5장 발명의 공방. 기존 공방(왼쪽 아래): 4장 동물 찾기 안내소. 문 위치·기술자 위치·복구 이미지를 역할에 맞게 연결.
- `INTRO-OUTRO-VIDEO-PROMPTS.md`: 기록의 수정 서사, 마지막 책 건물 개방 장면을 포함한 인트로·아웃트로 8컷. 8컷 생성 완료. 각 6초 컷 4개를 이어 인트로·아웃트로 각 24초로 적용했다.

## 최종 영상 추가 (2026-10-18)

- `assets/videos/story/{intro,outro}.mp4`: Kling 3.0 8컷을 각 24초로 편집. `STORY-VIDEO-JOBS-20261018.json`, `STORY-VIDEO-ENCODE-20261018.json`에 요청·변환 기록. 시작 이미지 8장은 `assets/story/`.
- `assets/videos/motion/{camel,penguin}.{mp4,webp}`: Kling 3.0으로 생성한 5초 1080p·무음 영상과 포스터. `EXTRA-MOTION-VIDEO-JOBS-20261018.json`에 완료 작업과 프롬프트 기록. 기본 6종과 함께 선택 관찰에 연결.
- 위쪽 초기 PNG 보관 설명은 당시 이력이다. 이후 사용자 요청에 따른 정리 내역은 `ASSET-CLEANUP-20261018.json`, 현재 배포 포함 여부는 `dist/build-manifest.json`이 기준이다.

## 전시관 재구성 (2026-10-22)

- `assets/scenes/museum-gallery-v2.webp`: OpenAI 기본 image_gen으로 생성한 자연사 전시관 실내. 녹색 벽·호두나무·황동·유리 전시대 조명과 석양이 있는 배경. 기존 표본과 글자는 HTML/CSS로 별도 표시한다.
- 정확한 프롬프트·원본 경로·WebP 변환 정보: `MUSEUM-GALLERY-ASSET-20261022.json`. sharp WebP quality 86. 전시관 입장 시에만 배경을 읽는다.
- 3장 관찰 사진은 생성 이미지가 아니다. 학습자가 재생한 기존 동물 영상의 실제 프레임을 canvas로 저장한다. 동물마다 한 장, 최대 480×360 및 64,000자, 브라우저 로컬 저장. 다시 찍기는 해당 사진만 교체한다.
