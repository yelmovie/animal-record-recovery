# AGENTS.md — 동물기록 복구작전 (animal-record-recovery)

이 문서는 사람과 AI 에이전트(Codex, Claude Code 등)가 이 저장소에서 작업할 때 따르는 프로젝트 지침이다.
적용 범위는 이 저장소뿐이다. 여러 과학 프로젝트를 묶은 작업 공간 안에서 작업할 때는 상위 폴더의 지침도 함께 확인한다.

작성 기준: 2026-10-30 Windows 11, 2026-11-15 macOS에서 exFAT 외장 SSD로 작업한 기록.
확인 날짜가 적힌 환경 정보는 당시의 기록이다. 작업하는 컴퓨터에서 현재 환경을 확인한다.

---

## A. 프로젝트 개요

- 초등 3학년 과학 「동물의 생활」 탐구형 웹앱. 태블릿·전자칠판에서 관찰 → 분류 → 영상 관찰 → 근거 추리 → 발명 실험 → 보상·전시 흐름으로 진행한다. 자세한 기능·이력은 `README.md`, `PRD.md`, `TRD.md`, `VALIDATION.md`.
- 기술 스택: 빌드 도구 없는 바닐라 JavaScript ES 모듈 + CSS(`index.html`이 `src/`를 직접 불러옴), 3D는 `src/vendor/three/`에 넣어 둔 three.js. 로컬 서버는 Node 내장 `http`만 쓰는 `server.mjs`. 저장은 브라우저 LocalStorage.
- 배포: Cloudflare Workers(`wrangler.jsonc`, 이름 `animal-record-recovery`, 정적 자산은 `dist/`, 영상 Range 요청만 `worker.js`가 처리). 운영 주소는 `https://animal-record-recovery.yelsam.workers.dev/`. `vercel.json`과 `.vercel/`도 남아 있으나 현재 어느 쪽이 운영인지는 `package.json`의 `deploy` 스크립트(= wrangler) 기준으로 본다.

### 주요 폴더

| 폴더/파일 | 내용 | 구분 |
|---|---|---|
| `src/` | 앱 소스(JS·CSS), `src/vendor/three/` | 사용자 작성 원본 |
| `index.html` | 진입 HTML | 원본 |
| `tests/` (+ `tests/fixtures/`) | `node --test` 테스트 | 원본 |
| `scripts/` | 빌드·검사·미리보기·에셋 준비 스크립트 | 원본 |
| `tools/concept-clips/` | 개념 영상 렌더러(ffmpeg 사용) | 원본 |
| `assets/` | 앱이 쓰는 그림·영상·음악·폰트·3D 모델 | 원본(일부는 생성물이지만 다시 만들기 어려움) |
| `assets/models/source/` | 3D 모델 원본 | **원본, Git 제외 — SSD에만 있음** |
| `files/` | 기획 문서, 영상·음악 원본(`files/videos/source-20261018/`, `files/music-source-20261019/` 등은 Git 제외) | **원본, 일부 SSD에만 있음** |
| `image/`, `samplepages/` | 이미지 원본·샘플 페이지(Git 제외) | **원본, SSD에만 있음** |
| `_unused/` | 정리 보류 파일(`_unused/root-videos-20261026/`은 Git 제외) | 원본, 삭제 금지 |
| `docs/` | 기획·검수·보고 문서, `docs/reviews/` 캡처 | 원본 |
| `delivery/` | 납품 ZIP(Git 제외) | 산출물이지만 삭제 금지 |
| `output/` | QA 캡처·로그·임시 QA 스크립트(Git 제외) | 작업 기록, 삭제 금지 |
| `dist/` | `npm run build` 결과(Git 제외) | 자동 생성 |
| `graphify-out/` | graphify 지식 그래프(Git 제외) | 자동 생성 |
| `node_modules/`, `.npm-cache/`, `.tmp/`, `.wrangler/` | 의존성·캐시·wrangler 로그(Git 제외) | 자동 생성, OS별 |
| `.vercel/` | Vercel 프로젝트 연결 정보(Git 제외) | 로컬 설정, 삭제 금지 |
| `.claude/launch.json` | Claude 미리보기 서버 설정 | 원본 |
| `.claude/settings.local.json` | 개인 권한 설정(Git 제외) | 개인 설정 |

