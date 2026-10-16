import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createNavigation} from '../src/navigation.js';
test('back follows actual pages and steps without recording answer rerenders',()=>{
  const nav=createNavigation();
  const home={screen:'home',stage:null,step:null},hub={screen:'hub',stage:null,step:null};
  const first={screen:'mission',stage:3,step:0},second={...first,step:1};
  nav.visit(home);assert.equal(nav.canGoBack,false);
  nav.visit(hub);nav.visit(first);nav.visit(first);nav.visit(second);
  assert.deepEqual(nav.back(),first);nav.visit(first);
  assert.deepEqual(nav.back(),hub);assert.deepEqual(nav.back(),home);
  assert.equal(nav.canGoBack,false);assert.equal(nav.back(),null);
});

test('reset removes completed routes and starts a fresh navigation history',()=>{
  const nav=createNavigation();
  const home={screen:'home',stage:null,step:null},hub={screen:'hub',stage:null,step:null};
  nav.visit(home);nav.visit(hub);nav.visit({screen:'celebration',stage:5,step:null});
  nav.visit({screen:'ending',stage:null,step:null});
  nav.reset();
  assert.equal(nav.canGoBack,false);assert.equal(nav.back(),null);
  nav.visit(home);
  assert.equal(nav.canGoBack,false);assert.equal(nav.back(),null);
  nav.visit(hub);assert.deepEqual(nav.back(),home);assert.equal(nav.back(),null);
});
