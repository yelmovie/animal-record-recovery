# 주민·도구 이미지와 활동 화면 개선

- 생성: 내장 image_gen 도구, 실제 알파 투명 배경.
- 스타일 기준: assets/adventure/explorer.webp, assets/raccoon.webp, assets/adventure/field-kit.webp.
- 이전의 긴 체형 NPC 시안은 적용하지 않음. 하루와 모리의 둥근 비율, 부드러운 입체 표현, 크림·녹색·황동 색감에 맞춘 새 시트 사용.
- 주민 5명: assets/residents/{researcher,curator,ranger,detective,engineer}-v2.webp. 지도·부탁·편지·복구 답장·전시관에서 동일 이미지 참조.
- 도구 5개: assets/tools/{1,2,3,4,5}-v2.webp. 복구 화면·가방·도구 대화상자에서 사용.
- 복구 장면: assets/village/recovery-{1,2,3,4,5}-v2.webp. 실제 map-restored.webp의 해당 건물 및 주변 길을 추출. 원본 지도와 건물 좌표 유지.
- 원본 시트: output/residents-source-v2.png, output/tools-source-v2.png. 알파 연결 영역으로 분리 후 WebP 최적화. 기존 그림 자체를 다시 그리거나 색상을 바꾸지 않음.

## 동작

관찰핀 없이 부분 버튼과 설명으로 기록 가능. 탐구 완료 시 주민 편지가 나타나며, 닫아도 진행 기록 유지. 한 부탁 안에서 두 작업을 동시에 열고 답장 한 번에 함께 검증·복구. 저장 키와 기존 완료 전시 기록 유지. 움직임 기록은 예상 → 장면 선택 → 기록 순서와 필수 동물 체크 목록, 다음 관찰 버튼을 제공. 기존 동물별 정답 장면 판정은 유지.

## 주민 생성 프롬프트

Use case: stylized-concept. Asset type: transparent production CHARACTER LINEUP for the supplied Korean children's educational forest exploration game.
Reference image 1 explorer.webp is the exact style and proportions to match. Reference image 2 raccoon.webp is style only. Generate ONE wide 5-column lineup sheet: FIVE different friendly adult town guides, ONE FULL BODY front three-quarter pose per column, all same scale and feet baseline, ample transparent gutters, no overlapping silhouettes or objects. Characters occupy each column fully, no frame or text.
Match the existing boy's gently rounded 3D animated children's film illustration, large expressive brown eyes, large heads, SHORT COMPACT 4-head-tall bodies, soft matte skin, softly sculpted hair, simple rounded hands, detailed but warm clothing. They should feel like friends of the supplied explorer, not realistic human portraits, not long-legged adult fashion models. NO pixel art, NO hard black outlines, NO anime, NO 2D sprites.
Left to right:
1 Sora female nature observer, brown hair bun, sage green vest over cream shirt, brown boots, holding small brass magnifier and field notebook.
2 Jun male museum curator, wavy brown hair, round glasses, forest green cardigan and cream apron, holding animal classification cards with leaf/paw pictures (no lettering).
3 Haneul female ecology ranger, dark short hair, olive ranger hat and moss green jacket, tan shorts, small binoculars at neck, friendly raised hand.
4 Nara female record detective, auburn bob hair, mustard scarf and teal coat, holding a clipboard with a simple paw symbol and pencil.
5 Doyun male inventor, dark tousled hair, brass goggles on head, navy overalls over cream shirt, holding a small wooden wing model.
Unified cream, moss, teal and honey palette, same soft warm daylight from upper left as references. Each person standing on their own transparent background. Real alpha transparency across entire sheet, NO background, NO gradients, NO ground plane, NO shadows extending into other columns, no letters, no labels. Wide landscape 2560x1536 layout. Full boots and heads within frame.

## 도구 생성 프롬프트

Use case: stylized-concept. Transparent GAME ITEM ICON ATLAS for the same forest exploration game. Reference is the project's existing field kit; match its warm illustrated 3D brass, cream leather, wood, moss green aesthetic exactly. ONE wide horizontal sheet of FIVE separate reward props, each centered in its own equal-width column with generous transparent gutters, similar scale. Left to right: 1 brass handheld magnifying glass with wooden handle, 2 open round brass compass with forest green dial and leaf-shaped needle, 3 closed cream leather field notebook with embossed leaf, 4 handheld wood and brass animal feature scanner with a simple small illuminated paw screen and glass lens, 5 enamel brass inventor badge with green leaf and tiny gear. Charming softly rounded forms, polished children's adventure game rendering, not photoreal product photo, not flat vector, not pixel art. Full objects visible, no people, no case, no environment, no letters or words, no labels, no circles behind objects, real transparent alpha background. Wide landscape image, all five props separated and never touching.
