import {createPost, transitionPost, decodePosts, encodePosts, validatePost} from './core.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const POST_KEY = 'ghost-lab.posts.v1';
const QA_KEY = 'ghost-lab.qa.v1';
const runtimeSource = 'https://github.com/TryGhost/Ghost/blob/main/docs/codebase/runtime-architecture.md';
const components = {
  browser: {title:'Reader / editor',category:'CLIENT',description:'The browser displays a public story or runs Ghost Admin. These two experiences have different permissions and request paths.',facts:{Boundary:'Outside the Ghost server process',Communication:'HTTP(S); Admin uses the Admin API',Tradeoff:'Client flexibility adds interface and authentication responsibilities.'},source:runtimeSource},
  nginx: {title:'Nginx',category:'INFRASTRUCTURE',description:'In the recommended self-hosted stack, Nginx accepts public requests and proxies them to the Ghost application. It is a separate infrastructure process.',facts:{Boundary:'Reverse proxy outside Ghost Core',Communication:'HTTP to Ghost’s listening port',Tradeoff:'Central request handling adds another operational component.'},source:'https://docs.ghost.org/faq/'},
  themes: {title:'Theme layer',category:'IN-PROCESS MODULE',description:'Handlebars templates turn content into server-rendered HTML. Native theme helpers reach shared server capabilities through an in-process proxy, not a separate HTTP hop to the Content API.',facts:{Boundary:'Inside Ghost Core',Communication:'Internal calls; HTML returned to reader',Tradeoff:'Integrated rendering is convenient; custom headless clients use a different path.'},source:runtimeSource},
  apis: {title:'Content & Admin APIs',category:'HTTP INTERFACES',description:'The Content API reads published content. The authenticated Admin API manages content. Both are interfaces provided by Core, not independent microservices.',facts:{Boundary:'HTTP boundary into one Core process',Communication:'JSON over HTTP; different auth models',Tradeoff:'Separate permissions clarify read/write access. Admin integration secrets belong on a trusted server.'},source:'https://docs.ghost.org/admin-api/'},
  services: {title:'Core services & models',category:'IN-PROCESS MODULE',description:'Ghost’s business logic, permissions, and models run within its shared Node.js process. Models coordinate persistent data access; service modules separate responsibilities within that runtime.',facts:{Boundary:'One application runtime',Communication:'In-process calls + database connection',Tradeoff:'Simple local calls and deployment; shared resources and failure boundary.'},source:runtimeSource},
  mysql: {title:'MySQL',category:'PERSISTENCE',description:'A separate MySQL service stores durable publication data in the supported production stack. SQLite is a local development option, not an interchangeable supported production database.',facts:{Boundary:'Database outside the Node.js process',Communication:'Core models issue database operations',Tradeoff:'Durable relational data; availability and backups need operational care.'},source:'https://docs.ghost.org/hosting/'},
  integrations: {title:'External services',category:'OPTIONAL INTEGRATIONS',description:'Ghost can integrate with email providers and storage adapters. Transactional mail and native bulk newsletters follow different paths; native self-hosted bulk mail uses Mailgun’s API.',facts:{Boundary:'Provider or adapter dependent',Communication:'Mail transport, provider APIs, or storage adapter',Tradeoff:'External capabilities introduce provider dependencies and partial failure cases.'},source:'https://docs.ghost.org/newsletters/'}
};
const flows = {
  read:{title:'Read a story',steps:['Reader','Nginx','Theme layer','Core models','MySQL'],nodes:['browser','nginx','themes','services','mysql'],note:'For a standard theme request, Core renders HTML and returns it to the reader via Nginx. This simplified path omits caches and middleware; native themes use in-process calls.'},
  publish:{title:'Publish a post',steps:['Ghost Admin','Nginx','Admin API','Core services','MySQL'],nodes:['browser','nginx','apis','services','mysql'],note:'The editor sends an authenticated write. Core checks permissions and updates persistent state; the response returns to Admin. The Content API does not create posts.'}
};
function inspect(key) {
  const c = components[key];
  $('#component-title').textContent = c.title;
  $('#component-category').textContent = c.category;
  $('#component-description').textContent = c.description;
  $('#component-facts').replaceChildren();
  for (const [label,value] of Object.entries(c.facts)) {
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = value; $('#component-facts').append(dt,dd);
  }
  $('#component-source').href = c.source;
  $$('[data-node]').forEach(node => node.setAttribute('aria-pressed',String(node.dataset.node === key)));
}
function showFlow(name) {
  const f = flows[name];
  $('#flow-title').textContent = f.title; $('#flow-note').textContent = f.note;
  $('#trace-steps').replaceChildren(...f.steps.map((step,i) => {
    const li = document.createElement('li'), n = document.createElement('span');
    n.textContent = String(i+1).padStart(2,'0'); li.append(n,document.createTextNode(step)); return li;
  }));
  $('#read-flow').setAttribute('aria-pressed',String(name==='read'));
  $('#publish-flow').setAttribute('aria-pressed',String(name==='publish'));
  $$('[data-node]').forEach(node => node.classList.toggle('on-path',f.nodes.includes(node.dataset.node)));
}
$$('[data-node]').forEach(node => node.addEventListener('click',() => inspect(node.dataset.node)));
$('#read-flow').addEventListener('click',() => showFlow('read'));
$('#publish-flow').addEventListener('click',() => showFlow('publish'));
inspect('services'); showFlow('read');

