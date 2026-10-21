import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePost,uniqueSlug,createPost,transitionPost,decodePosts,encodePosts,LIMITS} from '../dist/core.js';
const input={title:'A useful title',body:'A sufficiently detailed story for this prototype.'};
const options={id:'one',now:'2026-10-21T20:00:00.000Z'};
test('blank and whitespace inputs produce both field errors',()=>{
  for(const value of ['', '   ']) assert.deepEqual(Object.keys(validatePost(value,value)),['title','body']);
});
test('validation enforces both length boundaries after trimming',()=>{
  assert.deepEqual(validatePost('t'.repeat(100),'x'.repeat(20)),{});
  assert.deepEqual(Object.keys(validatePost('t'.repeat(101),'x'.repeat(1001))),['title','body']);
  assert.ok(validatePost('Title','x'.repeat(19)).body);
  assert.deepEqual(validatePost(' Valid title ', ' '+ 'x'.repeat(1000)+' '),{});
});
test('slugs normalize accents and distinguish duplicate titles',()=>{
  assert.equal(uniqueSlug(' Café & Architecture ',[]),'cafe-architecture');
  assert.equal(uniqueSlug('你好',[]),'untitled-story');
  assert.equal(uniqueSlug('Hello',[{slug:'hello'},{slug:'hello-2'}]),'hello-3');
});
test('a new valid story is a trimmed draft and leaves the original collection untouched',()=>{
  const before=[]; const result=createPost(before,{title:' '+input.title+' ',body:' '+input.body+' '},options);
  assert.ok(result.ok);assert.equal(result.posts[0].status,'draft');assert.equal(result.posts[0].title,input.title);assert.equal(result.posts[0].body,input.body);assert.equal(before.length,0);
});
test('database outage rejects writes without producing new state',()=>{
  const result=createPost([],input,{...options,databaseDown:true});assert.equal(result.ok,false);assert.equal(result.posts,undefined);
});
test('invalid fields are rejected before database access',()=>{
  const result=createPost([],{title:'',body:''},{databaseDown:true});assert.equal(result.ok,false);assert.ok(result.errors.title);assert.equal(result.posts,undefined);
});
test('publish and unpublish change only the target story; transitions are idempotent',()=>{
  const initial=createPost([],input,options).posts;
  const posts=createPost(initial,{...input,title:'Other title'},{...options,id:'two'}).posts;
  const published=transitionPost(posts,'one','published').posts;
  assert.equal(published.find(p=>p.id==='one').status,'published');assert.equal(published.find(p=>p.id==='two').status,'draft');assert.equal(posts.find(p=>p.id==='one').status,'draft');
  assert.deepEqual(transitionPost(published,'one','published').posts,published);
  assert.equal(transitionPost(published,'one','draft').posts.filter(p=>p.status==='published').length,0);
});
test('unknown story, invalid transition, and outage preserve state',()=>{
  const posts=createPost([],input,options).posts;
  for(const result of [transitionPost(posts,'missing','published'),transitionPost(posts,'one','deleted'),transitionPost(posts,'one','published',true)]){assert.equal(result.ok,false);assert.equal(result.posts,undefined);}
  assert.equal(posts[0].status,'draft');
});
test('storage round trip preserves valid stories and strips extraneous properties',()=>{
  const posts=createPost([],input,options).posts;
  assert.deepEqual(decodePosts(encodePosts(posts)),{posts,warning:null});
  assert.equal(decodePosts(encodePosts([{...posts[0],injected:'not trusted'}])).posts[0].injected,undefined);
});
test('malformed, oversized, and incompatible storage recovers to empty state',()=>{
  const p=createPost([],input,options).posts[0];
  for(const raw of ['bad json','null','{}',JSON.stringify({version:2,posts:[]}),encodePosts([p,p]),encodePosts([{...p,status:'admin'}]),encodePosts([{...p,title:null}]),encodePosts([{...p,slug:'<script>'}]),encodePosts([{...p,createdAt:'invalid'}]),encodePosts(Array(41).fill(p))]){
    const result=decodePosts(raw);assert.deepEqual(result.posts,[]);assert.ok(result.warning);
  }
  assert.deepEqual(decodePosts(null),{posts:[],warning:null});
});
test('demo collection cap rejects the next write',()=>{
  const posts=Array.from({length:LIMITS.posts},(_,i)=>({id:String(i),slug:`post-${i}`}));
  assert.equal(createPost(posts,input,options).ok,false);assert.equal(posts.length,LIMITS.posts);
});
test('HTML-like content remains unchanged as plain data for safe DOM text rendering',()=>{
  const title='<img src=x onerror=alert(1)>';
  const result=createPost([],{title,body:input.body},options);assert.ok(result.ok);assert.equal(result.posts[0].title,title);
});
