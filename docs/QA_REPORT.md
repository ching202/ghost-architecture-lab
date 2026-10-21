# QA execution report

Date: October 21, 2026. Tester: OpenAI Codex automated checks and screenshot inspection. Student verification and final-URL recording are separate tasks.

## Observed results

| Area | Result | Evidence / limitation |
| --- | --- | --- |
| Pure domain logic | **12/12 passed** | `node --test tests/core.test.mjs`, Node 24.19.0. |
| Browser interaction | **15/15 Chrome check groups passed** | Chrome 156.0.8078.47, Playwright 1.62.1. See [browser-results.json](evidence/browser-results.json). |
| Standalone offline preview | **6/6 smoke checks passed** | `preview.html` opened directly through a file URL in Chrome; architecture initialization, draft, publication, reload, reset, and no uncaught errors. See [offline-results.json](evidence/offline-results.json). |
| Desktop/tablet/mobile | **Passed automated overflow checks** | All four routes at 1920×1080, 768×1024, 390×844, and 320×740. Desktop architecture and mobile architecture/publishing screenshots visually inspected. |
| Console and local assets | **Clean in Chrome fixture run** | Zero page errors, console errors, failed requests, and error-status asset responses in recorded test session. This was not an internet-hosted test. |
| Keyboard basics | **Passed exercised controls** | Skip link, route activation, invalid-field focus, outage checkbox, and reset button. Semantic labels and focus styles are implemented. |
| Firefox | **Environment blocked; not passed** | Firefox 153.0 test binary exited with Windows error 3221225477 before navigation, including a retry with software graphics. No app test ran in Firefox. |
| Live hosting | **See deployment record; final browser checks pending** | Localhost network requests were denied/timed out in this execution environment. Hosting success alone is not a browser smoke test. |
| Performance | **Limited observation only** | Static payload is approximately 59 KiB uncompressed with no runtime dependencies or external font/image requests. Navigation timings in JSON are for a local route fixture and are not real-network benchmarks. |
| Full accessibility audit | **Not completed** | No automated WCAG score, full screen-reader audit, 200% zoom audit, or formal contrast certification is claimed. |

## Browser test method

Because loopback sockets were unavailable, the browser suite used `FIXTURE_MODE=1`. Playwright fulfilled requests with the exact bytes from `dist/` at a localhost origin. Chrome parsed and executed the real HTML/CSS/JS. Forms, local storage, navigation, downloads, pointer/keyboard controls, and responsive rendering were exercised in the browser.

This method checks application behavior and asset resolution in the fixture. It does **not** verify DNS, TLS, server response headers, authentication gates, deployment routing, or internet loading speed. Repeat the suite without fixture mode or complete the manual checklist on the final deployed URL.

The test process exits nonzero when Firefox fails to launch, even though Chrome's 15 groups pass. The JSON records both results. That overall nonzero result is retained rather than relabeled as an entirely passing cross-browser suite.

## Behavior exercised

- Seven component selectors and both request traces.
- Empty/whitespace titles, short story text, 100/1,000-character input limits.
- Draft creation, duplicate-title slugs, publication, unpublication, and filtered reading view.
- Failed creation/publication under outage; unchanged state and successful retry.
- Repeated empty submissions after save without additional valid drafts.
- Literal HTML-like input (no injected element), reload persistence, corrupted storage recovery, blocked-storage fallback.
- Notebook check/notes persistence, progress reset, and JSON download.
- Responsive views at four sizes and keyboard interaction.

## Actual defects corrected

| Finding | Correction | Retest |
| --- | --- | --- |
| Decorative toggle intercepted pointer events | `pointer-events: none` on toggle decoration | Pointer and keyboard outage checks pass. |
| Navigation overflow at 320 px | Two-column navigation at widths ≤360 px | All four routes pass at 320 px. |
| Skip link could reset the active route | Focus main while preventing hash navigation | Keyboard test from publishing keeps that section active. |
| Database arrow visually pointed between columns | Align arrow with MySQL | Screenshot inspected. |
| Test read route visibility too soon | Await visibility after hash-change action | Test passes without forced clicks or arbitrary sleeps. |
| Offline bundler altered literal `$$` in inserted JavaScript | Use function replacers when injecting CSS/JS into HTML | All six standalone smoke checks pass. |

## Evidence files

- [Machine-readable browser results](evidence/browser-results.json)
- [Standalone preview smoke results](evidence/offline-results.json)
- [Desktop architecture](evidence/chromium-desktop.png)
- [Desktop publishing](evidence/chromium-publishing.png)
- [Mobile architecture](evidence/chromium-mobile-architecture.png)
- [Mobile publishing](evidence/chromium-mobile-publishing.png)
- [Mobile evidence table](evidence/chromium-mobile-audit.png)
- [Mobile QA notebook](evidence/chromium-mobile-qa.png)

Screenshots containing test story text are test fixtures, not preloaded user content. The application starts with an empty notebook and no stories on a fresh origin.

## Required follow-up before submission

1. Repeat core flows in a working Firefox or Safari environment; record actual version and result.
2. Confirm final deployment access and inspect its Console/Network for errors.
3. Record actual network/device performance observations, keyboard use, and responsive layout in the screen/webcam video.
4. Review remaining accessibility checks. Update this report with observations rather than substituting app checkbox states for evidence.

Student follow-up: **[date / browser versions / deployment URL / observed results / evidence]**
