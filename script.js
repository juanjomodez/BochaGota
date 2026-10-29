/* =========================================================
   BochaGota · Lógica de la página
   Todo funciona en el navegador: no hay base de datos.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initReveal();
  initCounters();
  initFacts();
  initMap();
  initBars();
  initReceiptChart();
  initTips();
  initQuiz();
  initComparator();
  initChallenge();
});

/* ---------------------------------------------------------
   Utilidades
   --------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt = (n, dec = 0) =>
  Number(n).toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });

function toast(msg) {
  let t = $(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2500);
}

/* Ejecuta una función la primera vez que el elemento aparece en pantalla */
function onVisible(el, fn, threshold = 0.3) {
  if (!("IntersectionObserver" in window)) return fn(el);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        fn(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold });
  io.observe(el);
}

/* ---------------------------------------------------------
   Navegación: menú móvil, barra de progreso, sección activa
   --------------------------------------------------------- */
function initNav() {
  const nav = $(".nav");
  const toggle = $(".nav-toggle");
  const links = $(".nav-links");
  const progress = $("#progress");
  const toTop = $("#to-top");

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  $$("a", links).forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );

  const onScroll = () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    progress.style.width = pct + "%";
    nav.classList.toggle("scrolled", h.scrollTop > 10);
    toTop.classList.toggle("show", h.scrollTop > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // Resaltar el enlace de la sección visible
  const sections = $$("main section[id]");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        $$("a", links).forEach((a) =>
          a.classList.toggle("current", a.getAttribute("href") === "#" + e.target.id)
        );
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => io.observe(s));
}

/* ---------------------------------------------------------
   Aparición suave al hacer scroll
   --------------------------------------------------------- */
function initReveal() {
  $$(".reveal").forEach((el) => onVisible(el, (t) => t.classList.add("visible"), 0.12));
}

/* ---------------------------------------------------------
   Contadores animados
   --------------------------------------------------------- */
function initCounters() {
  $$("[data-count]").forEach((el) =>
    onVisible(el, () => {
      const end = +el.dataset.count;
      const start = performance.now();
      const dur = 1200;
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    })
  );
}

/* ---------------------------------------------------------
   Carrusel de datos curiosos
   --------------------------------------------------------- */
const FACTS = [
  "Una llave abierta puede dejar salir entre 6 y 12 litros de agua por minuto.",
  "Una llave que gotea o un sanitario con fuga pueden perder cerca de 30 litros al día sin que lo notes.",
  "En tu recibo, 1 m³ equivale a 1.000 litros: ¡eso son unas 2.000 botellas de medio litro!",
  "Solo cerca del 2,5 % del agua del planeta es dulce, y la mayor parte está congelada o bajo tierra.",
  "Producir una sola taza de café requiere alrededor de 130 litros de agua: esa es su huella hídrica.",
  "En Bochalema, 30 de 32 encuestados cierran la llave mientras se cepillan. ¡Buen ejemplo!",
  "El 62,5 % de los vecinos encuestados no revisa con frecuencia el consumo en su recibo.",
  "La Ley 373 de 1997 creó en Colombia el Programa para el Uso Eficiente y Ahorro del Agua.",
];

function initFacts() {
  const text = $("#fact-text");
  const dots = $("#fact-dots");
  let i = 0;
  let timer;

  FACTS.forEach((_, k) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", "Dato " + (k + 1));
    b.addEventListener("click", () => show(k));
    dots.appendChild(b);
  });

  function show(k) {
    i = (k + FACTS.length) % FACTS.length;
    text.style.opacity = 0;
    setTimeout(() => {
      text.textContent = FACTS[i];
      text.style.opacity = 1;
    }, 200);
    $$("button", dots).forEach((d, j) => d.classList.toggle("active", j === i));
    clearInterval(timer);
    timer = setInterval(() => show(i + 1), 7000);
  }

  $("#fact-prev").addEventListener("click", () => show(i - 1));
  $("#fact-next").addEventListener("click", () => show(i + 1));
  show(0);
}

/* ---------------------------------------------------------
   Mapa ilustrado de Bochalema
   --------------------------------------------------------- */
const MAP_INFO = {
  uao: "Universidad Autónoma de Occidente: queda justo al sur del barrio, entre la Autopista Cali – Jamundí y la Calle 42. Desde aquí se hace la investigación.",
  barrio: "Barrio Bochalema: zona de expansión urbana del sur de Cali, entre la Autopista Cali – Jamundí y la Avenida Bicentenario. Aquí están los hogares que participaron en la encuesta y en el análisis de recibos.",
};

function initMap() {
  const info = $("#map-info");
  $$(".map-pin").forEach((pin) => {
    const activate = () => {
      $$(".map-pin").forEach((p) => p.classList.remove("active"));
      pin.classList.add("active");
      info.textContent = MAP_INFO[pin.dataset.info];
    };
    pin.addEventListener("click", activate);
    pin.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });
}

/* ---------------------------------------------------------
   Barras de la encuesta
   --------------------------------------------------------- */
function initBars() {
  $$(".bars").forEach((box) => {
    const data = JSON.parse(box.dataset.bars);
    const total = +box.dataset.total;
    box.innerHTML = data
      .map(
        ([label, n]) => `
        <div class="bar-row">
          <div class="bar-label"><span>${label}</span><span>${n} · ${fmt((n / total) * 100, 0)}%</span></div>
          <div class="bar-track"><div class="bar-fill" data-w="${(n / total) * 100}"></div></div>
        </div>`
      )
      .join("");
    onVisible(box, () => $$(".bar-fill", box).forEach((f) => (f.style.width = f.dataset.w + "%")), 0);
  });
  $$(".donut").forEach((d) => onVisible(d, () => d.classList.add("in"), 0));
}

/* ---------------------------------------------------------
   Gráfico comparativo de recibos
   --------------------------------------------------------- */
const RECEIPTS = {
  names: ["Residencia 1", "Residencia 2", "Residencia 3"],
  total: { data: [[5, 4], [2, 3], [8, 8]], fmt: (v) => fmt(v) + " m³" },
  persona: { data: [[5, 4], [0.67, 1], [4, 4]], fmt: (v) => fmt(v, v % 1 ? 2 : 0) + " m³" },
  costo: { data: [[81891, 69093], [32799, 38558], [76653, 75490]], fmt: (v) => "$" + fmt(v) },
};

