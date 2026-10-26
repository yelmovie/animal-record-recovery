import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {settingsContent} from '../src/shell-views.js';
import {freshExpedition,restoreExpedition} from '../src/expedition.js';
import {APP_VERSION,SETTINGS_TEXT} from '../src/settings-content.js';

const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const html=(s=freshExpedition(),o)=>settingsContent(s,o);

test('settings version comes from package.json',()=>assert.equal(APP_VERSION,pkg.version));
test('a persisted teacher unlock is discarded on reload while learning records survive',()=>{
 const s=freshExpedition();s.adminUnlocked=true;s.observed=['frog-eye'];s.activities=['1-0'];
 const restored=restoreExpedition(JSON.stringify(s));assert.equal(restored.adminUnlocked,false);assert.deepEqual(restored.observed,s.observed);assert.deepEqual(restored.activities,s.activities);
});

test('settings follow the shared order: sound, why-replay, info, student, teacher, notices, footer',()=>{
  const h=html(),at=t=>{const i=h.indexOf(t);assert.ok(i>=0,t);return i;};
  const order=['배경 음악','효과음','배경 음악 크기',SETTINGS_TEXT.replayIntro,'앱 정보 · 배움과 보상','학생용 가이드','교사용 가이드','이미지·소리·저작권 고지','settings-footer'].map(at);
  assert.deepEqual(order,[...order].sort((a,b)=>a-b));
  assert.match(h,/data-action="reset-confirm"[\s\S]*data-action="close-dialog"/);
});

test('ending and record stay locked until all five places are back; music off locks the slider',()=>{
  const s=freshExpedition();s.musicOn=false;const h=html(s);
  assert.match(h,/data-action="story-outro"[^>]*aria-disabled="true"/);assert.match(h,/data-action="ending"[^>]*aria-disabled="true"/);
  assert.match(h,/id="music-volume"[^>]*disabled/);
});

test('teacher preview needs no code and offers a clear exit; no links, mail addresses or grade labels',()=>{
  assert.match(html(),/data-action="admin"/);assert.doesNotMatch(html(),/teacher-code|teacher-open|확인 코드|type="password"/);
  const s=freshExpedition();s.adminUnlocked=true;assert.match(html(s),/전체 단계 해금 종료/);
  assert.doesNotMatch(html(s),/data-action="ending"[^>]*aria-disabled/);
  const h=html();assert.doesNotMatch(h,/<a\s|https?:|mailto:|@[a-z0-9-]+\.[a-z]{2,}|학년|차시|40분/);
});

test('copyright keeps three separate paragraphs and names AI-made images and music',()=>{
  const h=html(),own=h.indexOf(SETTINGS_TEXT.ownWorks),ext=h.indexOf(SETTINGS_TEXT.externalWorks),c=h.indexOf(SETTINGS_TEXT.copyright);
  assert.ok(c>=0&&c<own&&own<ext);assert.match(h,/AI 생성 이미지/);assert.match(h,/AI 생성 음원/);
});


test('effect volume restores zero, defaults older saves, rejects invalid values, and locks when muted',()=>{
 const s=freshExpedition();s.soundVolume=0;s.soundEnabled=false;
 assert.equal(restoreExpedition(JSON.stringify(s)).soundVolume,0);
 assert.match(html(s),/id="sound-volume"[^>]*value="0"[^>]*disabled/);
 const {soundVolume,...old}=s;
 assert.equal(restoreExpedition(JSON.stringify(old)).soundVolume,.8);
 for(const v of [-1,2,'0.5',null])assert.equal(restoreExpedition(JSON.stringify({...old,soundVolume:v})).soundVolume,.8);
 // Backup and storage guidance were removed from settings at the teacher's request (2026-10-26).
 assert.doesNotMatch(html(),/기록 저장 · 공용 기기 안내|기록 백업/);
});
