import {artURL,icon,btn} from './presentation.js';

// Home and back sit on the left; the map has a quick sound switch beside settings.
// No counters, no extra menus, no top or bottom bar; the bag and other extras live inside the settings dialog.
export const hasSound=s=>s.soundEnabled||s.musicOn!==false;
export function header(s,v){if(['intro','outro'].includes(v.screen))return '';const hud=(glyph,action,label,extra='')=>btn(icon(glyph),action,'icon-btn hud-btn',`aria-label="${label}" title="${label}" ${extra}`);
 return `<header class="screen-hud">${v.screen==='home'?'':`<nav class="hud-left" aria-label="페이지 이동">${hud('home','home','홈으로 가기')}${hud('back','nav-back','이전 페이지로 가기',v.canGoBack?'':'disabled')}</nav>`}<nav class="hud-right" aria-label="소리와 설정">${s.adminUnlocked&&v.screen!=='map'?btn('미리보기 종료','preview-end','quiet preview-exit'):''}${v.screen==='map'?hud(hasSound(s)?'sound':'muted','map-sound',hasSound(s)?'소리 끄기':'소리 켜기',`aria-pressed="${hasSound(s)}"`):''}${hud('settings','settings','설정')}</nav></header>`;}
export function home(s){return `<main id="main" tabindex="-1" class="landing museum-landing">
  <img class="landing-world" src="${artURL('museum-opening-light')}" alt="숲속 자연 기록 전시관 앞에서 하루와 모리가 탐험을 기다리는 장면" fetchpriority="high">
  <div class="landing-shade" aria-hidden="true"></div>
  <section class="landing-copy" aria-labelledby="landing-title">
    <span class="landing-kicker">${icon('leaf')} 하루와 모리의 숲속 탐험</span>
    <h1 id="landing-title" class="landing-title"><span class="sr-only">동물기록 복구작전</span><img src="${artURL('title-logo-light')}" alt="" width="960" height="640" fetchpriority="high" draggable="false"></h1>
    <p class="landing-description">사라진 동물 기록을 찾아,<br><strong>우리 손으로 전시관을 다시 열어 줘!</strong></p>
    <div class="landing-actions">
      ${btn(`<span>${s.activities.length?'이어서 탐험하기':'탐험대 출발하기'}</span><span class="landing-start-arrow">${icon('arrow')}</span>`,'start','primary landing-start')}
      ${btn(`${icon('book')}<span>마을 이야기 보기</span>`,'story-intro','quiet landing-replay')}
    </div>
  </section>
</main>`;}
