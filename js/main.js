/* =========================================================
   SGB · Concienciación del Síndrome de Guillain-Barré
   Interactividad de la página
   ========================================================= */
(function () {
  "use strict";

  var doc = document;

  /* ---------- Helper de traducción (i18n) ---------- */
  function tt(key, fallback) {
    if (window.SGB_i18n && typeof window.SGB_i18n.t === "function") {
      var val = window.SGB_i18n.t(key);
      if (val && val !== key) return val;
    }
    return fallback;
  }

  /* ---------- Año actual en el footer ---------- */
  var yearEl = doc.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Menú móvil ---------- */
  var menuToggle = doc.getElementById("menuToggle");
  var nav = doc.getElementById("nav");

  function closeMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.remove("open");
    menuToggle.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", tt("attr.menu.open", "Abrir menú"));
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      menuToggle.classList.toggle("open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? tt("attr.menu.close", "Cerrar menú") : tt("attr.menu.open", "Abrir menú"));
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
  var toast = doc.getElementById("toast");
  var cartItems = 0;
  var toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2600);
  }

  function addToCart(name, price) {
    cartItems += 1;
    if (cartCount) {
      cartCount.textContent = String(cartItems);
      cartCount.classList.add("show");
    }
    showToast(tt("toast.added", "Añadido: ") + name + " · " + price + " €");
  }

  doc.querySelectorAll(".add-cart").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var pkey = btn.getAttribute("data-product-key");
      var fallback = btn.getAttribute("data-product") || "Producto";
      var name = pkey ? tt(pkey, fallback) : fallback;
      var price = btn.getAttribute("data-price") || "0";
      addToCart(name, price);
      if (cartBtn) {
        cartBtn.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }],
          { duration: 320, easing: "cubic-bezier(.22,.61,.36,1)" }
        );
      }
    });
  });

  if (cartBtn) {
    cartBtn.addEventListener("click", function () {
      if (cartItems === 0) {
        showToast(tt("toast.empty", "Tu carrito está vacío. ¡Explora la tienda solidaria!"));
      } else {
        var merch = doc.getElementById("merchan");
        showToast(tt("toast.count", "Llevas {n} artículo(s) en el carrito solidario.").replace("{n}", String(cartItems)));
        if (merch) merch.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  /* ---------- Animación al hacer scroll (reveal) ---------- */
  var revealEls = doc.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Barras de progreso (concienciación) ---------- */
  var statRows = doc.querySelectorAll(".stat-row");
  statRows.forEach(function (row) {
    var bar = row.querySelector(".stat-bar span");
    if (bar) {
      var w = bar.style.width;
      bar.style.width = "0";
      row.dataset.targetWidth = w;
    }
  });

  if ("IntersectionObserver" in window && statRows.length) {
    var sio = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var row = entry.target;
            var bar = row.querySelector(".stat-bar span");
            if (bar && row.dataset.targetWidth) {
              requestAnimationFrame(function () {
                bar.style.width = row.dataset.targetWidth;
              });
            }
            row.classList.add("animated");
            obs.unobserve(row);
          }
        });
      },
      { threshold: 0.4 }
    );
    statRows.forEach(function (row) { sio.observe(row); });
  } else {
    statRows.forEach(function (row) {
      var bar = row.querySelector(".stat-bar span");
      if (bar && row.dataset.targetWidth) bar.style.width = row.dataset.targetWidth;
      row.classList.add("animated");
    });
  }

  /* ---------- Scroll suave con offset de header fijo ---------- */
  var headerH = header ? header.offsetHeight : 0;
  doc.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id === "#" || id.length < 2) return;
      var target = doc.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - headerH + 2;
      window.scrollTo({ top: top, behavior: "smooth" });
      if (window.location.hash !== id) {
        history.replaceState(null, "", id);
      }
    });
  });

  /* ---------- Cerrar menú al hacer click fuera ---------- */
  doc.addEventListener("click", function (e) {
    if (!nav || !nav.classList.contains("open")) return;
    if (!e.target.closest("#nav") && !e.target.closest("#menuToggle")) closeMenu();
  });

  /* ---------- Cerrar menú con Escape ---------- */
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });
})();
