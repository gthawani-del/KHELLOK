# YudhKala Boxing V0.1 | Playable Browser Prototype

One 60-second PvCPU round using two instances of the real repaired Meshy 6 Boxer 01 GLB.

## Play
Easiest desktop/offline: open YudhKala_Boxing_Play_Offline.html in Chrome or Edge. It contains the real 3D model and bundled code; no Python, npm or internet required.
Or serve this source directory with: python3 -m http.server 8000
Then open http://localhost:8000

Mobile: HTML has touch controls in portrait, but actual iPhone/Android Safari/hardware have NOT been tested. To play on a phone reliably, host the source on HTTPS; opening local HTML files from mobile Files preview may be blocked by OS restrictions.

## Controls
- W or Up: advance
- S or Down: retreat
- A / D: strafe
- J: jab; K: hook; L: uppercut
- Hold Space: guard
- Shift: dodge
- P: pause
- Touch: D-pad left, attacks/guard right

## Rules
- 60-second round, 100 HP each, regenerating stamina.
- Same damage/stamina costs for player and CPU: jab=8, hook=13, uppercut=16; guarding reduces damage to about 22%.
- CPU reacts using positions and motion timing. Easy and Standard modes.
- KO or the fighter with more HP after timer wins.
- Distance/timing based collision; no real glove collider, ragdoll, referee or rope simulation.
- Ring bounds and minimum fighter separation.
- No accounts, server, purchases or gambling.
- CPU blue corner is a palette variant of player 3D asset, not a distinct model.

## Architecture
- src/combat-core.mjs: engine-independent match rules, movement, CPU and damage.
- src/game.mjs: Three.js renderer, animation binding and input.
- assets/fighter01_r2.glb: real 24-bone human model and eight animations.
- vendor: locally copied Three.js and GLTFLoader; no runtime CDN requests.
- tests/: deterministic combat assertions, Chromium tests.
- dist/game.bundle.js: generated bundle for offline HTML.

## QA
- 132 combat assertions passed.
- Actual Chromium desktop/mobile emulation loads 2 characters and all 8 animations.
- Offline HTML opened from file:// in Chromium, with no external HTTP and no JS exceptions.
- 390px touch layout tested, no horizontal overflow, touch targets at least 44px.
- Actual Safari/iPhone and Android hardware FPS remain UNVERIFIED.
- No extra paid generation or production GitHub repo changes.

## Next
One unique blue-corner fighter, refine animation and collision, add true physical KO, run real-phone benchmarks, consider multiplayer only when gameplay approved.
