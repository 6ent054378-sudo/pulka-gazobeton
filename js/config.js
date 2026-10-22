/* Все данные владельца страницы в одном месте. Пустые значения скрывают соответствующий блок. */
window.SITE_CONFIG = {
  owner: { photo: "img/me.webp" /* например img/me.png: вырезанное фото без фона, ширина от 900 px. Если пусто, блок с фото скрыт */ },
  legal: "Самозанятый Паховский Дмитрий Евгеньевич, ИНН 263517327900",
  email: "" /* почта для обращений по персональным данным */,
  contacts: { phone: "", phoneText: "", telegram: "", max: "", whatsapp: "" },
  terms: { days: "3-5", adBudget: "2000" },
  /* Адрес приёма заявок. Инструкция в README: backend/telegram-worker.mjs */
  webhookUrl: "https://pulka-leads.pulka-leads.workers.dev",
  metrikaId: "",
  demo: false
};
