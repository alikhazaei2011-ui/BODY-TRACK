
const app = document.getElementById("app");

const DAYS = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه",
  "چهارشنبه", "پنجشنبه", "جمعه"
];

const STORAGE_KEY = "bodyTrackWorkouts";
const NAME_KEY = "bodyTrackDisplayName";

let selectedDay = DAYS[0];

function loadWorkouts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};

    const cleaned = {};

    DAYS.forEach(day => {
      if (Array.isArray(saved[day])) {
        cleaned[day] = saved[day]
          .filter(item => item && typeof item === "object")
          .map(item => ({
            exercise: String(item.exercise ?? ""),
            sets: String(item.sets ?? ""),
            reps: String(item.reps ?? ""),
            weight: String(item.weight ?? ""),
            note: String(item.note ?? ""),
            completed: Boolean(item.completed)
          }));
      }
    });

    return cleaned;
  } catch (error) {
    console.error("Workout data could not be loaded:", error);
    return {};
  }
}

let workoutData = loadWorkouts();

function saveWorkouts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workoutData));
  } catch (error) {
    console.error("Workout data could not be saved:", error);
    alert("ذخیره اطلاعات انجام نشد. فضای ذخیره‌سازی مرورگر را بررسی کن.");
  }
}

function getUserName() {
  try {
    return localStorage.getItem(NAME_KEY) || "";
  } catch {
    return "";
  }
}

