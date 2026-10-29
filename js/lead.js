/* Телефон, проверка, UTM, отправка заявки, очередь неотправленных, цели Метрики. */
(function () {
  var cfg = window.SITE_CONFIG;
  var QUEUE_KEY = "pulka_queue_v1";
  var QUEUE_MAX = 20;
  var TIMEOUT = 8000;
  var RETRY_DELAY = 800;
  var flushing = false;

  function utm() {
    var out = {}, q = new URLSearchParams(window.location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid"].forEach(function (k) { if (q.get(k)) out[k] = q.get(k); });
    return out;
  }
  function maskPhone(input) {
    input.addEventListener("input", function () {
      var d = input.value.replace(/\D/g, "");
      if (!d) { input.value = ""; return; }
      if (d.charAt(0) === "8") d = "7" + d.slice(1);
      else if (d.charAt(0) !== "7") d = "7" + d;
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

  function readQueue() {
    try {
      var list = JSON.parse(window.localStorage.getItem(QUEUE_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function writeQueue(list) {
    try { window.localStorage.setItem(QUEUE_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function same(item, payload) { return item && payload && item.sentAt === payload.sentAt && item.phone === payload.phone; }
  function queueAdd(payload) {
    var list = readQueue();
    list.push(payload);
    if (list.length > QUEUE_MAX) list = list.slice(list.length - QUEUE_MAX);
    writeQueue(list);
  }
  function queueRemove(payload) {
    var list = readQueue();
    var next = list.filter(function (x) { return !same(x, payload); });
    if (next.length !== list.length) writeQueue(next);
  }
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  function post(payload) {
    var opt = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true };
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = null;
    if (ctrl) { opt.signal = ctrl.signal; timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT); }
    function done() { if (timer) clearTimeout(timer); }
    return fetch(cfg.webhookUrl, opt).then(function (r) {
      done();
      if (!r.ok) throw new Error("http-" + r.status);
      return r;
    }, function (e) { done(); throw e; });
  }

  function attempt(payload, n) {
    return post(payload).catch(function (e) {
      if (n >= 1) throw e;
      var delay = cfg.retryDelay == null ? RETRY_DELAY : cfg.retryDelay;
      return wait(delay).then(function () { return attempt(payload, n + 1); });
    });
  }

  function send(payload) {
    var data = {};
    Object.keys(payload || {}).forEach(function (k) { data[k] = payload[k]; });
    data.utm = utm(); data.page = location.href; data.sentAt = new Date().toISOString();
    if (isLocal()) return Promise.resolve({ demo: true });
    if (!cfg.webhookUrl) return Promise.reject(new Error("no-webhook"));
    return attempt(data, 0).then(function (r) {
      queueRemove(data);
      return r;
    }, function (e) {
      queueAdd(data);
      throw e;
    });
  }

  /* Повторная отправка заявок, которые не ушли в прошлый раз. */
  function flushQueue() {
    if (flushing || isLocal() || !cfg.webhookUrl) return Promise.resolve(0);
    var list = readQueue();
    if (!list.length) return Promise.resolve(0);
    flushing = true;
    var sent = 0;
    var chain = Promise.resolve();
    list.forEach(function (item) {
      chain = chain.then(function () {
        return post(item).then(function () { queueRemove(item); sent += 1; }, function () {});
      });
    });
    return chain.then(function () { flushing = false; return sent; }, function () { flushing = false; return sent; });
  }

  window.Lead = { maskPhone: maskPhone, validPhone: validPhone, send: send, goal: goal, isLocal: isLocal, flushQueue: flushQueue };
})();
