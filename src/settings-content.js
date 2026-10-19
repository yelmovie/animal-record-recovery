// Settings wording in one place (iscream-settings common layout). Screen code only renders it.
// APP_VERSION must match package.json "version" — tests/settings.test.mjs checks it.
export const APP_NAME='동물기록 복구작전';
export const APP_VERSION='0.5.0';
// Teacher demo code: checked on this screen only, never stored. Not a security password.
export const TEACHER_CODE='yelsam';

export const SETTINGS_TEXT={
  replayIntro:'이 탐험을 하는 이유 다시 보기',
  replayOutro:'엔딩 다시 보기',
  certificate:'나의 탐험 기록 보기',
  lockedAfterFinish:'다섯 장소를 모두 되찾으면 볼 수 있어요.',
  about:[
    ['탐험 목적','사라진 동물 기록을 되찾으며 관찰하고, 분류하고, 근거를 찾고, 발명하는 힘을 연습해요.'],
    ['미션 보상','탐험 별 18개와 탐사 도구 5개를 모아 나의 전시관을 다시 열어요.'],
    ['남는 배움','처음 예상·관찰한 근거·바꾼 생각·새 발명에 쓴 방법이 연구 기록과 전시관 작품으로 남아요.'],
  ],
  credit:'기획·제작: 옐샘 & 아이스크림미디어',
  student:[
    '지도에서 장소를 누르면 하루와 모리가 그곳으로 걸어가요. 장소에 들어가 탐색 활동을 하고 주민의 부탁을 해결해요.',
    '표본을 돌려 보고, 카드를 끌거나 눌러서 옮기고, 영상을 멈춰 보며 내 생각의 근거를 골라 기록해요.',
    '마친 활동은 별로 표시되고 이 기기에 자동 저장돼요.',
    '그림과 영상은 학습용으로 만든 장면이에요. 실제 동물 사진이나 영상과 함께 비교해 보면 더 정확해요.',
  ],
  teacher:[
    '전자칠판에서는 한 단계씩 함께 읽고 학생의 선택 근거를 먼저 물어봐 주세요.',
    '서로 다른 답은 오답으로 끝내지 말고 관찰 사진·영상 근거를 비교하는 토론으로 연결해 주세요.',
    '탐험 기록과 작품은 서버로 전송하지 않고 현재 브라우저에만 저장돼요.',
  ],
  standardsNote:'2022 개정 과학과 교육과정과 연계한 탐구 보조 활동이에요. 이 게임만으로 성취기준 전체를 달성했다고 판단하지 않으며, 수업·토론·후속 평가와 함께 활용해 주세요. 특히 친구와 설계를 소개하고 의견을 주고받는 협력적 소통은 교실 활동과 교사 관찰로 확인해 주세요.',
  standards:[
    ['4과02-01','여러 가지 동물을 관찰하여 특징에 따라 동물을 분류할 수 있다.'],
    ['4과02-02','다양한 환경에 서식하는 동물을 조사하여 동물의 생김새와 생활 방식이 환경과 관련되어 있음을 설명할 수 있다.'],
    ['4과02-03','동물의 특징을 이용하여 일상생활에서 활용할 수 있는 생활용품을 설계하여 협력적으로 소통할 수 있다.'],
  ],
  teacherTools:'학생의 진행 상태를 바꾸는 수업 시연 기능이에요. 교사용 확인 코드를 입력해 주세요.',
  teacherToolsNote:'확인 코드는 저장되지 않으며 현재 화면에서만 검사해요. 계정이나 개인정보를 보호하는 보안 비밀번호는 아니에요.',
  teacherUnlock:'모든 장소 열기',
  teacherUnlockNote:'수업 시연용이에요. 장소 입장만 열고 탐험 별과 보상은 주지 않아요.',
  notices:[
    '캐릭터·배경·장식 그림은 프로젝트 자체 AI 생성 이미지예요.',
    '동물 그림·3D 모형·움직임 영상은 실제 촬영이 아닌 학습용 재현 자료예요. 생김새의 세부와 움직임 속도는 사실 근거로 쓰지 말고 실제 자료와 함께 비교해 주세요.',
    '발명 시험은 특징을 설명하는 단순한 모형이며, 물리 성능이나 실제 안전성을 측정하지 않아요.',
    '배경 음악 2곡은 프로젝트 자체 AI 생성 음원이에요.',
    '효과음은 Pixabay Content License에 따라 사용·가공했어요.',
    '출처와 라이선스 상세 내용은 프로젝트의 assets/CREDITS.md에서 확인할 수 있어요.',
  ],
  sourcesNote:'미션 화면에는 출처를 표시하지 않고 이곳에 모아 두었어요.',
  sources:[
    ['그림·영상·3D 모형',[
      '캐릭터·마을·장면 그림 · ChatGPT 이미지 생성, Higgsfield(GPT Image 2.5) · 프로젝트 자체 생성',
      '동물 3D 모형 · Meshy · 프로젝트 자체 생성',
      '동물 움직임·인트로·아웃트로 영상 · Higgsfield(Kling 3.0) · 프로젝트 자체 생성',
    ]],
    ['배경 음악',[
      'Curious Little Step · Suno · 프로젝트 자체 생성',
      'Laid-Back Groove(아웃트로) · Suno · 프로젝트 자체 생성',
    ]],
    ['효과음 (Pixabay)',[
      '버튼 · Universfield · Pixabay Content License',
      '활동 완료 · cartoon_music · Pixabay Content License',
      '다시 살펴보기 · cartoon_music · Pixabay Content License',
      '별 도착 · Liecio · Pixabay Content License',
      '복구 도장 · freesound_community · Pixabay Content License',
      '장소 복구 팡파르 · Universfield · Pixabay Content License',
      '주민 말 걸기 · driken5482 · Pixabay Content License',
      '발걸음 · joentnt · Pixabay Content License',
      '문 열기 · soundreality · Pixabay Content License',
      '책장 넘김 · creatorshome · Pixabay Content License',
      '카드 내려놓기 · soundshelfstudio · Pixabay Content License',
    ]],
    ['글꼴·프로그램',[
      'Jua · Woowahan Brothers Corp. · SIL Open Font License 1.1',
      'Pretendard · Kil Hyung-jin · SIL Open Font License 1.1',
      'three.js · three.js authors · MIT License',
    ]],
  ],
  copyright:'ⓒ 옐샘 & i-Scream Media Corporation. All rights reserved.',
  ownWorks:'앱 화면 캡처·자체 제작 일러스트·자체 제작 음원은 무단 복제·재배포·전용·상업적 이용을 금지해요.',
  externalWorks:'외부 공개 효과음·폰트·프로그램의 저작권은 각 원저작자에게 있으며, 각 자료의 공개 라이선스와 이용 조건을 따라요.',
  contentSource:'교육 내용 구성 참고: 교육부(moe.go.kr), 국가교육과정정보센터(ncic.go.kr).',
  reset:'탐험 기록 초기화',
};