function saveUserName(name) {
  const cleanName = String(name || "").trim().slice(0, 30);

  if (!cleanName) return false;

  try {
    localStorage.setItem(NAME_KEY, cleanName);
    return true;
  } catch (error) {
    console.error("Name could not be saved:", error);
    return false;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

const icons = {
  home: '<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
  workout: '<svg viewBox="0 0 24 24"><path d="M6 9v6M3 10v4M18 9v6M21 10v4M6 12h12"/></svg>',
  body: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>',
  progress: '<svg viewBox="0 0 24 24"><path d="M3 17 9 11l4 4 8-9"/><path d="M15 6h6v6"/></svg>',
  more: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  photos: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
  profile: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2z"/></svg>',
  backup: '<svg viewBox="0 0 24 24"><path d="M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4"/></svg>'
};

function getPageTitle(page) {
  const titles = {
    home: "داشبورد",
    workout: "برنامه تمرینی",
    body: "اندازه‌های بدن",
    progress: "گزارش پیشرفت",
    photos: "گالری تصاویر بدن",
    profile: "پروفایل من",
    backup: "پشتیبان‌گیری",
    more: "بخش‌های بیشتر"
  };

  return titles[page] || "BODY TRACK";
}

function renderLayout(content, activePage = "home") {
  if (!app) return;

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">BT</div>
          <div>
            <h1>BODY TRACK</h1>
            <span>YOUR BODY. YOUR JOURNEY.</span>
          </div>
        </div>

        <nav class="side-nav">
          <button type="button" data-page="home" class="${activePage === "home" ? "active" : ""}">
            ${icons.home} خانه
          </button>
          <button type="button" data-page="workout" class="${activePage === "workout" ? "active" : ""}">
            ${icons.workout} برنامه تمرینی
          </button>
          <button type="button" data-page="body" class="${activePage === "body" ? "active" : ""}">
            ${icons.body} اندازه‌های بدن
          </button>
          <button type="button" data-page="progress" class="${activePage === "progress" ? "active" : ""}">
            ${icons.progress} پیشرفت من
          </button>
          <button type="button" data-page="more" class="${activePage === "more" ? "active" : ""}">
            ${icons.more} بخش‌های بیشتر
          </button>
        </nav>

        <div class="sidebar-footer">
          <span>BUILT FOR YOUR PROGRESS</span>
        </div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <div>
            <span class="topbar-label">FITNESS TRACKER</span>
            <h2>${getPageTitle(activePage)}</h2>
          </div>
          <div class="topbar-date">
            ${new Date().toLocaleDateString("fa-IR")}
          </div>
        </header>

        <section class="page-content">
          ${content}
        </section>
      </main>

      <nav class="mobile-nav">
        <button type="button" data-page="home" class="${activePage === "home" ? "active" : ""}">
          ${icons.home}<small>خانه</small>
        </button>
        <button type="button" data-page="workout" class="${activePage === "workout" ? "active" : ""}">
          ${icons.workout}<small>تمرین</small>
        </button>
        <button type="button" data-page="body" class="${activePage === "body" ? "active" : ""}">
          ${icons.body}<small>اندازه‌ها</small>
        </button>
        <button type="button" data-page="progress" class="${activePage === "progress" ? "active" : ""}">
          ${icons.progress}<small>پیشرفت</small>
        </button>
        <button type="button" data-page="more" class="${activePage === "more" ? "active" : ""}">
          ${icons.more}<small>بیشتر</small>
        </button>
      </nav>
    </div>
  `;
}

/* NAME SETUP */

function renderNameSetup() {
  document.getElementById("body-track-name-setup")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "body-track-name-setup";

  overlay.style.cssText = `
    position:fixed;
    inset:0;
    z-index:9999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
    background:rgba(3,10,7,.94);
    backdrop-filter:blur(18px);
    font-family:'Vazirmatn',sans-serif;
  `;

  overlay.innerHTML = `
    <form id="name-setup-form" style="
      width:100%;
      max-width:420px;
      padding:32px 24px;
      border:1px solid rgba(0,217,149,.22);
      border-radius:24px;
      background:#0c1913;
      text-align:center;
      box-shadow:0 20px 80px rgba(0,0,0,.4);
      box-sizing:border-box;
      font-family:'Vazirmatn',sans-serif;
    ">
      <div style="
        width:68px;height:68px;display:grid;place-items:center;
        margin:0 auto 22px;border-radius:20px;
        background:rgba(0,217,149,.12);color:#8BFFCB;
        font-size:25px;font-weight:800;
      ">BT</div>

      <span style="color:#8BFFCB;font-size:11px;letter-spacing:2px;">
        WELCOME TO BODY TRACK
      </span>

      <h2 style="color:#fff;margin:14px 0 10px;font-size:25px;">
        دوست داری چی صدات کنیم؟
      </h2>

      <p style="color:#a5b7ad;font-size:14px;line-height:2;margin-bottom:24px;">
        اسمت رو وارد کن تا تجربه شخصی خودت رو شروع کنیم.
      </p>

      <input
        id="body-track-user-name"
        type="text"
        maxlength="30"
        autocomplete="given-name"
        placeholder="مثلاً علی"
        required
        style="
          width:100%;box-sizing:border-box;padding:15px;
          border:1px solid rgba(0,217,149,.25);
          border-radius:13px;outline:none;
          background:#13241b;color:#fff;
          font:inherit;text-align:center;margin-bottom:16px;
        "
      />

      <button type="submit" style="
        width:100%;padding:15px;border:0;border-radius:13px;
        background:#00D995;color:#062016;font:inherit;
        font-weight:800;cursor:pointer;
      ">شروع کنیم ←</button>

      <small style="display:block;color:#71877a;margin-top:18px;">
        YOUR BODY. YOUR JOURNEY.
      </small>
    </form>
  `;

  document.body.appendChild(overlay);

  const input = overlay.querySelector("#body-track-user-name");
  input.focus();

  overlay.querySelector("#name-setup-form").addEventListener("submit", event => {
    event.preventDefault();

    if (!saveUserName(input.value)) {
      input.focus();
      return;
    }

    overlay.remove();
    renderHome();
  });
}

/* CHANGE NAME MODAL */

function renderNameEditor() {
  document.getElementById("body-track-name-editor")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "body-track-name-editor";

  overlay.style.cssText = `
    position:fixed;
    inset:0;
    z-index:9998;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
    background:rgba(3,10,7,.82);
    backdrop-filter:blur(12px);
    font-family:'Vazirmatn',sans-serif;
  `;

  overlay.innerHTML = `
    <form id="name-editor-form" style="
      width:100%;
      max-width:390px;
      padding:28px 22px;
      border:1px solid rgba(0,217,149,.25);
      border-radius:22px;
      background:#0c1913;
      box-shadow:0 20px 80px rgba(0,0,0,.45);
      box-sizing:border-box;
      font-family:'Vazirmatn',sans-serif;
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#8BFFCB;font-size:12px;">PERSONAL SETTINGS</span>
        <button type="button" id="close-name-editor" style="
          background:#17281f;color:#fff;border:0;
          border-radius:10px;width:35px;height:35px;
          font-size:20px;cursor:pointer;
        ">×</button>
      </div>

      <h3 style="color:#fff;margin:20px 0 8px;font-size:21px;">
        تغییر نام
      </h3>

      <p style="color:#a5b7ad;font-size:13px;line-height:2;margin-bottom:20px;">
        دوست داری از این به بعد چی صدات کنیم؟
      </p>

      <input
        id="edit-user-name"
        type="text"
        maxlength="30"
        value="${escapeHTML(getUserName())}"
        placeholder="مثلاً علی"
        required
        style="
          width:100%;box-sizing:border-box;padding:14px;
          border:1px solid rgba(0,217,149,.25);
          border-radius:13px;background:#13241b;
          color:#fff;font:inherit;text-align:center;
          outline:none;margin-bottom:16px;
        "
      />

      <button type="submit" style="
        width:100%;padding:14px;border:0;border-radius:13px;
        background:#00D995;color:#062016;font:inherit;
        font-weight:800;cursor:pointer;
      ">ذخیره تغییرات</button>
    </form>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector("#edit-user-name").focus();

  overlay.querySelector("#close-name-editor").addEventListener("click", () => {
    overlay.remove();
  });

  overlay.addEventListener("click", event => {
    if (event.target === overlay) overlay.remove();
  });

  overlay.querySelector("#name-editor-form").addEventListener("submit", event => {
    event.preventDefault();

    const input = overlay.querySelector("#edit-user-name");

    if (!input.value.trim()) {
      input.focus();
      return;
    }

    if (!saveUserName(input.value)) {
      alert("ذخیره نام انجام نشد. دوباره تلاش کن.");
      return;
    }

    overlay.remove();
    renderHome();
  });
}

/* BODY MEASUREMENTS */

function getMeasurements() {
  try {
    if (
      typeof BodyTracker !== "undefined" &&
      typeof BodyTracker.getData === "function"
    ) {
      const data = BodyTracker.getData();
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error("Measurement data error:", error);
  }

  return [];
}

function formatMeasurement(value) {
  if (value === undefined || value === null || value === "") return "—";
  return escapeHTML(value);
}

function getMeasurementChange(current, previous, field, unit = "") {
  const currentValue = Number(current?.[field]);
  const previousValue = Number(previous?.[field]);

  if (
    !current ||
    !previous ||
    current[field] === "" ||
    previous[field] === "" ||
    !Number.isFinite(currentValue) ||
    !Number.isFinite(previousValue)
  ) {
    return "برای مقایسه، به ثبت قبلی نیاز داریم.";
  }

  const difference = currentValue - previousValue;

  if (difference === 0) return "بدون تغییر نسبت به ثبت قبلی";

  const sign = difference > 0 ? "+" : "";
  return `${sign}${difference.toFixed(1)} ${unit} نسبت به ثبت قبلی`;
}

/* WEEKLY REPORT */

function getWeeklyStats() {
  const allExercises = DAYS.flatMap(day => workoutData[day] || []);
  const total = allExercises.length;
  const completed = allExercises.filter(item => item.completed).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  const dayStats = DAYS.map(day => {
    const exercises = workoutData[day] || [];
    const done = exercises.filter(item => item.completed).length;

    return {
      day,
      total: exercises.length,
      completed: done,
      percentage: exercises.length
        ? Math.round((done / exercises.length) * 100)
        : 0
    };
  });

  return { total, completed, percentage, dayStats };
}

/* HOME DASHBOARD */

function renderHome() {
  const name = getUserName();

  if (!name) {
    renderLayout("", "home");
    renderNameSetup();
    return;
  }

  const measurements = getMeasurements();
  const latest = measurements.length
    ? measurements[measurements.length - 1]
    : null;

  const previous = measurements.length > 1
    ? measurements[measurements.length - 2]
    : null;

  const weekly = getWeeklyStats();

  const content = `
    <section class="welcome-card">
      <div>
        <span class="eyebrow">YOUR PERSONAL FITNESS SPACE</span>
        <h2>سلام ${escapeHTML(name)}، خوش اومدی! 👋</h2>
        <p>امروز هم فرصتیه برای نزدیک‌تر شدن به هدفت. هر روز، یک قدم قوی‌تر.</p>

        <button type="button" class="primary-btn" data-page="workout">
          مشاهده برنامه تمرینی
        </button>

        <button type="button" class="secondary-btn" id="change-user-name"
          style="margin-right:8px;">
          تغییر نام
        </button>
      </div>

      <div class="welcome-decoration">BT</div>
    </section>

    <div class="section-heading">
      <div>
        <span class="eyebrow">YOUR BODY STATUS</span>
        <h3>وضعیت بدن</h3>
      </div>
      <button type="button" class="secondary-btn" data-page="body">
        ثبت اندازه جدید
      </button>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <span>وزن فعلی</span>
        <strong>${formatMeasurement(latest?.weight)}</strong>
        <small>${latest?.weight !== undefined ? "کیلوگرم" : "هنوز ثبت نشده"}</small>
      </article>

      <article class="stat-card">
        <span>دور بازو</span>
        <strong>${formatMeasurement(latest?.arm)}</strong>
        <small>${latest?.arm !== undefined ? "سانتی‌متر" : "هنوز ثبت نشده"}</small>
      </article>

      <article class="stat-card">
        <span>دور سینه</span>
        <strong>${formatMeasurement(latest?.chest)}</strong>
        <small>${latest?.chest !== undefined ? "سانتی‌متر" : "هنوز ثبت نشده"}</small>
      </article>
    </div>

    <section class="stat-card" style="margin-top:16px;">
      <div class="section-heading">
        <div>
          <span class="eyebrow">LATEST MEASUREMENT</span>
          <h3>آخرین ثبت اندازه‌ها</h3>
        </div>
        <span class="muted-text">${latest?.date ? escapeHTML(latest.date) : "بدون تاریخ"}</span>
      </div>

      ${
        latest
          ? `
            <div style="display:grid;gap:12px;">
              <div>
                <strong>تغییر وزن:</strong>
                <span>${getMeasurementChange(latest, previous, "weight", "کیلوگرم")}</span>
              </div>
              <div>
                <strong>تغییر دور بازو:</strong>
                <span>${getMeasurementChange(latest, previous, "arm", "سانتی‌متر")}</span>
              </div>
              <div>
                <strong>تغییر دور سینه:</strong>
                <span>${getMeasurementChange(latest, previous, "chest", "سانتی‌متر")}</span>
              </div>
            </div>
          `
          : `
            <p class="muted-text">
              هنوز اندازه‌ای ثبت نکردی. اولین اندازه‌گیریت رو ثبت کن تا تغییراتت رو ببینی.
            </p>
          `
      }
    </section>

    <div class="section-heading" style="margin-top:30px;">
      <div>
        <span class="eyebrow">WEEKLY WORKOUT REPORT</span>
        <h3>گزارش برنامه هفتگی</h3>
      </div>
      <span class="muted-text">بر اساس برنامه ثبت‌شده</span>
    </div>

    <section id="weekly-report" class="stat-card" dir="rtl">
      <div class="stats-grid">
        <article>
          <span>کل حرکات</span>
          <strong>${weekly.total}</strong>
        </article>
        <article>
          <span>انجام‌شده</span>
          <strong>${weekly.completed}</strong>
        </article>
        <article>
          <span>درصد تکمیل</span>
          <strong>${weekly.percentage}%</strong>
        </article>
      </div>

      <div class="workout-progress-track" style="margin-top:20px;">
        <div class="workout-progress-fill" style="width:${weekly.percentage}%"></div>
      </div>

      <p class="muted-text" style="margin-top:12px;">
        ${
          weekly.total
            ? `تا اینجا ${weekly.percentage} درصد از حرکات برنامه‌ات تکمیل شده.`
            : "هنوز حرکتی در برنامه هفتگی ثبت نکردی."
        }
      </p>

      <div style="display:grid;gap:14px;margin-top:22px;">
        ${weekly.dayStats.map(item => `
          <div>
            <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:7px;">
              <strong>${item.day}</strong>
              <small>${item.completed} از ${item.total}</small>
            </div>
            <div class="workout-progress-track">
              <div class="workout-progress-fill" style="width:${item.percentage}%"></div>
            </div>
          </div>
        `).join("")}
      </div>

      <button type="button" class="primary-btn" data-page="workout" style="margin-top:22px;">
        رفتن به برنامه تمرینی
      </button>
    </section>
  `;

  renderLayout(content, "home");
}

/* MORE PAGE */

function renderMore() {
  const content = `
    <section class="more-page">
      <div class="more-page-intro">
        <span class="eyebrow">BODY TRACK TOOLS</span>
        <h2>بخش‌های بیشتر</h2>
        <p>ابزارهای تکمیلی برای مدیریت اطلاعات و مسیر تناسب اندامت.</p>
      </div>

      <div class="more-page-grid">
        <button type="button" class="more-page-card" data-page="photos">
          <span class="more-page-icon">${icons.photos}</span>
          <strong>گالری تصاویر بدن</strong>
          <small>ثبت و مقایسه عکس‌های تغییرات بدن</small>
          <span class="more-page-arrow">←</span>
        </button>

        <button type="button" class="more-page-card" data-page="profile">
          <span class="more-page-icon">${icons.profile}</span>
          <strong>پروفایل شخصی</strong>
          <small>مدیریت اطلاعات و هدف‌های شخصی</small>
          <span class="more-page-arrow">←</span>
        </button>

        <button type="button" class="more-page-card" data-page="backup">
          <span class="more-page-icon">${icons.backup}</span>
          <strong>پشتیبان‌گیری</strong>
          <small>خروجی گرفتن و بازیابی اطلاعات</small>
          <span class="more-page-arrow">←</span>
        </button>
      </div>

      <div class="more-page-footer">
        <span class="eyebrow">YOUR BODY. YOUR JOURNEY.</span>
        <strong>BODY TRACK</strong>
      </div>
    </section>
  `;

  renderLayout(content, "more");
}

/* WORKOUT PAGE */

function renderWorkout() {
  const dayExercises = workoutData[selectedDay] || [];
  const completedCount = dayExercises.filter(item => item.completed).length;
  const totalCount = dayExercises.length;
  const progress = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  const content = `
    <section class="workout-compact">
      <div class="workout-week-header">
        <div>
          <span class="eyebrow">WEEKLY PLAN</span>
          <h3>برنامه هفتگی</h3>
        </div>
        <span class="muted-text">انتخاب روز</span>
      </div>

      <div class="days-grid">
        ${DAYS.map(day => {
          const exercises = workoutData[day] || [];
          const done = exercises.filter(item => item.completed).length;

          return `
            <button type="button"
              class="day-card ${selectedDay === day ? "selected" : ""}"
              data-day="${day}">
              <span>${day}</span>
              ${exercises.length ? `<small>${done}/${exercises.length}</small>` : ""}
            </button>
          `;
        }).join("")}
      </div>

      <section class="workout-day-section">
        <div class="workout-day-heading">
          <div>
            <span class="eyebrow">SELECTED DAY</span>
            <h3>تمرین‌های ${selectedDay}</h3>
          </div>
          <span class="workout-count">
            ${completedCount} از ${totalCount} انجام‌شده
          </span>
        </div>

        <div class="workout-progress-track">
          <div class="workout-progress-fill" style="width:${progress}%"></div>
        </div>

        <details class="add-exercise-details">
          <summary>+ افزودن حرکت جدید</summary>

          <form id="exercise-form" class="compact-exercise-form">
            <div class="form-grid">
              <label>
                نام حرکت
                <input name="exercise" type="text" maxlength="80"
                  placeholder="مثلاً جلو بازو" required />
              </label>

              <label>
                تعداد ست
                <input name="sets" type="number" min="1" max="100"
                  step="1" placeholder="3" required />
              </label>

              <label>
                تعداد تکرار
                <input name="reps" type="number" min="1" max="1000"
                  step="1" placeholder="15" required />
              </label>

              <label>
                وزن (کیلوگرم)
                <input name="weight" type="number" min="0" max="1000"
                  step="0.5" placeholder="اختیاری" />
              </label>
            </div>

            <label>
              توضیحات
              <textarea name="note" maxlength="500"
                placeholder="توضیحات اختیاری..."></textarea>
            </label>

            <button type="submit" class="primary-btn">ذخیره حرکت</button>
          </form>
        </details>

        <div class="exercise-list">
          ${
            totalCount
              ? dayExercises.map((item, index) => `
                <article class="exercise-card compact-exercise-card ${item.completed ? "completed" : ""}">
                  <div class="exercise-info">
                    <strong>${escapeHTML(item.exercise)}</strong>
                    <span>${escapeHTML(item.sets)} ست × ${escapeHTML(item.reps)} تکرار</span>
                    ${item.weight !== "" ? `<small>وزن: ${escapeHTML(item.weight)} کیلوگرم</small>` : ""}
                    ${item.note ? `<small>${escapeHTML(item.note)}</small>` : ""}
                  </div>

                  <div class="exercise-actions">
                    <button type="button" data-complete="${index}" class="complete-btn">
                      ${item.completed ? "✓ انجام شد" : "تکمیل"}
                    </button>
                    <button type="button" data-delete="${index}" class="delete-btn">حذف</button>
                  </div>
                </article>
              `).join("")
              : `
                <div class="empty-state compact-empty-state">
                  <strong>هنوز حرکتی ثبت نکردی</strong>
                  <p>برای شروع، روی افزودن حرکت جدید بزن.</p>
                </div>
              `
          }
        </div>

        ${
          totalCount && completedCount === totalCount
            ? `<div class="workout-finished-message">🎉 آفرین! تمرین‌های ${selectedDay} رو کامل انجام دادی.</div>`
            : ""
        }
      </section>
    </section>
  `;

  renderLayout(content, "workout");
}

/* PAGE ROUTER */

function showPage(page) {
  switch (page) {
    case "home":
      renderHome();
      break;

    case "workout":
      renderWorkout();
      break;

    case "body":
      renderLayout(BodyTracker.render(), "body");
      break;

    case "progress":
      renderLayout(ProgressTracker.render(), "progress");
      break;

    case "profile":
      renderLayout(ProfileManager.render(), "profile");
      break;

    case "backup":
      renderLayout(BackupManager.render(), "backup");
      break;

    case "more":
      renderMore();
      break;

    case "photos":
      PhotosManager.render()
        .then(content => renderLayout(content, "photos"))
        .catch(error => {
          console.error("Photos page error:", error);
          renderLayout(`
            <div class="empty-state">
              <strong>بارگذاری تصاویر ممکن نشد</strong>
              <p>لطفاً صفحه را دوباره باز کن.</p>
            </div>
          `, "photos");
        });
      break;

    default:
      renderHome();
  }
}

/* CLICK EVENTS */

document.addEventListener("click", event => {
  const target = event.target;

  if (!(target instanceof Element)) return;

  if (target.closest("#change-user-name")) {
    renderNameEditor();
    return;
  }

  const pageButton = target.closest("[data-page]");

  if (pageButton) {
    showPage(pageButton.dataset.page);
    return;
  }

  const dayButton = target.closest("[data-day]");

  if (dayButton) {
    selectedDay = dayButton.dataset.day;
    renderWorkout();
    return;
  }

  const completeButton = target.closest("[data-complete]");

  if (completeButton) {
    const index = Number(completeButton.dataset.complete);
    const exercises = workoutData[selectedDay] || [];

    if (!Number.isInteger(index) || !exercises[index]) return;

    exercises[index].completed = !exercises[index].completed;
    saveWorkouts();
    renderWorkout();
    return;
  }

  const deleteButton = target.closest("[data-delete]");

  if (deleteButton) {
    const index = Number(deleteButton.dataset.delete);
    const exercises = workoutData[selectedDay] || [];

    if (!Number.isInteger(index) || !exercises[index]) return;

    exercises.splice(index, 1);
    saveWorkouts();
    renderWorkout();
  }
});

/* FORM EVENTS */

document.addEventListener("submit", event => {
  if (event.target.id !== "exercise-form") return;

  event.preventDefault();

  const formData = new FormData(event.target);

  const exerciseName = String(formData.get("exercise") || "").trim();
  const sets = Number(formData.get("sets"));
  const reps = Number(formData.get("reps"));
  const weightValue = String(formData.get("weight") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!exerciseName) {
    alert("لطفاً نام حرکت را وارد کن.");
    return;
  }

  if (!Number.isInteger(sets) || sets < 1 || sets > 100) {
    alert("تعداد ست باید عددی بین ۱ تا ۱۰۰ باشد.");
    return;
  }

  if (!Number.isInteger(reps) || reps < 1 || reps > 1000) {
    alert("تعداد تکرار باید عددی بین ۱ تا ۱۰۰۰ باشد.");
    return;
  }

  if (
    weightValue !== "" &&
    (!Number.isFinite(Number(weightValue)) ||
      Number(weightValue) < 0 ||
      Number(weightValue) > 1000)
  ) {
    alert("وزن واردشده معتبر نیست.");
    return;
  }

  if (!workoutData[selectedDay]) {
    workoutData[selectedDay] = [];
  }

  workoutData[selectedDay].push({
    exercise: exerciseName,
    sets: String(sets),
    reps: String(reps),
    weight: weightValue,
    note,
    completed: false
  });

  saveWorkouts();
  renderWorkout();
});

/* FORCE WEEKLY REPORT FONT */

const weeklyFontStyle = document.createElement("style");
weeklyFontStyle.id = "body-track-weekly-font";
weeklyFontStyle.textContent = `
  #weekly-report,
  #weekly-report * {
    font-family: 'Vazirmatn', sans-serif !important;
  }
`;
document.head.appendChild(weeklyFontStyle);

/* APP START */

if (getUserName()) {
  renderHome();
} else {
  renderLayout("", "home");
  renderNameSetup();
}