## B. 실행 환경

- **Node.js**: `package.json`에 `engines`가 없고 `.nvmrc`·`.node-version`·`.tool-versions`도 없다(버전 고정 미지정).
  - 앱 실행·테스트·빌드: `README.md`에 "Node.js 20 이상"이라고 적혀 있다.
  - 배포 도구 wrangler 4.151.1: `package-lock.json`상 Node `>=22.0.0`을 요구한다.
  - `npm test`는 `node --test tests/*.test.mjs`다. Windows에서 npm은 cmd로 스크립트를 실행해 `*`를 셸이 펼치지 않으므로 Node가 직접 glob을 해석해야 한다(Node 21 이상 기능). 따라서 Windows에서는 Node 22 이상을 쓰는 것이 안전하다. (Node 20에서는 확인하지 않음)
  - 확인한 버전: Windows(2026-10-30) Node v24.14.0, npm 11.9.0 / macOS arm64(2026-11-15) Node v24.22.2, npm 11.19.1.
  - 버전을 임의로 최신으로 고정하지 않는다. 고정이 필요하면 사용자에게 먼저 제안한다.
- **패키지 관리자**: npm. 기준 lockfile은 `package-lock.json`(lockfileVersion 3) 하나다. pnpm이 설치된 컴퓨터라도 pnpm·yarn·bun으로 바꾸지 않는다.
- **의존성**: devDependency는 `wrangler` 하나뿐이다. 앱 실행·테스트·빌드에는 외부 패키지가 필요 없다(`README.md`). 즉 `node_modules`는 배포(`wrangler deploy`)에만 필요하다.
- `scripts/prepare-model-assets.mjs`는 `package.json`에 없는 `node_modules/model-tools/`(gltf-transform, meshoptimizer)를 쓴다. 파일 주석대로 `npm install --prefix node_modules/model-tools --no-save`로 따로 설치하는 에셋 제작용 도구다.
- **Python**: 앱에는 쓰지 않는다. `scripts/prepare-models.py`, `scripts/prepare-dome-models.py`(Blender로 실행), `scripts/prepare-story-videos.py`(imageio_ffmpeg 필요)는 에셋 제작용이며 Python·Blender 버전은 미지정이다.
- **ffmpeg**: `tools/concept-clips/render.mjs`만 사용. 찾는 순서는 `$FFMPEG` → `<프로젝트>/.tools/ffmpeg/ffmpeg.exe` → `D:/tools/ffmpeg/ffmpeg.exe` → PATH의 `ffmpeg`.
- Flutter·TypeScript·번들러·린터는 이 프로젝트에 없다.

## C. 명령어

모두 `package.json`에 실제로 있는 스크립트다. 프로젝트 루트에서 실행한다.

| 목적 | 명령 | 비고 |
|---|---|---|
| 개발 서버 | `npm start` | `node server.mjs`, `http://127.0.0.1:4173/` (`index.html`, `sw.js`, `src/`, `assets/`만 제공. `sw.js`는 배포본에서만 등록) |
| 문법 검사 | `npm run check` | `src/`, `scripts/`의 `.js/.mjs`를 `node --check`로 검사. 타입 검사·린트 대용은 아님 |
| 테스트 | `npm test` | `node --test tests/*.test.mjs` |
| 빌드 | `npm run build` | `scripts/build.mjs`: 필요한 파일만 `dist/`로 복사, CSS 묶기, `dist/build-manifest.json` 작성. **git 명령을 호출한다**(아래 D-2 참고) |
| 빌드본 미리보기 | `npm run preview` | `node server.mjs dist`, 기본 포트 4173 |
| 배포 | `npm run deploy` | `npm run build && wrangler deploy`. 운영 주소와 Worker 이름을 먼저 확인 |

