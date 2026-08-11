# Agent notes for 03-asteroids

## Project shape
- Single-file HTML5 Canvas Asteroids clone. Zero dependencies, no bundler, no build step.
- Entry points: `index.html` loads `game.js`. Canvas is fixed at 800×600.
- All game logic lives in `game.js`; styles are inline in `index.html`.

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

## Gotchas
- Editing `game.js` is sufficient for nearly any change.
- Keep user-facing text in Spanish (the README and HUD already are).
