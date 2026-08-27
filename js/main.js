/* =========================================================
   SGB · Concienciación del Síndrome de Guillain-Barré
   Interactividad de la página
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
  var cartDrawer = doc.getElementById("cartDrawer");
  var cartClose = doc.getElementById("cartClose");
  var cartOverlay = doc.getElementById("cartOverlay");
  var cartItemsList = doc.getElementById("cartItemsList");
  var cartEmptyState = doc.getElementById("cartEmptyState");
  var cartFooter = doc.getElementById("cartFooter");
  var cartTotalPrice = doc.getElementById("cartTotalPrice");
  var clearCartBtn = doc.getElementById("clearCartBtn");
  var checkoutBtn = doc.getElementById("checkoutBtn");
  var continueShopping = doc.getElementById("continueShopping");

  var cart = [];
  var STORAGE_CART_KEY = "sgb-cart";
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
      cartCount.classList.toggle("show", totalItems > 0);
    }

    if (!cartItemsList) return;
    cartItemsList.innerHTML = "";

    if (cart.length === 0) {
      if (cartEmptyState) cartEmptyState.style.display = "flex";
      if (cartFooter) cartFooter.style.display = "none";
    } else {
      if (cartEmptyState) cartEmptyState.style.display = "none";
      if (cartFooter) cartFooter.style.display = "block";

      var total = 0;
      cart.forEach(function (item, index) {
        total += item.price * item.qty;
        var li = doc.createElement("li");
        li.className = "cart-item";
        li.innerHTML =
          "<div class=\"cart-item-img\"><svg viewBox=\"0 0 24 24\" width=\"32\" height=\"32\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M20.38 3.46L16 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5l-1.62-1.54z\"/><path d=\"M12 21c-1.5-3 2-4.5 0-7.5\" stroke-width=\"2.2\"/></svg></div>" +
          "<div class=\"cart-item-info\">" +
          "<h4 class=\"cart-item-name\">" + esc(item.name) + "</h4>" +
          "<span class=\"cart-item-price\">" + item.price + " €</span>" +
          "<div class=\"cart-item-actions\">" +
          "<div class=\"qty-controls\">" +
          "<button class=\"qty-btn minus\" data-index=\"" + index + "\" aria-label=\"" + tt("cart.qty.minus", "Reducir cantidad") + "\">−</button>" +
          "<span class=\"qty-val\">" + item.qty + "</span>" +
          "<button class=\"qty-btn plus\" data-index=\"" + index + "\" aria-label=\"" + tt("cart.qty.plus", "Aumentar cantidad") + "\">+</button>" +
          "</div>" +
          "<button class=\"cart-remove\" data-index=\"" + index + "\" aria-label=\"" + tt("cart.remove.aria", "Eliminar producto") + "\">" + tt("cart.remove", "Eliminar") + "</button>" +
          "</div>" +
          "</div>";
        cartItemsList.appendChild(li);
      });

      if (cartTotalPrice) cartTotalPrice.textContent = total + " €";
    }
  }

  /* Delegación de eventos para el carrito */
  if (cartItemsList) {
    cartItemsList.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn || !btn.dataset.index) return;
      var idx = parseInt(btn.dataset.index, 10);
      if (isNaN(idx) || idx < 0 || idx >= cart.length) return;

      if (btn.classList.contains("plus")) {
        cart[idx].qty += 1;
        saveCart();
      } else if (btn.classList.contains("minus")) {
        if (cart[idx].qty > 1) {
          cart[idx].qty -= 1;
        } else {
          cart.splice(idx, 1);
        }
        saveCart();
      } else if (btn.classList.contains("cart-remove")) {
        cart.splice(idx, 1);
        saveCart();
      }
    });
  }

  function openCart() {
    if (cartDrawer) {
      cartDrawer.classList.add("open");
      cartDrawer.setAttribute("aria-hidden", "false");
      doc.body.classList.add("cart-open");
    }
  }

  function closeCart() {
    if (cartDrawer) {
      cartDrawer.classList.remove("open");
      cartDrawer.setAttribute("aria-hidden", "true");
      doc.body.classList.remove("cart-open");
    }
  }

  function addToCart(name, price) {
    var existing = cart.find(function (i) { return i.name === name; });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name: name, price: parseFloat(price), qty: 1 });
    }
    saveCart();
    showToast(tt("toast.added", "Añadido: ") + name);
    openCart();
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
    cartBtn.addEventListener("click", openCart);
  }
  if (cartClose) cartClose.addEventListener("click", closeCart);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);
  if (continueShopping) continueShopping.addEventListener("click", closeCart);
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", function () {
      if (confirm(tt("cart.confirm.clear", "¿Vaciar todo el carrito?"))) {
        cart = [];
        saveCart();
      }
    });
  }
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      var total = cart.reduce(function (sum, item) { return sum + (item.price * item.qty); }, 0);
      var donation = total * 0.20; // 20% destinado a la causa
      addDonation(donation);
      
      cart = [];
      saveCart();
      closeCart();
      showToast(tt("cart.success", "¡Gracias! Tu compra solidaria ha sumado {n}€ al objetivo.").replace("{n}", donation.toFixed(2)));
    });
  }

  loadCart();
  loadGoal();

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

  /* ---------- Gestión del Mapa de Síntomas ---------- */
  var hotspots = doc.querySelectorAll(".hotspot");
  var infoContents = doc.querySelectorAll(".info-content");

  function showMapStep(step) {
    hotspots.forEach(function (h) {
      h.classList.toggle("active", h.getAttribute("data-step") === step);
    });
    infoContents.forEach(function (c) {
      if (c.getAttribute("data-step") === step) {
        c.hidden = false;
        c.classList.add("active");
      } else {
        c.hidden = true;
        c.classList.remove("active");
      }
    });
  }

  hotspots.forEach(function (h) {
    h.addEventListener("click", function () {
      var step = h.getAttribute("data-step");
      showMapStep(step);
    });
    // Accesibilidad con teclado
    h.setAttribute("role", "button");
    h.setAttribute("tabindex", "0");
    h.addEventListener("keypress", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showMapStep(h.getAttribute("data-step"));
      }
    });
  });

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
      headerH = header ? header.offsetHeight : 0; // Recalcular en cada click
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

  /* ---------- Gestión de Testimonios ---------- */
  var testGrid = doc.getElementById("testGrid");
  var testCountEl = doc.getElementById("testCount");
  var testEmpty = doc.getElementById("testEmpty");
  var testTabs = doc.querySelectorAll(".test-tab");
  var testShareBtn = doc.getElementById("testShareBtn");
  var testModal = doc.getElementById("testModal");
  var testForm = doc.getElementById("testForm");
  var testStoryField = doc.getElementById("testStoryField");
  var testVideoField = doc.getElementById("testVideoField");
  var typeBtns = doc.querySelectorAll(".type-btn");
  var testCharCount = doc.getElementById("testCharCount");
  var testStoryInput = doc.getElementById("testStory");

  var currentFilter = "all";
  var STORAGE_TEST_KEY = "sgb-testimonios";

  var defaultTestimonios = [
    {
      id: 1,
      name: "María L.",
      role: "patient",
      type: "text",
      content: "El diagnóstico me llegó de golpe. Hoy sé que con tratamiento precoz y apoyo se puede recuperar la vida.",
      date: "2025-08-01",
      verified: true,
      likes: 12
    },
    {
      id: 2,
      name: "Javier M.",
      role: "survivor",
      type: "video",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      caption: "Mi camino de recuperación del SGB",
      date: "2025-06-12",
      verified: true,
      likes: 8
    },
    {
      id: 3,
      name: "Lucía R.",
      role: "family",
      type: "text",
      content: "Cuando a mi padre le diagnosticaron SGB, el desconocimiento lo asustó tanto como la enfermedad.",
      date: "2025-07-20",
      verified: true,
      likes: 15
    }
  ];

  function getTestimonios() {
    var stored = localStorage.getItem(STORAGE_TEST_KEY);
    if (stored) return JSON.parse(stored);
    return defaultTestimonios;
  }

  function saveTestimonios(tests) {
    localStorage.setItem(STORAGE_TEST_KEY, JSON.stringify(tests));
  }

  function renderTestimonios() {
    if (!testGrid) return;
    var tests = getTestimonios();
    var filtered = tests.filter(function (t) {
      if (currentFilter === "all") return true;
      return t.type === currentFilter;
    });

    testGrid.innerHTML = "";
    if (filtered.length === 0) {
      if (testEmpty) testEmpty.hidden = false;
      if (testCountEl) testCountEl.hidden = true;
    } else {
      if (testEmpty) testEmpty.hidden = true;
      if (testCountEl) {
        testCountEl.hidden = false;
        testCountEl.innerHTML = tt("test.count", "Mostrando <strong>{n}</strong> testimonio(s)").replace("{n}", String(filtered.length));
      }

      filtered.forEach(function (t) {
        var card = doc.createElement("article");
        card.className = "test-card " + t.type;
        if (!t.verified) card.classList.add("pending-review");

        var html = "";
        if (t.type === "video") {
          html += "<div class=\"test-media\">";
          // Basic validation for URL
          var safeUrl = (t.videoUrl || "").replace(/"/g, "&quot;");
          if (safeUrl.indexOf("youtube.com") !== -1 || safeUrl.indexOf("youtu.be") !== -1) {
             html += "<div style=\"display:grid;place-items:center;height:100%;background:#000;color:#fff;font-size:0.8rem\">YouTube Video Placeholder</div>";
          } else {
             html += "<video src=\"" + safeUrl + "\" controls muted></video>";
          }
          html += "</div>";
        }

        html += "<div class=\"test-card-body\">";
        if (t.type === "text") {
          html += "<span class=\"test-quote-mark\" aria-hidden=\"true\">“</span>";
          html += "<p class=\"test-text\">" + esc(t.content) + "</p>";
        } else {
          html += "<h4 class=\"test-video-caption\">" + esc(t.caption || tt("test.video.default", "Testimonio en vídeo")) + "</h4>";
        }

        html += "<div class=\"test-foot\">";
        var initial = (t.name || "?").charAt(0).toUpperCase();
        html += "<div class=\"test-avatar role-" + (t.role || "other") + "\">" + esc(initial) + "</div>";
        html += "<div class=\"test-author\">";
        html += "<strong>" + esc(t.name) + "</strong>";
        html += "<span>" + esc(tt("test.role." + t.role, t.role)) + "</span>";
        html += "</div>";
        html += "</div>";

        html += "<div class=\"test-badges\">";
        if (t.verified) {
          html += "<span class=\"test-badge verified\"><svg viewBox=\"0 0 24 24\" width=\"12\" height=\"12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 6L9 17l-5-5\"/></svg>" + esc(tt("test.badge.verified", "Verificado")) + "</span>";
        } else {
          html += "<span class=\"test-badge pending\">" + esc(tt("test.badge.pending", "Pendiente")) + "</span>";
        }
        if (t.type === "video") {
          html += "<span class=\"test-badge video-badge\"><svg viewBox=\"0 0 24 24\" width=\"12\" height=\"12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2\" y=\"5\" width=\"14\" height=\"14\" rx=\"3\"/><path d=\"m22 8-6 4 6 4z\"/></svg>Video</span>";
        }
        html += "<time class=\"test-date\">" + esc(t.date) + "</time>";
        html += "</div>";

        html += "<div class=\"test-actions\">";
        html += "<button class=\"test-btn-action support-btn\" data-id=\"" + t.id + "\">";
        html += "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21l8.84-8.61a5.5 5.5 0 0 0 0-7.78z\"/></svg>";
        html += "<span>" + parseInt(t.likes || 0, 10) + "</span>";
        html += "</button>";
        html += "<button class=\"test-btn-action share-btn\" data-id=\"" + t.id + "\">";
        html += "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13\"/></svg>";
        html += "</button>";
        html += "</div>";

        html += "</div>";
        card.innerHTML = html;
        testGrid.appendChild(card);
      });
    }
  }

  /* Delegación de eventos para testimonios */
  if (testGrid) {
    testGrid.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn || !btn.dataset.id) return;
      var id = parseInt(btn.dataset.id, 10);
      var tests = getTestimonios();
      var t = tests.find(function (item) { return item.id === id; });
      if (!t) return;

      if (btn.classList.contains("support-btn")) {
        toggleTestLike(id);
      } else if (btn.classList.contains("share-btn")) {
        var shareText = t.type === "text" ? t.content : (t.caption || "Testimonio SGB");
        shareContent("SGB · " + t.name, shareText);
      }
    });
  }

  /* Filtros */
  testTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      testTabs.forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      currentFilter = tab.dataset.filter;
      renderTestimonios();
    });
  });

  function toggleTestLike(id) {
    var tests = getTestimonios();
    var test = tests.find(function (t) { return t.id === id; });
    if (test) {
      test.likes = (test.likes || 0) + 1;
      saveTestimonios(tests);
      renderTestimonios();
      showToast(tt("toast.like.success", "¡Gracias por tu apoyo!"));
    }
  }

  function shareContent(title, text) {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: window.location.href
      }).catch(function () {});
    } else {
      // Fallback
      var dummy = doc.createElement("input");
      doc.body.appendChild(dummy);
      dummy.value = window.location.href;
      dummy.select();
      doc.execCommand("copy");
      doc.body.removeChild(dummy);
      showToast(tt("toast.share.fallback", "Enlace copiado al portapapeles."));
    }
  }

  /* Modal */
  function openTestModal() {
    if (!testModal) return;
    testModal.classList.add("open");
    doc.body.classList.add("modal-open");
    testModal.setAttribute("aria-hidden", "false");
    var first = testModal.querySelector("input");
    if (first) first.focus();
  }

  function closeTestModal() {
    if (!testModal) return;
    testModal.classList.remove("open");
    doc.body.classList.remove("modal-open");
    testModal.setAttribute("aria-hidden", "true");
    if (testShareBtn) testShareBtn.focus();
  }

  if (testShareBtn) {
    testShareBtn.addEventListener("click", openTestModal);
  }

  doc.querySelectorAll("[data-test-close]").forEach(function (el) {
    el.addEventListener("click", closeTestModal);
  });

  /* Formulario */
  typeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      typeBtns.forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      var type = btn.dataset.type;
      if (type === "text") {
        testStoryField.hidden = false;
        testVideoField.hidden = true;
      } else {
        testStoryField.hidden = true;
        testVideoField.hidden = false;
      }
    });
  });

  if (testStoryInput && testCharCount) {
    testStoryInput.addEventListener("input", function () {
      testCharCount.textContent = String(testStoryInput.value.length);
    });
  }

  if (testForm) {
    testForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = doc.getElementById("testName").value.trim();
      var role = doc.getElementById("testRole").value;
      var activeTypeBtn = doc.querySelector(".type-btn.active");
      var type = activeTypeBtn ? activeTypeBtn.dataset.type : "text";
      var content = doc.getElementById("testStory").value.trim();
      var videoUrl = doc.getElementById("testVideo").value.trim();
      var caption = doc.getElementById("testCaption").value.trim();
      var consent = doc.getElementById("testConsent").checked;

      var valid = true;
      // Validación básica
      if (!name) {
        doc.getElementById("testName").parentElement.classList.add("invalid");
        valid = false;
      } else {
        doc.getElementById("testName").parentElement.classList.remove("invalid");
      }

      if (!role) {
        doc.getElementById("testRole").parentElement.classList.add("invalid");
        valid = false;
      } else {
        doc.getElementById("testRole").parentElement.classList.remove("invalid");
      }

      if (type === "text" && content.length < 20) {
        testStoryField.classList.add("invalid");
        valid = false;
      } else {
        testStoryField.classList.remove("invalid");
      }

      if (type === "video" && !videoUrl) {
        testVideoField.classList.add("invalid");
        valid = false;
      } else {
        testVideoField.classList.remove("invalid");
      }

      if (!consent) {
        doc.getElementById("testConsent").parentElement.classList.add("invalid");
        valid = false;
      } else {
        doc.getElementById("testConsent").parentElement.classList.remove("invalid");
      }

      if (!valid) return;

      var newTest = {
        id: Date.now(),
        name: name,
        role: role,
        type: type,
        content: content,
        videoUrl: videoUrl,
        caption: caption,
        date: new Date().toISOString().split("T")[0],
        verified: false
      };

      var tests = getTestimonios();
      tests.unshift(newTest);
      saveTestimonios(tests);

      showToast(tt("test.success", "¡Gracias! Tu testimonio se ha guardado y será revisado."));
      testForm.reset();
      if (testCharCount) testCharCount.textContent = "0";
      closeTestModal();
      renderTestimonios();
    });
  }

  renderTestimonios();

  /* ---------- Cerrar menú al hacer click fuera ---------- */
  doc.addEventListener("click", function (e) {
    if (!nav || !nav.classList.contains("open")) return;
    if (!e.target.closest("#nav") && !e.target.closest("#menuToggle")) closeMenu();
  });

  /* ---------- Cerrar menú con Escape ---------- */
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Modo Oscuro ---------- */
  var themeToggle = doc.getElementById("themeToggle");
  var STORAGE_THEME_KEY = "sgb-theme";

  /* ---------- Objetivo de Donación ---------- */
  var STORAGE_GOAL_KEY = "sgb-goal-amount";
  var GOAL_TOTAL = 2500;
  var currentGoalAmount = 850; // Cantidad base inicial

  function loadGoal() {
    var stored = localStorage.getItem(STORAGE_GOAL_KEY);
    if (stored) currentGoalAmount = parseFloat(stored);
    updateGoalUI();
  }

  function addDonation(amount) {
    currentGoalAmount += amount;
    localStorage.setItem(STORAGE_GOAL_KEY, currentGoalAmount);
    updateGoalUI();
  }

  function updateGoalUI() {
    var amountEl = doc.getElementById("currentGoalAmount");
    var barEl = doc.getElementById("goalBar");
    var noteEl = doc.getElementById("goalNote");
    if (!amountEl || !barEl) return;

    var percent = Math.min((currentGoalAmount / GOAL_TOTAL) * 100, 100);
    amountEl.textContent = Math.floor(currentGoalAmount).toLocaleString();
    barEl.style.width = percent + "%";
    
    if (noteEl) {
      noteEl.innerHTML = tt("goal.note", "Llevamos el {n}% del objetivo alcanzado gracias a vuestra ayuda.")
        .replace("{n}", "<strong>" + Math.floor(percent) + "</strong>");
    }
  }

  function applyTheme(theme) {
    doc.documentElement.setAttribute("data-theme", theme);
  }

  function toggleTheme() {
    var current = doc.documentElement.getAttribute("data-theme") || "light";
    var newTheme = current === "light" ? "dark" : "light";
    applyTheme(newTheme);
    localStorage.setItem(STORAGE_THEME_KEY, newTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  var savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    applyTheme("dark");
  }

  /* ---------- Quiz Interactivo ---------- */
  var quizStart = doc.getElementById("quizStart");
  var quizGame = doc.getElementById("quizGame");
  var quizResult = doc.getElementById("quizResult");
  var startQuizBtn = doc.getElementById("startQuizBtn");
  var restartQuizBtn = doc.getElementById("restartQuizBtn");
  var quizQuestion = doc.getElementById("quizQuestion");
  var quizOptions = doc.getElementById("quizOptions");
  var quizProgressBar = doc.getElementById("quizProgressBar");
  var quizStepCount = doc.getElementById("quizStepCount");
  var quizFeedback = doc.getElementById("quizFeedback");
  var feedbackText = doc.getElementById("feedbackText");
  var feedbackIcon = doc.getElementById("feedbackIcon");
  var nextQuestionBtn = doc.getElementById("nextQuestionBtn");
  var resultScore = doc.getElementById("resultScore");
  var resultTitle = doc.getElementById("resultTitle");
  var resultText = doc.getElementById("resultText");

  var currentQuestionIdx = 0;
  var score = 0;
  var questions = [
    { q: "quiz.q1", o: ["quiz.q1.a", "quiz.q1.b", "quiz.q1.c"], correct: 1, f: "quiz.q1.f" },
    { q: "quiz.q2", o: ["quiz.q2.a", "quiz.q2.b", "quiz.q2.c"], correct: 1, f: "quiz.q2.f" },
    { q: "quiz.q3", o: ["quiz.q3.a", "quiz.q3.b", "quiz.q3.c"], correct: 1, f: "quiz.q3.f" },
    { q: "quiz.q4", o: ["quiz.q4.a", "quiz.q4.b", "quiz.q4.c"], correct: 1, f: "quiz.q4.f" },
    { q: "quiz.q5", o: ["quiz.q5.a", "quiz.q5.b", "quiz.q5.c"], correct: 0, f: "quiz.q5.f" }
  ];

  function showQuestion() {
    if (!quizQuestion || !quizOptions) return;
    var qData = questions[currentQuestionIdx];
    quizQuestion.textContent = tt(qData.q, "Question");
    quizOptions.innerHTML = "";
    quizFeedback.hidden = true;

    qData.o.forEach(function (optKey, idx) {
      var btn = doc.createElement("button");
      btn.className = "quiz-opt";
      btn.textContent = tt(optKey, "Option");
      btn.addEventListener("click", function () { checkAnswer(idx); });
      quizOptions.appendChild(btn);
    });

    if (quizProgressBar) quizProgressBar.style.width = ((currentQuestionIdx) / questions.length * 100) + "%";
    if (quizStepCount) quizStepCount.textContent = (currentQuestionIdx + 1) + "/" + questions.length;
  }

  function checkAnswer(selectedIdx) {
    var qData = questions[currentQuestionIdx];
    var options = quizOptions.querySelectorAll(".quiz-opt");
    options.forEach(function (btn) { btn.disabled = true; });

    var isCorrect = (selectedIdx === qData.correct);
    if (isCorrect) {
      score++;
      options[selectedIdx].classList.add("correct");
    } else {
      options[selectedIdx].classList.add("wrong");
      options[qData.correct].classList.add("correct");
    }

    if (quizFeedback) {
      quizFeedback.hidden = false;
      quizFeedback.className = "quiz-feedback " + (isCorrect ? "correct" : "wrong");
      if (feedbackText) feedbackText.textContent = tt(qData.f, isCorrect ? "¡Correcto!" : "Vaya...");
      if (feedbackIcon) {
        feedbackIcon.innerHTML = isCorrect
          ? "<svg viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\"><path d=\"M20 6L9 17l-5-5\"/></svg>"
          : "<svg viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\"><path d=\"M18 6L6 18M6 6l12 12\"/></svg>";
      }
    }
  }

  function nextQuestion() {
    currentQuestionIdx++;
    if (currentQuestionIdx < questions.length) {
      showQuestion();
    } else {
      showResults();
    }
  }

  function showResults() {
    if (quizGame) quizGame.hidden = true;
    if (quizResult) quizResult.hidden = false;
    if (quizProgressBar) quizProgressBar.style.width = "100%";
    if (resultScore) resultScore.textContent = score + "/" + questions.length;

    var resKey = "quiz.res.low";
    if (score === questions.length) resKey = "quiz.res.high";
    else if (score >= 3) resKey = "quiz.res.med";

    if (resultTitle) resultTitle.textContent = tt(resKey, "¡Gracias por participar!");
    if (resultText) resultText.textContent = tt("quiz.res.text", "Tu conocimiento ayuda a visibilizar el SGB.");
  }

  function startQuiz() {
    currentQuestionIdx = 0;
    score = 0;
    if (quizStart) quizStart.hidden = true;
    if (quizResult) quizResult.hidden = true;
    if (quizGame) quizGame.hidden = false;
    showQuestion();
  }

  if (startQuizBtn) startQuizBtn.addEventListener("click", startQuiz);
  if (restartQuizBtn) restartQuizBtn.addEventListener("click", startQuiz);
  if (nextQuestionBtn) nextQuestionBtn.addEventListener("click", nextQuestion);

  var shareQuizBtn = doc.getElementById("shareQuizBtn");
  if (shareQuizBtn) {
    shareQuizBtn.addEventListener("click", function () {
      var shareText = tt("quiz.share.text", "He sacado un {n} en el Quiz de concienciación sobre el SGB. ¡Pon a prueba tu conocimiento!").replace("{n}", score + "/" + questions.length);
      shareContent("SGB Quiz", shareText);
    });
  }

  /* ---------- Newsletter ---------- */
  var newsletterForm = doc.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = doc.getElementById("newsEmail").value;
      if (email) {
        showToast(tt("toast.newsletter.success", "¡Gracias! Te has suscrito con: ") + email);
        newsletterForm.reset();
      }
    });
  }

  /* ---------- Voluntariado ---------- */
  var volModal = doc.getElementById("volunteerModal");
  var openVolBtn = doc.getElementById("openVolunteerModal");
  var closeVolBtn = doc.getElementById("closeVolModal");
  var cancelVolBtn = doc.getElementById("cancelVol");
  var volOverlay = doc.getElementById("volOverlay");
  var volForm = doc.getElementById("volunteerForm");

  function openVolModal() {
    volModal.classList.add("open");
    volModal.setAttribute("aria-hidden", "false");
    doc.body.style.overflow = "hidden";
  }

  function closeVolModal() {
    volModal.classList.remove("open");
    volModal.setAttribute("aria-hidden", "true");
    doc.body.style.overflow = "";
  }

  if (openVolBtn) openVolBtn.addEventListener("click", openVolModal);
  if (closeVolBtn) closeVolBtn.addEventListener("click", closeVolModal);
  if (cancelVolBtn) cancelVolBtn.addEventListener("click", closeVolModal);
  if (volOverlay) volOverlay.addEventListener("click", closeVolModal);

  if (volForm) {
    volForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = volForm.querySelector("button[type='submit']");
      var originalText = btn.innerText;

      btn.disabled = true;
      btn.innerText = "...";

      // Simular envío
      setTimeout(function () {
        showToast(tt("vol.toast.success", "¡Gracias por tu interés! Nos pondremos en contacto contigo pronto."));
        volForm.reset();
        btn.disabled = false;
        btn.innerText = originalText;
        closeVolModal();
      }, 1000);
    });
  }

  /* ---------- Glosario ---------- */
  var glossarySearch = doc.getElementById("glossarySearch");
  var glossaryItems = doc.querySelectorAll(".glossary-item");
  var glossaryEmpty = doc.getElementById("glossaryEmpty");

  if (glossarySearch) {
    glossarySearch.addEventListener("input", function () {
      var query = glossarySearch.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      var count = 0;

      glossaryItems.forEach(function (item) {
        var term = item.dataset.term.toLowerCase();
        var title = item.querySelector("h3").innerText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        var text = item.querySelector("p").innerText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (term.includes(query) || title.includes(query) || text.includes(query)) {
          item.style.display = "";
          count++;
        } else {
          item.style.display = "none";
        }
      });

      if (glossaryEmpty) {
        glossaryEmpty.hidden = count > 0;
      }
    });
  }

  /* ---------- Footer Share & Back to Top ---------- */
  var footerShareBtn = doc.getElementById("footerShareBtn");
  if (footerShareBtn) {
    footerShareBtn.addEventListener("click", function () {
      shareContent("SGB · Concienciación", "Visita esta web sobre el Síndrome de Guillain-Barré.");
    });
  }

  /* ---------- Accesibilidad ---------- */
  var accessPanel = doc.getElementById("accessPanel");
  var accessToggle = doc.getElementById("accessToggle");
  var toggleContrast = doc.getElementById("toggleContrast");
  var fontPlus = doc.getElementById("fontPlus");
  var fontMinus = doc.getElementById("fontMinus");
  var resetAccess = doc.getElementById("resetAccess");
  var fontSizeMultiplier = 1;

  if (accessToggle) {
    accessToggle.addEventListener("click", function () {
      accessPanel.classList.toggle("open");
    });
  }

  if (toggleContrast) {
    toggleContrast.addEventListener("click", function () {
      doc.body.classList.toggle("high-contrast");
      toggleContrast.classList.toggle("active");
    });
  }

  if (fontPlus) {
    fontPlus.addEventListener("click", function () {
      if (fontSizeMultiplier < 1.5) {
        fontSizeMultiplier += 0.1;
        doc.documentElement.style.fontSize = (fontSizeMultiplier * 100) + "%";
      }
    });
  }

  if (fontMinus) {
    fontMinus.addEventListener("click", function () {
      if (fontSizeMultiplier > 0.8) {
        fontSizeMultiplier -= 0.1;
        doc.documentElement.style.fontSize = (fontSizeMultiplier * 100) + "%";
      }
    });
  }

  if (resetAccess) {
    resetAccess.addEventListener("click", function () {
      doc.body.classList.remove("high-contrast");
      if (toggleContrast) toggleContrast.classList.remove("active");
      fontSizeMultiplier = 1;
      doc.documentElement.style.fontSize = "";
    });
  }

  // Cerrar al hacer clic fuera
  doc.addEventListener("click", function (e) {
    if (accessPanel && !accessPanel.contains(e.target) && accessPanel.classList.contains("open")) {
      accessPanel.classList.remove("open");
    }
  });

  /* ---------- Text to Speech ---------- */
  var ttsButtons = doc.querySelectorAll(".tts-btn");
  var synth = window.speechSynthesis;
  var currentUtterance = null;

  function stopReading() {
    if (synth) {
      synth.cancel();
      ttsButtons.forEach(function (btn) {
        btn.classList.remove("playing");
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
      });
    }
  }

  if (ttsButtons.length > 0 && synth) {
    ttsButtons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var targetId = btn.dataset.tts;
        var targetSection = doc.querySelector(targetId);

        if (btn.classList.contains("playing")) {
          stopReading();
          return;
        }

        stopReading();

        if (targetSection) {
          var textToRead = targetSection.innerText;
          // Limpiar un poco el texto (quitar el propio botón si se cuela)
          textToRead = textToRead.replace(/Escuchar contenido|Listen to content|Inhalt anhören|Écouter le contenu/g, "");
          
          currentUtterance = new SpeechSynthesisUtterance(textToRead);
          currentUtterance.lang = doc.documentElement.lang || "es";
          
          currentUtterance.onend = function () {
            btn.classList.remove("playing");
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
          };

          btn.classList.add("playing");
          btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
          
          synth.speak(currentUtterance);
        }
      });
    });
  }

  // Parar lectura si se cambia de idioma
  doc.querySelectorAll(".lang-option").forEach(function (opt) {
    opt.addEventListener("click", stopReading);
  });

  /* ---------- Mitos ---------- */
  var flipCards = doc.querySelectorAll(".flip-card");
  flipCards.forEach(function (card) {
    card.addEventListener("click", function () {
      card.classList.toggle("flipped");
    });
  });

  var backToTopBtn = doc.getElementById("backToTop");
  if (backToTopBtn) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add("show");
      } else {
        backToTopBtn.classList.remove("show");
      }
    });

    backToTopBtn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  /* ---------- Checklist de Cuidadores ---------- */
  var checklistItems = doc.querySelectorAll(".checklist-item");
  var STORAGE_CHECKLIST_KEY = "sgb-care-checklist";

  function loadChecklist() {
    try {
      var stored = localStorage.getItem(STORAGE_CHECKLIST_KEY);
      if (stored) {
        var data = JSON.parse(stored);
        checklistItems.forEach(function (item) {
          var input = item.querySelector("input");
          if (input && data[input.id]) {
            input.checked = true;
            item.classList.add("checked");
          }
        });
      }
    } catch (e) {}
  }

  function saveChecklist() {
    var data = {};
    checklistItems.forEach(function (item) {
      var input = item.querySelector("input");
      if (input) data[input.id] = input.checked;
    });
    try {
      localStorage.setItem(STORAGE_CHECKLIST_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  checklistItems.forEach(function (item) {
    var input = item.querySelector("input");
    if (!input) return;

    // Permitir clic en toda la fila
    item.addEventListener("click", function (e) {
      if (e.target !== input) {
        input.checked = !input.checked;
        var event = new Event("change");
        input.dispatchEvent(event);
      }
    });

    input.addEventListener("change", function () {
      item.classList.toggle("checked", input.checked);
      saveChecklist();
    });
  });

  loadChecklist();

  /* ---------- Seguimiento de Hitos ---------- */
  var milestoneCards = doc.querySelectorAll(".milestone-card");
  var STORAGE_MILESTONES_KEY = "sgb-milestones";

  function loadMilestones() {
    try {
      var stored = localStorage.getItem(STORAGE_MILESTONES_KEY);
      if (stored) {
        var data = JSON.parse(stored);
        milestoneCards.forEach(function (card) {
          var id = card.dataset.milestone;
          if (data[id]) {
            card.classList.add("unlocked");
          }
        });
      }
    } catch (e) {}
  }

  function saveMilestones() {
    var data = {};
    milestoneCards.forEach(function (card) {
      var id = card.dataset.milestone;
      data[id] = card.classList.contains("unlocked");
    });
    try {
      localStorage.setItem(STORAGE_MILESTONES_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  milestoneCards.forEach(function (card) {
    function toggleMilestone() {
      var isUnlocked = card.classList.toggle("unlocked");
      if (isUnlocked) {
        showToast(tt("miles.unlocked", "¡Hito alcanzado!"));
      }
      saveMilestones();
    }

    card.addEventListener("click", toggleMilestone);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleMilestone();
      }
    });
  });

  loadMilestones();

  /* ---------- Red de Apoyo (Filtros) ---------- */
  var regionTabs = doc.querySelectorAll(".region-tab");
  var assocCards = doc.querySelectorAll(".assoc-card");

  regionTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      regionTabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");

      var region = tab.dataset.region;
      assocCards.forEach(function (card) {
        if (region === "all" || card.dataset.region === region) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });

})();
