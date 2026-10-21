# Deployment record

**Status: deployed and smoke-tested on October 21, 2026.**

- [Live website](https://ching202.github.io/ghost-architecture-lab/)
- [Public GitHub repository](https://github.com/ching202/ghost-architecture-lab)
- [README and architecture analysis](https://github.com/ching202/ghost-architecture-lab#readme)
- [First successful deployment run](https://github.com/ching202/ghost-architecture-lab/actions/runs/39689303104)
- [Current workflow runs](https://github.com/ching202/ghost-architecture-lab/actions)

The repository is public under `ching202`. Settings → Pages uses GitHub Actions. Each push to `main` runs `.github/workflows/pages.yml`, tests domain behavior with Node's built-in test runner, and publishes `dist/` to GitHub Pages. The application is buildless; its five source files are served directly. No third-party package installation or deployment secret is required.

## Live verification

The workflow returned the website URL above. The Codex in-app browser loaded the real HTTPS URL and exercised component selection, the publishing request trace, empty-form validation, draft creation, rejected publication during a simulated database outage, successful retry, reload persistence, unpublication, and reset. The AI evidence and QA notebook routes rendered. The captured warning/error console log was empty. Temporary test stories were reset.

![Live architecture page](evidence/live-deployment.jpg)

This is a static educational simulation: publishing a story changes only that browser's local data. It does not publish posts to a real Ghost server or to GitHub.

## Remaining student checks

Repeat the core flow in Firefox or Safari, inspect Network in DevTools, and check all submission links in a signed-out/incognito window. A complete second-engine test and signed-out/instructor-account access check are not claimed here. The browser session used for repository creation was signed into GitHub, although the repository's Public badge and Pages publication were verified. See [QA_REPORT.md](QA_REPORT.md) for test limitations.

An earlier Sites hosting attempt did not complete. GitHub Pages is the active deployment; no Sites URL is needed for submission.
