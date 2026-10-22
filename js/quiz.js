/* Квиз: ветвление по ответам, плавные переходы, финальный шаг с выбором связи и телефоном. */
(function () {
  var cfg = window.SITE_CONFIG, Lead = window.Lead, ALL = window.QUIZ_STEPS, CHANNELS = window.QUIZ_CHANNELS;
  var root = document.getElementById("quiz");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = { i: 0, answers: { channel: CHANNELS[0] }, busy: false, timer: null };
  var fill = el("div", { class: "q-fill" });
  var holder = el("div", { class: "q-holder" });
  root.appendChild(el("div", { class: "q-bar" }, [fill])); root.appendChild(holder);

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k]; else if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }
  function path() { return ALL.filter(function (s) { return !s.when || s.when(state.answers); }); }
  function total() { return path().length + 1; }
  function setBar(done) { fill.style.transform = "scaleX(" + (done ? 1 : (state.i + 1) / total()) + ")"; }
  function arrow(dir) { return el("span", { class: "q-arrow " + dir, "aria-hidden": "true" }); }
  function prune() { /* ответы шагов, которые больше не показываются, убираем */
    var ids = path().map(function (s) { return s.id; });
    ALL.forEach(function (s) { if (ids.indexOf(s.id) === -1) delete state.answers[s.id]; });
  }

  /* Плавная смена экрана: старый уходит, новый появляется с нужной стороны */
  function show(build, dir) {
    if (state.busy) return; clearTimeout(state.timer);
    var old = holder.firstChild;
    function put() {
      var panel = build(); panel.classList.add(dir === "back" ? "enter-back" : "enter");
      holder.replaceChildren(panel); state.busy = false;
      var t = panel.querySelector(".q-title"); if (t && old) t.focus({ preventScroll: true });
    }
    if (!old || reduce) { put(); return; }
    state.busy = true; old.classList.add(dir === "back" ? "leave-back" : "leave");
    setTimeout(put, 170);
  }
  function go(dir) {
    if (dir === "back") state.i -= 1;
    else { Lead.goal("quiz_step_" + (state.i + 1)); state.i += 1; prune(); }
    render(dir);
  }
  function backBtn() {
    var b = el("button", { type: "button", class: "q-btn q-back", "aria-label": "Назад" }, [arrow("l")]);
    b.addEventListener("click", function () { go("back"); });
    return b;
  }

  function stepPanel(s) {
    var multi = s.type === "multi";
    var picked = state.answers[s.id];
    var sel = multi ? (picked || []).slice() : null;
    var panel = el("div", { class: "q-panel" });
    var grid = el("div", { class: "q-grid", role: multi ? "group" : "radiogroup", "aria-labelledby": "q-title" });
    var hint = el("p", { class: "q-hint", id: "q-hint", text: (multi ? sel.length : picked) ? "" : (s.hint || "Выберите вариант, дальше автоматически") });
    var next = el("button", { type: "button", class: "q-btn q-next" }, [el("span", { text: "Далее" }), arrow("r")]);
    next.disabled = multi ? !sel.length : !picked;
    s.options.forEach(function (o) {
      var on = multi ? sel.indexOf(o) !== -1 : o === picked;
      var b = el("button", { type: "button", role: multi ? "checkbox" : "radio", "aria-checked": on ? "true" : "false", class: "q-opt" + (multi ? " multi" : "") + (on ? " is-on" : "") }, [el("span", { class: "q-radio" }), el("span", { text: o })]);
      b.addEventListener("click", function () {
        if (state.busy) return;
        if (multi) {
          var k = sel.indexOf(o); if (k === -1) sel.push(o); else sel.splice(k, 1);
          b.classList.toggle("is-on", k === -1); b.setAttribute("aria-checked", k === -1 ? "true" : "false");
          state.answers[s.id] = sel.slice(); next.disabled = !sel.length; hint.textContent = sel.length ? "" : s.hint;
          return;
        }
        state.answers[s.id] = o;
        grid.querySelectorAll(".q-opt").forEach(function (x) { x.classList.remove("is-on"); x.setAttribute("aria-checked", "false"); });
        b.classList.add("is-on"); b.setAttribute("aria-checked", "true"); next.disabled = false; hint.textContent = "";
        clearTimeout(state.timer); state.timer = setTimeout(function () { go("next"); }, reduce ? 0 : 340);
      });
      grid.appendChild(b);
    });
    next.addEventListener("click", function () { clearTimeout(state.timer); go("next"); });
    var actions = el("div", { class: "q-actions" });
    if (state.i > 0) actions.appendChild(backBtn());
    actions.appendChild(next);
    panel.appendChild(el("h2", { class: "q-title", tabindex: "-1", id: "q-title", text: s.title }));
    panel.appendChild(grid); panel.appendChild(hint); panel.appendChild(actions);
    return panel;
  }

  function contactPanel() {
    var panel = el("div", { class: "q-panel" });
    panel.appendChild(el("h2", { class: "q-title", tabindex: "-1", id: "q-title", text: "Напишите номер телефона" }));
    panel.appendChild(el("p", { class: "q-sub", text: "и узнайте, сколько заявок система даст в вашем случае" }));
    panel.appendChild(el("p", { class: "q-label", id: "q-ch-label", text: "Выберите способ связи" }));
    var tabs = el("div", { class: "q-tabs", role: "radiogroup", "aria-labelledby": "q-ch-label" });
    CHANNELS.forEach(function (c) {
      var on = state.answers.channel === c;
      var t = el("button", { type: "button", role: "radio", "aria-checked": on ? "true" : "false", class: "q-tab" + (on ? " is-on" : ""), text: c });
      t.addEventListener("click", function () {
        state.answers.channel = c;
        tabs.querySelectorAll(".q-tab").forEach(function (x) { x.classList.remove("is-on"); x.setAttribute("aria-checked", "false"); });
        t.classList.add("is-on"); t.setAttribute("aria-checked", "true");
        phone.focus({ preventScroll: true });
      });
      tabs.appendChild(t);
    });
    panel.appendChild(tabs);
    var phone = el("input", { type: "tel", class: "q-input", inputmode: "tel", autocomplete: "tel", placeholder: "+7 (000) 000-00-00", maxlength: "18", "aria-label": "Номер телефона", "aria-describedby": "q-hint", "aria-invalid": "false" });
    Lead.maskPhone(phone);
    var hint = el("p", { class: "q-hint", id: "q-hint", text: "Введите 10 цифр после +7" });
    var consent = el("input", { type: "checkbox" });
    var cl = el("label", { class: "q-consent" }, [consent, el("span", { text: "Я даю согласие на обработку " }, [el("a", { href: "privacy.html", target: "_blank", rel: "noopener", text: "персональных данных" })])]);
    var err = el("p", { class: "q-error", role: "alert" });
    var submit = el("button", { type: "button", class: "q-btn q-next" }, [el("span", { text: "Получить предложение" })]);
    submit.disabled = true;
    function ready() { return Lead.validPhone(phone.value) && consent.checked; }
    function sync() { submit.disabled = !ready(); err.textContent = ""; }
    phone.addEventListener("input", sync); consent.addEventListener("change", sync);
    function send() {
      if (!ready() || submit.dataset.sending) return;
      submit.dataset.sending = "1"; submit.disabled = true; submit.firstChild.textContent = "Отправляем";
      var a = {}; Object.keys(state.answers).forEach(function (k) { a[k] = Array.isArray(state.answers[k]) ? state.answers[k].join(", ") : state.answers[k]; });
      Lead.send({ phone: phone.value, channel: state.answers.channel, answers: a })
        .then(function () { Lead.goal("lead_sent"); showDone(); })
        .catch(function () {
          delete submit.dataset.sending; submit.disabled = false; submit.firstChild.textContent = "Получить предложение";
          err.textContent = "Не удалось отправить. " + (cfg.contacts.phoneText ? "Позвоните: " + cfg.contacts.phoneText : "Попробуйте ещё раз чуть позже.");
        });
    }
    submit.addEventListener("click", send);
    phone.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send(); } });
    panel.appendChild(phone); panel.appendChild(hint); panel.appendChild(cl); panel.appendChild(err);
    panel.appendChild(el("div", { class: "q-actions" }, [backBtn(), submit]));
    return panel;
  }

  function donePanel() {
    var panel = el("div", { class: "q-panel" });
    panel.appendChild(el("h2", { class: "q-title", tabindex: "-1", text: "Заявка принята" }));
    panel.appendChild(el("p", { class: "q-sub", text: "Свяжусь с вами в рабочее время и пришлю расчёт под ваш бизнес и бюджет." }));
    var links = el("div", { class: "q-links" });
    [["Telegram", cfg.contacts.telegram], ["MAX", cfg.contacts.max], ["WhatsApp", cfg.contacts.whatsapp]].forEach(function (p) {
      if (p[1]) links.appendChild(el("a", { class: "q-btn q-link", href: p[1], target: "_blank", rel: "noopener", text: "Написать в " + p[0] }));
    });
    if (links.children.length) panel.appendChild(links);
    if (Lead.isLocal() && !cfg.webhookUrl) panel.appendChild(el("p", { class: "q-dev", text: "Режим проверки: webhookUrl в js/config.js не задан, заявка никуда не ушла." }));
    return panel;
  }
  function showDone() { setBar(true); show(donePanel, "next"); }

  function render(dir) {
    var p = path(); setBar(false);
    show(state.i < p.length ? function () { return stepPanel(p[state.i]); } : contactPanel, dir || "next");
  }
  window.Quiz = { render: function () { render("next"); } };
})();
