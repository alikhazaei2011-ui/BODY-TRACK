const BodyTracker = {
  key: "bodyTrackMeasurements",

  getData() {
    return JSON.parse(localStorage.getItem(this.key) || "[]");
  },

  saveData(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },

  render() {
    const records = this.getData();
    const latest = records.length ? records[records.length - 1] : null;

    const fields = [
      ["weight", "وزن", "کیلوگرم", "number", "0.1"],
      ["height", "قد", "سانتی‌متر", "number", "1"],
      ["chest", "دور سینه", "سانتی‌متر", "0"],
      ["waist", "دور کمر", "سانتی‌متر", "0"],
      ["arm", "دور بازو", "سانتی‌متر", "0"],
      ["thigh", "دور ران", "سانتی‌متر", "0"],
      ["shoulder", "دور شانه", "سانتی‌متر", "0"]
    ];

    return `
      <header class="topbar">
        <div>
          <span class="english topbar-caption">BODY MEASUREMENTS</span>
          <h2>اندازه‌گیری بدن</h2>
        </div>
        <div class="avatar">B</div>
      </header>

      <section class="welcome-card">
        <div>
          <span class="english welcome-tag">TRACK YOUR CHANGE</span>
          <h1>تغییراتت رو<br>ثبت کن.</h1>
          <p>هر اندازه‌گیری، یک قدم به شناخت بهتر بدنت.</p>
        </div>
        <div class="welcome-decoration english">02</div>
      </section>

      <section class="section-heading">
        <div>
          <span class="english section-caption">LATEST RECORD</span>
          <h2>آخرین وضعیت بدن</h2>
        </div>
      </section>

      <section class="stats-grid">
        ${fields.map(([key, label, unit]) => `
          <article class="stat-card">
            <span class="stat-label">${label}</span>
            <strong class="english">${latest?.[key] || "--"}
              <small>${unit}</small>
            </strong>
          </article>
        `).join("")}
      </section>

      <section class="section-heading">
        <div>
          <span class="english section-caption">NEW MEASUREMENT</span>
          <h2>ثبت اندازه‌گیری جدید</h2>
        </div>
      </section>

      <section class="empty-card" style="text-align:right">
        <form id="body-record-form">
          <div class="stats-grid">
            ${fields.map(([key, label, unit]) => `
              <div>
                <label class="stat-label">${label} (${unit})</label>
                <input
                  name="${key}"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="مقدار ${label}"
                  ${key === "weight" ? "required" : ""}
                  style="width:100%;padding:12px;margin-top:8px;margin-bottom:16px;border:1px solid var(--border);border-radius:11px;background:#FAF9F6"
                >
              </div>
            `).join("")}
          </div>

          <label class="stat-label">توضیحات</label>
          <textarea name="note" rows="3"
            placeholder="مثلاً وضعیت تمرین یا تغییرات این ماه..."
            style="width:100%;padding:12px;margin-top:8px;border:1px solid var(--border);border-radius:11px;font:inherit"></textarea>

          <button class="primary-button" type="submit">
            ذخیره اندازه‌گیری +
          </button>
        </form>
      </section>

      <section class="section-heading">
        <div>
          <span class="english section-caption">MEASUREMENT HISTORY</span>
          <h2>تاریخچه اندازه‌گیری‌ها</h2>
        </div>
      </section>

      <section>
        ${records.length ? [...records].reverse().map(record => `
          <article class="stat-card" style="margin-bottom:12px">
            <strong class="english">${record.date}</strong>
            <p class="stat-note">
              وزن: ${record.weight || "--"} کیلوگرم
              · دور بازو: ${record.arm || "--"} سانتی‌متر
              · دور کمر: ${record.waist || "--"} سانتی‌متر
            </p>
            ${record.note ? `<p class="stat-note">${this.escape(record.note)}</p>` : ""}
          </article>
        `).join("") : `
          <div class="empty-card">
            <div class="empty-icon">📏</div>
            <h3>هنوز اندازه‌گیری ثبت نکردی</h3>
            <p>اولین اطلاعات بدنت رو ثبت کن.</p>
          </div>
        `}
      </section>
    `;
  },

  escape(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  },

  handleSubmit(event) {
    if (event.target.id !== "body-record-form") return;

    event.preventDefault();

    const form = new FormData(event.target);
    const record = {};

    ["weight", "height", "chest", "waist", "arm", "thigh", "shoulder"].forEach(key => {
      record[key] = form.get(key) || "";
    });

    record.note = form.get("note") || "";
    record.date = new Date().toLocaleDateString("fa-IR");

    const records = this.getData();
    records.push(record);
    this.saveData(records);

    if (typeof showPage === "function") {
      showPage("body");
    }
  }
};

document.addEventListener("submit", event => {
  BodyTracker.handleSubmit(event);
});
