/* Телефон, проверка, UTM, отправка заявки, цели Метрики. */
(function () {
  var cfg = window.SITE_CONFIG;
  function utm() {
    var out = {}, q = new URLSearchParams(window.location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid"].forEach(function (k) { if (q.get(k)) out[k] = q.get(k); });
    return out;
  }
  function maskPhone(input) {
    input.addEventListener("input", function () {
      var d = input.value.replace(/\D/g, "");
      if (d.charAt(0) === "8") d = "7" + d.slice(1);
      if (d.charAt(0) !== "7") d = "7" + d;
      d = d.slice(0, 11);
      var s = "+7";
      if (d.length > 1) s += " (" + d.slice(1, 4);
      if (d.length >= 4) s += ")";
      if (d.length > 4) s += " " + d.slice(4, 7);
      if (d.length > 7) s += "-" + d.slice(7, 9);
      if (d.length > 9) s += "-" + d.slice(9, 11);
      input.value = s;
    });
  }
  function validPhone(v) { return v.replace(/\D/g, "").length === 11; }
  function goal(name) { if (cfg.metrikaId && typeof window.ym === "function") window.ym(cfg.metrikaId, "reachGoal", name); }
  function isLocal() { return cfg.demo === true || location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1"; }
  function send(payload) {
    payload.utm = utm(); payload.page = location.href; payload.sentAt = new Date().toISOString();
    if (!cfg.webhookUrl) return isLocal() ? Promise.resolve({ demo: true }) : Promise.reject(new Error("no-webhook"));
    return fetch(cfg.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error("http-" + r.status); return r; });
  }
  window.Lead = { maskPhone: maskPhone, validPhone: validPhone, send: send, goal: goal, isLocal: isLocal };
})();