- 타입 검사(`typecheck`)·린트(`lint`) 스크립트는 없다. 없는 명령을 만들어 쓰지 않는다.
- 포트 바꾸기(같은 의미, 셸만 다름):
  - Windows PowerShell: `$env:PORT='4174'; npm run preview`
  - macOS zsh: `PORT=4174 npm run preview`
- 그 밖의 미리보기 스크립트: `node scripts/preview-tablet.mjs`(4187), `node scripts/preview-campaign.mjs`(4178), `node scripts/preview-models.mjs`(4180).
- `.claude/launch.json`의 `dist-preview` 항목은 `cmd /c "set PORT=4190&& node server.mjs dist"`로 **Windows 전용**이다. Mac에서는 `PORT=4190 node server.mjs dist`를 직접 쓰거나 다른 항목(`animal`, `tablet-review`, `campaign-qa`)을 쓴다. 이 파일을 OS에 맞춰 고치려면 사용자에게 먼저 묻는다.
- `npm ci`는 기존 `node_modules`를 통째로 지우고 다시 만든다. 사용자 확인 후 실행한다.

## D. Mac mini ↔ Windows를 오갈 때의 규칙

### D-1. 유지할 것과 재생성할 것

- **항상 유지(공유 대상)**: 소스(`src/`, `scripts/`, `tools/`, `tests/`, `index.html`, `sw.js`, `server.mjs`, `worker.js`), 설정(`package.json`, `wrangler.jsonc`, `vercel.json`, `.gitignore`, `.claude/launch.json`), lockfile(`package-lock.json`), 원본 에셋과 문서.
- **다른 OS 것을 재사용하지 않고 필요할 때 다시 만드는 폴더**:
  - `node_modules/` — wrangler가 쓰는 `@cloudflare/workerd-*`, `@esbuild/*`는 OS·CPU별 바이너리다. Windows에서 설치한 것을 Mac에서 쓰거나 그 반대로 쓰면 배포 명령이 실패할 수 있다. 앱 실행·테스트·빌드에는 필요 없으므로, 배포가 필요할 때만 그 OS에서 사용자 확인 후 `npm ci`로 다시 만든다.
  - `node_modules/model-tools/` — 위와 같은 이유로 OS별 재설치.
  - `dist/` — `npm run build`로 언제든 다시 만든다(빌드는 이전 매니페스트에 적힌 파일만 지운다).
  - `.npm-cache/`, `.tmp/`, `.wrangler/`, `graphify-out/` — 캐시·로그·자동 생성물.
- **절대 지우지 않는 폴더/파일**: `src/`, `tests/`, `scripts/`, `tools/`, `assets/`(특히 Git에 없는 `assets/models/source/`), `files/`(Git에 없는 영상·음악 원본 포함), `image/`, `samplepages/`, `_unused/`, `docs/`, `delivery/`, `output/`, `.vercel/`, `.claude/`, `package-lock.json`.
  - `.gitignore`에 들어 있는 원본(`assets/models/source/`, `files/videos/source-20261018/`, `files/videos/story-source-20261018/`, `files/music-source-20261019/`, `image/`, `samplepages/`, `_unused/root-videos-20261026/` 등)은 **GitHub에 없고 이 SSD에만 있다.** "Git에서 복구하면 된다"고 가정하지 않는다.
- 설치·빌드 오류가 나도 소스·lockfile·원본 에셋을 지우거나 lockfile을 재생성하지 않는다. 패키지 관리자를 바꾸지 않는다.

### D-2. exFAT 외장 SSD와 Git

