# 2026-11-12 지도 조작 개선·업체 피드백 인계

사용자가 퇴근으로 컴퓨터를 끄기 위해 작업 중단과 인계 문서 저장을 요청했다. 이 문서 저장 시점부터 새 코드 수정·검사·배포는 진행하지 않는다. 아래 내용은 담당 에이전트의 마지막 확인 결과를 모은 것이며, 미완료 항목은 완료로 간주하지 않는다.

## 지금 완료된 것

- 원래 요청한 1~16 프로젝트의 지도 방향키 터치·키보드 조작 개선은 전부 커밋·푸시·배포를 완료했다.
- 전체 최초 배포 근거: `output/map-controls-resume/final-release-report.md`, `output/map-controls-resume/projects.json`, 해당 폴더의 `release*.json`.
- 2번 동물 프로젝트에서 사용자가 사진으로 알려준 다리 앞 오른쪽 공방 이동 불가 문제도 추가 수정·배포했다.
  - 원인: 이동 그래프 남동쪽 길 누락과 노드 근처 방향 전환 보정.
  - 변경: `src/map-walk.js`, `src/village.js`, `assets/village/village.json`, 회귀 테스트 2개 및 검수 보고서.
  - 최신 main: `6f44658bbb6e4c8f89f606b5d7c781df8903b2f6` — 푸시 완료.
  - `npm run check`, 테스트 259개, 빌드 통과. Windows 로컬 브라우저에서 사용자 사진 위치 `[805,735]` → 오른쪽 공방 `[1335,704]`, 왼쪽 복귀, cancel 정지, 잠금 보존을 1280·1024 화면으로 확인했다.
  - `release.mjs` 2번 배포 결과: `dryRun: 0`, 종료 코드 0.
  - 운영 주소: https://animal-record-recovery.yelsam.workers.dev/
  - 마지막 운영 HTTP 해시 재검증은 도구 오류로 미완료다.
  - 캡처: `output/map-controls-group-c/2-bridge-before-1280.png`, `2-bridge-middle-1280.png`, `2-bridge-after-1280.png`.

## 이어서 맡았던 업체 피드백 검토

원본 시트: https://docs.google.com/spreadsheets/d/1Ok9VRUKXi6XNlHPXbELsMduD3ZHamQtDbsPbLDTk1Bs/edit?gid=987902134#gid=987902134

`제작현황` 탭의 `I8:I11` 내용을 1~16 전체 프로젝트에 공통 적용해 확인하고, 확정된 누락만 수정하는 작업이다. 원본 시트는 수정하지 않았다. 전체 검토표(matrix)는 아직 미완성이다.

| 구분 | 확인할 내용 |
|---|---|
| C1 | NanumSquareNeo 실제 폰트 적용. GGText·Jua·Pretendard 같은 별칭만 보지 말고 실제 폰트 파일까지 추적. Canvas·내보내기 포함. |
| C2 | 아래 맞춤법·띄어쓰기 수정 목록 확인. |
| C3 | `ncic.go.kr`을 `ncic.re.kr`로 수정. |
| C4 | 장소별 실제 활동 개수와 지도 진도 표시 일치. 2번은 `8/2/4/6/4`. |
| C5 | 버튼·손 모드 설명 동기화, 패널 가림 여부, 완료 카드 버튼 삭제 요구 확인. |
| C6 | 미션 2·4·5 뒤의 조사 `을` → `를`. |

C2 목록: `다시하기` → `다시 하기`, `이어하기` → `이어 하기`, `연구노트` → `연구 노트`, `걸어다녔어` → `걸어 다녔어`, `이어가자` → `이어 가자`, `살아 남은` → `살아남은`, `한해를` → `한 해를`, `새 싹` → `새싹`, `시계 바늘` → `시곗바늘`, `이어갈` → `이어 갈`, `수평잡기` → `수평 잡기`, `힘을 덜 드는` → `힘이 덜 드는`, `길고 완만하게에서` → `길고 완만한 빗면에서`, `먼저 먼저` 중복 제거, `생명관찰노트` → `생명 관찰 노트`.

