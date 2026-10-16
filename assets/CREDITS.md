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