function initReceiptChart() {
  const chart = $("#receipt-chart");
  const draw = (view) => {
    const { data, fmt: f } = RECEIPTS[view];
    const max = Math.max(...data.flat());
    chart.innerHTML = data
      .map(
        ([a, b], i) => `
        <div class="chart-group">
          <div class="chart-bars">
            <div class="chart-bar b1" data-h="${(a / max) * 100}"><span>${f(a)}</span></div>
            <div class="chart-bar b2" data-h="${(b / max) * 100}"><span>${f(b)}</span></div>
          </div>
          <div class="chart-name">${RECEIPTS.names[i]}</div>
        </div>`
      )
      .join("");
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        $$(".chart-bar", chart).forEach((b) => (b.style.height = `calc(${b.dataset.h}% - 26px)`))
      )
    );
  };

  $$(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab);
      });
      draw(tab.dataset.view);
    })
  );
  onVisible(chart, () => draw("total"), 0);
}

/* ---------------------------------------------------------
   Tarjetas de consejos: voltear y filtrar
   --------------------------------------------------------- */
function initTips() {
  $$(".tip").forEach((tip) => {
    const flip = () => tip.classList.toggle("flipped");
    tip.addEventListener("click", flip);
    tip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        flip();
      }
    });
  });

  $$(".filters .chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      $$(".filters .chip").forEach((c) => c.classList.toggle("active", c === chip));
      const f = chip.dataset.filter;
      $$(".tip").forEach((t) => t.classList.toggle("hidden", f !== "todos" && t.dataset.cat !== f));
    })
  );
}

/* ---------------------------------------------------------
   CUESTIONARIO DE HUELLA HÍDRICA
   Cada opción define su efecto en los litros y su calidad:
   "good" (bien), "mid" (puede mejorar) o "bad" (debe mejorar).
   Los valores son promedios de referencia para fines educativos.
   --------------------------------------------------------- */
const ICONS = {
  casa: '<svg viewBox="0 0 60 60" class="q-icon"><path d="M8 28 L30 10 L52 28 V52 H8Z" fill="#e9f8ff" stroke="#38b6e8" stroke-width="4" stroke-linejoin="round"/><rect x="24" y="34" width="12" height="18" fill="#a8e6b8"/></svg>',
  ducha: '<svg viewBox="0 0 60 60" class="q-icon"><path d="M40 6 v10 h-14" stroke="#8aa6b5" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M14 16 h18 l-3 7 h-12z" fill="#8aa6b5"/><g stroke="#38b6e8" stroke-width="3" stroke-linecap="round"><path d="M18 28 l-3 10"/><path d="M23 28 v14"/><path d="M28 28 l3 10"/></g><circle cx="44" cy="44" r="12" fill="#fff" stroke="#5cc785" stroke-width="4"/><path d="M44 37 v7 l5 3" stroke="#0b3b5c" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  diente: '<svg viewBox="0 0 60 60" class="q-icon"><rect x="8" y="26" width="34" height="8" rx="4" fill="#38b6e8" transform="rotate(-25 25 30)"/><rect x="34" y="14" width="16" height="10" rx="3" fill="#fff" stroke="#a8e6b8" stroke-width="3" transform="rotate(-25 42 19)"/><path d="M30 40 c-4 7 -6 10 -6 13 a6 6 0 0 0 12 0 c0 -3 -2 -6 -6 -13z" fill="#7fd3f5"/></svg>',
  plato: '<svg viewBox="0 0 60 60" class="q-icon"><ellipse cx="28" cy="38" rx="22" ry="10" fill="#fff" stroke="#38b6e8" stroke-width="4"/><ellipse cx="28" cy="36" rx="10" ry="4" fill="#e9f8ff"/><g fill="#fff" stroke="#a8e6b8" stroke-width="3"><circle cx="44" cy="16" r="6"/><circle cx="34" cy="10" r="4"/></g></svg>',
  lavadora: '<svg viewBox="0 0 60 60" class="q-icon"><rect x="10" y="6" width="40" height="48" rx="6" fill="#fff" stroke="#38b6e8" stroke-width="4"/><circle cx="30" cy="34" r="12" fill="#e9f8ff" stroke="#5cc785" stroke-width="4"/><circle cx="18" cy="14" r="2.5" fill="#5cc785"/></svg>',
  ropa: '<svg viewBox="0 0 60 60" class="q-icon"><path d="M8 26 h44 l-5 26 h-34z" fill="#f3c969"/><path d="M12 26 q18 -16 36 0" fill="#7fd3f5"/><circle cx="24" cy="22" r="5" fill="#a8e6b8"/><circle cx="36" cy="20" r="5" fill="#ffb3c1"/></svg>',
  ahorrador: '<svg viewBox="0 0 60 60" class="q-icon"><path d="M10 14 h28 v8 h-12 v8" stroke="#8aa6b5" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="20" y="30" width="12" height="7" rx="2" fill="#5cc785"/><g stroke="#7fd3f5" stroke-width="2"><path d="M22 40 v12"/><path d="M26 40 v14"/><path d="M30 40 v12"/></g><circle cx="48" cy="44" r="9" fill="#a8e6b8"/><path d="M44 44 h8 M48 40 v8" stroke="#fff" stroke-width="2.5"/></svg>',
  planta: '<svg viewBox="0 0 60 60" class="q-icon"><path d="M18 40 h24 l-4 16 h-16z" fill="#e0895a"/><path d="M30 40 v-16" stroke="#5cc785" stroke-width="3"/><path d="M30 30 q-14 -4 -14 -16 q12 2 14 16z M30 26 q12 -6 14 -18 q-12 4 -14 18z" fill="#5cc785"/></svg>',
  carro: '<svg viewBox="0 0 60 60" class="q-icon"><path d="M4 38 q0 -8 8 -9 l7 -9 h20 l8 9 q9 1 9 9 v6 h-52z" fill="#7fd3f5"/><circle cx="16" cy="45" r="6" fill="#0b3b5c"/><circle cx="44" cy="45" r="6" fill="#0b3b5c"/></svg>',
  fuga: '<svg viewBox="0 0 60 60" class="q-icon"><path d="M2 16 h28 q8 0 8 8 v34" stroke="#8aa6b5" stroke-width="10" fill="none"/><path d="M48 28 c-5 8 -7 11 -7 14 a7 7 0 0 0 14 0 c0 -3 -2 -6 -7 -14z" fill="#38b6e8"/></svg>',
  reciclar: '<svg viewBox="0 0 60 60" class="q-icon"><g fill="none" stroke="#5cc785" stroke-width="5" stroke-linecap="round"><path d="M14 22 a18 18 0 0 1 30 -4"/><path d="M46 36 a18 18 0 0 1 -30 6"/></g><path d="M42 8 l6 10 l-11 2z M18 52 l-6 -10 l11 -2z" fill="#5cc785"/></svg>',
  recibo: '<svg viewBox="0 0 60 60" class="q-icon"><path d="M12 4 h36 v52 l-6 -4 l-6 4 l-6 -4 l-6 4 l-6 -4 l-6 4z" fill="#fff" stroke="#38b6e8" stroke-width="3"/><rect x="18" y="12" width="20" height="5" rx="2.5" fill="#38b6e8"/><g fill="#5cc785"><rect x="18" y="34" width="6" height="12"/><rect x="27" y="28" width="6" height="18"/><rect x="36" y="38" width="6" height="8"/></g></svg>',
};

