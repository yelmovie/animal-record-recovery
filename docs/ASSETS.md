# 참고 에셋 사용 기록

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
