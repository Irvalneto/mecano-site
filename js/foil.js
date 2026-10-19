/* Cartoes com acabamento "folha holografica": o cartao inclina pouco e o brilho perolado
   segue o mouse, revelado quando o cursor se aproxima (referencia: Holographic Card, vgpu.sh;
   tilt maximo 0.16 x 0.12 rad e suavizacao ~10/s da referencia, aqui em graus via CSS).
   So mouse e sem movimento reduzido. Escreve apenas variaveis CSS no cartao sob o cursor. */
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const MAX_X = 3, MAX_Y = 4;           // graus de inclinacao
  let active = null;

  const reset = (el) => {
    el.style.setProperty("--foil", "0");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  document.addEventListener("pointermove", (e) => {
    const el = e.target.closest?.("[data-foil]");
    if (active && active !== el) reset(active);
    active = el;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--fx", px.toFixed(3));
    el.style.setProperty("--fy", py.toFixed(3));
    el.style.setProperty("--foil", "1");
    el.style.setProperty("--ry", `${((px - 0.5) * 2 * MAX_Y).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-(py - 0.5) * 2 * MAX_X).toFixed(2)}deg`);
  }, { passive: true });

  document.addEventListener("pointerleave", () => active && (reset(active), (active = null)));

  document.querySelectorAll(".svc-card, .bento-cell").forEach((el) => el.setAttribute("data-foil", ""));
})();
