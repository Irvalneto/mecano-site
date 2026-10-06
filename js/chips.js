/* V2: chips de servico como abas acessiveis (tablist/tab/tabpanel).
   Sem JS todos os cartoes ficam visiveis, empilhados, e os chips sao ancoras. */
document.querySelectorAll("[data-tabs]").forEach((root) => {
  const tabs = [...root.querySelectorAll("[role=tab]")];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
  if (!tabs.length || panels.some((p) => !p)) return;
  root.classList.add("is-tabs");
  panels.forEach((p) => p.tabIndex = 0); // painel entra na ordem de Tab (padrao WAI-ARIA)

  const center = (i) => {
    const strip = tabs[i].parentElement, c = tabs[i].getBoundingClientRect(), r = strip.getBoundingClientRect();
    strip.scrollLeft += c.left - r.left - (strip.clientWidth - c.width) / 2;
  };
  const select = (i, focus, user) => {
    tabs.forEach((t, j) => {
      t.setAttribute("aria-selected", String(i === j));
      t.tabIndex = i === j ? 0 : -1;
      panels[j].hidden = i !== j;
    });
    if (focus) tabs[i].focus();
    // chip selecionado centralizado na faixa rolavel (so scrollLeft da faixa; a pagina nao rola)
    center(i);
    if (user) history.replaceState(null, "", "#" + panels[i].id);
  };
  const fromHash = (scroll) => {
    const i = panels.findIndex((p) => "#" + p.id === location.hash);
    if (i < 0) return false;
    select(i);
    if (scroll) root.scrollIntoView({ block: "start" });
    return true;
  };

  tabs.forEach((t, i) => {
    t.addEventListener("click", (e) => { e.preventDefault(); select(i, false, true); });
    t.addEventListener("keydown", (e) => {
      const n = tabs.length;
      if (e.key === " ") { e.preventDefault(); select(i, true, true); return; } // Espaco ativa (link nao reage a Espaco)
      const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      select(to, true, true);
    });
  });
  addEventListener("hashchange", () => fromHash(true));
  if (!fromHash(false)) select(0);
  else {
    // carga a frio com #hash: o navegador rola por conta propria apos o load; reposiciona abaixo do header
    // fontes/imagens mudam a largura dos chips ate o load: recentraliza o chip do hash junto
    const go = () => setTimeout(() => {
      root.scrollIntoView({ block: "start" });
      center(tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));
    }, 60);
    if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
  }
});
