
const app = document.getElementById("app");

const DAYS = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه",
  "چهارشنبه", "پنجشنبه", "جمعه"
];

const STORAGE_KEY = "bodyTrackWorkouts";

let selectedDay = DAYS[0];

function loadWorkouts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return {};
    }

    const cleaned = {};

    DAYS.forEach(day => {
      if (Array.isArray(saved[day])) {
        cleaned[day] = saved[day].filter(item =>
          item && typeof item === "object"
        ).map(item => ({
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

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
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
  if (!app) {
    console.error("App container not found.");
    return;
  }

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
          ${icons.home}
          <small>خانه</small>
        </button>

        <button type="button" data-page="workout" class="${activePage === "workout" ? "active" : ""}">
          ${icons.workout}
          <small>تمرین</small>
        </button>

        <button type="button" data-page="body" class="${activePage === "body" ? "active" : ""}">
          ${icons.body}
          <small>اندازه‌ها</small>
        </button>

        <button type="button" data-page="progress" class="${activePage === "progress" ? "active" : ""}">
          ${icons.progress}
          <small>پیشرفت</small>
        </button>

        <button type="button" data-page="more" class="${activePage === "more" ? "active" : ""}">
          ${icons.more}
          <small>بیشتر</small>
        </button>
      </nav>

    </div>
  `;
}

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

function renderHome() {
  const allExercises = Object.values(workoutData).flat();
  const totalExercises = allExercises.length;

  const completedExercises = allExercises.filter(
    item => item.completed
  ).length;

  const measurements = BodyTracker.getData();
  const latestMeasurement = measurements.length
    ? measurements[measurements.length - 1]
    : null;

  const content = `
    <section class="welcome-card">
      <div>
        <span class="eyebrow">YOUR JOURNEY STARTS HERE</span>
        <h2>هر روز، یک قدم قوی‌تر.</h2>
        <p>تمرین‌ها و تغییرات بدنت رو ثبت کن و مسیر پیشرفتت رو ببین.</p>

        <button type="button" class="primary-btn" data-page="workout">
          مشاهده برنامه تمرینی
        </button>
      </div>

      <div class="welcome-decoration">BT</div>
    </section>

    <div class="section-heading">
      <div>
        <span class="eyebrow">YOUR OVERVIEW</span>
        <h3>نمای کلی فعالیت‌ها</h3>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <span>کل تمرین‌ها</span>
        <strong>${totalExercises}</strong>
        <small>تمرین ثبت‌شده</small>
      </article>

      <article class="stat-card">
        <span>تمرین‌های انجام‌شده</span>
        <strong>${completedExercises}</strong>
        <small>تکمیل‌شده</small>
      </article>

      <article class="stat-card">
        <span>وزن آخر</span>
        <strong>${escapeHTML(latestMeasurement?.weight ?? "—")}</strong>
        <small>${latestMeasurement ? "کیلوگرم" : "هنوز ثبت نشده"}</small>
      </article>
    </div>
  `;

  renderLayout(content, "home");
}

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
            <button
              type="button"
              class="day-card ${selectedDay === day ? "selected" : ""}"
              data-day="${day}"
            >
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
          <div
            class="workout-progress-fill"
            style="width:${progress}%"
          ></div>
        </div>

        <details class="add-exercise-details">
          <summary>+ افزودن حرکت جدید</summary>

          <form id="exercise-form" class="compact-exercise-form">

            <div class="form-grid">
              <label>
                نام حرکت
                <input
                  name="exercise"
                  type="text"
                  maxlength="80"
                  placeholder="مثلاً جلو بازو"
                  required
                />
              </label>

              <label>
                تعداد ست
                <input
                  name="sets"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  placeholder="3"
                  required
                />
              </label>

              <label>
                تعداد تکرار
                <input
                  name="reps"
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  placeholder="15"
                  required
                />
              </label>

              <label>
                وزن (کیلوگرم)
                <input
                  name="weight"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.5"
                  placeholder="اختیاری"
                />
              </label>
            </div>

            <label>
              توضیحات
              <textarea
                name="note"
                maxlength="500"
                placeholder="توضیحات اختیاری..."
              ></textarea>
            </label>

            <button type="submit" class="primary-btn">
              ذخیره حرکت
            </button>

          </form>
        </details>

        <div class="exercise-list">
          ${
            totalCount
              ? dayExercises.map((item, index) => `
                <article class="exercise-card compact-exercise-card ${item.completed ? "completed" : ""}">

                  <div class="exercise-info">
                    <strong>${escapeHTML(item.exercise)}</strong>

                    <span>
                      ${escapeHTML(item.sets)} ست ×
                      ${escapeHTML(item.reps)} تکرار
                    </span>

                    ${
                      item.weight !== ""
                        ? `<small>وزن: ${escapeHTML(item.weight)} کیلوگرم</small>`
                        : ""
                    }

                    ${
                      item.note
                        ? `<small>${escapeHTML(item.note)}</small>`
                        : ""
                    }
                  </div>

                  <div class="exercise-actions">
                    <button
                      type="button"
                      data-complete="${index}"
                      class="complete-btn"
                    >
                      ${item.completed ? "✓ انجام شد" : "تکمیل"}
                    </button>

                    <button
                      type="button"
                      data-delete="${index}"
                      class="delete-btn"
                    >
                      حذف
                    </button>
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
        .then(content => {
          renderLayout(content, "photos");
        })
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

document.addEventListener("click", event => {
  const target = event.target;

  if (!(target instanceof Element)) return;

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

renderHome();
