/* ALAIF CAFE — storefront interactions
   CSS owns the motion; JS renders the shop from products.json and wires
   Shopify cart-permalink checkout (no SDK/token, keeps Tapstitch fulfillment).
   ------------------------------------------------------------------ */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Named color → swatch hex. Falls back to a neutral if unmapped. */
const COLOR_HEX = {
  "Olive Green": "#6b7238", "Black": "#161616", "Coffee": "#6f4e37",
  "Dark Gray": "#4a4a4d", "Dull Red": "#8f3b3b", "Navy Blue": "#20293f",
  "White": "#efece4", "Flower Gray": "#b8b2a6", "Light Apricot": "#f0c8a2",
  "Gray": "#8b8b8b", "Khaki": "#b3a071",
};

/* ---------- header scroll state ---------- */
const header = $("#header");
const onScroll = () => header.setAttribute("data-scrolled", String(window.scrollY > 24));
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- seamless marquee (duplicate track content) ---------- */
const mq = $("#marquee");
if (mq) mq.innerHTML += mq.innerHTML;

/* ---------- footer year ---------- */
$("#year").textContent = new Date().getFullYear();

/* ---------- optional hero video (only if asset exists) ---------- */
(function heroVideo() {
  const v = $("#heroVideo");
  if (!v) return;
  fetch("https://vmussi2.github.io/alaif-storefront/assets/hero.mp4", { method: "HEAD" }).then(r => {
    if (!r.ok) return;
    v.poster = "assets/hero-poster.jpg";
    v.src = "assets/hero.mp4";
    v.style.display = "block";
    v.autoplay = true; v.play?.().catch(() => {});
    $(".hero__bg")?.style.setProperty("opacity", ".35");
  }).catch(() => {});
})();

/* ---------- scroll reveal ---------- */
const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add("is-in"); revealIO.unobserve(e.target); }
  }
}, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
const observeReveals = () => $$("[data-reveal]").forEach(el => revealIO.observe(el));

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  $("#toastMsg").textContent = msg;
  t.setAttribute("data-show", "true");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.setAttribute("data-show", "false"), 2200);
}

/* live bag count from Shopify's AJAX cart */
function refreshBag() {
  const el = $("#bagCount"); if (!el) return;
  fetch("/cart.js", { headers: { "Accept": "application/json" } })
    .then(r => r.ok ? r.json() : null)
    .then(c => { if (c) el.textContent = c.item_count; }).catch(() => {});
}