const QUESTIONS = [
  {
    id: "personas", icon: "casa", type: "range", min: 1, max: 8, value: 2,
    title: "¿Cuántas personas viven en tu casa?",
    help: "Lo usamos para repartir el agua de las actividades compartidas, como la lavadora o el riego.",
  },
  {
    id: "ducha", icon: "ducha", tip: "tip-ducha",
    title: "¿Cuánto dura normalmente tu ducha?",
    help: "En la encuesta de Bochalema, 18 de 32 personas dijeron entre 5 y 10 minutos.",
    options: [
      { label: "Menos de 5 minutos", v: 4, q: "good" },
      { label: "Entre 5 y 10 minutos", v: 7.5, q: "mid" },
      { label: "Entre 10 y 15 minutos", v: 12.5, q: "bad" },
      { label: "Más de 15 minutos", v: 18, q: "bad" },
    ],
    good: "Tus duchas son cortas. ¡Cada minuto menos ahorra varios litros!",
    improve: "Intenta bajar tu ducha a 5 minutos: usa una canción o un temporizador y cierra la llave al enjabonarte.",
  },
  {
    id: "cepillado", icon: "diente", tip: "tip-cepillado",
    title: "Cuando te cepillas los dientes, la llave…",
    help: "Pista: el 94 % de los vecinos encuestados la cierra.",
    options: [
      { label: "La cierro y uso un vaso", v: 0.5, q: "good" },
      { label: "La cierro mientras me cepillo", v: 1, q: "good" },
      { label: "La dejo abierta una parte del tiempo", v: 5, q: "mid" },
      { label: "La dejo abierta todo el tiempo", v: 12, q: "bad" },
    ],
    good: "Cierras la llave al cepillarte. ¡Como la gran mayoría en Bochalema!",
    improve: "Cierra la llave mientras te cepillas y enjuágate con un vaso de agua.",
  },
  {
    id: "platos", icon: "plato", tip: "tip-platos",
    title: "Cuando lavas los platos…",
    help: "Piensa en cómo se lava normalmente en tu casa.",
    options: [
      { label: "Enjabono todo con la llave cerrada y luego enjuago", v: 8, q: "good" },
      { label: "Uso un platón o la lavaplatos llena", v: 7, q: "good" },
      { label: "Abro y cierro la llave varias veces", v: 15, q: "mid" },
      { label: "Dejo la llave abierta todo el tiempo", v: 30, q: "bad" },
    ],
    good: "Lavas los platos sin dejar la llave corriendo.",
    improve: "Enjabona todos los platos primero con la llave cerrada y enjuaga todo al final.",
  },
  {
    id: "lavadora", icon: "lavadora", tip: "tip-lavadora",
    title: "¿Cuántas veces al mes se usa la lavadora en tu casa?",
    help: "28 de 32 hogares encuestados lavan 3 o más veces al mes.",
    options: [
      { label: "1 vez o menos", v: 1, q: "good" },
      { label: "2 veces", v: 2, q: "good" },
      { label: "3 a 4 veces", v: 3.5, q: "good" },
      { label: "Más de 4 veces", v: 7, q: "mid" },
    ],
    good: "Usas la lavadora con una frecuencia moderada.",
    improve: "Intenta juntar la ropa para hacer menos lavadas en el mes.",
  },
  {
    id: "carga", icon: "ropa", tip: "tip-lavadora",
    title: "¿Cómo cargas la lavadora?",
    help: "Una lavada usa alrededor de 60 a 80 litros, esté llena o no.",
    options: [
      { label: "Siempre llena", v: 1, q: "good" },
      { label: "Casi siempre llena", v: 1.15, q: "good" },
      { label: "A veces a media carga", v: 1.35, q: "mid" },
      { label: "Lavo poquitas prendas cada vez", v: 1.7, q: "bad" },
    ],
    good: "Aprovechas cada lavada con carga completa.",
    improve: "Espera a tener la carga completa antes de poner la lavadora.",
  },
  {
    id: "ahorradores", icon: "ahorrador", tip: "tip-dispositivos",
    title: "¿Tienes regadera, llaves o sanitario ahorradores?",
    help: "Por ejemplo: aireadores, regaderas de bajo flujo o sanitarios de doble descarga.",
    options: [
      { label: "Sí, en la ducha y el sanitario", v: { flujo: 6, wc: 4.8 }, q: "good" },
      { label: "Solo en uno de los dos", v: { flujo: 8, wc: 7 }, q: "mid" },
      { label: "No tengo", v: { flujo: 10, wc: 9 }, q: "bad" },
      { label: "No sé", v: { flujo: 9, wc: 8 }, q: "mid" },
    ],
    good: "Tienes dispositivos ahorradores: ahorras agua sin darte cuenta.",
    improve: "Instala un aireador o una regadera ahorradora; son económicos y reducen mucho el flujo.",
  },
  {
    id: "riego", icon: "planta", tip: "tip-riego",
    title: "¿Cómo riegas las plantas o el jardín?",
    help: "21 de 32 personas encuestadas riegan plantas en su casa.",
    options: [
      { label: "No tengo plantas", v: 0, q: "none" },
      { label: "Con regadera o vaso, temprano o de noche", v: 10, q: "good" },
      { label: "Con regadera, a cualquier hora", v: 14, q: "mid" },
      { label: "Con manguera", v: 100, q: "bad" },
    ],
    good: "Riegas tus plantas con regadera, sin desperdiciar.",
    improve: "Cambia la manguera por una regadera y riega temprano en la mañana o al final de la tarde.",
  },
  {
    id: "exteriores", icon: "carro", tip: "tip-balde",
    title: "Para lavar el carro, la moto, el balcón o la terraza usas…",
    help: "Incluye también lavar los elementos de las mascotas.",
    options: [
      { label: "No hago ese tipo de limpieza", v: 0, q: "none" },
      { label: "Balde, trapero y esponja", v: 40, q: "good" },
      { label: "A veces balde, a veces manguera", v: 180, q: "mid" },
      { label: "Manguera", v: 400, q: "bad" },
    ],
    good: "Usas balde para la limpieza exterior.",
    improve: "Usa balde y esponja en vez de manguera para el carro, la moto, balcones y terrazas.",
  },
  {
    id: "fugas", icon: "fuga", tip: "tip-fugas",
    title: "¿Has encontrado fugas en tu casa en el último año?",
    help: "Llaves que gotean, el sanitario que suena o manchas de humedad.",
    options: [
      { label: "No, y reviso de vez en cuando", v: 0, q: "good" },
      { label: "Sí, pero ya la arreglamos", v: 0, q: "good" },
      { label: "No estoy seguro(a)", v: 10, q: "mid" },
      { label: "Sí, y sigue sin arreglarse", v: 30, q: "bad" },
    ],
    good: "Tienes bajo control las fugas de tu casa.",
    improve: "Haz la prueba del contador: cierra todas las llaves y mira si el medidor sigue girando.",
  },
  {
    id: "reutiliza", icon: "reciclar", tip: "tip-reutilizar",
    title: "¿Reutilizas el agua en casa?",
    help: "Por ejemplo, el agua de la lavadora o la que sale fría mientras se calienta la ducha.",
    options: [
      { label: "Sí, casi siempre", v: 6, q: "good" },
      { label: "A veces", v: 3, q: "mid" },
      { label: "Nunca lo he hecho", v: 0, q: "bad" },
    ],
    good: "Reutilizas el agua: le das una segunda vida.",
    improve: "Pon un balde en la ducha mientras se calienta el agua y úsala para trapear o el sanitario.",
  },
  {
    id: "recibo", icon: "recibo", tip: "tip-recibo",
    title: "¿Revisas el consumo (m³) en tu recibo del agua?",
    help: "En Bochalema, 20 de 32 personas rara vez o nunca lo revisan.",
    options: [
      { label: "Siempre, y lo comparo con el mes anterior", v: 0, q: "good" },
      { label: "Rara vez", v: 0, q: "mid" },
      { label: "No suelo revisarlo", v: 0, q: "bad" },
    ],
    good: "Revisas tu recibo: así detectas a tiempo cualquier aumento.",
    improve: "Revisa cada mes los m³ de tu recibo y usa nuestro comparador para saber cuánto usa cada persona.",
  },
];

