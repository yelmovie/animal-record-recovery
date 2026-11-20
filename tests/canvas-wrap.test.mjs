import test from 'node:test';
import assert from 'node:assert/strict';
import {wrap} from '../src/studio-runtime.js';
// Every character is 10px wide, spaces included.
const ctx={measureText:s=>({width:s.length*10})};
test('poster text breaks between words and keeps line lengths even',()=>{
 const lines=wrap(ctx,'벽에 붙인 고정대의 자석이 문 아래 철판을 당겨서 문을 열린 채로 잡아 줘.',300);
 assert.equal(lines.join(' '),'벽에 붙인 고정대의 자석이 문 아래 철판을 당겨서 문을 열린 채로 잡아 줘.');
 for(const line of lines)assert.ok(line.length*10<=300,line);
 const widths=lines.map(l=>l.length);
 assert.ok(Math.min(...widths)/Math.max(...widths)>=0.6,JSON.stringify(lines));
});
test('a word longer than the line still fits, and line breaks and empty lines stay',()=>{
 assert.deepEqual(wrap(ctx,'가나다라마바사',30),['가나다','라마바','사']);
 assert.deepEqual(wrap(ctx,'첫 줄\n\n둘째 줄',300),['첫 줄','','둘째 줄']);
 assert.deepEqual(wrap(ctx,'짧은 글',300),['짧은 글']);
});
