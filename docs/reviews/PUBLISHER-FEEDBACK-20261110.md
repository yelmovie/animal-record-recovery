# Publisher feedback and crab display correction, 2026-11-10

Source: official spreadsheet, 제작 현황!I9.

- Map, quest panel, and reward stars now follow STAGES.tasks (8, 2, 4, 6, 4). Later activities earn their own visible stars without changing saved progress or pass rules.
- Corrected ncic.go.kr to ncic.re.kr.
- Corrected 처음부터 다시 하기, 걸어 다녔어, 이어 가자.
- Same spacing rule applied to the intro video status text (이어갈 → 이어 갈, 2 places in story-player.js).
- Additional user request: changed only the crab runtime shader to mute the copper/red surface into an earthy olive-brown palette. Both scan and dome loaders use the correction. Original GLB geometry, maps, animation and files are untouched. No new 3D generation or paid service was used.

The source manifest calls the AI model Copper Crab but does not identify a biological species. Do not label it as a specific species. Live crabs can be red, brown, green or other colours; red alone does not prove a cooked crab. This is an illustrative visual correction to reduce the cooked appearance, not species identification. NOAA reference: https://www.fisheries.noaa.gov/alaska/habitat-conservation/look-out-invasive-crab and https://www.fisheries.noaa.gov/s3/2023-09/2023-Crab-Guide.pdf.

The existing 2D crab thumbnail and motion movie have not been regenerated or recoloured in this change. Real tablet hardware and complete student playthrough are not covered by this focused review.

Validation: npm run check; npm test; npm run build; git diff --check. Browser review: desktop map and 1024 x 768 viewport showed 8 and 6 stars in the formerly incorrect places. Original and corrected crab rendered in the scanner; body-part interaction and WebGL error logs checked. Final test totals and deployment are reported with the commit.