const POINTS = { good: 10, mid: 5, bad: 0 };
const BEST = {
  ducha: 0, cepillado: 0, platos: 0, lavadora: null, carga: 0, ahorradores: 0,
  riego: 1, exteriores: 1, fugas: 0, reutiliza: 0, recibo: 0,
};

/* Calcula litros por persona al día a partir de las respuestas */
function computeLiters(ans) {
  const p = ans.personas;
  const val = (id) => QUESTIONS.find((q) => q.id === id).options[ans[id]].v;
  const dev = val("ahorradores");

  const parts = {
    "Ducha": val("ducha") * dev.flujo,
    "Sanitario": 5 * dev.wc,
    "Cepillado y lavamanos": val("cepillado") * 2.5 + 4,
    "Cocina y platos": val("platos") + 5,
    "Lavadora": (val("lavadora") * 70 * val("carga")) / 30 / p,
    "Riego": (val("riego") * 3) / 7 / p,
    "Limpieza exterior": (val("exteriores") * 4) / 30 / p,
    "Fugas": val("fugas") / p,
  };
  const reuse = Math.min(val("reutiliza"), parts["Sanitario"] * 0.5);
  parts["Sanitario"] -= reuse;
  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  return { parts, total };
}

function initQuiz() {
  const box = $("#quiz-questions");
  const form = $("#quiz-form");
  const prev = $("#quiz-prev");
  const next = $("#quiz-next");
  const submit = $("#quiz-submit");
  const bar = $("#quiz-bar");
  const count = $("#quiz-count");
  let current = 0;

  // Construir preguntas
  box.innerHTML = QUESTIONS.map((q, i) => {
    let body;
    if (q.type === "range") {
      body = `
        <div class="range-wrap">
          <div class="range-value"><span id="r-${q.id}">${q.value}</span> ${q.value === 1 ? "persona" : "personas"}</div>
          <input type="range" name="${q.id}" min="${q.min}" max="${q.max}" value="${q.value}" aria-label="${q.title}">
        </div>`;
    } else {
      body = `<div class="options">${q.options
        .map(
          (o, k) => `
          <label class="option">
            <input type="radio" name="${q.id}" value="${k}">
            <span>${o.label}</span>
          </label>`
        )
        .join("")}</div>`;
    }
    return `
      <fieldset class="question${i === 0 ? " active" : ""}" data-i="${i}">
        ${ICONS[q.icon]}
        <legend>${q.title}</legend>
        <p class="q-help">${q.help}</p>
        ${body}
        <p class="quiz-error" aria-live="polite"></p>
      </fieldset>`;
  }).join("");

  const range = $('input[type=range]', box);
  range.addEventListener("input", () => {
    const n = +range.value;
    range.previousElementSibling.innerHTML = `<span>${n}</span> ${n === 1 ? "persona" : "personas"}`;
  });

  // Avanzar automáticamente al escoger una opción
  $$('input[type=radio]', box).forEach((r) =>
    r.addEventListener("change", () => {
      setError("");
      if (current < QUESTIONS.length - 1) setTimeout(() => go(current + 1), 280);
    })
  );

  function setError(msg) {
    $(".question.active .quiz-error", box).textContent = msg;
  }

  function answered(i) {
    const q = QUESTIONS[i];
    return q.type === "range" || !!$(`input[name="${q.id}"]:checked`, form);
  }

  function go(i) {
    if (i > current && !answered(current)) {
      setError("Escoge una opción para continuar.");
      return;
    }
    current = i;
    $$(".question", box).forEach((f, k) => f.classList.toggle("active", k === i));
    prev.disabled = i === 0;
    const last = i === QUESTIONS.length - 1;
    next.hidden = last;
    submit.hidden = !last;
    bar.style.width = ((i + 1) / QUESTIONS.length) * 100 + "%";
    count.textContent = `Pregunta ${i + 1} de ${QUESTIONS.length}`;
  }

  prev.addEventListener("click", () => go(current - 1));
  next.addEventListener("click", () => go(current + 1));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!answered(current)) return setError("Escoge una opción para ver tu resultado.");
    const ans = { personas: +range.value };
    QUESTIONS.slice(1).forEach((q) => (ans[q.id] = +$(`input[name="${q.id}"]:checked`, form).value));
    showResults(ans);
  });

  $("#quiz-restart").addEventListener("click", () => {
    form.reset();
    range.dispatchEvent(new Event("input"));
    $("#results").hidden = true;
    $("#quiz").hidden = false;
    $$(".tip").forEach((t) => t.classList.remove("highlight"));
    go(0);
    $("#huella").scrollIntoView({ behavior: "smooth" });
  });

  $("#quiz-copy").addEventListener("click", () => {
    const txt = $("#results").dataset.share || "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(() => toast("¡Resultado copiado!"), () => toast(txt));
    } else {
      toast(txt);
    }
  });

  go(0);
}

