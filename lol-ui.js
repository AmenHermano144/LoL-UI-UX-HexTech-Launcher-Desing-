/* ==========================================================================
   LoL-UI — comportamiento de componentes (sin dependencias)
   Uso: <script src="lol-ui.js"></script>  →  LolUI.init()  (se llama solo al cargar)
   ========================================================================== */
(function (global) {
  "use strict";

  /* ---------- Slider: rellena la pista y muestra el valor ---------- */
  function initSliders(root) {
    root.querySelectorAll(".lol-range").forEach(function (r) {
      if (r._lol) return; r._lol = true;
      var out = r.closest(".lol-slider") && r.closest(".lol-slider").querySelector(".lol-slider__value");
      var suffix = r.dataset.suffix || "";
      function paint() {
        var min = +r.min || 0, max = +r.max || 100;
        r.style.setProperty("--val", ((r.value - min) / (max - min)) * 100 + "%");
        if (out) out.textContent = r.value + suffix;
      }
      r.addEventListener("input", paint); paint();
    });
  }

  /* ---------- Stepper numérico ---------- */
  function initSteppers(root) {
    root.querySelectorAll(".lol-stepper").forEach(function (s) {
      if (s._lol) return; s._lol = true;
      var input = s.querySelector("input");
      var btns = s.querySelectorAll("button");
      function step(d) {
        var v = (+input.value || 0) + d * (+input.step || 1);
        if (input.min !== "") v = Math.max(+input.min, v);
        if (input.max !== "") v = Math.min(+input.max, v);
        input.value = v; input.dispatchEvent(new Event("change", { bubbles: true }));
      }
      btns[0].addEventListener("click", function () { step(-1); });
      btns[1].addEventListener("click", function () { step(1); });
    });
  }

  /* ---------- Select personalizado ---------- */
  function initSelects(root) {
    root.querySelectorAll(".lol-select").forEach(function (sel) {
      if (sel._lol) return; sel._lol = true;
      var trigger = sel.querySelector(".lol-select__trigger");
      var label = trigger.querySelector("span") || trigger;
      var opts = Array.prototype.slice.call(sel.querySelectorAll(".lol-select__option"));
      var active = -1;
      function open(v) {
        sel.classList.toggle("is-open", v);
        trigger.setAttribute("aria-expanded", v);
        if (v) { active = Math.max(0, opts.findIndex(function (o) { return o.getAttribute("aria-selected") === "true"; })); mark(); }
      }
      function mark() { opts.forEach(function (o, i) { o.classList.toggle("is-active", i === active); }); if (opts[active]) opts[active].scrollIntoView({ block: "nearest" }); }
      function choose(o) {
        opts.forEach(function (x) { x.setAttribute("aria-selected", x === o); });
        label.textContent = o.textContent;
        sel.dataset.value = o.dataset.value || o.textContent;
        sel.dispatchEvent(new CustomEvent("lol:change", { bubbles: true, detail: { value: sel.dataset.value } }));
        open(false); trigger.focus();
      }
      trigger.addEventListener("click", function () { open(!sel.classList.contains("is-open")); });
      opts.forEach(function (o) { o.addEventListener("click", function () { choose(o); }); });
      trigger.addEventListener("keydown", function (e) {
        var isOpen = sel.classList.contains("is-open");
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault(); if (!isOpen) return open(true);
          active = (active + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length; mark();
        } else if ((e.key === "Enter" || e.key === " ") && isOpen) { e.preventDefault(); choose(opts[active]); }
        else if (e.key === "Escape") open(false);
      });
      document.addEventListener("click", function (e) { if (!sel.contains(e.target)) open(false); });
    });
  }

  /* ---------- Keybinds ----------
     <button class="lol-keybind" data-action="ability-q" data-key="Q"></button>
     Click → escucha. Esc cancela. Retroceso/Supr borra. Detecta modificadores y conflictos.
     Emite "lol:keybind" con { action, key }.                                            */
  var KEY_BASE = { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Control: "Ctrl", Escape: "Esc", Enter: "Enter", Tab: "Tab" };
  var I18N = {
    en: { unassigned: "Unassigned", pressKey: "Press a key…", keys: { " ": "Space", CapsLock: "Caps Lock" }, mouse: { 0: "Left click", 1: "Middle click", 2: "Right click" } },
    es: { unassigned: "Sin asignar", pressKey: "Presiona una tecla…", keys: { " ": "Espacio", CapsLock: "Bloq Mayús" }, mouse: { 0: "Clic izq.", 1: "Clic central", 2: "Clic der." } }
  };
  var LANG = document.documentElement.getAttribute("lang") === "es" ? "es" : "en";
  function strings() { return I18N[LANG]; }
  function keyLabel(e) {
    return strings().keys[e.key] || KEY_BASE[e.key] || (e.key.length === 1 ? e.key.toUpperCase() : e.key);
  }
  function mouseLabel(b) { return strings().mouse[b] || "Mouse " + (b + 1); }
  function renderKeybind(btn) {
    var k = btn.dataset.key;
    btn.classList.toggle("is-empty", !k);
    btn.textContent = k || strings().unassigned;
  }
  function checkConflicts(root) {
    var all = Array.prototype.slice.call(root.querySelectorAll(".lol-keybind"));
    var count = {};
    all.forEach(function (b) { if (b.dataset.key) count[b.dataset.key] = (count[b.dataset.key] || 0) + 1; });
    all.forEach(function (b) { b.classList.toggle("is-conflict", !!b.dataset.key && count[b.dataset.key] > 1); });
  }
  function initKeybinds(root) {
    root.querySelectorAll(".lol-keybind").forEach(function (btn) {
      if (btn._lol) return; btn._lol = true;
      renderKeybind(btn);
      var listening = false;
      function stop(save, key) {
        listening = false; btn.classList.remove("is-listening");
        if (save) {
          btn.dataset.key = key || "";
          btn.dispatchEvent(new CustomEvent("lol:keybind", { bubbles: true, detail: { action: btn.dataset.action, key: key || null } }));
        }
        renderKeybind(btn); checkConflicts(document);
        window.removeEventListener("keydown", onKey, true);
        window.removeEventListener("mousedown", onMouse, true);
      }
      function onKey(e) {
        e.preventDefault(); e.stopPropagation();
        if (["Shift", "Control", "Alt", "Meta"].indexOf(e.key) > -1) {
          var held = [e.ctrlKey && "Ctrl", e.altKey && "Alt", e.shiftKey && "Shift"].filter(Boolean).join(" + ");
          btn.textContent = held + " + …"; return;
        }
        if (e.key === "Escape") return stop(false);
        if (e.key === "Backspace" || e.key === "Delete") return stop(true, "");
        var mods = [e.ctrlKey && "Ctrl", e.altKey && "Alt", e.shiftKey && "Shift"].filter(Boolean);
        mods.push(keyLabel(e));
        stop(true, mods.join(" + "));
      }
      function onMouse(e) {
        if (e.target === btn && e.button === 0) return; // el clic que activó
        if (e.target !== btn) return stop(false);
        e.preventDefault(); stop(true, mouseLabel(e.button));
      }
      btn.addEventListener("click", function () {
        if (listening) return;
        listening = true; btn.classList.add("is-listening"); btn.classList.remove("is-empty");
        btn.textContent = strings().pressKey;
        setTimeout(function () {
          window.addEventListener("keydown", onKey, true);
          window.addEventListener("mousedown", onMouse, true);
        }, 0);
      });
      btn.addEventListener("contextmenu", function (e) { if (listening) e.preventDefault(); });
    });
    checkConflicts(document);
  }

  /* ---------- Tabs ---------- */
  function initTabs(root) {
    root.querySelectorAll(".lol-tabs").forEach(function (tabs) {
      if (tabs._lol) return; tabs._lol = true;
      var list = Array.prototype.slice.call(tabs.querySelectorAll(".lol-tab"));
      function select(t) {
        list.forEach(function (x) {
          var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
          var p = x.getAttribute("aria-controls") && document.getElementById(x.getAttribute("aria-controls"));
          if (p) p.hidden = !on;
        });
      }
      list.forEach(function (t, i) {
        t.addEventListener("click", function () { select(t); });
        t.addEventListener("keydown", function (e) {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          var n = list[(i + (e.key === "ArrowRight" ? 1 : -1) + list.length) % list.length]; select(n); n.focus();
        });
      });
    });
  }

  /* ---------- Segmentado ---------- */
  function initSegmented(root) {
    root.querySelectorAll(".lol-segmented").forEach(function (g) {
      if (g._lol) return; g._lol = true;
      g.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
          g.dispatchEvent(new CustomEvent("lol:change", { bubbles: true, detail: { value: b.dataset.value || b.textContent } }));
        });
      });
    });
  }

  /* ---------- Tooltip: data-lol-tooltip="Texto" o data-lol-tooltip-title ---------- */
  var tip;
  function initTooltips(root) {
    if (!tip) { tip = document.createElement("div"); tip.className = "lol-tooltip"; document.body.appendChild(tip); }
    root.querySelectorAll("[data-lol-tooltip]").forEach(function (el) {
      if (el._lolTip) return; el._lolTip = true;
      function show() {
        var t = el.getAttribute("data-lol-tooltip-title");
        tip.innerHTML = "";
        if (t) { var s = document.createElement("strong"); s.textContent = t; tip.appendChild(s); }
        tip.appendChild(document.createTextNode(el.getAttribute("data-lol-tooltip")));
        var r = el.getBoundingClientRect();
        tip.classList.add("is-visible");
        var tw = tip.offsetWidth, th = tip.offsetHeight;
        var x = Math.min(Math.max(8, r.left + r.width / 2 - tw / 2), innerWidth - tw - 8);
        var y = r.top - th - 10; if (y < 8) y = r.bottom + 10;
        tip.style.left = x + "px"; tip.style.top = y + "px";
      }
      function hide() { tip.classList.remove("is-visible"); }
      el.addEventListener("mouseenter", show); el.addEventListener("focus", show);
      el.addEventListener("mouseleave", hide); el.addEventListener("blur", hide);
    });
  }

  /* ---------- Modal ---------- */
  function openModal(id) {
    var m = document.getElementById(id); if (!m) return;
    m.classList.add("is-open");
    var f = m.querySelector("button, [tabindex], input"); if (f) setTimeout(function () { f.focus(); }, 50);
  }
  function closeModal(m) { (typeof m === "string" ? document.getElementById(m) : m).classList.remove("is-open"); }
  function initModals(root) {
    root.querySelectorAll("[data-lol-open]").forEach(function (b) {
      if (b._lol) return; b._lol = true;
      b.addEventListener("click", function () { openModal(b.getAttribute("data-lol-open")); });
    });
    root.querySelectorAll(".lol-modal-backdrop").forEach(function (m) {
      if (m._lol) return; m._lol = true;
      m.addEventListener("click", function (e) { if (e.target === m || e.target.closest("[data-lol-close]")) closeModal(m); });
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") document.querySelectorAll(".lol-modal-backdrop.is-open").forEach(closeModal);
  });

  /* ---------- Toast ---------- */
  function toast(opts) {
    opts = opts || {};
    var box = document.querySelector(".lol-toasts");
    if (!box) { box = document.createElement("div"); box.className = "lol-toasts lol-root"; document.body.appendChild(box); }
    var t = document.createElement("div");
    t.className = "lol-toast" + (opts.type ? " lol-toast--" + opts.type : "");
    var body = document.createElement("div");
    var h = document.createElement("div"); h.className = "lol-toast__title"; h.textContent = opts.title || "";
    var p = document.createElement("div"); p.className = "lol-toast__msg"; p.textContent = opts.message || "";
    body.appendChild(h); body.appendChild(p); t.appendChild(body);
    box.appendChild(t);
    setTimeout(function () { t.classList.add("is-leaving"); setTimeout(function () { t.remove(); }, 220); }, opts.duration || 3500);
    return t;
  }

  function setLang(l) {
    LANG = l === "es" ? "es" : "en";
    document.querySelectorAll(".lol-keybind").forEach(function (b) {
      if (!b.classList.contains("is-listening")) renderKeybind(b);
    });
  }

  function init(root) {
    root = root || document;
    initSliders(root); initSteppers(root); initSelects(root); initKeybinds(root);
    initTabs(root); initSegmented(root); initTooltips(root); initModals(root);
  }

  global.LolUI = { init: init, toast: toast, openModal: openModal, closeModal: closeModal, setLang: setLang };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); });
  else init();
})(window);
