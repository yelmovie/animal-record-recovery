import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStudio,normalizeStudio,studioDrawingReady} from '../src/studio.js';
import {brushStyle,strokeMarkup,drawStudioStroke,hsvToHex,hexToHsv} from '../src/studio-brush.js';

test('old drawings retain their pen appearance and new tools persist arbitrary colors and fine widths',()=>{
 const source={strokes:[{color:'#a1b2c3',width:7.5,points:[{x:2,y:3}]}]};
 const old=normalizeStudio(source);
 assert.equal(old.strokes[0].tool,'pen');assert.deepEqual(old.tools,createStudio().tools);
 const saved=normalizeStudio({...source,tools:{color:'#3A9FCE',width:36.5,tool:'marker'}});
 assert.deepEqual(saved.tools,{color:'#3a9fce',width:36.5,tool:'marker'});
 assert.deepEqual(normalizeStudio(JSON.parse(JSON.stringify(saved))),saved);
 assert.equal(normalizeStudio({tools:{width:900}}).tools.width,60);
 assert.equal(normalizeStudio({tools:{width:-1}}).tools.width,1);
 assert.equal(normalizeStudio({tools:{width:NaN,tool:'script',color:'red'}}).tools.width,10);
 const erased=normalizeStudio({title:'지우개만',strokes:[{tool:'eraser',color:'#e82231',width:22,points:[{x:10,y:10}]}]});
 assert.equal(erased.strokes[0].color,'#ffffff');assert.equal(studioDrawingReady(erased),false);
});

test('color wheel covers all hue sectors, shades and exact RGB round trips',()=>{
 for(const [h,hex] of [[0,'#ff0000'],[60,'#ffff00'],[120,'#00ff00'],[180,'#00ffff'],[240,'#0000ff'],[300,'#ff00ff'],[360,'#ff0000'],[-60,'#ff00ff']])assert.equal(hsvToHex(h,100,100),hex);
 assert.equal(hsvToHex(212,0,100),'#ffffff');assert.equal(hsvToHex(212,100,0),'#000000');assert.equal(hsvToHex(0,100,50),'#800000');
 for(const hex of ['#294b3e','#a1b2c3','#000000','#ffffff','#0f7bda','#e69b24']){const {h,s,v}=hexToHsv(hex);assert.equal(hsvToHex(h,s,v),hex);}
 assert.equal(hsvToHex(Infinity,Infinity,Infinity),'#000000');
});

test('each pen has distinct opacity and texture, while erasing stays opaque',()=>{
 assert.equal(brushStyle({tool:'pen'}).opacity,1);
 assert.equal(brushStyle({tool:'marker'}).opacity,.38);assert.equal(brushStyle({tool:'marker'}).cap,'square');
 assert.equal(brushStyle({tool:'pencil'}).opacity,.72);assert.ok(brushStyle({tool:'pencil'}).dash.length);
 assert.equal(brushStyle({tool:'eraser',color:'#000000'}).color,'#ffffff');assert.equal(brushStyle({tool:'eraser'}).opacity,1);
 assert.equal(brushStyle({color:'"/><script>',width:Infinity}).color,'#294b3e');
});

test('SVG and downloaded PNG use the same smooth path and apply transparency once per stroke',()=>{
 const calls=[],ctx=new Proxy({}, {get:(_,name)=>(...args)=>calls.push([name,...args]),set:(_,name,value)=>{calls.push(['set',name,value]);return true;}});
 const stroke={tool:'marker',color:'#ab7623',width:12,points:[{x:0,y:0},{x:20,y:40},{x:50,y:20},{x:80,y:50}]};
 const svg=strokeMarkup(stroke);drawStudioStroke(ctx,stroke);
 assert.match(svg,/M 0 0 Q 20 40 35 30 Q 50 20 65 35 L 80 50/);
 assert.match(svg,/opacity="0.38"/);assert.match(svg,/stroke-linecap="square"/);
 assert.deepEqual(calls.filter(call=>call[0]==='quadraticCurveTo'),[['quadraticCurveTo',20,40,35,30],['quadraticCurveTo',50,20,65,35]]);
 assert.equal(calls.filter(call=>call[0]==='stroke').length,1);
 assert.deepEqual(calls.filter(call=>call[0]==='set'&&call[1]==='globalAlpha'),[['set','globalAlpha',.38]]);
 assert.equal(calls[0][0],'save');assert.equal(calls.at(-1)[0],'restore');
 assert.match(strokeMarkup({...stroke,tool:'pencil'}),/stroke-dasharray="0.7 1.2"/);
 assert.match(strokeMarkup({...stroke,points:[{x:10,y:10}]}),/^<rect /);
 assert.match(strokeMarkup({...stroke,tool:'pen',points:[{x:10,y:10}]}),/^<circle /);
 assert.equal(strokeMarkup({points:[{x:NaN,y:0}]}),'');
});
