# 삭제 후보 목록

> 작성: 2026-10-20 · 최종점검 15c(승인된 정리). **실제 삭제는 하지 않았다.** 옮긴 파일은 이 폴더에 그대로 있고, 지울지는 사용자가 정한다.
> 기준: `index.html`이 불러오지 않고, `scripts/build.mjs` 배포 목록에도 없고, `src/`·`tests/`·`scripts/` 어디에서도 import·읽기를 하지 않는 파일만 옮긴다.

| 경로 | 크기 | 안 쓰는 근거 | 처리 |
|---|---|---|---|
| `src/style.css` → `_unused/src/style.css` | 51,964 B | 0.4 첫 버전 화면(연구소 메인·관찰 탭 등) 스타일. `index.html`의 `<link>`에 없고 `build.mjs` 목록에도 없음. `src`·`tests`·`scripts`에서 이름으로 참조하는 곳 없음(2026-10-20 grep) | **옮김** |
| `src/polish.css` → `_unused/src/polish.css` | 36,721 B | 0.4 첫 버전 다듬기 층. 위와 같은 근거. 안에서 `assets/lab.webp`(2026-10-18 정리로 이미 없음)를 참조 | **옮김** |
| `src/app.js` | 47,358 B | 0.4 첫 버전 진입점. `index.html`은 `src/adventure-app.js`만 불러오고 `build.mjs`에도 없음. 그러나 `tests/app.test.mjs`가 이 파일을 직접 읽어 실행함 | **안 옮김** — 테스트가 읽음. 테스트를 정리할 때 함께 결정 |
| `src/hub.js` | 5,150 B | `src/app.js`만 import함. 배포·`index.html`에 없음 | **안 옮김** — 남겨 둔 `app.js`가 import하므로 같이 움직여야 함 |
| `_unused/sfx/drop.mp3` | 58,514 B | 2026-10-20 카드 놓기 소리가 틀린 소리처럼 들려 합성음으로 교체(커밋 `77dde1d`). 배포 목록에서 빠짐 | 이미 옮겨져 있음 |
| `_unused/music/workshop-theme.mp3` | 3,185,049 B | 2026-10-19 배경음을 Curious Little Step 하나로 통일하면서 뺀 활동 배경음(커밋 `bdcdb2d`) | 이미 옮겨져 있음 |

## 되돌리는 법

옮긴 CSS는 `_unused/src/`에서 `src/`로 다시 옮기면 된다. 어느 화면도 이 두 파일을 불러오지 않으므로 옮긴 뒤 화면 변화는 없다.
