# Castaway Island

An original browser-native animated island diorama: a stranded castaway, 30-second visual comedy, code-generated ocean and props, procedural sound, and orbit controls.

**Live:** https://xtreemze.github.io/castaway/

## Stack

Vite+ 1.3, Three.js, native Web Audio, GitHub Actions, and GitHub Pages. The original diorama is preserved, with its browser module moved to `src/main.js` and Three.js imported from the npm dependency rather than a CDN.

## Workflow

All changes can be authored through GitHub issues, branches, and pull requests. CI executes `node --check src/main.js` and `vp build` using hosted GitHub runners. The `main` branch deploys its compiled `dist/` artifacts to GitHub Pages. In repository Settings → Pages choose **GitHub Actions** as the source.

## Interactions

Drag to orbit, scroll or pinch to zoom, **Next scene** to select a vignette, **Pause** to suspend the narrative, **Night** to change lighting, and **Enable sound** to activate procedural ambience after a user gesture.

## Roadmap

Extract the narrative into typed, seeded, replayable event modules; make procedural character poses declarative; add screenshot-driven Playwright tests and performance reporting. Preserve the original staged visual-comedy tone.

All art and geometry are original interpretations inspired by classic screensaver physical comedy.
