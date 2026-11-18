
const BodyTracker = {
  key: "bodyTrackMeasurements",

  fields: [
    {
      key: "weight",
      label: "وزن",
      unit: "کیلوگرم",
      step: "0.1",
      max: 500
    },
    {
      key: "height",
      label: "قد",
      unit: "سانتی‌متر",
      step: "0.1",
      max: 300
    },
    {
      key: "chest",
      label: "دور سینه",
      unit: "سانتی‌متر",
      step: "0.1",
      max: 300
    },
    {
      key: "waist",
      label: "دور کمر",
      unit: "سانتی‌متر",
      step: "0.1",
      max: 300
    },
    {
      key: "arm",
      label: "دور بازو",
      unit: "سانتی‌متر",
      step: "0.1",
      max: 150
    },
    {
      key: "thigh",
      label: "دور ران",
      unit: "سانتی‌متر",
      step: "0.1",
      max: 200
    },
    {
      key: "shoulder",
      label: "دور شانه",
      unit: "سانتی‌متر",
      step: "0.1",
      max: 300
    }
  ],

  getData() {
    try {
      const data = JSON.parse(
        localStorage.getItem(this.key) || "[]"
      );

      if (!Array.isArray(data)) return [];

      return data.filter(record =>
        record && typeof record === "object" && !Array.isArray(record)
      );
    } catch (error) {
      console.error("Measurement data could not be loaded:", error);
      return [];
    }
  },

  saveData(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Measurement data could not be saved:", error);
      alert("ذخیره اطلاعات انجام نشد. فضای ذخیره‌سازی مرورگر را بررسی کن.");
      return false;
    }
  },

  escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  },

  formatValue(value) {
    if (value === null || value === undefined || value === "") {
      return "--";
    }

    return this.escape(value);
  },

  render() {
    const records = this.getData();
    const latest = records.length
      ? records[records.length - 1]
      : null;

    return `
      <section class="welcome-card">
        <div>
          <span class="eyebrow">TRACK YOUR CHANGE</span>
          <h2>تغییراتت رو ثبت کن.</h2>
          <p>
            هر اندازه‌گیری، یک قدم به شناخت بهتر بدنت.
            اطلاعاتت رو ثبت کن و روند تغییراتت رو دنبال کن.
          </p>
        </div>

        <div class="welcome-decoration">02</div>
      </section>

      <div class="section-heading">
        <div>
          <span class="eyebrow">LATEST RECORD</span>
          <h3>آخرین وضعیت بدن</h3>
        </div>
      </div>

      <div class="stats-grid">
        ${this.fields.map(field => {
          const value = latest
            ? this.formatValue(latest[field.key])
            : "--";

          return `
            <article class="stat-card">
              <span>${field.label}</span>
              <strong>
                ${value}
                <small>${field.unit}</small>
              </strong>
            </article>
          `;
        }).join("")}
      </div>

      <div class="section-heading">
        <div>
          <span class="eyebrow">NEW MEASUREMENT</span>
          <h3>ثبت اندازه‌گیری جدید</h3>
        </div>
      </div>

      <div class="workout-panel measurement-panel">
        <form id="body-record-form">

          <div class="form-grid">
            ${this.fields.map(field => `
              <label>
                ${field.label} (${field.unit})

                <input
                  name="${field.key}"
                  type="number"
                  min="0"
                  max="${field.max}"
                  step="${field.step}"
                  placeholder="مقدار ${field.label}"
                  ${field.key === "weight" ? "required" : ""}
                />
              </label>
            `).join("")}
          </div>

          <label>
            توضیحات

            <textarea
              name="note"
              rows="3"
              maxlength="500"
              placeholder="مثلاً وضعیت تمرین یا تغییرات این ماه..."
            ></textarea>
          </label>

          <button class="primary-btn" type="submit">
            + ذخیره اندازه‌گیری
          </button>

        </form>
      </div>

      <div class="section-heading">
        <div>
          <span class="eyebrow">MEASUREMENT HISTORY</span>
          <h3>تاریخچه اندازه‌گیری‌ها</h3>
        </div>

        <span class="muted-text">
          ${records.length} رکورد ثبت‌شده
        </span>
      </div>

      <div class="measurement-history">
        ${
          records.length
            ? [...records].reverse().map(record => `
              <article class="stat-card measurement-record">
                <div class="section-heading">
                  <strong>${this.formatValue(record.date)}</strong>
                  <span class="muted-text">اندازه‌گیری بدن</span>
                </div>

                <div class="measurement-record-grid">
                  ${this.fields.map(field => `
                    <div>
                      <span>${field.label}</span>
                      <strong>
                        ${this.formatValue(record[field.key])}
                        <small>${field.unit}</small>
                      </strong>
                    </div>
                  `).join("")}
                </div>

                ${
                  record.note
                    ? `<p class="stat-note">${this.escape(record.note)}</p>`
                    : ""
                }
              </article>
            `).join("")
            : `
              <div class="empty-state">
                <strong>هنوز اندازه‌گیری ثبت نکردی</strong>
                <p>اولین اطلاعات بدنت رو ثبت کن تا تاریخچه تغییراتت ساخته بشه.</p>
              </div>
            `
        }
      </div>
    `;
  },

  handleSubmit(event) {
    if (event.target.id !== "body-record-form") return;

    event.preventDefault();

    const formElement = event.target;
    const form = new FormData(formElement);
    const record = {};

    for (const field of this.fields) {
      const rawValue = String(form.get(field.key) ?? "").trim();

      if (rawValue === "") {
        if (field.key === "weight") {
          alert("لطفاً وزن خودت رو وارد کن.");
          return;
        }

        record[field.key] = "";
        continue;
      }

      const value = Number(rawValue);

      if (
        !Number.isFinite(value) ||
        value <= 0 ||
        value > field.max
      ) {
        alert(`مقدار ${field.label} معتبر نیست.`);
        return;
      }

      record[field.key] = String(value);
    }

    record.note = String(form.get("note") ?? "").trim();
    record.date = new Date().toLocaleDateString("fa-IR");

    const records = this.getData();
    records.push(record);

    if (!this.saveData(records)) return;

    if (typeof showPage === "function") {
      showPage("body");
    }
  }
};

document.addEventListener("submit", event => {
  BodyTracker.handleSubmit(event);
});
