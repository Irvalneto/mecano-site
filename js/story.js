/* Historia de rolagem da home: a etapa que cruza o meio da tela vira a ativa e
   o palco (porca) troca de estado via data-step. Sem JS ou com movimento
   reduzido nada acontece: o CSS entrega a porca pronta e as 4 etapas em lista. */
(() => {
  const root = document.querySelector(".story");
  const track = root && root.querySelector("[data-story]");
  if (!track || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

  const steps = [...track.querySelectorAll(".story-step")];
  const show = (el) => {
    steps.forEach((s) => s.classList.toggle("is-active", s === el));
    track.dataset.step = el.dataset.step;
  };
  root.classList.add("is-live");
  show(steps[0]);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.isIntersecting && show(e.target));
  }, { rootMargin: matchMedia("(min-width: 1024px)").matches ? "-45% 0px -45% 0px" : "-60% 0px -30% 0px" });  // celular: faixa abaixo do palco fixo
  steps.forEach((s) => io.observe(s));
})();