function route(focus=false) {
  const candidate = location.hash.slice(1);
  const name = ['architecture','publishing','audit','qa'].includes(candidate) ? candidate : 'architecture';
  $$('.page').forEach(page => {page.hidden = page.id !== name;});
  $$('[data-route]').forEach(a => a.dataset.route===name ? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current'));
  if (focus) { window.scrollTo({top:0}); $('#main').focus({preventScroll:true}); }
}
window.addEventListener('hashchange',() => route(true)); route();
$('.skip-link').addEventListener('click',event=>{event.preventDefault();$('#main').focus();});

let storageAvailable = true;
function warnStorage(text) { $('#storage-warning').textContent=text; $('#storage-warning').hidden=false; }
function storageRead(key) {
  try { return localStorage.getItem(key); }
  catch { storageAvailable=false; warnStorage('Browser storage is blocked. The lab still works, but this session will not survive a reload.'); return null; }
}
function storageWrite(key,value) {
  try { localStorage.setItem(key,value); storageAvailable=true; return true; }
  catch { storageAvailable=false; warnStorage('Browser storage is unavailable or full. Changes are in memory only and will be lost on reload.'); return false; }
}
const decoded = decodePosts(storageRead(POST_KEY));
let posts = decoded.posts;
if (decoded.warning) warnStorage(decoded.warning);
const activity = [];
let databaseDown = false;
function log(message) {
  activity.unshift({time:new Date(),message}); if (activity.length>12) activity.pop();
  $('#activity-log').replaceChildren(...activity.map(item => {
    const li = document.createElement('li'), time=document.createElement('time'), text=document.createElement('span');
    time.dateTime=item.time.toISOString(); time.textContent=item.time.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    text.textContent=item.message; li.append(time,text); return li;
  }));
}
function message(text,isError=false) {const el=$('#lab-message');el.textContent=text;el.classList.toggle('error',isError);}
function persistPosts() { storageWrite(POST_KEY,encodePosts(posts)); }
function element(tag,className,text) { const el=document.createElement(tag);if(className) el.className=className;if(text!==undefined) el.textContent=text;return el; }
function empty(text) {const div=element('div','empty-state');div.append(element('span','', '↗'),element('p','',text));return div;}
function renderStories() {
  const published=posts.filter(p=>p.status==='published');
  $('#draft-count').textContent=String(posts.length-published.length); $('#published-count').textContent=String(published.length);
  const cards=posts.map(post => {
    const card=element('article','story-card'), meta=element('div','story-meta'), time=element('time','',new Date(post.createdAt).toLocaleDateString());
    time.dateTime=post.createdAt;meta.append(element('span',`story-state ${post.status}`,post.status.toUpperCase()),time);
    card.append(meta,element('h3','',post.title),element('div','slug',`/${post.slug}/`),element('p','',post.body.length>140 ? post.body.slice(0,140)+'…' : post.body));
    const actions=element('div','story-actions'), button=element('button','button small '+(post.status==='draft'?'primary':'ghost'),post.status==='draft'?'Publish story →':'Return to draft');
    button.setAttribute('aria-label',`${post.status==='draft'?'Publish':'Unpublish'}: ${post.title}`);
    button.addEventListener('click',() => {
      const nextStatus=post.status==='draft'?'published':'draft';
      const result=transitionPost(posts,post.id,nextStatus,databaseDown);
      if (!result.ok) { message(result.message,true); log('WRITE FAILED · database simulation unavailable; state unchanged.'); return; }
      posts=result.posts;persistPosts();renderStories();
      message(`“${post.title}” is ${nextStatus==='published'?'now visible in the public reading view':'a draft again and hidden from the public reading view'}.${storageAvailable?'':' Changes are in memory only.'}`);
      log(nextStatus==='published'?'WRITE OK · draft → published; read view includes the story.':'WRITE OK · published → draft; read view excludes the story.');
      // The old button is replaced during rendering. Move focus to its replacement.
      const index=posts.findIndex(p=>p.id===post.id); $('#story-list').querySelectorAll('button')[index]?.focus({preventScroll:true});
    });
    actions.append(button);card.append(actions);return card;
  });
  $('#story-list').replaceChildren(...(cards.length?cards:[empty('Your first draft starts here. Save a story, then publish it to cross the read boundary.')]));
  $('#reader-list').replaceChildren(...(published.length ? published.map(p=>{
    const article=element('article','reader-card');article.append(element('p','eyebrow','PUBLISHED STORY'),element('h3','',p.title),element('p','',p.body));return article;
  }) : [empty('Nothing public yet. Drafts are visible to the editorial workspace only.')]));
}
function setErrors(errors) {
  for (const field of ['title','body']) {
    $(`#${field}-error`).textContent=errors[field]||'';
    $(`#story-${field}`).setAttribute('aria-invalid',String(Boolean(errors[field])));
  }
}
function counts() {$('#title-count').textContent=`${$('#story-title').value.length} / 100`;$('#body-count').textContent=`${$('#story-body').value.length} / 1000`;}
['title','body'].forEach(field => $(`#story-${field}`).addEventListener('input',()=>{
  counts();if ($(`#story-${field}`).getAttribute('aria-invalid')==='true') {
    const errors=validatePost($('#story-title').value,$('#story-body').value);
    $(`#${field}-error`).textContent=errors[field]||'';
    $(`#story-${field}`).setAttribute('aria-invalid',String(Boolean(errors[field])));
  }
}));
$('#story-form').addEventListener('submit',event=>{
  event.preventDefault();
  const result=createPost(posts,{title:$('#story-title').value,body:$('#story-body').value},{databaseDown,id:crypto.randomUUID()});
  setErrors(result.errors||{});
  if (!result.ok) {
    message(result.message||'Check the highlighted fields. Your text is still here.',true);
    log(result.errors?'VALIDATION · invalid draft rejected before persistence.':'WRITE FAILED · no draft saved; input retained.');
    if (result.errors) $(`#story-${Object.keys(result.errors)[0]}`).focus();
    return;
  }
  posts=result.posts;persistPosts();renderStories();$('#story-form').reset();counts();
  message(storageAvailable?'Draft saved. It stays private until you publish it.':'Draft saved in memory only. Storage is unavailable.');
  log('WRITE OK · valid story saved as draft; excluded from public reading view.');$('#story-title').focus();
});
$('#database-down').addEventListener('change',event=>{
  databaseDown=event.target.checked;
  $('#database-status').textContent=databaseDown?'Database simulation offline':'Database simulation online';
  $('#database-status').classList.toggle('offline',databaseDown);
  log(databaseDown?'FAULT INJECTED · writes will fail; existing reads remain visible in this demo.':'FAULT CLEARED · writes can succeed again.');
});
$('#reset-demo').addEventListener('click',()=>{
  posts=[];persistPosts();renderStories();$('#story-form').reset();setErrors({});counts();
  databaseDown=false;$('#database-down').checked=false;$('#database-status').textContent='Database simulation online';$('#database-status').classList.remove('offline');
  activity.length=0;log('RESET · local stories cleared; database simulation online.');message('Demo reset. Start a new story.');$('#story-title').focus();
});
renderStories();log('READY · browser-local teaching simulation; no Ghost server connected.');

const qaGroups = [
  {title:'01 / Functional testing',checks:[
    {id:'flow',title:'Complete the publishing flow',detail:'Save a valid draft → verify it is not public → publish → verify it is public → return to draft.'},
    {id:'validation',title:'Reject empty, short, and long inputs',detail:'Submit blank and whitespace titles, a short story, and paste long strings. Check field labels, limits, error messages, and focus.'},
    {id:'failure',title:'Recover from a failed write',detail:'Enable the database outage; saving and publishing must fail without changing state. Restore it and retry. Test duplicate titles and fast repeat clicks.'},
    {id:'storage',title:'Verify persistence and safe text rendering',detail:'Reload saved stories. Try HTML-like text: it must display literally. Reset the demo; check no stories remain.'}
  ]},
  {title:'02 / UI & responsive design',checks:[
    {id:'desktop',title:'Inspect the desktop layout',detail:'Use a 1920 × 1080 viewport. Open every section, select every component, and check text, grids, and visible controls.'},
    {id:'mobile',title:'Inspect tablet and mobile layouts',detail:'Repeat at 768 × 1024 and 390 × 844. Test the form, map, and evidence table; look for clipping and horizontal overflow.'}
  ]},
  {title:'03 / Browser & console health',checks:[
    {id:'engines',title:'Repeat core flows in two engines',detail:'Use Chromium (Chrome or Edge) AND Firefox or Safari. Chrome plus Edge does not satisfy two engines. Record versions below.'},
    {id:'console',title:'Inspect Console and Network',detail:'Open DevTools, clear logs, reload, and run core flows. Check zero uncaught errors and no broken local assets or 404 responses.'}
  ]},
  {title:'04 / Accessibility & performance',checks:[
    {id:'keyboard',title:'Use the keyboard without a mouse',detail:'Test the skip link, navigation, node buttons, form, outage toggle, and checks with Tab, Enter, and Space. Verify visible focus and sensible error focus.'},
    {id:'performance',title:'Inspect loading and interaction',detail:'Reload with cache disabled. Record the environment and timings; confirm the interface responds promptly. Observe the effect of reduced motion if enabled.'}
  ]}
];
const allChecks=qaGroups.flatMap(group=>group.checks);
let qa={version:1,checked:[],notes:''};
try {
  const data=JSON.parse(storageRead(QA_KEY)||'null');
  if (data?.version===1 && Array.isArray(data.checked) && typeof data.notes==='string') qa={version:1,checked:[...new Set(data.checked.filter(id=>allChecks.some(c=>c.id===id)))],notes:data.notes.slice(0,5000)};
} catch { /* A malformed manual notebook starts empty; nothing is marked passed. */ }
function qaProgress() {$('#qa-count').textContent=String(qa.checked.length);$('#qa-total').textContent=String(allChecks.length);$('#qa-progress').max=allChecks.length;$('#qa-progress').value=qa.checked.length;}
function saveQa() {storageWrite(QA_KEY,JSON.stringify(qa));qaProgress();}
$('#qa-groups').replaceChildren(...qaGroups.map(group=>{
  const div=element('div','panel qa-group');div.append(element('h2','',group.title));
  group.checks.forEach(check=>{
    const label=element('label','qa-check'), input=document.createElement('input'), text=element('span','',check.title);
    input.type='checkbox';input.id=`qa-${check.id}`;input.checked=qa.checked.includes(check.id);
    text.append(element('small','',check.detail));label.append(input,text);div.append(label);
    input.addEventListener('change',()=>{qa.checked=input.checked ? [...new Set([...qa.checked,check.id])] : qa.checked.filter(id=>id!==check.id);saveQa();});
  });return div;
}));
$('#qa-notes').value=qa.notes;
$('#qa-notes').addEventListener('input',()=>{qa.notes=$('#qa-notes').value;saveQa();});
$('#reset-qa').addEventListener('click',()=>{qa={version:1,checked:[],notes:''};$$('.qa-check input').forEach(input=>{input.checked=false;});$('#qa-notes').value='';saveQa();});
$('#export-qa').addEventListener('click',()=>{
  const report={project:'Ghost Architecture Lab',generatedAt:new Date().toISOString(),recordType:'User-entered manual observations; not an automated test result',browser:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},checks:allChecks.map(c=>({id:c.id,title:c.title,recordedComplete:qa.checked.includes(c.id)})),notes:qa.notes};
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
  const link=element('a');link.href=url;link.download='ghost-lab-qa-notes.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
qaProgress();
