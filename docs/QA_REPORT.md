# QA execution report

Date: October 21, 2026. Tester: OpenAI Codex automated checks and screenshot inspection. The student must still record their own screen/webcam walkthrough.

## Latest result: live Chromium and Firefox both passed

At **23:02:45 UTC / 7:02:45 p.m. EDT on October 21, 2026**, Playwright 1.62.1 tested the real [GitHub Pages site](https://ching202.github.io/ghost-architecture-lab/) on a GitHub-hosted **Ubuntu 24.04** runner. These were headless browser runs with fresh, unauthenticated browser contexts and **no request-route fixture**. They are not claims about a local Windows Firefox session.

| Engine | Actual version | Passed check groups | Uncaught page errors | Console errors / warnings | HTTP errors / failed requests |
| --- | --- | --- | --- | --- | --- |
| Chromium | 151.0.7922.34 | **15/15** | **0** | **0 / 0** | **0 / 0** |
| Firefox | 153.0 | **15/15** | **0** | **0 / 0** | **0 / 0** |

**Evidence:** [successful workflow run](https://github.com/ching202/ghost-architecture-lab/actions/runs/39690676950), [complete machine-generated JSON](evidence/live-browser-run/browser-results.json), and [screenshots](evidence/live-browser-run/). Test/workflow source commit: `175e409a64fad08d7c232a2d5619f7d6692751e4`. This identifies the test source; the target was the live Pages deployment, not a local build from that checkout.

The suite exercised component selection and request traces; empty/whitespace/short/oversized input; draft, publish, and unpublish; duplicate slugs; outage rejection and retry; literal HTML-like text; persistence; rapid repeat saves; notebook notes and export; reset; corrupted/blocked storage recovery; and basic keyboard controls. Every route passed horizontal-overflow checks at **1920×1080, 768×1024, 390×844, and 320×740** in both engines. Firefox's two desktop and four mobile screenshots were visually inspected; no obvious text overlap or layout break was observed in those captures.

Firefox recorded **HTTP 200** for the document, stylesheet, both JavaScript modules, and favicon. Chromium recorded HTTP 200 for the document, stylesheet, and both modules; a favicon request was not observed in its captured request list. Neither browser recorded a failed request or error-status response. This is automated network-event evidence; the student's live DevTools demonstration remains separate.

The first fresh-context navigation recorded `load` at **316 ms in Chromium** and **485 ms in Firefox**, without configured throttling on the runner's network. These are individual observations, not repeatable performance benchmarks or predictions for the student's connection. The JSON's later `navigationTiming` values were collected after subsequent reloads and must not be described as cold-load results.

The Windows Firefox launch probe was repeated before using Linux and again exited with code `3221225477` before page navigation. That environment failure remains part of the record. No application change was needed to obtain the Linux Firefox pass. The test harness gained a separate evidence destination, engine selection, network/version metadata, a workflow summary, and an explicit wait for each responsive route to become visible.

The downloaded evidence archive matched GitHub's published SHA-256 digest: `edd0b74acf90a6a4c1a5748ad2b6d0f206fbb8ad52c28a63a11313ce25c922bb`. Results and screenshots are retained in this repository so they do not depend on the workflow artifact's 30-day retention.

## Initial local run and earlier smoke check (historical)

The following records describe the earlier session. Its Firefox and full hosted-test gaps are resolved by the Linux live-browser run above; the original evidence has not been overwritten.

| Area | Result | Evidence / limitation |
| --- | --- | --- |
| Pure domain logic | **12/12 passed** | `node --test tests/core.test.mjs`, Node 24.19.0. |
| Browser interaction | **15/15 Chrome check groups passed** | Chrome 156.0.8078.47, Playwright 1.62.1. See [browser-results.json](evidence/browser-results.json). |
| Standalone offline preview | **6/6 smoke checks passed** | `preview.html` opened directly through a file URL in Chrome; architecture initialization, draft, publication, reload, reset, and no uncaught errors. See [offline-results.json](evidence/offline-results.json). |
| Desktop/tablet/mobile | **Passed automated overflow checks** | All four routes at 1920×1080, 768×1024, 390×844, and 320×740. Desktop architecture and mobile architecture/publishing screenshots visually inspected. |
| Console and local assets | **Clean in Chrome fixture run** | Zero page errors, console errors, failed requests, and error-status asset responses in recorded test session. This was not an internet-hosted test. |
| Keyboard basics | **Passed exercised controls** | Skip link, route activation, invalid-field focus, outage checkbox, and reset button. Semantic labels and focus styles are implemented. |
| Firefox | **Environment blocked; not passed** | Firefox 153.0 test binary exited with Windows error 3221225477 before navigation, including a retry with software graphics. No app test ran in Firefox. |
| Live hosting | **Live-browser smoke check passed** | Real [GitHub Pages URL](https://ching202.github.io/ghost-architecture-lab/) loaded in the Codex in-app browser. Component selection, publish trace, validation, draft, outage rejection/retry, publication, reload, unpublication, reset, and all four routes exercised. Captured warning/error console entries: zero. Full Network-panel audit and second-engine check remain pending. |
| Performance | **Limited observation only** | Static payload is approximately 59 KiB uncompressed with no runtime dependencies or external font/image requests. Navigation timings in JSON are for a local route fixture and are not real-network benchmarks. |
| Full accessibility audit | **Not completed** | No automated WCAG score, full screen-reader audit, 200% zoom audit, or formal contrast certification is claimed. |

## Earlier browser test method

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

## GitHub Pages smoke check

On October 21, 2026, the first [Pages workflow](https://github.com/ching202/ghost-architecture-lab/actions/runs/39689303104) completed its test and deployment job successfully. The real HTTPS URL was then opened in the Codex in-app browser, separate from the earlier local-fixture tests. The live check confirmed the behaviors recorded in the hosting row above. The test story was removed with Reset demo, leaving the application ready for a fresh demonstration. See the [live screenshot](evidence/live-deployment.jpg) and [deployment record](DEPLOYMENT.md).

At that earlier smoke-check stage, no formal network benchmark, full cross-browser rerun, or signed-out access test had been performed. The subsequent two-engine live run is recorded at the top of this report. The in-app browser version was not independently recorded.

## Reproduce the live browser checks

In GitHub, open **Actions → Verify live browser behavior → Run workflow**. It installs the pinned Playwright package and its Chromium/Firefox binaries, then runs `tests/browser-check.mjs` against the live URL. The job summary and `browser-qa-evidence` artifact record the actual outcome, including failures. The workflow has read-only repository permissions and does not commit test stories or modify application code.

Locally, after installing Playwright and its browsers, set `BASE_URL` to the live URL, `FIXTURE_MODE=0`, and `EVIDENCE_DIR=docs/evidence/new-live-run`, then run `node tests/browser-check.mjs`. `BROWSER_ENGINES=firefox` selects Firefox alone. Keep a new evidence directory to preserve earlier results.

## Required follow-up before submission

1. Review the completed two-engine evidence and show the workflow/report in the video. A local Firefox demonstration is optional additional evidence; do not describe the Linux run as a local manual test.
2. Check the repository and video links for instructor access. The app loaded in fresh unauthenticated contexts; inspect Network and Console live while recording to satisfy the video requirement.
3. Record actual network/device performance observations, keyboard use, and responsive layout in the screen/webcam video.
4. Review remaining accessibility checks. Update this report with observations rather than substituting app checkbox states for evidence.

Student follow-up: **[date / browser versions / deployment URL / observed results / evidence]**
