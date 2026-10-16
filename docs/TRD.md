# TRD — 동물기록 복구작전 MVP

## 구성

외부 런타임 패키지 없는 JavaScript ES Module 앱. 2D 화면은 HTML/CSS/SVG, 허브만 Canvas 2D로 구성한다. 기존 프로젝트가 비어 있었고, 현재 범위에 실시간 3D나 물리 엔진이 필요하지 않아 Phaser·Three.js를 도입하지 않았다.

`server.mjs`는 Node 내장 HTTP 서버다. 127.0.0.1:4173에 바인딩하고 index.html, src/, assets/만 제공한다. 사용자 원본 자료와 ZIP, 문서는 웹으로 노출하지 않는다. 프로덕션 호스팅 서버가 아니다.

## 모듈 책임

| 파일 | 책임 |
|---|---|
| src/model.js | 스테이지·동물·단서·발명 데이터, 순수 정답 판정, 저장 정규화 |
| src/app.js | 10개 학습 단계, 이벤트 위임, DOM 렌더, 도감·스케치·텍스트 내보내기 |
| src/hub.js | 640×380 픽셀 지도, 건물·수목·길·강, 캐릭터 이동과 캔버스 해제 |
| src/style.css | 색·타이포·컴포넌트·뷰포트별 레이아웃 |
| tests/model.test.mjs | 학습 조건, 잠금, 저장, 시험의 회귀 검사 |

## 상태와 저장

LocalStorage 키: `animal-record-recovery:v1`.

주요 필드: version, completed, adminUnlocked, soundEnabled, observed, evidence, compare, classification, criterion, found, chain, clues, suspect, grounds, design, sketches, trials, step, lastStage.

- `completed`: 실제로 완료한 1~5 스테이지 번호. 중복 방지. 관리자 해금으로 순서 없이 완료한 기록도 보존.
- `step`: 장별 0/1 단계. 화면 이동 후에도 유지.
- `design`: problem, feature, structure, name(24자).
- `sketches`: 문제별 선 목록. 한 문제당 최대 30선, 선당 250개 좌표.
- `trials`: 최대 최근 30회. 시험 시점의 문제/특징/구조와 통과 여부.

저장 시점을 사용자 조작 직후로 둔다. 스케치는 포인터를 뗄 때 저장한다. 깨진 JSON·버전 불일치·예상하지 못한 값은 기본 상태나 허용된 값으로 정규화한다. 저장소 사용 불가 시 메모리에서 플레이를 유지하고 상단에 저장 불가 상태를 표시한다.

## 판정과 전환

`completeStage`는 해금 여부와 `stageReady`를 모두 확인한다. 화면의 버튼 상태만 믿지 않는다. 오답 피드백은 결과를 지우지 않는다. 설계 통과는 현재 problem/feature/structure와 일치하는 성공 시험이 있을 때만 인정한다.

4장에는 이름만 맞혀도 통과할 수 없게 두 개의 열람한 근거를 요구한다. 장소·물갈퀴·이동 정보만 조사한 경우 특징을 구별하기 부족하므로 재조사를 제공한다.

## 렌더링·입력

- 제공 PNG는 CSS sprite 배경으로 사용한다. 원본 편집 없이 격자 위치를 지정한다.
- 허브는 저해상도 캔버스를 `image-rendering: pixelated`로 확대한다. 이동은 장면 내 위치 보간이며 충돌·길찾기를 포함하지 않는다.
- 허브 화면을 떠날 때 requestAnimationFrame을 해제한다.
- 지도 마커와 미션 조작은 DOM 버튼. 클릭·키보드·터치를 지원한다.
- 펜 입력은 SVG 좌표로 변환하는 Pointer Events, pointer capture, pointercancel 처리로 구성한다.
- 동적 입력 이름은 HTML escape 또는 textContent로 출력한다.
- 색상 이외에 텍스트와 체크 아이콘을 함께 사용한다. 대화상자는 native dialog다.

## 테스트와 배포

`npm run check`: 각 JS 모듈 문법 검사. `npm test`: Node 내장 테스트 실행.

빌드 변환이 필요 없는 정적 앱이다. 공개 호스팅 시 index.html, src/, 실제 사용 assets/만 배포하면 된다. 별도 호스팅은 이번 요청에 포함하지 않았다. 서버 로그·API·분석 스크립트·학생 데이터 전송이 없다.

실제 iPad Safari, Android 태블릿, 장시간 수업 사용, 화면낭독기 전체 흐름은 아직 미검증이다. 제품 그림은 조건 검사 모형이며 스케치의 물리 성능은 평가하지 않는다.

## 공통 상단 컨트롤

모든 화면 상단에 홈/이전 페이지와 소리/설정을 고정 표시한다. `src/navigation.js`는 화면·장·단계 이동만 기록하고, 답 선택이나 설정 변경은 페이지 이력에 넣지 않는다. 이전 페이지가 없으면 버튼은 비활성화한다.

설정은 탭이나 하위 메뉴 없이 소리와 관리자 전체 해금 스위치를 함께 보여 준다. `adminUnlocked`는 입장 제한만 해제하며 완료 기록을 만들지 않는다. 끄면 일반 진행 조건으로 돌아간다. `soundEnabled`는 `src/audio.js`의 버튼·복구 Web Audio 효과음을 제어한다. 두 값은 자동 저장되며 이전 버전 저장은 해금 끔/소리 켬으로 복원된다. 관리자 표시는 로컬 미리보기 편의 기능으로, 서버 권한이나 인증 기능이 아니다.