function showResults(ans) {
  const { parts, total } = computeLiters(ans);

  // Mejor escenario posible con las mismas personas
  const best = { ...ans };
  Object.entries(BEST).forEach(([k, v]) => {
    if (v !== null) {
      const q = QUESTIONS.find((x) => x.id === k);
      // No obligar a tener plantas o carro: solo mejorar la forma de hacerlo
      if (q.options[ans[k]].q === "none") return;
      best[k] = v;
    }
  });
  const bestTotal = computeLiters(best).total;

  // Puntaje de hábitos
  let pts = 0;
  let n = 0;
  const good = [];
  const improve = [];
  QUESTIONS.slice(1).forEach((q) => {
    const opt = q.options[ans[q.id]];
    if (opt.q === "none") return;
    n++;
    pts += POINTS[opt.q];
    (opt.q === "good" ? good : improve).push({ q, opt });
  });
  const score = Math.round((pts / (n * 10)) * 100);

  // Nivel
  let level, cls, text;
  if (total <= 100 && score >= 70) {
    level = "¡Eres una Gota Guardiana!";
    cls = "level-good";
    text = "Tu consumo estimado está dentro de la referencia de 50 a 100 litros por persona al día y tus hábitos son muy buenos. Sigue así y comparte lo que haces con tus vecinos.";
  } else if (total <= 140) {
    level = "Vas por buen camino";
    cls = "level-mid";
    text = "Tienes buenos hábitos, pero aún hay acciones sencillas que pueden bajar tu consumo. Revisa la lista de mejoras: cada una cuenta.";
  } else {
    level = "Tu huella puede bajar bastante";
    cls = "level-high";
    text = "Tu consumo estimado está por encima de la referencia. La buena noticia: con pocos cambios en las actividades que más gastan puedes ahorrar mucha agua.";
  }

  const res = $("#results");
  $("#quiz").hidden = true;
  res.hidden = false;

  const title = $("#result-title");
  title.textContent = level;
  title.className = cls;
  $("#result-text").textContent = text;
  $("#score-pts").textContent = score;
  $("#score-month").textContent = fmt(total * 30);
  $("#score-tanks").textContent = fmt((total * 365) / 1000, 1);

  // Medidor en forma de gota
  const fill = Math.min(total / 200, 1);
  const water = $("#gauge-water");
  water.style.transform = "translateY(200px)";
  requestAnimationFrame(() =>
    requestAnimationFrame(() => (water.style.transform = `translateY(${200 - fill * 190}px)`))
  );
  animateNumber($("#gauge-num"), Math.round(total));

  // Listas con ilustraciones de cada consejo
  const item = ({ q, opt }, isGood) => {
    const art = $(`#${q.tip} .tip-front svg`);
    const svg = art ? art.outerHTML : ICONS[q.icon];
    return `<li>${svg}<div><b>${opt.label}</b>${isGood ? q.good : q.improve}
      ${isGood ? "" : `<br><a href="#${q.tip}" data-tip="${q.tip}">Ver consejo ↓</a>`}</div></li>`;
  };
  $("#list-good").innerHTML = good.length
    ? good.map((g) => item(g, true)).join("")
    : '<li class="empty">Aún no hay hábitos en verde, ¡pero hoy es un buen día para empezar!</li>';
  $("#list-improve").innerHTML = improve.length
    ? improve.map((g) => item(g, false)).join("")
    : '<li class="empty">¡Nada que mejorar! Eres un ejemplo para Bochalema.</li>';

  // Resaltar los consejos sugeridos
  $$(".tip").forEach((t) => t.classList.remove("highlight"));
  improve.forEach(({ q }) => $("#" + q.tip)?.classList.add("highlight"));
  $$("[data-tip]", res).forEach((a) =>
    a.addEventListener("click", () => {
      $$(".filters .chip")[0].click();
      const t = $("#" + a.dataset.tip);
      setTimeout(() => t.classList.add("flipped"), 700);
    })
  );

  // Desglose
  const maxPart = Math.max(...Object.values(parts));
  $("#breakdown-bars").innerHTML = Object.entries(parts)
    .filter(([, v]) => v > 0.05)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([k, v]) => `
      <div class="bd-row">
        <span>${k}</span>
        <div class="bd-track"><div class="bd-fill${v > 40 ? " warn" : ""}" data-w="${(v / maxPart) * 100}"></div></div>
        <span>${fmt(v)} L</span>
      </div>`
    )
    .join("");
  setTimeout(() => $$(".bd-fill").forEach((f) => (f.style.width = f.dataset.w + "%")), 150);

  const saving = Math.max(total - bestTotal, 0);
  $("#saving-potential").innerHTML = saving > 1
    ? `Si aplicas todas las mejoras podrías bajar a unos <strong>${fmt(bestTotal)} L al día</strong>: un ahorro de cerca de <strong>${fmt(saving * 30)} litros al mes</strong> solo tú, y unos <strong>${fmt((saving * 30 * ans.personas) / 1000, 1)} m³</strong> menos en el recibo de tu hogar si todos lo hacen.`
    : "¡Ya estás muy cerca del mejor escenario posible!";

  // Comparación con el estudio de Bochalema
  const m3PersonMonth = (total * 30) / 1000;
  const duchaOpt = ans.ducha;
  const duchaMsg = [
    "Te duchas menos de 5 minutos, como solo 6 de los 32 vecinos encuestados.",
    "Te duchas entre 5 y 10 minutos, igual que la mayoría (18 de 32) de los vecinos encuestados.",
    "Te duchas entre 10 y 15 minutos; en la encuesta, solo 6 de 32 personas dijeron lo mismo.",
    "Te duchas más de 15 minutos; en la encuesta, solo 2 de 32 personas lo hacen.",
  ][duchaOpt];
  $("#compare-box").innerHTML = `
    <h4>Tú frente a Bochalema</h4>
    <ul>
      <li>Tu consumo estimado equivale a unos <strong>${fmt(m3PersonMonth, 1)} m³ por persona al mes</strong>.
        En los recibos del estudio, la Residencia 2 registró cerca de 1 m³ por persona, y las Residencias 1 y 3 unos 4 m³.</li>
      <li>${duchaMsg}</li>
      <li>${ans.recibo === 0
        ? "Revisas tu recibo, algo que solo hacen siempre 12 de los 32 encuestados."
        : "Como el 62,5 % de los encuestados, no revisas tu recibo con frecuencia. ¡Prueba el comparador de recibos de abajo!"}</li>
    </ul>`;

  res.dataset.share =
    `Mi huella hídrica en casa según BochaGota: ${fmt(total)} litros al día (${level}). ` +
    `Puntaje de hábitos: ${score}/100. ¡Calcula la tuya y cuidemos el agua en Bochalema!`;

  res.scrollIntoView({ behavior: "smooth", block: "start" });
}

