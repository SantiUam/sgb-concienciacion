/* =========================================================
   SGB · Concienciación del Síndrome de Guillain-Barré
   Interactividad de la página (Modular & Profesional)
   ========================================================= */
(function () {
  "use strict";

  var doc = document;

  /* ---------- Sanitización (XSS Protection) ---------- */
  function esc(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ---------- Helper de traducción (i18n) ---------- */
  function tt(key, fallback) {
    if (window.SGB_i18n && typeof window.SGB_i18n.t === "function") {
      var val = window.SGB_i18n.t(key);
      if (val && val !== key) return val;
    }
    return fallback;
  }

  /* ---------- Menú móvil ---------- */
  var menuToggle = doc.getElementById("menuToggle");
  var nav = doc.getElementById("nav");

  function closeMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.remove("open");
    menuToggle.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      menuToggle.classList.toggle("open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
  }

  /* ---------- Sombra del header al hacer scroll ---------- */
  var header = doc.querySelector(".site-header");
  function onScrollHeader() {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Carrito de merchandising ---------- */
  var cartCount = doc.getElementById("cartCount");
  var cartBtn = doc.getElementById("cartBtn");
  var cartDrawer = doc.getElementById("cartDrawer");
  var cartClose = doc.getElementById("cartClose");
  var cartOverlay = doc.getElementById("cartOverlay");
  var cartItemsList = doc.getElementById("cartItemsList");
  var cartEmptyState = doc.getElementById("cartEmptyState");
  var cartFooter = doc.getElementById("cartFooter");
  var cartTotalPrice = doc.getElementById("cartTotalPrice");
  var checkoutBtn = doc.getElementById("checkoutBtn");

  var cart = [];
  var STORAGE_CART_KEY = "sgb-cart";

  function loadCart() {
    var stored = localStorage.getItem(STORAGE_CART_KEY);
    if (stored) {
      try {
        cart = JSON.parse(stored);
      } catch (e) {
        cart = [];
      }
    }
    updateCartUI();
  }

  function saveCart() {
    localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
    updateCartUI();
  }

  function updateCartUI() {
    var totalItems = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
    if (cartCount) {
      cartCount.textContent = String(totalItems);
      cartCount.style.display = totalItems > 0 ? "flex" : "none";
    }

    if (!cartItemsList) return;
    cartItemsList.innerHTML = "";

    if (cart.length === 0) {
      if (cartEmptyState) cartEmptyState.hidden = false;
      if (cartFooter) cartFooter.hidden = true;
    } else {
      if (cartEmptyState) cartEmptyState.hidden = true;
      if (cartFooter) cartFooter.hidden = false;

      var total = 0;
      cart.forEach(function (item, index) {
        total += item.price * item.qty;
        var li = doc.createElement("li");
        li.className = "cart-item";
        li.innerHTML =
          "<div class='cart-item-info'>" +
          "<h4>" + esc(item.name) + "</h4>" +
          "<span>" + item.price + " € x " + item.qty + "</span>" +
          "</div>" +
          "<button class='cart-remove' data-index='" + index + "'>&times;</button>";
        cartItemsList.appendChild(li);
      });
      if (cartTotalPrice) cartTotalPrice.textContent = total + " €";
    }
  }

  if (cartItemsList) {
    cartItemsList.addEventListener("click", function (e) {
      var btn = e.target.closest(".cart-remove");
      if (!btn) return;
      var idx = parseInt(btn.dataset.index, 10);
      cart.splice(idx, 1);
      saveCart();
    });
  }

  function openCart() {
    if (cartDrawer) {
      cartDrawer.classList.add("open");
      cartDrawer.setAttribute("aria-hidden", "false");
    }
  }

  function closeCart() {
    if (cartDrawer) {
      cartDrawer.classList.remove("open");
      cartDrawer.setAttribute("aria-hidden", "true");
    }
  }

  if (cartBtn) cartBtn.addEventListener("click", openCart);
  if (cartClose) cartClose.addEventListener("click", closeCart);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

  function addToCart(name, price) {
    var existing = cart.find(function (i) { return i.name === name; });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name: name, price: parseFloat(price), qty: 1 });
    }
    saveCart();
    openCart();
  }

  /* ---------- Renderizado de Productos (Tienda) ---------- */
  function renderProducts() {
    var grid = doc.getElementById("productsGrid");
    if (!grid) return;

    var products = [
      { name: tt("merchan.p1.title", "Camiseta"), price: 22, desc: "Algodón orgánico" },
      { name: tt("merchan.p2.title", "Gorra"), price: 18, desc: "Bordado profesional" },
      { name: tt("merchan.p3.title", "Pulsera"), price: 8, desc: "Silicona solidaria" },
      { name: "Botella eco", price: 15, desc: "Acero inoxidable" },
      { name: "Sudadera", price: 45, desc: "Premium fit" },
      { name: "Libreta", price: 12, desc: "Papel reciclado" }
    ];

    grid.innerHTML = "";
    products.forEach(function (p) {
      var art = doc.createElement("article");
      art.className = "teaser-card reveal";
      art.innerHTML = 
        "<h3>" + esc(p.name) + "</h3>" +
        "<p>" + esc(p.desc) + "</p>" +
        "<div class='product-foot'>" +
        "<span class='price'>" + p.price + " €</span>" +
        "<button class='btn btn-primary add-to-cart' data-name='" + esc(p.name) + "' data-price='" + p.price + "'>Añadir</button>" +
        "</div>";
      grid.appendChild(art);
    });

    grid.addEventListener("click", function(e) {
      var btn = e.target.closest(".add-to-cart");
      if (btn) addToCart(btn.dataset.name, btn.dataset.price);
    });
  }

  /* ---------- Testimonios ---------- */
  function getTestimonios() {
    return [
      { name: "María L.", content: "El diagnóstico fue un golpe, pero hoy camino de nuevo.", role: "Paciente" },
      { name: "Javier M.", content: "Apoyar la investigación es clave para todos nosotros.", role: "Superviviente" },
      { name: "Lucía R.", content: "Como familiar, la información fue mi mayor refugio.", role: "Familiar" }
    ];
  }

  function renderTestGrid() {
    var grid = doc.getElementById("testGrid");
    if (!grid) return;

    var tests = getTestimonios();
    grid.innerHTML = "";
    tests.forEach(function (t) {
      var art = doc.createElement("article");
      art.className = "teaser-card reveal";
      art.innerHTML = "<blockquote>\"" + esc(t.content) + "\"</blockquote><strong>" + esc(t.name) + "</strong><span>" + esc(t.role) + "</span>";
      grid.appendChild(art);
    });
  }

  /* ---------- Hitos (Dashboard) ---------- */
  function renderMilestones() {
    var container = doc.getElementById("milestones-content");
    if (!container) return;

    var milestones = [
      { id: "m1", title: "Primer paso", desc: "Movilidad recuperada en miembros inferiores." },
      { id: "m2", title: "Respiración autónoma", desc: "Retirada de asistencia ventilatoria." },
      { id: "m3", title: "Vuelta al trabajo", desc: "Reintegración social y laboral." }
    ];

    container.innerHTML = "<div class='grid-3'></div>";
    var grid = container.querySelector(".grid-3");
    
    milestones.forEach(function (m) {
      var card = doc.createElement("div");
      card.className = "teaser-card reveal milestone-card";
      card.dataset.id = m.id;
      card.innerHTML = "<h3>" + esc(m.title) + "</h3><p>" + esc(m.desc) + "</p><button class='btn btn-ghost'>Marcar como hito</button>";
      grid.appendChild(card);
    });
  }

  /* ---------- Animación Reveal ---------- */
  function initReveal() {
    var revealEls = doc.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
          }
        });
      }, { threshold: 0.1 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Inicialización General ---------- */
  loadCart();
  renderProducts();
  renderTestGrid();
  renderMilestones();
  initReveal();

  /* ---------- Mapa de Síntomas (Clínica) ---------- */
  var hotspots = doc.querySelectorAll(".hotspot");
  var infoContents = doc.querySelectorAll(".info-content");
  if (hotspots.length) {
    hotspots.forEach(function (h) {
      h.addEventListener("click", function () {
        var step = h.dataset.step;
        infoContents.forEach(function (c) {
          c.hidden = c.dataset.step !== step;
          c.classList.toggle("active", c.dataset.step === step);
        });
      });
    });
  }

  /* ---------- Mitos (Educación) ---------- */
  doc.querySelectorAll(".flip-card").forEach(function (card) {
    card.addEventListener("click", function () {
      card.classList.toggle("flipped");
    });
  });

})();
