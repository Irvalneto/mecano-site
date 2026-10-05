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

  const MAX = 14;                    // graus de inclinacao maxima
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;   // alvo e atual (rotX, rotY)

  const tick = () => {
    x += (tx - x) * 0.14; y += (ty - y) * 0.14;   // mola amortecida
    el.style.transform = `perspective(900px) rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.02 ? requestAnimationFrame(tick) : 0;
    if (!raf && !tx && !ty) el.style.transform = "";
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(tick); };

  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    ty = (px - 0.5) * 2 * MAX; tx = -(py - 0.5) * 2 * MAX;
    sheen.style.setProperty("--mx", `${px * 100}%`);
    sheen.style.setProperty("--my", `${py * 100}%`);
    go();
  });
  el.addEventListener("pointerleave", () => { tx = ty = 0; go(); });
})();
