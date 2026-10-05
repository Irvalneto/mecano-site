/* N4: porca do hero reage ao mouse (inclinacao com mola + brilho que segue o cursor).
   Decorativo: so com mouse (hover/fine) e sem prefers-reduced-motion.
   Age no wrapper .hero-nut, entao vale para a imagem parada e para o canvas do F15. */
(() => {
  const el = document.querySelector(".hero-nut");
  if (!el || !matchMedia("(hover: hover) and (pointer: fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const sheen = document.createElement("span");
  sheen.className = "hero-nut-sheen";
  el.appendChild(sheen);

  // Espessura: copias escurecidas da face empilhadas em Z. Inclinada, a porca
  // mostra as laterais (volume real), nao so um desenho achatado.
  const face = el.querySelector("img");
  const LAYERS = 22, STEP = 2.2;     // 22 x 2,2 px = ~48 px de profundidade
  if (face) for (let i = LAYERS; i >= 1; i--) {
    const l = face.cloneNode();
    l.className = "hero-nut-layer";
    l.style.transform = `translateZ(${-i * STEP}px)`;
    l.style.filter = `brightness(${(0.30 + 0.5 * (1 - i / LAYERS)).toFixed(2)})`;
    el.insertBefore(l, face);
  }

  const MAX = 24;                    // graus de inclinacao maxima
  const REST_X = 10, REST_Y = -16;   // pose de repouso (ja mostra volume)
  let tx = REST_X, ty = REST_Y, x = REST_X, y = REST_Y, raf = 0;   // alvo e atual

  const tick = () => {
    x += (tx - x) * 0.14; y += (ty - y) * 0.14;   // mola amortecida
    el.style.transform = `perspective(750px) rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.02 ? requestAnimationFrame(tick) : 0;
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(tick); };

  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    ty = REST_Y + (px - 0.5) * 2 * MAX; tx = REST_X - (py - 0.5) * 2 * MAX;
    sheen.style.setProperty("--mx", `${px * 100}%`);
    sheen.style.setProperty("--my", `${py * 100}%`);
    go();
  });
  el.addEventListener("pointerleave", () => { tx = REST_X; ty = REST_Y; go(); });
  go();
})();
