import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as model from '../src/model.js';
import * as assets from '../src/assets.js';
import {createNavigation} from '../src/navigation.js';

// Exercise the real application functions with only the DOM methods they use.
// These tests verify state and generated markup, not browser layout or HTML parsing.
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
function application({saved=null,failWrites=false}={}){
  const listeners=new Map(),dialogListeners=new Map(),attributes=new Map(),classes=new Set();
  let markup='',warning=null,stored=saved,writeFailure=failWrites,exported=null;
  const status={innerHTML:'',classList:{toggle(name,on){on?classes.add(name):classes.delete(name);}},setAttribute(name,value){attributes.set(name,value);}};
  const main={focus(){}},heading={textContent:''},downloadLink={href:''};
  const app={
    get innerHTML(){return markup;},
    set innerHTML(value){markup=value;warning=null;},
    querySelectorAll(){return [];},
    insertAdjacentHTML(_where,value){
      if(value.includes('id="storage-warning"'))warning={markup:value,remove(){warning=null;}};
      else throw new Error('Unexpected inserted markup');
    },
  };
  const dialog={open:false,innerHTML:'',addEventListener(name,handler){dialogListeners.set(name,handler);},showModal(){this.open=true;},close(){this.open=false;dialogListeners.get('close')?.();}};
  const document={
    activeElement:null,
    addEventListener(name,handler){listeners.set(name,handler);},
    querySelector(selector){
      switch(selector){
        case '#app':return app;
        case '#dialog':return dialog;
        case '.save-state':return status;
        case '#storage-warning':return warning;
        case '#main':return main;
        case '.design-preview h2':return heading;
        case '#report-download':return downloadLink;
        case '#world':return {};
        default:throw new Error(`Unimplemented DOM selector: ${selector}`);
      }
    },
  };
  const context=vm.createContext({
    ...model,...assets,createNavigation,document,Blob,
    createHub(){return {destroy(){},move(){}};},playSound(){},silence(){},window:{scrollTo(){}},
    URL:{createObjectURL(blob){exported=blob;return 'blob:test-record';},revokeObjectURL(){}},
    localStorage:{getItem(){return stored;},setItem(_key,value){if(writeFailure)throw new Error('QuotaExceededError');stored=value;}},
  });
  const run=code=>vm.runInContext(code,context);
  run(source);
  return {run,app,dialog,status,attributes,classes,heading,
    get warning(){return warning;},get saved(){return stored;},get exported(){return exported;},
    setWriteFailure(value){writeFailure=value;},
    input(value){listeners.get('input')({target:{id:'invention-name',value}});},
  };
}

test('a failed initial save immediately warns and a later successful save clears it',()=>{
  const a=application({failWrites:true});
  assert.equal(a.run('storageOK'),false);
  assert.match(a.status.innerHTML,/저장 공간을 확인/);
  assert.equal(a.attributes.get('role'),'alert');
  assert.equal(a.classes.has('save-error'),true);
  assert.match(a.warning.markup,/기록을 저장할 수 없어/);
  a.run('render()');
  assert.ok(a.warning,'a rerender must retain the storage warning');
  a.setWriteFailure(false);a.run('save()');
  assert.equal(a.run('storageOK'),true);
  assert.match(a.status.innerHTML,/자동 저장/);
  assert.equal(a.classes.has('save-error'),false);
  assert.equal(a.warning,null);
  assert.equal(JSON.parse(a.saved).version,1);
});

test('reset clears progress and completed-page history before a new expedition',()=>{
  const a=application();
  a.run("s.completed=[1,2,3,4,5]; stage=5; go('celebration'); go('ending'); act('reset',{dataset:{}}); act('nav-back',{dataset:{}})");
  assert.equal(a.run('screen'),'home');
  assert.equal(a.run('navigation.canGoBack'),false);
  assert.deepEqual(JSON.parse(a.saved),model.freshState());
  assert.doesNotMatch(a.app.innerHTML,/동물 기록 연구원 인증서/);
  a.run("act('enter',{dataset:{id:'5'}})");
  assert.equal(a.run('screen'),'home','a new expedition must not enter stage 5');
  a.run("act('enter',{dataset:{id:'1'}}); act('nav-back',{dataset:{}})");
  assert.equal(a.run('screen'),'home');
});

test('back skips celebration and ending routes that no longer have completion evidence',()=>{
  const a=application();
  a.run("s.completed=[1,2,3,4,5]; stage=5; go('celebration'); go('ending'); go('home'); s.completed=[]; navigateBack()");
  assert.equal(a.run('screen'),'home');
  assert.doesNotMatch(a.app.innerHTML,/동물 기록 연구원 인증서/);
});

test('malformed saved structure names cannot crash the invention preview',()=>{
  for(const structure of ['toString','constructor','__proto__','missing']){
    const saved=JSON.stringify({...model.freshState(),adminUnlocked:true,design:{problem:'protect',feature:'shell',structure,name:'복원한 설계'}});
    const a=application({saved});
    assert.doesNotThrow(()=>a.run("act('enter',{dataset:{id:'5'}})"));
    assert.match(a.app.innerHTML,/\/assets\/generated\/helmet\.webp/);
    assert.doesNotThrow(()=>a.run("act('next',{dataset:{}})"));
  }
});

test('trial history identifies an incorrect feature when the structure is correct',()=>{
  const a=application();
  a.run("s.design={problem:'protect',feature:'web',structure:'dome',name:'특징 다시 보기'}; act('test',{dataset:{}})");
  const markup=a.run('trialHistory()');
  assert.match(markup,/동물의 특징을 다시 살펴봐/);
  assert.doesNotMatch(markup,/제품 구조를 다시 살펴봐/);
});

test('trial history identifies an incorrect structure when the feature is correct',()=>{
  const a=application();
  a.run("s.design={problem:'protect',feature:'shell',structure:'wide',name:'구조 다시 보기'}; act('test',{dataset:{}})");
  const markup=a.run('trialHistory()');
  assert.match(markup,/제품 구조를 다시 살펴봐/);
  assert.doesNotMatch(markup,/동물의 특징을 다시 살펴봐/);
});

test('user names are escaped in design, trial, certificate and export markup',async()=>{
  const a=application();
  const payload='"><svg/onload=alert(1)>';
  a.input(payload);
  assert.equal(a.heading.textContent,payload,'live input uses textContent');
  assert.equal(JSON.parse(a.saved).design.name,payload);
  const escaped='&quot;&gt;&lt;svg/onload=alert(1)&gt;';
  for(const expression of ['design(0)','design(1)','ending()','trialHistory()']){
    a.run('s.completed=[1,2,3,4,5]; s.trials=[{...s.design,passed:true}]');
    const markup=a.run(expression);
    assert.ok(markup.includes(escaped),expression);
    assert.ok(!markup.includes(payload),expression);
    assert.ok(!markup.includes('<svg/onload='),expression);
  }
  // A longer stored historical name must not break out of an export textarea.
  a.run("s.design.name='</textarea><script>alert(1)</script>'; download()");
  assert.match(a.dialog.innerHTML,/&lt;\/textarea&gt;&lt;script&gt;/);
  assert.doesNotMatch(a.dialog.innerHTML,/<script>/);
  assert.ok((await a.exported.text()).includes('</textarea><script>alert(1)</script>'),'plain-text export preserves the actual name');
});
