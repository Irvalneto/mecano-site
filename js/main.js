// Mecano Soluções Digitais — comportamento do site (vanilla JS, sem dependências)

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initYear();
  initReveal();
  initContactForm();
  initFolderCards();
  initHighlightText();
  initHookSidebar();
  initHeroMeta();
  initWhatsappFloat();
  initAnalytics();
  fixHashLinksUnderBase();
});

/* --- Menu mobile --- */
function initMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-mobile");
  if (!toggle || !nav) return;

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    nav.classList.remove("is-open");
    document.body.style.overflow = "";
  };
  const open = () => {
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Fechar menu");
    nav.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    isOpen ? close() : open();
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // fecha o menu se a viewport crescer para desktop
  window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => {
    if (e.matches) close();
  });
}

/* --- Ano no rodapé (copyright sempre atual) --- */
function initYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

/* --- Reveal on scroll (progressivo, desliga sozinho sem reduced-motion) --- */
function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -8% 0px" }
  );

  items.forEach((el) => observer.observe(el));
  // rede de seguranca: se algo nunca cruzar o limiar (ou o observer falhar), nada fica escondido
  setTimeout(() => items.forEach((el) => el.classList.add("is-visible")), 4000);
}

/* --- Folder cards (home): entrada com stagger via anime.js.
   Sem anime.js/IO/motion reduzido, o CSS já entrega os cards visíveis. */
function initFolderCards() {
  const cards = document.querySelectorAll(".folder-card");
  if (!cards.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof anime === "undefined" || !("IntersectionObserver" in window)) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      const targets = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      if (!targets.length) return;
      anime({
        targets,
        opacity: [0, 1],
        translateY: [24, 0],
        rotate: [-2, 0],
        duration: 520,
        delay: anime.stagger(90),
        easing: "easeOutQuad",
      });
      targets.forEach((el) => obs.unobserve(el));
    },
    { threshold: 0.2 }
  );
  cards.forEach((card) => observer.observe(card));
}

/* --- Painel "Entrega/Código/Comunicação" do hero: entrada com stagger. */
function initHeroMeta() {
  const items = document.querySelectorAll(".hero-meta-item");
  if (!items.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof anime === "undefined") {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  anime({
    targets: items,
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 480,
    delay: anime.stagger(120, { start: 300 }),
    easing: "easeOutQuad",
  });
}

/* --- Highlighted text: barra desliza atrás da frase via anime.js.
   Fica visível estático por padrão; só "prepara" a animação quando
   anime.js + IntersectionObserver + motion normal estão disponíveis. */
function initHighlightText() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const bars = document.querySelectorAll(".hl-bg");
  if (!bars.length || typeof anime === "undefined" || !("IntersectionObserver" in window)) return;

  bars.forEach((bar) => { bar.style.transform = "scaleX(0)"; });

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        anime({ targets: entry.target, scaleX: [0, 1], duration: 600, easing: "easeOutExpo" });
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.8 }
  );
  bars.forEach((bar) => observer.observe(bar));
}

/* --- Hook sidebar (página Serviços): colapsa/expande em CSS puro
   (uma única propriedade — não precisa de JS para animar) e marca
   a seção ativa conforme o scroll. */
function initHookSidebar() {
  const sidebar = document.querySelector("#hook-sidebar");
  const toggle = document.querySelector("#hook-sidebar-toggle");
  if (!sidebar || !toggle) return;

  toggle.addEventListener("click", () => {
    const expanded = sidebar.classList.toggle("is-expanded");
    toggle.setAttribute("aria-expanded", String(expanded));
  });

  const links = Array.from(sidebar.querySelectorAll("a[href^='#']"));
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (!sections.length || !("IntersectionObserver" in window)) return;

  const setActive = (id) => {
    links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-40% 0px -50% 0px" }
  );
  sections.forEach((section) => observer.observe(section));
}

/* --- Formulário de contato: validação inline + loading + sucesso/erro --- */
// Relay do Twenty CRM (twenty/lead-relay.mjs). Vazio = formulário desligado: ao enviar,
// mostra telefone, e-mail e WhatsApp. Para ligar: colocar aqui a URL pública do relay.
const FORM_ENDPOINT = location.hostname === "localhost" ? "http://localhost:3021" : "";
const CONTACT_LINKS_HTML =
  '<a href="tel:+5591993066577">(91) 99306-6577</a>, ' +
  '<a href="https://wa.me/5591993066577?text=Ola!%20Vim%20pelo%20site%20da%20Mecano%20e%20quero%20conversar%20sobre%20um%20projeto." rel="noopener">WhatsApp</a> ou ' +
  '<a href="mailto:suporte@mecanodigital.com.br">suporte@mecanodigital.com.br</a>';

