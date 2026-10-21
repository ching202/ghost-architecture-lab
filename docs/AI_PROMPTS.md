# AI disclosure and prompt appendix

Prepared October 21, 2026. This records the prompts and selected initial outputs actually used. It does not invent a sequence of student-authored prompts, manual refactors, or model hallucinations.

## Tool and contribution

OpenAI Codex desktop generated the analysis, implementation, tests, and documentation. A research subagent checked Ghost's official documentation and upstream repository. The exact backend model revision is not exposed in these deliverables. The project did not use Claude, Gemini, or GitHub Copilot.

The student supplied the assignment and selected the scope. Student review, final deployment access checks, and the screen/webcam presentation are still the student's work to perform. Add any later prompts and personal changes here without attributing generated work to yourself.

## Exact user input

The first user input was the complete assignment pasted as an attachment, preserved verbatim in [ASSIGNMENT.txt](ASSIGNMENT.txt), plus the file wrapper stating “Pasted text contains the user's request.” There was no separate detailed implementation prompt after “My request:”.

The assistant asked:

> What would you like me to produce from this assignment?

The exact selected user answer was:

> Full working project, README, QA checklist, and video outline (Recommended)

## Assistant's initial implementation brief

This is the actual initial response after the scope selection, not a user prompt:

> I’ll build an interactive Ghost architecture explorer with a publishing simulation, then add the README, QA evidence, and a timed video outline. I’m using the Sites skill to build and preview the app, and I’ll verify the architecture against Ghost’s official sources.

## Exact delegated research prompt

```text
Research Ghost's architecture using only official docs and upstream source. Return a concise verified analysis, exact supporting URLs, distinctions between Ghost core, Ghost Admin, Content/Admin APIs, themes, MySQL, Nginx, caching, email integrations, process/communication boundaries, and 4 realistic potential AI assumptions to audit. Do not invent that hallucinations happened. Note current docs/version limits. Use web tools. Do not edit files or create Sites. This is a bounded research task for the Sites skill.
```

## Initial output preserved

[initial-core.js.txt](initial-core.js.txt) is an exact copy of the first generated `dist/core.js`, saved before browser QA. It implements validation, unique slugs, draft creation, publish/unpublish transitions, and versioned storage decoding. It is an initial code-output sample, not a fabricated chat response.

The initial architecture direction was refined using official evidence before it became the final UI. The final study distinguishes the main process boundary from HTTP interfaces and labels “modular monolith” as our interpretation. It does not claim that the AI initially called Ghost microservices, required Redis, or invented an actual data-store choice.

## Verification audit

| Assumption examined | Finding and implementation effect | Primary evidence |
| --- | --- | --- |
| Diagram boxes imply independent services | Show one Core process boundary around theme, APIs, and services; keep browser and database outside. | [Runtime architecture](https://github.com/TryGhost/Ghost/blob/main/docs/codebase/runtime-architecture.md) |
| Themes call the public Content API over HTTP | Show the native theme path as internal calls; distinguish custom headless clients. | [Runtime architecture](https://github.com/TryGhost/Ghost/blob/main/docs/codebase/runtime-architecture.md) |
| Redis must be installed | Treat caching separately from durable storage; do not put mandatory Redis in the default map. | [Configuration](https://docs.ghost.org/config/) |
| SQLite/PostgreSQL are supported production substitutes | Label the production data service MySQL and avoid presenting other engines as interchangeable. | [Hosting](https://docs.ghost.org/hosting/) |
| SMTP config is sufficient for native bulk newsletters | Separate transactional mail from bulk email and link the bulk-provider requirement. | [Newsletters](https://docs.ghost.org/newsletters/) |
| Admin integration secrets can be put in browser JS | Build a credential-free simulation. A real integration would require a trusted server. | [Admin API authentication](https://docs.ghost.org/admin-api/) |

The research also found version-sensitive documentation. Current upstream browser-app details may reflect unreleased work, and documentation pages can differ in runtime guidance. The prototype avoids a fixed Ghost Admin framework claim and does not claim a latest stable Ghost release. Its own Node requirement is documented separately.

## Actual implementation findings and corrections

1. **Switch hit target:** the decorative toggle span intercepted Playwright clicks on the checkbox. Added `pointer-events: none` to the decoration. Both pointer and keyboard checks were rerun.
2. **320 px navigation overflow:** four nowrap navigation labels exceeded the viewport. Added a two-column navigation layout at the narrowest width and reran all four routes.
3. **Skip-link routing:** code review found that navigating to `#main` could select the default section. Added a focused skip-link handler that keeps the current section, with a keyboard regression assertion.
4. **Test timing:** a test read section visibility before the hash-change handler completed. The test now waits for the destination section to be visible. This was a test synchronization correction, not a falsely claimed product bug.
5. **Diagram precision:** moved the database arrow to terminate above the MySQL column rather than between MySQL and optional integrations.
6. **Standalone preview generation:** JavaScript string replacement initially interpreted a literal `$$` during bundling. Function replacers now preserve the source bytes, and a direct-file browser smoke test confirms the preview works.

## Environment limits, not product fixes

Loopback requests were denied/timed out in the execution environment, even after network permission was granted. Chrome tested the exact static files through Playwright routing. Firefox exited before navigation with a Windows process error; no Firefox pass is claimed. These are documented in [QA_REPORT.md](QA_REPORT.md), with follow-up steps in [QA_CHECKLIST.md](QA_CHECKLIST.md).

## Student follow-up log

The user subsequently requested (exact text):

> Help me upload this to a public GitHub repository and deploy it so I have working links to submit.

Codex used the signed-in GitHub website to publish the source and configure GitHub Pages. This is an assistant contribution; see the deployment record for verified results.

The user requested a recording script (exact text):

> Write me a 5–7 minute video script and tell me exactly what to click and show on screen while I explain the project.

The user then requested (exact text):

> Help me run the Firefox checks and update the QA report with the actual results before I record the video.

And clarified (exact text):

> I talk slow as well so you can make it shorter

Codex repeated the Windows launch probe, preserved its pre-navigation failure, and added a reproducible GitHub Actions workflow using Ubuntu 24.04. The live deployment passed all 15 check groups in Firefox 153.0 and Chromium 151.0.7922.34. The machine-generated evidence was downloaded, its archive digest verified, and Firefox screenshots inspected. Only the test harness, workflow, and documentation changed; no application fix was needed for this run. The report distinguishes this headless Linux test from a student-operated Windows browser. A shorter video script provides about 400 spoken words plus timed screen actions. See [QA_REPORT.md](QA_REPORT.md) and [VIDEO_SCRIPT_SHORT.txt](VIDEO_SCRIPT_SHORT.txt).

Before submission, replace these placeholders with your actual activity:

- Sources I personally inspected: **[complete after review]**
- Changes I made and why: **[complete honestly; do not claim generated changes]**
- Final deployment tested in Chromium and Firefox/Safari: **[date, versions, result]**
- Additional prompts and outputs: **[append exact text if any]**
