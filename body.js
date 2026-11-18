
window.showToast = window.showToast || function(message, type = "success") {
  let toast = document.getElementById("body-track-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "body-track-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "28px",
    left: "50%",
    transform: "translate(-50%, 20px)",
    padding: "13px 22px",
    borderRadius: "14px",
    background: type === "success" ? "#123d2b" : "#4a2020",
    color: "#ffffff",
    border: `1px solid ${type === "success" ? "#20c77a" : "#e05b5b"}`,
    boxShadow: "0 8px 30px rgba(0,0,0,.3)",
    fontFamily: "Vazirmatn, sans-serif",
    fontSize: "14px",
    fontWeight: "600",
    zIndex: "99999",
    opacity: "0",
    transition: "opacity .25s ease, transform .25s ease",
    pointerEvents: "none",
    textAlign: "center",
    maxWidth: "90%",
    direction: "rtl"
  });

  clearTimeout(window.bodyTrackToastTimer);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, 0)";
  });

  window.bodyTrackToastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, 20px)";
  }, 2800);
};


const BodyTracker = {
  key: "bodyTrackMeasurements",
  pendingDeleteIndex: null,

  fields: [
    { key: "weight", label: "وزن", unit: "کیلوگرم", step: "0.1", max: 500 },
    { key: "height", label: "قد", unit: "سانتی‌متر", step: "0.1", max: 300 },
    { key: "chest", label: "دور سینه", unit: "سانتی‌متر", step: "0.1", max: 300 },
    { key: "waist", label: "دور کمر", unit: "سانتی‌متر", step: "0.1", max: 300 },
    { key: "arm", label: "دور بازو", unit: "سانتی‌متر", step: "0.1", max: 150 },
    { key: "thigh", label: "دور ران", unit: "سانتی‌متر", step: "0.1", max: 200 },
    { key: "shoulder", label: "دور شانه", unit: "سانتی‌متر", step: "0.1", max: 300 }
  ],

  getData() {
    try {
      const data = JSON.parse(localStorage.getItem(this.key) || "[]");

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
    const latest = records.length ? records[records.length - 1] : null;

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
          const value = latest ? this.formatValue(latest[field.key]) : "--";

          return `
            <article class="stat-card">
              <span>${field.label}</span>
              <strong>${value} <small>${field.unit}</small></strong>
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
            ? records.map((record, index) => ({ record, index }))
                .reverse()
                .map(({ record, index }) => `
                  <article class="stat-card measurement-record">
                    <div class="section-heading">
                      <strong>${this.formatValue(record.date)}</strong>
                      <button
                        type="button"
                        class="delete-measurement-btn"
                        data-delete-measurement="${index}"
                        aria-label="حذف این اندازه‌گیری"
                        title="حذف اندازه‌گیری"
                        style="
                          background:#4a2020;
                          color:white;
                          border:1px solid #e05b5b;
                          border-radius:10px;
                          padding:8px 12px;
                          cursor:pointer;
                        "
                      >🗑️ حذف</button>
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

  openDeleteModal(index) {
    const records = this.getData();

    if (!Number.isInteger(index) || index < 0 || index >= records.length) {
      return;
    }

    this.pendingDeleteIndex = index;

    let modal = document.getElementById("body-track-delete-modal");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "body-track-delete-modal";

      modal.innerHTML = `
        <div class="bt-delete-overlay" data-close-delete>
          <section
            class="bt-delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bt-delete-title"
            aria-describedby="bt-delete-description"
          >
            <div class="bt-delete-icon">🗑️</div>

            <span class="bt-delete-eyebrow">BODY TRACK SECURITY</span>

            <h3 id="bt-delete-title">حذف اندازه‌گیری؟</h3>

            <p id="bt-delete-description">
              آیا مطمئنی می‌خواهی این رکورد را حذف کنی؟
              این عملیات قابل بازگشت نیست.
            </p>

            <div class="bt-delete-actions">
              <button type="button" class="bt-cancel-delete" data-close-delete>
                انصراف
              </button>

              <button type="button" class="bt-confirm-delete" id="bt-confirm-delete">
                بله، حذف کن
              </button>
            </div>
          </section>
        </div>
      `;

      document.body.appendChild(modal);

      const style = document.createElement("style");
      style.id = "body-track-delete-style";

      style.textContent = `
        #body-track-delete-modal {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: none;
          font-family: Vazirmatn, sans-serif;
          direction: rtl;
        }

        #body-track-delete-modal.bt-modal-open {
          display: block;
        }

        .bt-delete-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, .76);
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
          animation: btFadeIn .2s ease;
        }

        .bt-delete-dialog {
          width: 100%;
          max-width: 390px;
          padding: 30px 24px 24px;
          text-align: center;
          border-radius: 24px;
          background: linear-gradient(145deg, #14251d, #09140f);
          border: 1px solid rgba(32, 199, 122, .25);
          box-shadow: 0 25px 80px rgba(0, 0, 0, .55);
          animation: btDialogIn .25s ease;
        }

        .bt-delete-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          border-radius: 20px;
          background: rgba(224, 91, 91, .12);
          border: 1px solid rgba(224, 91, 91, .3);
          font-size: 27px;
        }

        .bt-delete-eyebrow {
          color: #20c77a;
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: 800;
        }

        .bt-delete-dialog h3 {
          color: #f4fff8;
          font-size: 21px;
          font-weight: 800;
          margin: 12px 0;
        }

        .bt-delete-dialog p {
          color: #a4b8ac;
          font-size: 13px;
          line-height: 2;
          margin: 0 0 25px;
        }

        .bt-delete-actions {
          display: flex;
          gap: 10px;
        }

        .bt-delete-actions button {
          flex: 1;
          min-height: 47px;
          border-radius: 13px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: .2s ease;
        }

        .bt-cancel-delete {
          color: #d8e5dd;
          background: #1b2b22;
          border: 1px solid #344a3c;
        }

        .bt-confirm-delete {
          color: white;
          background: linear-gradient(135deg, #c74747, #8e2929);
          border: 1px solid #e05b5b;
          box-shadow: 0 5px 18px rgba(180, 40, 40, .2);
        }

        .bt-delete-actions button:active {
          transform: scale(.97);
        }

        @keyframes btFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes btDialogIn {
          from { opacity: 0; transform: translateY(15px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 420px) {
          .bt-delete-dialog {
            padding: 25px 18px 20px;
          }
        }
      `;

      document.head.appendChild(style);
    }

    modal.classList.add("bt-modal-open");

    const confirmButton = modal.querySelector("#bt-confirm-delete");

    if (confirmButton) {
      confirmButton.focus();
    }
  },

  closeDeleteModal() {
    const modal = document.getElementById("body-track-delete-modal");

    if (modal) {
      modal.classList.remove("bt-modal-open");
    }

    this.pendingDeleteIndex = null;
  },

  confirmDelete() {
    const index = this.pendingDeleteIndex;

    if (!Number.isInteger(index)) {
      this.closeDeleteModal();
      return;
    }

    const records = this.getData();

    if (index < 0 || index >= records.length) {
      this.closeDeleteModal();
      return;
    }

    records.splice(index, 1);

    if (!this.saveData(records)) {
      this.closeDeleteModal();
      return;
    }

    this.closeDeleteModal();

    if (typeof showPage === "function") {
      showPage("body");
    }

    window.showToast("اندازه‌گیری با موفقیت حذف شد! ✓");
  },

  handleDelete(event) {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest("[data-delete-measurement]");

    if (!button) return;

    const index = Number(button.dataset.deleteMeasurement);

    if (!Number.isInteger(index)) return;

    this.openDeleteModal(index);
  },

  handleModalClick(event) {
    if (!(event.target instanceof Element)) return;

    const modal = document.getElementById("body-track-delete-modal");

    if (!modal || !modal.classList.contains("bt-modal-open")) return;

    if (event.target.closest("#bt-confirm-delete")) {
      this.confirmDelete();
      return;
    }

    if (event.target.closest("[data-close-delete]")) {
      this.closeDeleteModal();
    }
  },

  handleKeydown(event) {
    if (event.key !== "Escape") return;

    const modal = document.getElementById("body-track-delete-modal");

    if (modal && modal.classList.contains("bt-modal-open")) {
      this.closeDeleteModal();
    }
  },

  handleSubmit(event) {
    if (event.target.id !== "body-record-form") return;

    event.preventDefault();

    const form = new FormData(event.target);
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

      if (!Number.isFinite(value) || value <= 0 || value > field.max) {
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

    window.showToast("اندازه‌گیری با موفقیت ذخیره شد! ✓");
  }
};


document.addEventListener("submit", event => {
  BodyTracker.handleSubmit(event);
});

document.addEventListener("click", event => {
  BodyTracker.handleDelete(event);
  BodyTracker.handleModalClick(event);
});

document.addEventListener("keydown", event => {
  BodyTracker.handleKeydown(event);
});
