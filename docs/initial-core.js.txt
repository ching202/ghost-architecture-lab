// Pure domain functions shared by the browser and Node's test runner.
export const LIMITS = Object.freeze({title:100, body:1000, posts:40});
export function validatePost(title, body) {
  const errors = {};
  if (typeof title !== 'string' || !title.trim()) errors.title = 'Add a title before saving.';
  else if (title.trim().length > LIMITS.title) errors.title = `Keep the title to ${LIMITS.title} characters.`;
  if (typeof body !== 'string' || body.trim().length < 20) errors.body = 'Write at least 20 characters for the story.';
  else if (body.trim().length > LIMITS.body) errors.body = `Keep the story to ${LIMITS.body} characters.`;
  return errors;
}
export function uniqueSlug(title, posts) {
  const base = title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70) || 'untitled-story';
  let slug = base, n = 2;
  while (posts.some(post => post.slug === slug)) slug = `${base}-${n++}`;
  return slug;
}
export function createPost(posts, {title, body}, {databaseDown = false, id = Date.now().toString(), now = new Date().toISOString()} = {}) {
  const errors = validatePost(title, body);
  if (Object.keys(errors).length) return {ok:false, errors};
  if (databaseDown) return {ok:false, message:'The simulated database is unavailable. Nothing was saved. Restore it and retry.'};
  if (posts.length >= LIMITS.posts) return {ok:false, message:`The demo holds ${LIMITS.posts} stories. Reset the demo to start again.`};
  return {ok:true, posts:[{id, title:title.trim(), body:body.trim(), slug:uniqueSlug(title,posts), status:'draft', createdAt:now}, ...posts]};
}
export function transitionPost(posts, id, status, databaseDown = false) {
  if (databaseDown) return {ok:false, message:'The simulated database is unavailable. The story was not changed.'};
  if (!['draft','published'].includes(status)) return {ok:false, message:'Unknown publication state.'};
  if (!posts.some(post => post.id === id)) return {ok:false, message:'This story no longer exists. Refresh the selection.'};
  return {ok:true, posts:posts.map(post => post.id === id ? {...post,status} : post)};
}
export function decodePosts(raw) {
  if (raw === null) return {posts:[], warning:null};
  try {
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.posts) || data.posts.length > LIMITS.posts) throw new Error('Invalid storage format');
    const ids = new Set(), slugs = new Set();
    for (const p of data.posts) {
      if (!p || typeof p.id !== 'string' || !p.id || p.id.length > 100 || ids.has(p.id) ||
        typeof p.slug !== 'string' || !/^[a-z0-9-]{1,85}$/.test(p.slug) || slugs.has(p.slug) ||
        !['draft','published'].includes(p.status) || Object.keys(validatePost(p.title,p.body)).length ||
        typeof p.createdAt !== 'string' || !Number.isFinite(Date.parse(p.createdAt))) throw new Error('Invalid saved story');
      ids.add(p.id); slugs.add(p.slug);
    }
    return {posts:data.posts.map(({id,title,body,slug,status,createdAt}) => ({id,title,body,slug,status,createdAt})), warning:null};
  } catch { return {posts:[], warning:'Saved demo data could not be read. A fresh session is ready.'}; }
}
export function encodePosts(posts) { return JSON.stringify({version:1,posts}); }
