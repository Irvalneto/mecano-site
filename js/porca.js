/* N4: porca do hero em 3D que reage ao mouse.
   - Espessura: camadas escurecidas da face empilhadas em Z (bitmaps pre-escurecidos
     uma vez; nada de filtro por frame).
   - Movimento: so transform, suavizado por tempo (igual em 60 e 144 Hz).
   - Brilho: gradiente que se MOVE por transform dentro de uma mascara estatica
     (nada e repintado a cada frame).
   Decorativo: so com mouse (hover/fine) e sem prefers-reduced-motion.
   Age no wrapper .hero-nut, vale para a imagem parada e para o canvas do F15. */
(() => {
  const el = document.querySelector(".hero-nut");
  const face = el && el.querySelector("img");
  if (!face || !matchMedia("(hover: hover) and (pointer: fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const LAYERS = 30, STEP = 1.7;        // 30 x 1,7 px = ~51 px de profundidade
  const MAX_X = 24, MAX_Y = 42;          // graus: vira inteira p/ os dois lados
  const REST_X = 10, REST_Y = -16;
  const TAU = 150;                       // ms: constante de tempo (maior = mais suave)

  // Palco: o que gira. O .hero-nut fica parado e recebe o mouse; se ele mesmo
  // girasse, a borda "fugiria" do cursor e a porca voltaria ao repouso (tremida).
  const stage = document.createElement("span");
  stage.className = "hero-nut-stage";
  while (el.firstChild) stage.appendChild(el.firstChild);
  el.appendChild(stage);

  // Brilho: mascara estatica (CSS) > luz que se desloca por transform.
  const sheen = document.createElement("span");
  sheen.className = "hero-nut-sheen";
  const glow = document.createElement("span");
  sheen.appendChild(glow);
  stage.appendChild(sheen);

  const build = () => {
    const w = 450, h = Math.round(450 * face.naturalHeight / face.naturalWidth);   // ~nitidez nativa em 1x/2x (300 ficava borrado e gerava halo na lateral)
    for (let i = LAYERS; i >= 1; i--) {
      const c = document.createElement("canvas");
      c.width = w; c.height = h; c.className = "hero-nut-layer"; c.setAttribute("aria-hidden", "true");
      const g = c.getContext("2d");
      g.drawImage(face, 0, 0, w, h);
      // Lateral = silhueta da face em cor UNICA por camada (nao uma copia da textura: 30 copias
      // diferentes se misturavam num halo borrado). Do tom de aco escuro (junto da face) ate um
      // aco quase grafite (no fundo da espessura): degrade com borda externa nitida, sem plato nem nevoa.
      const t = Math.pow(i / LAYERS, 0.55);
      const m = (a, b) => Math.round(a + (b - a) * t);
      g.globalCompositeOperation = "source-in";
      g.fillStyle = `rgb(${m(74, 28)},${m(71, 26)},${m(65, 23)})`;
      g.fillRect(0, 0, w, h);
      c.style.transform = `translateZ(${-i * STEP}px)`;
      stage.insertBefore(c, face);
    }
    // espessura entra com fade (CSS) em vez de "pular" para o lugar
    requestAnimationFrame(() => stage.classList.add("is-built"));
  };
  (face.decode ? face.decode() : Promise.resolve()).then(build).catch(() => {});

  let tx = REST_X, ty = REST_Y, x = tx, y = ty;     // rotacao: alvo e atual
  let gx = 0.5, gy = 0.5, gtx = 0.5, gty = 0.5;     // posicao do brilho (0..1)
  let last = 0, drawn = 0, raf = 0, hold = 0, inside = false, visible = true;
  const t0 = performance.now();
  const smooth = (p) => p * p * (3 - 2 * p);

  // Sem o mouse em cima, a luz "respira": orbita eliptica lenta (~20 s) e pulso de intensidade
  // (referencia: Next.js Flare, vgpu.sh). Com o mouse, a luz segue o cursor e o pulso sobe a 1.
  const tick = (now) => {
    const dt = Math.min(now - (last || now - 16), 50);
    if (!inside && now - drawn < 33) { raf = requestAnimationFrame(tick); return; }   // repouso: ~30 fps
    last = now; drawn = now;
    const k = 1 - Math.exp(-dt / TAU), kl = 1 - Math.exp(-dt / 300);
    x += (tx - x) * k; y += (ty - y) * k;
    const s0 = (now - t0) / 1000;
    if (!inside) {
      const ph = s0 * 0.32, rad = 0.34 + 0.09 * Math.sin(ph * 0.83);
      gtx = 0.5 + Math.cos(ph) * rad * 1.1; gty = 0.5 - Math.sin(ph) * rad * 0.85;
    }
    gx += (gtx - gx) * kl; gy += (gty - gy) * kl;
    hold += ((inside ? 1 : 0) - hold) * kl;
    const pulse = 0.2 + 0.8 * smooth(0.5 + 0.5 * Math.sin(s0 * 0.9)), idle = 0.55 * pulse;
    el.style.setProperty("--sheen", (idle + (1 - idle) * hold).toFixed(3));
    stage.style.transform = `perspective(750px) rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
    const r = el.offsetWidth;                         // brilho: ~85% da largura
    const s = r * 0.85;
    glow.style.width = glow.style.height = `${s}px`;
    glow.style.transform = `translate3d(${(gx * r - s / 2).toFixed(1)}px, ${(gy * el.offsetHeight - s / 2).toFixed(1)}px, 0)`;
    raf = visible && !document.hidden ? requestAnimationFrame(tick) : ((last = 0), 0);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(tick); };

  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    // curso total em 80% da caixa: vira inteira antes de o cursor chegar na borda
    const nx = Math.max(-1, Math.min(1, (px - 0.5) / 0.4)), ny = Math.max(-1, Math.min(1, (py - 0.5) / 0.4));
    ty = nx * MAX_Y; tx = -ny * MAX_X;
    gtx = px; gty = py; inside = true;
    go();
  });
  el.addEventListener("pointerleave", () => { tx = REST_X; ty = REST_Y; inside = false; go(); });
  // fora da tela ou aba oculta: o laco para de verdade
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) go(); }).observe(el);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) go(); });
  go();
})();