- 이 드라이브는 exFAT이라 파일 소유자를 기록하지 않는다. Windows의 Git은 이 저장소를 `dubious ownership`으로 거부한다.
  - 전역 Git 설정(`git config --global --add safe.directory ...`)을 에이전트가 임의로 바꾸지 않는다. 명령마다 붙여 쓴다:
    `git -c "safe.directory=F:/iscreammedia_sc34/2 animal" status`
  - `npm run build`는 내부에서 `git rev-parse HEAD`, `git diff`를 실행하므로 같은 이유로 실패할 수 있다. 전역 설정 없이 그 명령에만 적용하려면 환경변수로 넘긴다(2026-10-30 Windows에서 `git rev-parse`로 동작 확인, 빌드 자체는 실행하지 않음):
    - PowerShell: `$env:GIT_CONFIG_COUNT='1'; $env:GIT_CONFIG_KEY_0='safe.directory'; $env:GIT_CONFIG_VALUE_0='F:/iscreammedia_sc34/2 animal'; npm run build`
    - macOS zsh(경로는 그 컴퓨터에서 확인한 실제 경로로): `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0="<실제 프로젝트 경로>" npm run build`
  - Windows의 드라이브 문자와 macOS의 마운트 경로는 바뀔 수 있다. 매번 실제 경로를 확인한다.
- 저장소 로컬 Git 설정(2026-10-30 확인): `core.ignorecase=true`, `core.filemode=false`, `core.symlinks=false`. Windows는 시스템 설정(`C:/Program Files/Git/etc/gitconfig`)에서 `core.autocrlf=true`다.
- exFAT·Windows에서 심볼릭 링크를 만들지 않는다.
- macOS는 exFAT에 `._파일명`, `.DS_Store` 같은 보조 파일을 만든다(예: `.tmp/._update-check`). 커밋하지 않는다. 현재 `.gitignore`에는 이 패턴이 없다 — 추가가 필요하면 사용자에게 제안만 한다.
  - Git이 `.git/objects/pack/._pack-….idx`를 읽어 `non-monotonic index`를 경고할 수 있다. 보조 파일인지 먼저 확인하고 실제 `pack-….idx`와 `pack-….pack`은 건드리지 않는다.

### D-3. 줄바꿈

- `.gitattributes`와 `.editorconfig`는 없다. Git 인덱스의 텍스트 파일은 모두 LF다(2026-10-30 `git ls-files --eol`: `i/lf` 207개, 바이너리 254개, `i/crlf` 0개).
- Windows 작업 폴더에는 `core.autocrlf=true` 때문에 CRLF 파일 55개, 혼합 5개가 있다(`src/` 17개, `docs/` 26개 등). 같은 SSD 파일을 Mac Git이 보면(autocrlf 미설정 시) 이 파일들이 "수정됨"으로 보일 수 있다(Mac에서는 미확인).
  - 내용 변경 없이 줄바꿈만 다른 파일을 커밋하지 않는다. 전체 파일 줄바꿈 변환을 하지 않는다.
  - 정책 제안(적용 안 함, 사용자 결정 필요): 루트에 `.gitattributes`로 `* text=auto eol=lf`를 두고 바이너리를 `binary`로 지정하는 방식. 적용하면 작업 폴더 파일이 다시 쓰일 수 있으므로 미커밋 변경이 없을 때 따로 진행한다.
- 파일을 고칠 때는 그 파일의 기존 줄바꿈을 유지한다.

### D-4. 한글 파일명(NFC/NFD)

- macOS는 한글 파일명을 NFD(자모 분리)로 만들 수 있고 Windows는 보통 NFC(완성형)를 쓴다.
- 현재 저장소에는 `docs/reviews/learner-clarity-20261021/`의 캡처가 **같은 이름의 NFC판 20개와 NFD판 20개로 이중 추적**되어 있다. 디스크에는 NFC판 20개만 있어서 Windows `git status`에 NFD판 20개가 "삭제됨"(` D`)으로 나온다(2026-10-30 확인).
  - 이 삭제 상태를 복원·커밋·`git rm`하지 않고 그대로 둔다. 정리가 필요하면 사용자에게 먼저 묻는다.
  - 새로 만드는 파일·폴더 이름은 가능하면 영문 소문자·숫자·하이픈을 쓴다. 한글이 필요하면 NFC로 만든다.