/* ---------- render shop ---------- */
async function renderShop() {
  let data;
  try {
    data = { products: (window.ALAIF_PRODUCTS || []) };
  } catch (err) {
    $("#productGrid").innerHTML =
      `<p class="card__meta">Catalog unavailable — run the products.json refresh.</p>`;
    return;
  }

  const DOMAIN = data.domain;
  const grid = $("#productGrid");
  grid.innerHTML = "";

  data.products.forEach((p, i) => {
    // accurate per-color photo from Shopify variant images; fall back to gallery order
    const perColor = Math.max(1, Math.floor(p.images.length / Math.max(1, p.colors.length)));
    const imageForColor = (idx) => {
      const c = p.colors[idx];
      return (p.colorImages && p.colorImages[c]) || p.images[Math.min(idx * perColor, p.images.length - 1)];
    };
    const backForColor = (idx) => (p.colorBacks && p.colorBacks[p.colors[idx]]) || null;
    const hasBack = !!backForColor(0);
    const state = { color: 0, size: null };

    const card = document.createElement("article");
    card.className = "card";
    if (i === 0) card.style.setProperty("--reveal-delay", "0ms");

    card.innerHTML = `
      <div class="card__media">
        ${i === 0 ? `<span class="card__badge">New drop</span>` : ""}
        <img class="card__img" src="${p.card || imageForColor(0)}" alt="${p.title}" loading="lazy" />
        ${hasBack ? `<img class="card__img card__img--back" src="${backForColor(0)}" alt="${p.title} — back" loading="lazy" /><span class="card__flip">Hover · back</span>` : ""}
      </div>
      <div class="card__body">
        <div class="card__row">
          <h3 class="card__name">${p.title.replace(/^ALAIF\s+/i, "")}</h3>
          <span class="card__price">$${(Number(p.price)%1===0?Math.round(p.price):Number(p.price).toFixed(2))}</span>
        </div>
        <p class="card__meta js-meta">${p.colors[0]}</p>
        ${p.note ? `<p class="card__note">${p.note}</p>` : ""}
        <div class="swatches js-swatches" role="group" aria-label="Color"></div>
        <div class="sizes js-sizes" role="group" aria-label="Size"></div>
        <a class="btn btn--solid btn--block card__cta js-add" role="button">Add to bag</a>
      </div>`;

    const img      = $(".card__img", card);
    const imgBack  = $(".card__img--back", card);
    const meta     = $(".js-meta", card);
    const swatches = $(".js-swatches", card);
    const sizesEl  = $(".js-sizes", card);
    const addBtn   = $(".js-add", card);

    /* swatches */
    p.colors.forEach((c, ci) => {
      const b = document.createElement("button");
      b.className = "swatch";
      b.style.setProperty("--sw", (p.colorHex && p.colorHex[c]) || COLOR_HEX[c] || "#8a8a8a");
      b.setAttribute("aria-label", c);
      b.setAttribute("aria-pressed", String(ci === 0));
      b.addEventListener("click", () => {
        if (state.color === ci) return;
        state.color = ci;
        $$(".swatch", swatches).forEach((s, k) => s.setAttribute("aria-pressed", String(k === ci)));
        meta.textContent = c;
        // blur-masked image swap (Emil: bridge the crossfade)
        img.classList.add("is-swapping");
        const next = new Image();
        next.src = imageForColor(ci);
        next.onload = () => { img.src = next.src; requestAnimationFrame(() => img.classList.remove("is-swapping")); };
        setTimeout(() => img.classList.remove("is-swapping"), 340); // safety
        if (imgBack) { const bk = backForColor(ci); if (bk) imgBack.src = bk; }
      });
      swatches.appendChild(b);
    });

    /* sizes */
    p.sizes.forEach((s) => {
      const b = document.createElement("button");
      b.className = "size";
      b.textContent = s;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => {
        state.size = s;
        $$(".size", sizesEl).forEach(el => el.setAttribute("aria-pressed", String(el === b)));
        addBtn.textContent = "Add to bag";
      });
      sizesEl.appendChild(b);
    });

    /* add to bag → Shopify cart permalink for the selected variant */
    addBtn.addEventListener("click", () => {
      if (!state.size) { addBtn.textContent = "Select a size ↑"; sizesEl.animate(
        [{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
        { duration: 220, easing: "cubic-bezier(0.23,1,0.32,1)" }); return; }
      const color = p.colors[state.color];
      const variant = p.variants.find(v => v.color === color && v.size === state.size);
      if (!variant) { toast("That combo is unavailable"); return; }
      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ items: [{ id: Number(variant.id), quantity: 1 }] })
      })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(() => { toast(`Added — ${color} / ${state.size}`); refreshBag(); })
        .catch(() => { window.location.href = `/cart/${variant.id}:1`; });
    });

    grid.appendChild(card);
  });

  /* story + lookbook use real product shots */
  const byTitle = (frag) => data.products.find(p => p.title.toLowerCase().includes(frag)) || data.products[0];
  const hoodie = byTitle("hoodie");
  const boxy   = byTitle("boxy");
  const shorts = byTitle("shorts");

  const storyMedia = $("#storyMedia");
  if (storyMedia) storyMedia.innerHTML = `<img src="${hoodie.images[0]}" alt="${hoodie.title}" loading="lazy" />`;

  const look = $("#rangeGrid");
  if (look) {
    const picks = [hoodie, boxy, shorts];
    look.innerHTML = picks.map((p) => `
      <a class="look" href="#shop">
        <div class="look__well"><img src="${p.card || p.hero || p.images[0]}" alt="${p.title}" loading="lazy" /></div>
        <div class="look__bar">
          <span class="look__tag">${p.title.replace(/^ALAIF\s+/i, "")}</span>
          <span class="look__price">$${(Number(p.price)%1===0?Math.round(p.price):Number(p.price).toFixed(2))}</span>
        </div>
      </a>`).join("");
  }

  observeReveals();
}

/* ---------- newsletter (stashes locally until a backend is wired) ---------- */
$("#signupForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = e.target.email;
  const val = (input.value || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) { input.focus(); return; }
  const list = JSON.parse(localStorage.getItem("alaif:subscribers") || "[]");
  if (!list.includes(val)) list.push(val);
  localStorage.setItem("alaif:subscribers", JSON.stringify(list));
  e.target.reset();
  $("#signupOk").textContent = "You're on the list. Welcome to Alaif.";
});

/* inline the designer's SVG illustrations (dev: fetch from assets/;
   on Shopify the section build pre-inlines them so this no-ops) */
$$("[data-illo]").forEach(el => {
  if (el.children.length) return;
  fetch(`https://vmussi2.github.io/alaif-storefront/assets/${el.dataset.illo}.svg`).then(r => r.ok ? r.text() : null)
    .then(svg => { if (svg) el.innerHTML = svg; }).catch(() => {});
});
$$("[data-doodle]").forEach(el => {
  if (el.children.length) return;
  fetch(`https://vmussi2.github.io/alaif-storefront/assets/doodles/${el.dataset.doodle}.svg`).then(r => r.ok ? r.text() : null)
    .then(svg => { if (svg) el.innerHTML = svg; }).catch(() => {});
});

/* boot */
renderShop().then(observeReveals);
observeReveals();
refreshBag();
