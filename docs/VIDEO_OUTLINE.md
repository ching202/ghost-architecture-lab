# Video outline — target 6:30

Record your **screen and live webcam/face throughout**. Use these as speaking cues, not a script to read verbatim. Keep the camera away from the inspector, form controls, and DevTools. This file is a plan; no video or webcam recording has been generated.

## Before recording

- Review the sources and be ready to explain the difference between logical modules and deployed services in your own words.
- Use the final instructor-accessible deployment; open the public GitHub README in another tab.
- Complete Firefox/Safari testing and update `QA_REPORT.md` with genuine results. Keep both engines ready for the recording.
- Reset the demo and QA notebook. Prepare DevTools and responsive presets (1920 × 1080, 768 × 1024, 390 × 844).
- Put your webcam on screen; test mic level, screen readability, and a short sample recording. Keep personal notifications out of frame.
- Rehearse once with a timer. Aim for 6:30, leaving 30 seconds before the upper limit.

## 0:00–2:00 — Architecture and AI teardown

**0:00–0:20 · Introduce the project.**

Show Architecture. Explain that Ghost is the analyzed open-source application; this separate companion app is an interactive visualizer plus a local publishing simulation.

**0:20–1:05 · Trace the boundaries.**

Point to browser, Nginx, Core, and MySQL. Select Core and explain the single process boundary. Select APIs to distinguish read-only Content API from authenticated Admin writes. Explain that “modular monolith” is your analytical description alongside Ghost's decoupled product structure.

**1:05–1:30 · Compare two paths.**

Switch Read a story → Publish a post. Explain that native themes use internal calls; a headless client can use the Content API. Responses return to the caller along the request path.

**1:30–2:00 · Show evidence and audit.**

Open AI & evidence. Discuss two checks: modules are not necessarily microservices; Redis is optional. Show one official source link and the README's prompt appendix. State that Codex generated the scaffold and documentation, then explain what was verified and the actual UI defects found during QA. Do not claim nonexistent AI hallucinations or personal changes.

## 2:00–4:00 — Live functionality

**2:00–2:25 · Create a draft.**

Open Publishing lab. Mention the explicit simulation notice. Use:

```text
Title: Designing a dependable publishing flow
Story: A draft should remain private until publication succeeds. Clear boundaries make validation and recovery easier to test.
```

Save and show the draft count. Point out that the reading view is still empty.

**2:25–2:55 · Publish and unpublish.**

Publish the story and point to the public reading view. Return it to draft, then publish again. Explain the state transition and the shared pure-domain logic.

**2:55–3:25 · Inject failure.**

Enable database outage. Attempt to unpublish or save a second story. Show unchanged state, retained input, and the request log. Restore the simulated database and retry. Explain that this demonstrates an invariant, not a real MySQL transaction or realistic read availability during an outage.

**3:25–4:00 · Show persistence and notebook.**

Reload to show browser-local persistence. Briefly demonstrate duplicate titles producing unique slugs. Open QA notebook and explain that checks are human observations; the JSON export is not proof that tests ran.

## 4:00–6:00 — Live QA with DevTools

**4:00–4:30 · Functional/edge cases.**

Submit a blank form. Show both validation messages and focus. Try whitespace or a short story. Paste a long title; show the character cap.

**4:30–5:00 · Responsive design.**

Use the DevTools device toolbar, visibly switching desktop → tablet → 390 px mobile. Show Architecture and Publishing, including the map, wrapped text, and usable controls.

**5:00–5:30 · Console, assets, and second engine.**

Open Console, clear it, reload, and perform a core action. Show no uncaught errors. Show successful app requests in Network. Switch to Firefox or Safari and repeat a quick draft/publish action; identify the browser/version. This step must be completed personally because the generated environment could not launch Firefox.

**5:30–6:00 · Accessibility and performance.**

Use Tab to show visible focus and Enter/Space to activate controls. Show an actual final-URL load measurement from Network/Performance with its device/network context. Open the QA report to distinguish the completed Chrome checks from the completed follow-up checks you added. Avoid treating fixture timings as internet performance measurements.

## 6:00–6:30 — Retrospective

Give one engineering lesson in your own words:

- Architecture diagrams must communicate process and trust boundaries, not merely list technologies.
- A modular core simplifies local interactions but shares runtime resources and failures.
- AI sped up drafting; official sources and executable tests established confidence.

Show the public repository, deployment, and AI disclosure. End by 6:30–6:45. Upload to the requested video service with link access suitable for the instructor, then test that link signed out.
