/* F15: liquid metal na porca do hero (@paper-design/shaders, versao fixa).
   Carrega DEPOIS do conteudo (nao bloqueia render). O ShaderMount ja pausa fora
   da tela (IntersectionObserver) e com a aba oculta.
   Sem canvas com prefers-reduced-motion ou sem WebGL2: fica a imagem parada do N4.
   Mascara pre-processada offline (assets/marca/porca-liquid.png, R = gradiente da
   borda, G = opacidade) para nao rodar o solver no navegador do visitante. */
(() => {
  const el = document.querySelector(".hero-nut");
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const hasWebGL2 = (() => {
    try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
  })();
  if (!hasWebGL2) return;

  // So os 4 modulos usados (o bundle +esm traz todos os shaders: ~900 ms de parse no celular).
  const LIB = "https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.81/dist/";
  const MASK = "assets/marca/porca-liquid.png";

  const start = async () => {
    try {
      const [mount, sizing, colors, metal, mask] = await Promise.all([
        import(LIB + "shader-mount.js"), import(LIB + "shader-sizing.js"),
        import(LIB + "get-shader-color-from-string.js"), import(LIB + "shaders/liquid-metal.js"),
        new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = MASK; }),
      ]);
      const { ShaderMount } = mount, { ShaderFitOptions, defaultObjectSizing: d } = sizing;
      const color = colors.getShaderColorFromString, { liquidMetalFragmentShader } = metal;

      // Cores/parametros: ver comentario LIQUID METAL em css/tokens.css (sem solda no metal).
      const uniforms = {
        u_fit: ShaderFitOptions[d.fit], u_scale: d.scale, u_rotation: d.rotation,
        u_offsetX: d.offsetX, u_offsetY: d.offsetY, u_originX: d.originX, u_originY: d.originY,
        u_worldWidth: d.worldWidth, u_worldHeight: d.worldHeight,
        u_colorBack: color("#0E0D0B00"),   // grafite transparente: o hero ja e grafite
        u_colorTint: color("#F4F2EC"),     // papel
        u_image: mask, u_isImage: true, u_shape: 0,
        u_repetition: 3.5, u_softness: 0.4, u_shiftRed: 0, u_shiftBlue: 0,
        u_distortion: 0.1, u_contour: 0.4, u_angle: 70,
      };

      const host = document.createElement("span");
      host.className = "hero-nut-shader";
      host.setAttribute("aria-hidden", "true");
      const face = el.querySelector("img");
      // dentro do palco 3D (js/porca.js) quando existir; senao direto no bloco
      (face ? face.parentNode : el).insertBefore(host, face ? face.nextSibling : null);

      new ShaderMount(host, liquidMetalFragmentShader, uniforms, { alpha: true, premultipliedAlpha: true },
                      0.3, 0, 2);
      // 2 quadros para o 1o desenho; so entao troca a imagem parada pelo canvas
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-live")));
    } catch { /* sem rede/GL: a imagem parada continua */ }
  };

  // 4 s depois do load: a imagem parada ja esta no hero e a compilacao do shader nao entra no TBT.
  const idle = () => setTimeout(() => ("requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 2500 }) : start()), 4000);
  if (document.readyState === "complete") idle(); else addEventListener("load", idle, { once: true });
})();