function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const status = form.querySelector(".form-status");
  const submitBtn = form.querySelector('button[type="submit"]');

  const validators = {
    name: (v) => v.trim().length >= 2 || "Informe seu nome completo.",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Informe um e-mail válido.",
    service: (v) => v !== "" || "Selecione o tipo de serviço.",
    message: (v) => v.trim().length >= 10 || "Conte um pouco mais sobre o projeto (mín. 10 caracteres).",
  };

  function validateField(input) {
    const rule = validators[input.name];
    if (!rule) return true;
    const result = rule(input.value);
    const field = input.closest(".field");
    const errorEl = field.querySelector(".field-error");
    if (result === true) {
      field.removeAttribute("data-invalid");
      return true;
    }
    field.setAttribute("data-invalid", "true");
    if (errorEl) errorEl.textContent = result;
    return false;
  }

  form.querySelectorAll("input, select, textarea").forEach((input) => {
    input.addEventListener("blur", () => validateField(input));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.removeAttribute("data-state");

    const fields = Array.from(form.querySelectorAll("input[name], select[name], textarea[name]"));
    const allValid = fields.map(validateField).every(Boolean);
    if (!allValid) {
      fields.find((f) => f.closest(".field").hasAttribute("data-invalid"))?.focus();
      return;
    }

    // Formulário desligado: sem requisição, mostra os canais diretos (dados preservados).
    if (!FORM_ENDPOINT) {
      status.dataset.state = "info";
      status.innerHTML =
        "O envio pelo formulário ainda não está ativo. Fale com a gente por " + CONTACT_LINKS_HTML +
        ". A primeira conversa é sem custo e respondemos em até 1 dia útil.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.dataset.loading = "true";

    try {

      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!res.ok) throw new Error("request-failed");

      track("envio-formulario");
      status.dataset.state = "success";
      status.textContent = "Mensagem enviada. Retornamos em até 1 dia útil.";
      form.reset();
    } catch (err) {
      status.dataset.state = "error";
      status.innerHTML =
        "Não foi possível enviar pelo formulário agora. Fale com a gente por " + CONTACT_LINKS_HTML +
        " — respondemos em até 1 dia útil.";
    } finally {
      submitBtn.disabled = false;
      delete submitBtn.dataset.loading;
    }
  });
}

/* --- Botão flutuante de WhatsApp: some enquanto o formulário está na tela
   (para não cobrir campos nem o botão Enviar; a página já tem o botão inline). */
function initWhatsappFloat() {
  const float = document.querySelector(".wa-float");
  const form = document.querySelector("#contact-form");
  if (!float || !form || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(([entry]) => {
    float.classList.toggle("is-hidden", entry.isIntersecting);
    float.tabIndex = entry.isIntersecting ? -1 : 0;
  }).observe(form);
}

/* --- Medição de leads (GoatCounter: grátis, sem cookie, sem banner).
   Código do site vazio = nada carrega e nenhum erro. Para ligar: preencher abaixo. */
const GOATCOUNTER_CODE = "mecano";

function initAnalytics() {
  if (!GOATCOUNTER_CODE) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  document.head.appendChild(script);

  const kinds = [
    ["tel:", "clique-telefone"],
    ["mailto:", "clique-email"],
    ["https://wa.me/", "clique-whatsapp"],
    ["https://www.instagram.com/", "clique-instagram"],
  ];
  document.addEventListener("click", (e) => {
    const href = e.target.closest?.("a[href]")?.getAttribute("href");
    const hit = href && kinds.find(([prefix]) => href.startsWith(prefix));
    if (hit) track(hit[1]);
  });
}

// Evento de conversão; se o script foi bloqueado (ou o código está vazio), não faz nada.
function track(name) {
  try {
    window.goatcounter?.count?.({ path: name, title: name, event: true });
  } catch (_) {}
}

/* A 404 usa <base> no domínio de produção (para achar css/js em URL aninhada);
   links só com #âncora (skip-link) apontariam para a home, então ficam na página atual. */
function fixHashLinksUnderBase() {
  if (document.baseURI.split("#")[0] === location.href.split("#")[0]) return;
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.href = location.pathname + location.search + a.getAttribute("href");
  });
}