### D-5. 경로·대소문자·OS 전용 의존성

- 앱 코드(`src/`, `index.html`, `server.mjs`, `worker.js`)에 드라이브 문자·`/Volumes`·사용자 홈 절대경로는 없다(2026-10-30 grep 확인). 경로는 `import.meta.url`·`path` 기준 상대경로를 유지한다.
- 절대경로가 있는 곳: `tools/concept-clips/render.mjs`의 ffmpeg 후보 `D:/tools/ffmpeg/ffmpeg.exe`, `.tools/ffmpeg/ffmpeg.exe`(Windows 전용 후보, 없으면 PATH의 `ffmpeg` 사용). Mac에서는 `FFMPEG` 환경변수나 PATH를 쓴다. 이런 경로를 앱 코드에 새로 넣지 않는다.
- Windows 전용: `.claude/launch.json`의 `dist-preview`(cmd). `.ps1`·`.bat`·`.cmd`·`.sh` 스크립트는 없다.
- import·자산 경로 대소문자: `src/`, `scripts/`, `tests/`, `tools/`, `index.html` 등의 상대 import·`url()`·`href/src` 301건과 `assets/...` 문자열 경로 16건을 실제 파일명과 비교해 불일치 0건(2026-10-30). exFAT·Windows는 대소문자를 구분하지 않아 틀려도 로컬에서는 동작하지만 배포 서버에서는 깨질 수 있으니, 파일명과 import를 글자 그대로 맞춘다.
- 경로에 공백(`2 animal`)과 한글이 있다. 셸 명령에서는 항상 따옴표로 감싼다.

## E. 환경변수·저장 데이터

- `.env` 파일은 없다. 앱 실행에 API 키가 필요 없다.
- 코드가 읽는 환경변수(이름만):
  - `PORT` — `server.mjs`(기본 4173), `scripts/preview-tablet.mjs`(4187), `scripts/preview-models.mjs`(4180)
  - `FFMPEG` — `tools/concept-clips/render.mjs`의 ffmpeg 경로
  - `GIT_CONFIG_COUNT`, `GIT_CONFIG_KEY_0`, `GIT_CONFIG_VALUE_0` — 앱이 읽지는 않지만 exFAT에서 빌드할 때 Git에 넘기는 용도(D-2)
- 배포 인증: 저장소에 Cloudflare 인증 정보는 없다. `wrangler deploy`는 그 컴퓨터의 wrangler 로그인 상태에 의존한다(각 컴퓨터 상태는 미확인). 토큰·키를 출력하거나 파일로 저장하거나 커밋하지 않는다.
- `.vercel/project.json`에는 프로젝트 연결 정보가 있다. 내용을 출력하거나 커밋하지 않는다.
- 학생 기록은 서버가 아니라 **각 태블릿 브라우저의 LocalStorage**에 있다(키 `animal-record-recovery:v1`, 백업 `animal-record-recovery-backup`). 주소·포트·브라우저가 다르면 기록이 분리된다(`127.0.0.1:4173`과 다른 포트는 서로 다른 기록).
  - 실제 학생·운영 기록을 테스트용으로 초기화하거나, 완료 상태를 강제로 주입하지 않는다.
  - 교사용 "전체 단계 해금"은 학생 기록을 바꾸지 않는 것이 의도된 동작이다(`README.md`). 이 경계를 깨는 수정을 하지 않는다.
  - 저장 형식 변경 시 기존 기록 이관 규칙(`README.md` "저장과 이전 기록")을 지킨다.
- 기존 `.env`·사용자 데이터·`.claude/settings.local.json`을 덮어쓰지 않는다.

## F. 검증과 작업 종료

### 수정 후 검증

1. `npm run check` → `npm test` (앱 소스를 고친 경우).
2. 배포본이 바뀌는 수정이면 `npm run build` 후 `npm run preview`로 `dist/` 확인(D-2의 safe.directory 주의).
3. 화면 수정은 실제 브라우저로 확인한다. 기준 화면: 태블릿 16:9 가로, 1024×768, 1280×800 등(검수 기록은 `docs/reviews/`).
4. `README.md`의 검증 범위 기록 방식을 따른다. 실행하지 않은 검사는 "미검증"으로 적는다.

