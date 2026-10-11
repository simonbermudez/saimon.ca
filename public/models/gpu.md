# GPU Model

The Tesla card on the site is modelled procedurally in code; there is no GLB asset.

- `src/gpu/teslaCard.js` — geometry (millimetre units): faceted shroud with glowing chevrons,
  full-length fin stack, copper vapor chamber + heat pipes, GPU package/die, 24× GDDR5,
  VRM, EPS-12V connector, PCIe x16 edge, backplate and vented full-height bracket.
- `src/gpu/textures.js` — runtime canvas textures (PCB, gold fingers, bracket vents, wordmark).
- `src/gpu/stage.js` — renderer, lighting, bloom, and the scroll choreography
  (hero → about → exploded anatomy → 4-card rack).
