const app = document.getElementById("app");

const DAYS = [
  "شنبه", "یکشنبه", "دوشنبه",
  "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"
];

let selectedDay = "شنبه";

let workoutData = JSON.parse(
  localStorage.getItem("bodyTrackWorkouts") || "{}"
);

function saveData() {
  localStorage.setItem(
    "bodyTrackWorkouts",
    JSON.stringify(workoutData)
  );
}

function getExercises(day) {
  return workoutData[day] || [];
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function renderLayout(content, activePage = "home") {
  const pages = [
    ["home", "⌂", "خانه"],
    ["workout", "▤", "برنامه تمرینی"],
    ["body", "◉", "تغییرات بدن"],
    ["progress", "↗", "پیشرفت"],
    ["profile", "♙", "پروفایل"]
  ];

  app.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon">B</div>
          <div>
            <h2 class="english">BODY TRACK</h2>
            <span class="english">FITNESS JOURNAL</span>
          </div>
        </div>

        <div class="sidebar-label">منوی اصلی</div>

        <nav class="navigation">
          ${pages.map(([page, icon, label]) => `
            <button class="nav-item ${activePage === page ? "active" : ""}"
              data-page="${page}">
              <span>${icon}</span>${label}
            </button>
          `).join("")}
        </nav>

        <div class="sidebar-footer">
          <span class="english">YOUR BODY.</span>
          <strong class="english">YOUR JOURNEY.</strong>
        </div>
      </aside>

      <main class="main-content">
        ${content}

        <footer class="main-footer">
          <span class="english">BODY TRACK © 2026</span>
          <span>پیشرفت، نتیجه استمرار است.</span>
        </footer>
      </main>

      <nav class="mobile-nav">
        ${pages.map(([page, icon, label]) => `
          <button class="mobile-nav-item ${activePage === page ? "active" : ""}"
            data-page="${page}">
            <span>${icon}</span><small>${label}</small>
          </button>
        `).join("")}
      </nav>
    </div>
  `;
}

function renderHome() {
  const allExercises = Object.values(workoutData).flat();
  const completed = allExercises.filter(item => item.done).length;
  const total = allExercises.length;

  renderLayout(`
    <header class="topbar">
      <div>
        <span class="english topbar-caption">YOUR FITNESS SPACE</span>
        <h2>سلام! خوش اومدی 👋</h2>
      </div>
      <div class="avatar">B</div>
    </header>

    <section class="welcome-card">
      <div>
        <span class="english welcome-tag">BUILD YOURSELF</span>
        <h1>هر روز، یک قدم<br>نزدیک‌تر به هدفت.</h1>
        <p>مسیر پیشرفتت رو از همین امروز ثبت کن.</p>
        <button class="primary-button" data-page="workout">
          شروع تمرین ←
        </button>
      </div>
      <div class="welcome-decoration english">01</div>
    </section>

    <section class="section-heading">
      <div>
        <span class="english section-caption">YOUR OVERVIEW</span>
        <h2>خلاصه وضعیت</h2>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <span class="stat-label">تعداد حرکات</span>
        <strong class="english">${total}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-label">حرکات تکمیل‌شده</span>
        <strong class="english">${completed}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-label">حرکات باقی‌مانده</span>
        <strong class="english">${total - completed}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-label">درصد تکمیل</span>
        <strong class="english">${total ? Math.round(completed / total * 100) : 0}%</strong>
      </article>
    </section>

    <section class="section-heading">
      <div>
        <span class="english section-caption">GET STARTED</span>
        <h2>از کجا شروع کنیم؟</h2>
      </div>
    </section>

    <section class="empty-card">
      <div class="empty-icon">🏋️</div>
      <h3>مسیر پیشرفتت رو بساز</h3>
      <p>برنامه تمرینی و اندازه‌گیری‌های بدنت رو ثبت کن.</p>
      <button class="secondary-button" data-page="workout">
        برنامه تمرینی
      </button>
      <button class="secondary-button" data-page="body">
        ثبت اطلاعات بدن
      </button>
    </section>
  `, "home");
}

function renderWorkout() {
  const exercises = getExercises(selectedDay);

  renderLayout(`
    <header class="topbar">
      <div>
        <span class="english topbar-caption">YOUR TRAINING PLAN</span>
        <h2>برنامه تمرینی</h2>
      </div>
      <div class="avatar">B</div>
    </header>

    <section class="section-heading">
      <div>
        <span class="english section-caption">WEEKLY SCHEDULE</span>
        <h2>روز تمرینت رو انتخاب کن</h2>
      </div>
    </section>

    <section class="stats-grid">
      ${DAYS.map(day => `
        <button class="stat-card day-card"
          data-day="${day}"
          style="cursor:pointer;border:2px solid ${selectedDay === day ? "var(--accent)" : "transparent"}">
          <span class="stat-label">${day}</span>
          <strong class="english">${getExercises(day).length}</strong>
          <span class="stat-note">حرکت</span>
        </button>
      `).join("")}
    </section>

    <section class="section-heading">
      <div>
        <span class="english section-caption">DAILY WORKOUT</span>
        <h2>تمرین‌های ${selectedDay}</h2>
      </div>
      <span class="date-label">${exercises.length} حرکت</span>
    </section>

    <section class="empty-card" style="text-align:right">
      <form id="exercise-form">
        <h3>افزودن حرکت جدید</h3>

        <label class="stat-label">نام حرکت</label>
        <input name="name" required placeholder="مثلاً جلو بازو با دمبل">

        <div class="stats-grid">
          <div>
            <label class="stat-label">تعداد ست</label>
            <input name="sets" type="number" min="1" value="3" required>
          </div>
          <div>
            <label class="stat-label">تکرار</label>
            <input name="reps" type="number" min="1" value="12" required>
          </div>
          <div>
            <label class="stat-label">وزنه (کیلوگرم)</label>
            <input name="weight" type="number" min="0" step="0.5" value="0">
          </div>
        </div>

        <label class="stat-label">یادداشت</label>
        <textarea name="note" rows="2" placeholder="نکته‌ای درباره این حرکت..."></textarea>

        <button class="primary-button" type="submit">
          افزودن به برنامه +
        </button>
      </form>
    </section>

    <section class="section-heading">
      <div>
        <span class="english section-caption">YOUR EXERCISES</span>
        <h2>لیست حرکات</h2>
      </div>
    </section>

    <section class="exercise-list">
      ${exercises.length ? exercises.map((exercise, index) => `
        <article class="stat-card" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
            <div>
              <h3>${escapeHTML(exercise.name)}</h3>
              <p class="stat-note">
                ${exercise.sets} ست × ${exercise.reps} تکرار
                ${Number(exercise.weight) > 0 ? ` · ${exercise.weight} کیلوگرم` : ""}
              </p>
            </div>
            <button class="secondary-button" data-complete="${index}">
              ${exercise.done ? "✓ انجام شد" : "تکمیل"}
            </button>
          </div>

          ${exercise.note ? `<p class="stat-note">${escapeHTML(exercise.note)}</p>` : ""}

          <button class="text-button" data-delete="${index}"
            style="margin-top:12px;color:var(--accent)">
            حذف حرکت
          </button>
        </article>
      `).join("") : `
        <section class="empty-card">
          <div class="empty-icon">🏋️</div>
          <h3>هنوز حرکتی ثبت نکردی</h3>
          <p>از فرم بالا اولین حرکت تمرینی خودت رو اضافه کن.</p>
        </section>
      `}
    </section>
  `, "workout");
}

function showPage(page) {
  if (page === "home") {
    renderHome();
  } else if (page === "workout") {
    renderWorkout();
  } else if (page === "body") {
    renderLayout(BodyTracker.render(), "body");
  } else {
    renderPlaceholder(page);
  }
}

function renderPlaceholder(page) {
  const titles = {
    progress: "پیشرفت",
    profile: "پروفایل"
  };

  renderLayout(`
    <header class="topbar">
      <div>
        <span class="english topbar-caption">BODY TRACK</span>
        <h2>${titles[page] || "BODY TRACK"}</h2>
      </div>
      <div class="avatar">B</div>
    </header>

    <section class="empty-card">
      <div class="empty-icon">🚧</div>
      <h3>این بخش در حال ساخت است</h3>
      <p>به‌زودی این قسمت هم به BODY TRACK اضافه می‌شود.</p>
      <button class="secondary-button" data-page="home">
        بازگشت به خانه
      </button>
    </section>
  `, page);
}

document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    showPage(pageButton.dataset.page);
    return;
  }

  const dayButton = event.target.closest("[data-day]");
  if (dayButton) {
    selectedDay = dayButton.dataset.day;
    renderWorkout();
    return;
  }

  const completeButton = event.target.closest("[data-complete]");
  if (completeButton) {
    const exercises = getExercises(selectedDay);
    const index = Number(completeButton.dataset.complete);

    exercises[index].done = !exercises[index].done;
    saveData();
    renderWorkout();
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    const index = Number(deleteButton.dataset.delete);
    workoutData[selectedDay].splice(index, 1);
    saveData();
    renderWorkout();
  }
});

document.addEventListener("submit", event => {
  if (event.target.id !== "exercise-form") return;

  event.preventDefault();

  const form = new FormData(event.target);

  const exercise = {
    name: form.get("name").trim(),
    sets: Number(form.get("sets")),
    reps: Number(form.get("reps")),
    weight: Number(form.get("weight")) || 0,
    note: form.get("note").trim(),
    done: false
  };

  if (!exercise.name || exercise.sets < 1 || exercise.reps < 1) return;

  if (!workoutData[selectedDay]) {
    workoutData[selectedDay] = [];
  }

  workoutData[selectedDay].push(exercise);
  saveData();
  renderWorkout();
});

renderHome();