### 보고 원칙

- 현재 OS에서 통과한 결과를 다른 OS의 성공으로 확대하지 않는다. "Windows에서 `npm test` 통과, Mac 미검증"처럼 나눠 적는다.
- 태블릿 웹앱이므로 **브라우저 창 크기 조절·기기 에뮬레이션 검사**와 **실제 iPad Safari / Android Chrome 터치 검사**를 구분한다. 실기기를 쓰지 않았으면 터치·드래그·회전·화상 키보드는 미검증으로 보고한다.
- 교사용 미리보기(전체 해금)로 확인한 것과 학생 정규 경로 완주를 구분한다.
- 요청받은 앱 코드 변경은 검증을 통과한 뒤 해당 변경만 커밋하고 지정된 원격 브랜치에 푸시한다. 기존 운영 Worker에 배포하고, 운영 `build-manifest.json`이나 핵심 파일을 비교해 반영을 확인한다. 검토만, 로컬만, 푸시까지만 등 사용자가 범위를 정하면 그 범위를 따른다. 문서만 변경한 경우 운영 앱을 다시 배포할 필요는 없다.
- 상위 폴더 지침에 따라 코드 수정 뒤에는 `graphify update .`로 그래프를 갱신한다(graphify가 설치된 경우).

### SSD 분리 전 확인

- 실행 중인 개발·미리보기 서버(포트 4173, 4174, 4178, 4180, 4187, 4190), `wrangler`, 빌드, 파일 감시, AI 에이전트 세션이 이 폴더를 쓰고 있지 않은지 확인하고 종료한다.
  - Windows PowerShell: `Get-NetTCPConnection -State Listen -LocalPort 4173,4174,4178,4180,4187,4190 -ErrorAction SilentlyContinue`
  - macOS: `lsof -nP -iTCP -sTCP:LISTEN | grep -E ':(4173|4174|4178|4180|4187|4190)'`
- 편집기·터미널이 이 폴더를 열고 있지 않은지 확인한 뒤, Windows는 "하드웨어 안전하게 제거", Mac은 Finder 꺼내기로 분리한다.

### 다음 컴퓨터에서 이어갈 때 최소 작업

1. OS·셸·CPU 아키텍처·`node -v`·`npm -v`와 실제 프로젝트 경로를 확인한다(앱 실행 Node 20 이상, 배포·Windows 테스트는 22 이상 권장).
2. `git -c "safe.directory=<실제 경로>" status`로 미커밋 변경을 확인한다. 줄바꿈만 바뀐 파일·NFD 파일 삭제 표시(D-3, D-4)는 건드리지 않는다.
3. 앱 실행·테스트·빌드만 할 때는 설치 없이 `npm start` / `npm test` / `npm run build`(D-2 방식)를 쓴다.
4. 배포가 필요하고 `node_modules`가 다른 OS에서 설치된 것이면, 사용자에게 알리고 승인받은 뒤 그 OS에서 `npm ci`로 다시 설치한다.
5. 작업 종료 시 변경 파일, 실제 실행한 검사, 남은 문제, 다음 컴퓨터에서 할 일을 짧게 남긴다.

### 환경별로 다시 확인할 것

- 다른 컴퓨터로 옮길 때 실제 SSD 마운트 경로 및 Git의 줄바꿈·한글 경로 설정. 2026-11-15 macOS에서는 `core.autocrlf=input`, `core.precomposeunicode=true`였고, 미커밋 코드 변경은 없었다.
- Node 20에서 `npm test`가 Windows·Mac 각각 동작하는지.
- 각 컴퓨터의 wrangler 로그인 상태, Vercel 설정을 아직 쓰는지.
- Python·Blender·ffmpeg 에셋 도구의 필요 버전.
