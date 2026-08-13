# Agent notes for 03-asteroids

## Project shape
- Single-file HTML5 Canvas Asteroids clone. Zero dependencies, no bundler, no build step.
- Entry points: `index.html` loads `game.js`. Canvas is fixed at 1040×780 (1.3x of the original 800×600); `W`/`H` in `game.js` are derived from the canvas attributes.
- All game logic lives in `game.js`; styles are inline in `index.html`.
- Core entities: `Ship`, `Bullet`, `Asteroid`, `ShootingStar`, `PowerUp`, `Particle`.
- Mechanics include classic asteroid shooting, lives/levels, periodic shooting stars (bonus target), and a speed-boost power-up.

## Run / verify
- Open `index.html` directly in a browser, or serve locally:
  ```bash
  npx serve .
  ```
  Then visit `http://localhost:3000`.
- There are no automated tests or lint/type checks. Validate changes by playing the game in a browser.

## Code conventions
- Vanilla ES6+ JavaScript. Uses `requestAnimationFrame` with a `dt` capped at `0.05s`.
- Game state: `'playing' | 'dead' | 'gameover'`.
- World is toroidal: objects wrap at canvas edges via the `wrap()` helper.
- Input keys use `e.code` (`Space`, `ArrowUp`, etc.); arrow keys and space call `preventDefault()`.
- Entities share a simple lifecycle: `update(dt)`, `draw()`, and a `dead` flag for removal.
- Audio is generated with the Web Audio API (`ensureAudio`, `playSpeedSound`).

## Gotchas
- Editing `game.js` is sufficient for nearly any change.
- Keep user-facing text in Spanish (the README and HUD already are).
- Spawning uses safe distances (`SAFE_DIST`) to avoid placing asteroids or shooting stars on top of the ship.
- Shooting stars expire after a fixed lifetime and spawn small asteroids if not destroyed.

## Agent preferences
- When asking the user a question, present options as a selection using the `question` tool.
