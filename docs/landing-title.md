# 첫 화면 제목 이미지 · 2026-10-19

- 사용자 요청: 생성한 '동물기록 복구작전' 제목 이미지를 첫 화면에 적용하고 디자인 변경.
- 원본: `output/imagegen/animal-record-title-concept-v1.png` (built-in image_gen).
- 생성 프롬프트: `output/imagegen/animal-record-title-concept-v1.prompt.txt`.
- 사용 파일: `assets/adventure/title-logo-v1.webp`, 1200 × 800, 220,300 bytes, 실제 알파 투명도 확인.
- 사용 위치: `src/shell-views.js` 첫 화면의 h1. 읽기 도구용 제목은 DOM 텍스트로 유지.
- 레이아웃: `src/landing.css`. 기존 배경과 학습 진행 로직을 유지하고 제목·두 줄 소개·주요 출발 버튼·이야기 보기 배치 변경.
- 배포 포함: `scripts/build.mjs`. 첫 화면에서만 제목 이미지 로드, `index.html`에서 preload.
- 확인: 문법 검사, 기존 테스트 110개, 빌드 성공. Chrome 1920×1080, 1366×768, 1280×720, 1024×768, 1024×600, 768×1024, 390×844에서 가로 넘침 없음. 출발→소개→건너뛰기→지도, 홈→이야기 보기 확인. 로컬 브라우저 오류 및 HTTP 오류 없음. 모바일은 세로 스크롤 허용.
- 로컬 미리보기: `http://127.0.0.1:4189/`. 외부 배포는 수행하지 않음.
