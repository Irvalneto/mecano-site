/* V2: chips de servico como abas acessiveis (tablist/tab/tabpanel).
   Sem JS todos os cartoes ficam visiveis, empilhados, e os chips sao ancoras. */
document.querySelectorAll("[data-tabs]").forEach((root) => {
  const tabs = [...root.querySelectorAll("[role=tab]")];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
  if (!tabs.length || panels.some((p) => !p)) return;
  root.classList.add("is-tabs");

  const select = (i, focus, user) => {
    tabs.forEach((t, j) => {
      t.setAttribute("aria-selected", String(i === j));
      t.tabIndex = i === j ? 0 : -1;
      panels[j].hidden = i !== j;
    });
    if (focus) tabs[i].focus();
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
      const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      select(to, true, true);
    });
  });
  addEventListener("hashchange", () => fromHash(true));
  if (!fromHash(true)) select(0);
});