function animateNumber(el, end) {
  const start = performance.now();
  const dur = 1400;
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------------------------------------------------------
   Traduce tu recibo del agua: comparador de recibos
   Hace los mismos cálculos del informe de investigación:
   consumo por periodo, consumo diario, consumo por persona
   y variación del costo de acueducto + alcantarillado.
   --------------------------------------------------------- */
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const PERIODS = MONTHS.map((m, i) => `${m} – ${MONTHS[(i + 1) % 12]}`);

/* Valores de ejemplo para que la persona vea cómo funciona */
const CMP_EXAMPLE = [
  { period: 6, year: 2026, days: 28, m3: 8, acu: 40000, alc: 36000 },
  { period: 7, year: 2026, days: 30, m3: 8, acu: 39500, alc: 35800 },
];

function initComparator() {
  const form = $("#cmp-form");
  const countSel = $("#cmp-count");
  const peopleIn = $("#cmp-people");
  const box = $("#cmp-receipts");
  const out = $("#cmp-results");

  const receiptHTML = (i, d) => `
    <fieldset class="cmp-receipt" data-i="${i}">
      <legend>Recibo ${i + 1}</legend>
      <label class="cmp-period"><span>Meses del recibo</span>
        <select data-k="period">${PERIODS.map((p, k) => `<option value="${k}"${k === d.period ? " selected" : ""}>${p}</option>`).join("")}</select>
      </label>
      <label><span>Año</span><input type="number" data-k="year" min="2000" max="2100" value="${d.year ?? ""}"></label>
      <label><span>Días facturados</span><input type="number" data-k="days" min="1" max="120" value="${d.days ?? ""}"></label>
      <label><span>Consumo (m³)</span><input type="number" data-k="m3" min="0" step="0.1" value="${d.m3 ?? ""}" placeholder="Ej: 8"></label>
      <label><span>Acueducto ($)</span><input type="number" data-k="acu" min="0" step="1" value="${d.acu ?? ""}" placeholder="Opcional"></label>
      <label><span>Alcantarillado ($)</span><input type="number" data-k="alc" min="0" step="1" value="${d.alc ?? ""}" placeholder="Opcional"></label>
    </fieldset>`;

  function readReceipts() {
    return $$(".cmp-receipt", box).map((fs) => {
      const get = (k) => $(`[data-k="${k}"]`, fs).value;
      const num = (k) => (get(k) === "" ? null : parseFloat(get(k)));
      return { period: +get("period"), year: num("year"), days: num("days"), m3: num("m3"), acu: num("acu"), alc: num("alc") };
    });
  }

  function build() {
    const current = readReceipts();
    const n = +countSel.value;
    let html = "";
    for (let i = 0; i < n; i++) {
      let d = current[i] || CMP_EXAMPLE[i];
      if (!d) {
        // Un recibo nuevo sigue al anterior: mismos días aproximados y los meses siguientes
        const prev = current[i - 1] || CMP_EXAMPLE[CMP_EXAMPLE.length - 1] || { period: 0, year: 2026 };
        const period = (prev.period + 1) % 12;
        d = { period, year: period === 0 ? (prev.year || 2026) + 1 : prev.year, days: 30 };
      }
      html += receiptHTML(i, d);
    }
    box.innerHTML = html;
    calc();
  }

  function calc() {
    const people = Math.max(1, parseInt(peopleIn.value, 10) || 1);
    const rows = readReceipts().map((r, i) => {
      const valid = r.m3 !== null && r.m3 >= 0 && r.days > 0;
      const cost = r.acu === null && r.alc === null ? null : (r.acu || 0) + (r.alc || 0);
      return {
        ...r, i, valid, cost,
        name: `Recibo ${i + 1}`,
        label: `${PERIODS[r.period]}${r.year ? " " + r.year : ""}`,
        daily: valid ? r.m3 / r.days : null,
        perPerson: valid ? r.m3 / people : null,
        lpd: valid ? (r.m3 * 1000) / r.days / people : null,
        perM3: valid && cost !== null && r.m3 > 0 ? cost / r.m3 : null,
      };
    });
    const ok = rows.filter((r) => r.valid);
    if (!ok.length) {
      out.innerHTML = '<p class="cmp-empty">Escribe al menos el consumo (m³) y los días facturados de un recibo para ver los cálculos.</p>';
      return;
    }

    const dash = "—";
    const money = (v) => (v === null ? dash : "$" + fmt(v));
    const sign = (v, dec = 0, suf = "") => (v > 0 ? "+" : v < 0 ? "−" : "") + fmt(Math.abs(v), dec) + suf;

    // Tabla 1: consumo de cada recibo
    const t1 = `
      <div class="table-wrap"><table class="cmp-table">
        <caption>Consumo por recibo</caption>
        <thead><tr>
          <th>Recibo</th><th>Meses</th><th>Días</th><th>Consumo</th><th>Consumo diario</th>
          <th>Por persona</th><th>Litros por persona al día</th><th>Acueducto + alcantarillado</th><th>Costo por m³</th>
        </tr></thead>
        <tbody>${rows.map((r) => r.valid ? `
          <tr>
            <td><b>${r.name}</b></td><td>${r.label}</td><td>${fmt(r.days)}</td><td>${fmt(r.m3, r.m3 % 1 ? 1 : 0)} m³</td>
            <td>${fmt(r.daily, 3)} m³/día</td><td>${fmt(r.perPerson, 2)} m³</td><td><b>${fmt(r.lpd)} L</b></td>
            <td>${money(r.cost)}</td><td>${r.perM3 === null ? dash : money(Math.round(r.perM3))}</td>
          </tr>` : `<tr class="muted"><td><b>${r.name}</b></td><td>${r.label}</td><td colspan="7">Faltan datos de consumo o días</td></tr>`).join("")}
        </tbody>
      </table></div>`;

    // Tabla 2: variación entre recibos consecutivos
    let t2 = "";
    const pairs = [];
    for (let k = 1; k < ok.length; k++) pairs.push([ok[k - 1], ok[k]]);
    if (pairs.length) {
      t2 = `
      <div class="table-wrap"><table class="cmp-table">
        <caption>Comparación entre periodos</caption>
        <thead><tr>
          <th>Comparación</th><th>Variación del consumo</th><th>Variación del consumo diario</th>
          <th>Diferencia de costo</th><th>Variación porcentual del costo</th>
        </tr></thead>
        <tbody>${pairs.map(([a, b]) => {
          const dm3 = b.m3 - a.m3;
          const dd = b.daily - a.daily;
          const ddPct = a.daily > 0 ? (dd / a.daily) * 100 : 0;
          const hasCost = a.cost !== null && b.cost !== null;
          const dc = hasCost ? b.cost - a.cost : null;
          const dcPct = hasCost && a.cost > 0 ? (dc / a.cost) * 100 : null;
          const cls = (v) => (v > 0 ? "up" : v < 0 ? "down" : "");
          return `<tr>
            <td><b>${a.name} → ${b.name}</b><br><small>${a.label} → ${b.label}</small></td>
            <td class="${cls(dm3)}">${sign(dm3, dm3 % 1 ? 1 : 0, " m³")}</td>
            <td class="${cls(dd)}">${sign(dd, 3, " m³/día")} <small>(${sign(ddPct, 1, " %")})</small></td>
            <td class="${cls(dc)}">${dc === null ? dash : (dc > 0 ? "+" : dc < 0 ? "−" : "") + "$" + fmt(Math.abs(dc))}</td>
            <td class="${cls(dc)}">${dcPct === null ? dash : sign(dcPct, 1, " %")}</td>
          </tr>`;
        }).join("")}</tbody>
      </table></div>`;
    }

    // Gráfico de consumo diario
    const maxD = Math.max(...ok.map((r) => r.daily), 0.001);
    const chart = `
      <div class="cmp-chart-box">
        <h4>Consumo diario por recibo <small>(m³/día)</small></h4>
        <div class="cmp-chart">${ok.map((r, k) => `
          <div class="cmp-col">
            <div class="cmp-bar${k % 2 ? " alt" : ""}" style="--h:${(r.daily / maxD) * 100}%"><span>${fmt(r.daily, 3)}</span></div>
            <small>${r.name}<br>${r.label}</small>
          </div>`).join("")}
        </div>
      </div>`;

    // Resumen general
    const totM3 = ok.reduce((s, r) => s + r.m3, 0);
    const totDays = ok.reduce((s, r) => s + r.days, 0);
    const avgLpd = (totM3 * 1000) / totDays / people;
    const costRows = ok.filter((r) => r.cost !== null);
    const totCost = costRows.reduce((s, r) => s + r.cost, 0);
    const summary = `
      <div class="cmp-summary">
        <div><span>${fmt(totM3, totM3 % 1 ? 1 : 0)} m³</span><small>consumo total (${fmt(totM3 * 1000)} L)</small></div>
        <div><span>${fmt(totM3 / totDays, 3)}</span><small>m³ al día en promedio</small></div>
        <div><span>${fmt(avgLpd)} L</span><small>por persona al día en promedio</small></div>
        <div><span>${costRows.length ? "$" + fmt(totCost) : "—"}</span><small>acueducto + alcantarillado en total</small></div>
      </div>`;

    // Conclusiones automáticas, como en el análisis del informe
    const notes = [];
    if (pairs.length) {
      const a = ok[0];
      const b = ok[ok.length - 1];
      const dm3 = b.m3 - a.m3;
      const dd = b.daily - a.daily;
      if (dm3 === 0 && Math.abs(dd) > 0.0005) {
        notes.push(`Aunque el consumo total fue el mismo (${fmt(a.m3, a.m3 % 1 ? 1 : 0)} m³), el consumo diario ${dd < 0 ? "bajó" : "subió"} de ${fmt(a.daily, 3)} a ${fmt(b.daily, 3)} m³/día porque los periodos no duraron lo mismo (${a.days} y ${b.days} días). Por eso conviene comparar el consumo diario y no solo el total.`);
      } else if (dm3 !== 0) {
        notes.push(`Entre el primer y el último recibo el consumo ${dm3 > 0 ? "aumentó" : "disminuyó"} ${fmt(Math.abs(dm3), Math.abs(dm3) % 1 ? 1 : 0)} m³, y el consumo diario pasó de ${fmt(a.daily, 3)} a ${fmt(b.daily, 3)} m³/día.`);
      } else {
        notes.push("Tu consumo se mantuvo estable entre el primer y el último recibo.");
      }
      if (a.cost !== null && b.cost !== null) {
        const dc = b.cost - a.cost;
        const sameDir = Math.sign(dc) === Math.sign(dm3);
        if (dc === 0 && dm3 === 0) {
          notes.push("El valor de acueducto y alcantarillado se mantuvo igual, al igual que el consumo.");
        } else if (!sameDir || (dm3 === 0 && dc !== 0)) {
          notes.push(`El valor de acueducto y alcantarillado ${dc > 0 ? "subió" : dc < 0 ? "bajó" : "se mantuvo"}${dc !== 0 ? " $" + fmt(Math.abs(dc)) : ""} aunque el consumo ${dm3 > 0 ? "subió" : dm3 < 0 ? "bajó" : "fue igual"}. El valor facturado no depende solo del agua consumida: también influyen los cargos básicos, las tarifas y otros conceptos.`);
        } else {
          notes.push(`El valor de acueducto y alcantarillado ${dc > 0 ? "aumentó" : "disminuyó"} $${fmt(Math.abs(dc))}, en la misma dirección que el consumo.`);
        }
      }
    }
    notes.push(avgLpd <= 100
      ? `En promedio cada persona usa unos ${fmt(avgLpd)} litros al día, dentro de la referencia de 50 a 100 litros por persona al día.`
      : `En promedio cada persona usa unos ${fmt(avgLpd)} litros al día, por encima de la referencia de 100 litros. Revisa duchas, lavadora y posibles fugas, o haz el cuestionario de huella hídrica.`);
    notes.push("Ten en cuenta que estos valores son promedios del hogar: no muestran cuánto usa cada persona ni determinan por sí solos si hay desperdicio. Para eso también importan los hábitos de cada casa.");

    out.innerHTML = `
      ${summary}
      ${t1}
      ${t2}
      <div class="cmp-bottom">
        ${chart}
        <div class="cmp-notes"><h4>¿Qué significan tus resultados?</h4><ul>${notes.map((n) => `<li>${n}</li>`).join("")}</ul></div>
      </div>`;
  }

  countSel.addEventListener("change", build);
  form.addEventListener("input", (e) => { if (e.target !== countSel) calc(); });
  form.addEventListener("change", (e) => { if (e.target.matches("select[data-k]")) calc(); });
  form.addEventListener("submit", (e) => e.preventDefault());
  build();
}

/* ---------------------------------------------------------
   Reto de 7 días (se guarda solo en este navegador)
   --------------------------------------------------------- */
const CHALLENGE = [
  ["Ducha de 5 minutos", "Usa una canción de referencia para cronometrarte."],
  ["Llave cerrada al cepillarte", "Enjuágate con un vaso de agua."],
  ["Prueba del contador", "Cierra todas las llaves y revisa si el medidor se mueve."],
  ["Un balde en la ducha", "Recoge el agua fría y úsala para trapear o el sanitario."],
  ["Lavadora con carga completa", "Espera a juntar suficiente ropa."],
  ["Riego con regadera", "Riega temprano o al final de la tarde."],
  ["Revisa tu recibo", "Compara los m³ con el mes anterior y cuéntaselo a tu familia."],
];
const STORE_KEY = "bochagota-reto";

function readStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
}
function writeStore(v) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch { /* sin almacenamiento */ }
}

