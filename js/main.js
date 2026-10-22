(function () {
  var cfg = window.SITE_CONFIG;
  document.querySelectorAll("[data-c=days]").forEach(function (n) { n.textContent = cfg.terms.days; });
  document.querySelectorAll("[data-c=adBudget]").forEach(function (n) { n.textContent = cfg.terms.adBudget; });
  document.getElementById("year").textContent = new Date().getFullYear();

  var rep = document.getElementById("rep");
  if (cfg.owner.photo) {
    var img = document.createElement("img"); img.src = cfg.owner.photo; img.alt = "Фото представителя"; img.width = 900; img.height = 1200; img.decoding = "async";
    rep.appendChild(img); rep.hidden = false; document.getElementById("hero").classList.add("has-rep");
  }
  var legal = document.getElementById("legal"); if (cfg.legal) legal.textContent = cfg.legal; else legal.remove();

  /* Баннер о куки: показывается один раз */
  var seen = false; try { seen = localStorage.getItem("cookie_ok") === "1"; } catch (e) {}
  if (!seen) {
    var box = document.createElement("aside"); box.className = "cookie"; box.setAttribute("aria-label", "Уведомление об использовании cookie");
    box.innerHTML = '<div class="cookie-in"><p style="margin:0;white-space:nowrap">Мы используем <a href="privacy.html">куки</a>.</p><button type="button" class="cookie-ok">Хорошо</button></div>';
    box.querySelector(".cookie-ok").addEventListener("click", function () { try { localStorage.setItem("cookie_ok", "1"); } catch (e) {} box.remove(); });
    document.body.appendChild(box);
  }

  if (cfg.metrikaId) {
    (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a); })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(cfg.metrikaId, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }
  window.Quiz.render();
})();
