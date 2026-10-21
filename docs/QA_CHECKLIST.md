# Manual QA checklist

Use this on the **final deployed URL**, and repeat on local changes. Do not mark a row passed until observed. The app's QA notebook exports your observations; it is not an automated test runner.

Record: tester, date, URL/version, browser and version, viewport, expected/actual outcome, evidence filename or video timestamp, and any fix/retest.

| ID | Category | Steps | Expected result | Record |
| --- | --- | --- | --- | --- |
| F01 | Functional | Open all four navigation sections; refresh a section URL; use browser Back/Forward. | Correct section and active navigation; no fatal error. | Pending personal check |
| F02 | Functional | Click all seven architecture nodes; switch read/publish traces. | Inspector and source link match selection; correct API path appears. | Pending personal check |
| F03 | Functional | Save a valid draft, publish it, then return it to draft. | Draft is editorial-only; published story appears publicly; unpublish hides it. | Pending personal check |
| F04 | Edge case | Submit blanks, then a whitespace title and short text. | Clear field errors; title focus; no saved story; input retained. | Pending personal check |
| F05 | Edge case | Paste 150 title characters and 1,200 story characters. | Fields stop at 100/1,000; no clipping or broken layout. | Pending personal check |
| F06 | Edge case | Save the same title twice. | Both stories exist with distinct slugs, such as `story` and `story-2`. | Pending personal check |
| F07 | Fault injection | Enable outage, try Save and Publish, then restore service and retry. | Failed writes leave state unchanged and retain form input; retry succeeds. | Pending personal check |
| F08 | Edge case | Press Save rapidly after a successful save. | Empty repeated submits do not create extra valid stories. | Pending personal check |
| F09 | Persistence | Reload with drafts and a published story. Reset the demo. | Saved state restores; reset clears the demo and restores the online toggle. | Pending personal check |
| F10 | Safe rendering | Use title `<b>Hello</b>` with a valid story. | Tags appear as literal text, never interpreted HTML. | Pending personal check |
| F11 | Notebook | Check a QA item, add notes, reload, export, then clear. | Progress persists; downloaded JSON identifies user-entered observations; clear resets it. | Pending personal check |
| R01 | Desktop | Test every section at 1920 × 1080. | No overlap, clipping, or horizontal overflow. | Pending personal check |
| R02 | Tablet | Repeat at 768 × 1024. | Map, inspector, form, and table fit. | Pending personal check |
| R03 | Mobile | Repeat at 390 × 844 and optionally 320 × 740. Include long story content. | Controls remain usable and text wraps. | Pending personal check |
| B01 | Cross-browser | Repeat F02–F09 in Chrome/Edge and Firefox/Safari. | Core behavior works in two different engines. Chrome plus Edge is not sufficient. | **Automated live checks passed in Chromium 151 and Firefox 153; see QA_REPORT.md.** |
| B02 | Console | Clear DevTools Console; reload and repeat the core flow. | Zero uncaught JS errors. | Automated live checks: zero in both engines. Show DevTools personally in the video. |
| B03 | Assets | Clear Network; disable cache; reload; filter errors. | App HTML, CSS, JS, and favicon load; no broken local asset 404s. | Automated live checks: no HTTP errors or failed requests. Firefox observed all five assets, including favicon, at HTTP 200. Show Network personally in the video. |
| A01 | Labels/focus | Tab from top; activate skip link from both architecture and publishing sections. | Focus is visible; skip reaches main without switching sections. | Pending personal check |
| A02 | Keyboard | Navigate, inspect nodes, submit form, toggle outage, and check QA items using keyboard. | Enter/Space work; invalid title gets focus; no trap. | Pending personal check |
| A03 | Readability | Inspect at 200% zoom and with a screen reader if available. | Content remains usable; labels and errors are announced sensibly. | Not fully audited |
| P01 | Performance | Open Network/Performance, disable cache, reload final URL, and note device/network settings. | Page and interactions respond promptly; report actual measurements. | Pending on final URL |

For advanced storage checks, DevTools → Application → Local Storage can set `ghost-lab.posts.v1` to invalid JSON. Reload: the app should show a recovery message and start empty. Remove/reset the invalid entry afterward. Blocking storage should produce a memory-only warning, not a fatal error. Do not modify unrelated website storage.

If any test fails, record the failure and fix/retest; do not simply leave a checked box. The video must show real DevTools and responsive behavior, not just this table or a screen full of checked items.