function initChallenge() {
  const list = $("#challenge-list");
  const saved = readStore();

  list.innerHTML = CHALLENGE.map(
    ([t, d], i) => `
    <li>
      <label>
        <input type="checkbox" data-i="${i}" ${saved[i] ? "checked" : ""}>
        <span class="day">Día<b>${i + 1}</b></span>
        <span class="txt"><b>${t}</b><small>${d}</small></span>
        <span class="check">✓</span>
      </label>
    </li>`
  ).join("");

  const update = () => {
    const state = $$("input", list).map((c) => c.checked);
    writeStore(state);
    const done = state.filter(Boolean).length;
    const pct = Math.round((done / CHALLENGE.length) * 100);
    $("#challenge-pct").textContent = pct + "%";
    $("#challenge-fill").setAttribute("y", 180 - (pct / 100) * 172);
    $("#challenge-msg").textContent =
      done === 0 ? "¡Empieza hoy con la primera acción!"
      : done < 4 ? `¡Vas ${done} de 7! Cada gota cuenta.`
      : done < 7 ? `¡${done} de 7! Ya casi eres Gota Guardiana.`
      : "¡Reto completado! Eres una Gota Guardiana de Bochalema 💧";
  };

  list.addEventListener("change", (e) => {
    update();
    if (e.target.checked && $$("input:checked", list).length === CHALLENGE.length) toast("¡Felicitaciones! Completaste el reto 🎉");
  });
  $("#challenge-reset").addEventListener("click", () => {
    $$("input", list).forEach((c) => (c.checked = false));
    update();
  });
  update();
}