특수 확인: 1번 균형 다리에서 처음 물체를 놓은 뒤 오른쪽 접시 동작을 1920px에서 확인. 3번 리피 편지 폰트와 분류 모드 확인.

주의: 시트 번호 5~12는 폴더 번호와 다르다. 반드시 단원명을 맞춰 확인한다.

| 시트 번호 | 폴더 번호 |
|---|---|
| 5 | 9 |
| 6 | 10 |
| 7 | 11 |
| 8 | 12 |
| 9 | 5 |
| 10 | 6 |
| 11 | 7 |
| 12 | 8 |

## 미커밋 상태로 남은 수정 — 담당 A

| 프로젝트 | 변경·검사 상태 |
|---|---|
| 1 | `src/info.ts`, `src/main.ts`, `src/screens/village.ts` 문구·잠금 조사 수정. 지도 이미지 동시 요청 4개 제한, 개별 1회 재시도, JSON 25초 제한·재시도 수정. check 종료 코드 2, 실패 원인 아직 확인하지 못함. 새 로더는 미검증·미배포. |
| 3 | `src/map-villains.js`, `src/research-notebook.js`, `src/learning.js`, `src/app.js`, `src/polish.css`, `src/style.css`, `src/settings-content.js`와 `assets/fonts` 수정. 공식 NanumSquareNeo woff2 3개 및 OFL 추가. 기존 GG 별칭은 실제로 Jua·Pretendard·Gaegu 파일을 가리키고 있었음. check 종료 코드 1, 실패 원인 아직 확인하지 못함. |
| 5 | `src/coach.ts`, `src/inquiry.ts`, `src/quest-ui.ts` 문구 수정. check 종료 코드 0. |
| 11 | `src/app.js` 문구 수정. check 종료 코드 0. |

공통 로그·기록은 2번 프로젝트의 `output/vendor-feedback-audit/` 아래에 있다: `{1,3,5,11}-checks.log`, `changed-a.json`, `patch-a.mjs`, `scan-a.mjs`, `source-scan-a.json`. 마지막 파일은 수정 전 스캔이다.

- 1번 기존 운영 페이지 cold load에서 이미지 56개 동시 요청과 25초 제한 때문에 실패하는 현상을 재현했다. 새 로더 수정은 아직 검증·배포하지 않았다.
- 3번 Windows 빌드는 `ESBUILD_MODULE_PATH`에 1번 프로젝트(`1 udangtangtang`)의 `node_modules/esbuild`를 지정해야 했다. Mac에서는 설치 상태와 실제 경로를 다시 확인해야 한다.
- 5번 검사는 `.bin` 실행 대신 기존 tsc·vitest·vite의 JavaScript 진입 파일을 직접 실행했다.
- 1·3·4·5·11의 C4·C5 및 특수 UI 실제 동작 검토가 남았다.
- 14·15·16은 감사를 시작하지 않았다.

수정 전 확인된 브랜치·HEAD(현재 상태는 다음 컴퓨터에서 다시 읽을 것):

| 프로젝트 | 브랜치 | HEAD |
|---|---|---|
| 1 | main | `32cf97c29f0a41bfcc7a4db3cdd5daa1634157f5` |
| 3 | sort-board-drag | `cda96a8e4968f418d4c5199a883a10877236dd4f` |
| 4 | main | `62f7e1244e34e7a9dd6c008f5501f10dfc3e3dc6` |
| 5 | codex/magnet-quest-upgrade-20261021 | `a90c97eb1b3e0216aa22ae87f62757030190a3ab` |
| 11 | map-upgrade | `899b5309df95a078ce0a1bb8fe8bbca4c852718f` |

## 업체 피드백 수정·배포 완료 — 담당 B

6·8·9·12·13번은 확정된 최소 문구·초기 로딩 폰트 수정, 필수 검사, 커밋·푸시·배포를 완료했다. 마지막 배포 세션은 종료 코드 0이고 브라우저는 finally에서 종료됐다. 새 운영 페이지 재검증 및 전체 공통 검토표 완성은 아직 하지 않았다.

| 프로젝트 | 마지막 보고된 커밋 짧은 해시 |
|---|---|
| 6 | `a4a3b874` |
| 8 | `53c079bc` |
| 9 | `89ca9b76` |
| 12 | `735b8214` |
| 13 | `e85ddee8` |

