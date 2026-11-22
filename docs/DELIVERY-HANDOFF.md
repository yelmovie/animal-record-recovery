# 납품 안내 — 동물기록 복구작전

기존 인계 문서: [`HANDOFF.md`](HANDOFF.md), [`DELIVERY.md`](DELIVERY.md), 프로젝트 지침 [`../AGENTS.md`](../AGENTS.md).

## 1. 한눈에
- 프로젝트 이름: 동물기록 복구작전 (`animal-record-recovery`, 앱 버전 0.5.0)
- 운영 주소: https://animal-record-recovery.yelsam.workers.dev
- 저장소: https://github.com/yelmovie/animal-record-recovery (브랜치 `main`)
- 현재 운영 앱 커밋: `7a25944` (2026-11-22). Worker 배포 `c0ecb627-eddd-41a1-9ce8-9c1ca07a99eb`의 최신 인증서 파일을 공식 운영 주소에서 다시 대조했습니다. 이후 문서 변경은 앱 재배포 없이 기록합니다.

## 2. 폴더 구조
배포되는 것
- `src/`: 게임 코드(바닐라 JS 모듈, three.js는 `src/vendor/three/`)
- `assets/`: 그림·영상·소리·글꼴·3D 모델
- `index.html`, `sw.js`, `worker.js`, `wrangler.jsonc`

보관용(배포되지 않음)
- `docs/`: 기획·점검·배포 기록, 권리 장부, 교사 검토지
- `tests/`, `scripts/`: 테스트와 빌드·점검 스크립트, `server.mjs`: 로컬 서버
- `delivery/`: 이전 납품 묶음(현재 소스와 일치하지 않음), `files/`, `samplepages/`, `_unused/`

## 3. 실행·빌드·검사 명령 (`package.json` 기준)
- 개발 서버: `npm start` (`node server.mjs`)
- 검사: `npm run check`, 테스트: `npm test` (`node --test tests/*.test.mjs`)
- 빌드: `npm run build` (`node scripts/build.mjs`, 결과는 `dist/`)
- 빌드 결과 미리보기: `npm run preview` (기본 `http://127.0.0.1:4173`)
- Node.js 20 이상. 실행에 외부 패키지나 API 키가 필요하지 않습니다.

## 4. 배포
- 호스팅: Cloudflare Workers 정적 에셋(`wrangler.jsonc`, 이름 `animal-record-recovery`).
- 명령: `npm run deploy` (`npm run build && wrangler deploy`)
- 영상 탐색(Range) 처리: `worker.js`. `run_worker_first`가 `/assets/videos/*`와 `/assets/concepts/*`만 이 워커로 보냅니다.
- 푸시가 배포를 실행하는 워크플로(`.github`)는 없습니다.

## 5. 다른 호스팅으로 옮길 때 챙길 것
- 정적 파일 폴더: `npm run build`가 만든 `dist/` 전체(약 120 MiB, 2026-10-21 기준).
- 서비스 워커: `sw.js`를 사이트 루트에서 제공해야 합니다.
- Range 처리: `assets/videos/*`, `assets/concepts/*`의 영상이 바이트 범위 요청(206)을 지원해야 합니다.
- 환경 값: 필요한 환경 변수와 API 키가 없습니다. 서버와 로그인도 없습니다.
- 진행 기록은 브라우저 LocalStorage라 주소가 바뀌면 이어지지 않습니다.
- `file://` 더블클릭 실행은 ES 모듈 때문에 되지 않습니다. 서버로 열어야 합니다.

## 6. 버전과 변경 이력 (`git log`, 2026-11-22)
- 2026-11-22 `7a25944`: PNG에도 화면과 같은 인증서 제목 외곽획 적용
- 2026-11-22 `efdbdec`: 인증서 숫자 요약 제거·제목 획 보강
- 2026-11-22 `baa773f`·`dce7686`: 동물 탐험 테두리, A4 가로 손기입·인쇄·PNG
- `a588fb6` 학습 문구 적용, 완료 버튼을 하단에 배치
- `643fe4a` 브라우저 뒤로가기가 앱 안에 머묾, 첫 시도 표시와 보기 섞기
- `948ffa4` 성취 카드 글자 크기와 대비 보강
- `d9c6ddf` 3D 스테이지 누수, 옅은 글자 대비, 인증서 인쇄 수정
- `2d4dbed`~`94f611a`(2026-11-22, 운영 a6dc38cb) 16곳 맞추기: 인증서에 완료 날짜·제작 표기·「인증서 인쇄 / PDF 저장」 버튼, 설정 소리 순서(배경 음악 → 크기 → 효과음 → 크기 → 목소리), 저작권 고지에 CC0 효과음·지도 악당 목소리
- 그 외 최근 커밋은 `5007f7d`, `3a052cf`, `453d825`, `12d00e3` 등 문서 기록입니다.

## 7. 권리·출처
[`RIGHTS-LEDGER-20261121.md`](RIGHTS-LEDGER-20261121.md): 54줄 중 49줄 확인됨, 근거 약함 4줄, 출처 미확인 1줄. 그림은 Codex, 움직임 영상은 제미나이(사용자 확인 2026-11-21). 남은 줄은 3D 모형과 Higgsfield 경유 음성입니다.

## 8. 알려진 한계와 남은 일 (`docs/reviews/SCORE-20261121.md`)
- 점수 94/100(실기기 제외 98).
- 실기기·학교 네트워크 확인 대기.
- 권리 장부의 3D 모형(박쥐·참새·거미·개미)과 Higgsfield 경유 음성 자료 대기.
- 코드 구조: `adventure-app.js`가 하나의 클로저라 40KB 기준을 맞추지 못했습니다(3-4단계 중단 기록).

## 운영 대조 기록 (2026-11-22 12:56)

- 조율 세션이 운영 주소의 `index`와 스크립트·스타일 파일 40개를 저장소 `origin/main`과 대조했습니다. 결과는 모두 일치입니다(불일치 0).
- 위 본문에 「운영 반영 확인 필요」로 적힌 칸은 이 대조로 확인된 것입니다. 이후 앱을 다시 배포하면 `_scratch/final-recheck-20261120/prodcmp.sh 02`로 다시 대조합니다.

## 최신 인증서 운영 확인 (2026-11-22T20:22:16+09:00)

- 인증서 앱 `7a25944`와 기존 Worker 배포 `c0ecb627-eddd-41a1-9ce8-9c1ca07a99eb`를 유지했습니다. 공식 운영 `https://animal-record-recovery.yelsam.workers.dev`의 index와 인증서 관련 코드·스타일·그림 총5개가 현재 소스 또는 검증 빌드와 SHA256 일치하고 HTTP200입니다.
- 인증서는 A4 가로, 학교·학년·반·번호·이름 손기입 빈칸, 인쇄/PDF1쪽·PNG2400×1697입니다. 진행·성취 숫자 요약은 없고 제목900 굵기와 획 보강을 화면·인쇄·PNG에 맞췄습니다.
- 기존 `.tmp/cert-design-20261122/prod-final.json`에서1280×800·1024×768·1920×1080의 인증서 전체 표시·숫자 요약 없음·제목900·오류0을 확인했습니다. 기존 검사·테스트·빌드와 PDF·PNG 출력 검증은 기존 인증서 작업 기록입니다. 이번 마무리는 문서 최신화와 운영 파일·원격main 재대조입니다.
- 실기기·수업·교사 검수·권리 증빙 자료는 기존 대기 상태를 유지합니다.