위 해시는 담당자가 보고한 짧은 해시다. 전체 해시는 추측하지 말고 각 저장소의 Git 또는 배포 보고서에서 읽는다. 7·10번은 추가로 확정된 수정이 없었다.

## 집 Mac에서 이어갈 순서

1. OS·셸·CPU 아키텍처·Node/npm·실제 SSD 루트를 확인하고 각 저장소 Git 상태를 읽는다. 각 프로젝트 AGENTS.md를 따른다.
2. 이 문서와 `output/map-controls-resume/final-release-report.md`, `output/vendor-feedback-audit/changed-a.json`, 1·3번 검사 로그를 먼저 읽는다.
3. 1·3번 검사 실패 원인을 확인하고 고친 뒤, 미커밋 1·3·5·11 변경을 검증한다. 사용자가 작업 당시 전체 커밋·푸시·배포를 허용했지만 종료 요청 후에는 진행을 멈췄다. 다시 이어서 하라는 요청을 받은 뒤 해당 범위만 완료한다.
4. 모든 16개 프로젝트의 C1~C6 검토표를 완성하고, 1·3·4·5·11의 활동 개수·지도 진도·모드 설명·가림·특수 UI를 실제 브라우저에서 확인한다.
5. 미착수 14·15·16번을 검토한다.
6. 이번에 배포가 바뀐 6·8·9·12·13번 운영 페이지를 재확인하고 2번 추가 수정의 운영 HTTP 해시 최종 확인을 마친다.

## 환경·보존 주의

- 인계 파일 저장 시 확인: Windows 10.0.26200, PowerShell 7.6.9, 프로세스 X64, Node v24.14.0, npm 11.9.0. 실제 루트는 `D:\iscreammedia_sc34\2 animal`이었다.
- Windows의 `node_modules`, workerd, esbuild를 Mac에서 그대로 재사용하지 않는다. lockfile과 기존 소스·에셋·미커밋 변경은 보존한다. 필요한 재설치는 각 프로젝트 규칙과 기존 승인을 먼저 확인한다.
- 기존 QA `release.mjs`·`projects.json`에는 Windows의 D: 절대경로가 있다. Mac에서 실제 경로를 확인해 작업용 스크립트를 조정한다. 앱 소스에 시스템 절대경로를 넣지 않는다.
- 2번 저장소에는 기존 NFD 파일 삭제 표시 20개, 사용자 문서, `._*` 파일이 있다. 복구·삭제·정리·전체 add를 하지 않는다. 인계 시 Git은 `.git/objects/pack/._pack-*.idx`에 non-monotonic index 경고를 냈지만 status 종료 코드는 0이었다. 이 경고를 해결하려고 Git 내부 파일을 임의 삭제하지 않는다.
- Mac과 실제 iPad Safari·Android Chrome 터치/드래그/회전/키보드는 이번 작업에서 미검증이다. Windows의 브라우저 화면 크기 검사를 실기기 검사로 간주하지 않는다.
- graphify는 Windows에 설치되어 있지 않아 갱신하지 못했다.
- 도구 오류 때문에 전체 실행 프로세스 최종 조회는 완료하지 못했다. 담당 A의 알려진 세션은 종료됐고 담당 B의 마지막 배포 세션 종료 코드 0 및 브라우저 종료를 확인했다. 담당 C 작업 프로세스 회수도 종료 코드 0이었다. 이것만으로 다른 모든 서버가 종료됐다고 단정하지 않는다.
- SSD 분리 전 본 작업에서 띄운 서버만 종료하고 사용자의 기존 프로세스는 건드리지 않는다. 편집기·터미널 사용을 마친 뒤 Windows 안전 제거 또는 Mac Finder 꺼내기로 분리한다.

## 인계 저장 범위

이 문서 작성 시점에는 새 앱 코드 수정·테스트·빌드·배포를 하지 않았다. 문서 저장과 읽기 확인을 우선했다. 문서의 Git 커밋·푸시 여부는 저장 직후 사용자에게 전달한 실제 결과를 기준으로 한다.
