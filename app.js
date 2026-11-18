
const app = document.getElementById("app");

const DAYS = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه",
  "چهارشنبه", "پنجشنبه", "جمعه"
];

let selectedDay = DAYS[0];
let workoutData = JSON.parse(
  localStorage.getItem("bodyTrackWorkouts") || "{}"
);

function saveWorkouts() {
  localStorage.setItem("bodyTrackWorkouts", JSON.stringify(workoutData));
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

function getPageTitle(page) {
  const titles = {
    home: "داشبورد",
    workout: "برنامه تمرینی",
    body: "اندازه‌های بدن",
    progress: "گزارش پیشرفت",
    photos: "گالری تصاویر بدن",
    profile: "پروفایل من",
    backup: "پشتیبان‌گیری"
  };

  return titles[page] || "BODY TRACK";
}

function renderLayout(content, activePage = "home") {
  const morePages = ["photos", "profile", "backup"];
  const isMoreActive = morePages.includes(activePage);

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
          <button data-page="home" class="${activePage === "home" ? "active" : ""}">خانه</button>
          <button data-page="workout" class="${activePage === "workout" ? "active" : ""}">برنامه تمرینی</button>
          <button data-page="body" class="${activePage === "body" ? "active" : ""}">اندازه‌های بدن</button>
          <button data-page="progress" class="${activePage === "progress" ? "active" : ""}">پیشرفت من</button>

          <div class="sidebar-more">
            <button class="more-heading ${isMoreActive ? "active" : ""}" data-more-toggle>
              بیشتر <span>⌄</span>
            </button>

            <div class="more-links ${isMoreActive ? "open" : ""}">
              <button data-page="photos" class="${activePage === "photos" ? "active" : ""}">گالری تصاویر بدن</button>
              <button data-page="profile" class="${activePage === "profile" ? "active" : ""}">پروفایل شخصی</button>
              <button data-page="backup" class="${activePage === "backup" ? "active" : ""}">پشتیبان‌گیری</button>
            </div>
          </div>
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
          <div class="topbar-date">${new Date().toLocaleDateString("fa-IR")}</div>
        </header>

        <section class="page-content">
          ${content}
        </section>
      </main>

      <div class="mobile-more-panel ${isMoreActive ? "open" : ""}" id="mobile-more-panel">
        <div class="more-panel-heading">
          <strong>بخش‌های بیشتر</strong>
          <button data-more-close aria-label="بستن">×</button>
        </div>
        <button data-page="photos" class="${activePage === "photos" ? "active" : ""}">
          <span>▧</span> گالری تصاویر بدن
        </button>
        <button data-page="profile" class="${activePage === "profile" ? "active" : ""}">
          <span>♙</span> پروفایل شخصی
        </button>
        <button data-page="backup" class="${activePage === "backup" ? "active" : ""}">
          <span>↥</span> پشتیبان‌گیری
        </button>
      </div>

      <nav class="mobile-nav">
        <button data-page="home" class="${activePage === "home" ? "active" : ""}">
          <span>⌂</span><small>خانه</small>
        </button>
        <button data-page="workout" class="${activePage === "workout" ? "active" : ""}">
          <span>▤</span><small>تمرین</small>
        </button>
        <button data-page="body" class="${activePage === "body" ? "active" : ""}">
          <span>◉</span><small>اندازه‌ها</small>
        </button>
        <button data-page="progress" class="${activePage === "progress" ? "active" : ""}">
          <span>⌁</span><small>پیشرفت</small>
        </button>
        <button data-more-toggle class="${isMoreActive ? "active" : ""}">
          <span>☰</span><small>بیشتر</small>
        </button>
      </nav>
    </div>
  `;
}

function renderHome() {
  const allExercises = Object.values(workoutData).flat();
  const totalExercises = allExercises.length;
  const completedExercises = allExercises.filter(item => item.completed).length;
  const latestMeasurement = BodyTracker.getData().slice(-1)[0];

  const content = `
    <section class="welcome-card">
      <div>
        <span class="eyebrow">YOUR JOURNEY STARTS HERE</span>
        <h2>هر روز، یک قدم قوی‌تر.</h2>
        <p>تمرین‌ها و تغییرات بدنت رو ثبت کن و مسیر پیشرفتت رو ببین.</p>
        <button class="primary-btn" data-page="workout">مشاهده برنامه تمرینی</button>
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
        <strong>${latestMeasurement?.weight ?? "—"}</strong>
        <small>${latestMeasurement ? "کیلوگرم" : "هنوز ثبت نشده"}</small>
      </article>
    </div>

    <div class="section-heading">
      <div>
        <span class="eyebrow">QUICK ACCESS</span>
        <h3>دسترسی سریع</h3>
      </div>
    </div>

    <div class="quick-grid">
      <button class="quick-card" data-page="body">
        <span>01</span>
        <strong>ثبت اندازه‌های بدن</strong>
        <small>وزن و اندازه‌هایت را ثبت کن</small>
      </button>
      <button class="quick-card" data-page="progress">
        <span>02</span>
        <strong>مشاهده پیشرفت</strong>
        <small>روند تغییراتت را دنبال کن</small>
      </button>
      <button class="quick-card" data-page="photos">
        <span>03</span>
        <strong>گالری تصاویر بدن</strong>
        <small>عکس‌های تغییرات بدنت را مقایسه کن</small>
      </button>
      <button class="quick-card" data-page="profile">
        <span>04</span>
        <strong>پروفایل شخصی</strong>
        <small>اطلاعات شخصی‌ات را مدیریت کن</small>
      </button>
      <button class="quick-card" data-page="backup">
        <span>05</span>
        <strong>پشتیبان‌گیری</strong>
        <small>از اطلاعاتت نسخه پشتیبان بگیر</small>
      </button>
    </div>
  `;

  renderLayout(content, "home");
}

function renderWorkout() {
  const dayExercises = workoutData[selectedDay] || [];

  const content = `
    <div class="section-heading">
      <div>
        <span class="eyebrow">WEEKLY PLAN</span>
        <h3>برنامه هفتگی تو</h3>
      </div>
      <span class="muted-text">تمرین‌هایت را مدیریت کن</span>
    </div>

    <div class="days-grid">
      ${DAYS.map(day => `
        <button class="day-card ${selectedDay === day ? "selected" : ""}" data-day="${day}">
          ${day}
        </button>
      `).join("")}
    </div>

    <div class="workout-panel">
      <div class="section-heading">
        <div>
          <span class="eyebrow">SELECTED DAY</span>
          <h3>${selectedDay}</h3>
        </div>
        <span class="muted-text">${dayExercises.length} تمرین</span>
      </div>

      <form id="exercise-form">
        <div class="form-grid">
          <label>
            نام حرکت
            <input name="exercise" type="text" placeholder="مثلاً جلو بازو" required />
          </label>
          <label>
            تعداد ست
            <input name="sets" type="number" min="1" placeholder="3" required />
          </label>
          <label>
            تعداد تکرار
            <input name="reps" type="number" min="1" placeholder="12" required />
          </label>
          <label>
            وزن (کیلوگرم)
            <input name="weight" type="number" min="0" step="0.5" placeholder="اختیاری" />
          </label>
        </div>

        <label>
          توضیحات
          <textarea name="note" placeholder="نکته یا توضیح تمرین..."></textarea>
        </label>

        <button type="submit" class="primary-btn">+ افزودن تمرین</button>
      </form>

      <div class="exercise-list">
        ${dayExercises.length ? dayExercises.map((item, index) => `
          <article class="exercise-card ${item.completed ? "completed" : ""}">
            <div class="exercise-info">
              <strong>${escapeHTML(item.exercise)}</strong>
              <span>${item.sets} ست × ${item.reps} تکرار</span>
              ${item.weight ? `<small>وزن: ${item.weight} کیلوگرم</small>` : ""}
              ${item.note ? `<small>${escapeHTML(item.note)}</small>` : ""}
            </div>
            <div class="exercise-actions">
              <button data-complete="${index}" class="complete-btn">
                ${item.completed ? "انجام شد ✓" : "تکمیل"}
              </button>
              <button data-delete="${index}" class="delete-btn">حذف</button>
            </div>
          </article>
        `).join("") : `
          <div class="empty-state">
            <strong>هنوز تمرینی ثبت نشده</strong>
            <p>اولین حرکت این روز را اضافه کن.</p>
          </div>
        `}
      </div>
    </div>
  `;

  renderLayout(content, "workout");
}

function showPage(page) {
  if (page === "home") {
    renderHome();
  } else if (page === "workout") {
    renderWorkout();
  } else if (page === "body") {
    renderLayout(BodyTracker.render(), "body");
  } else if (page === "progress") {
    renderLayout(ProgressTracker.render(), "progress");
  } else if (page === "profile") {
    renderLayout(ProfileManager.render(), "profile");
  } else if (page === "backup") {
    renderLayout(BackupManager.render(), "backup");
  } else if (page === "photos") {
    PhotosManager.render().then(content => {
      renderLayout(content, "photos");
    }).catch(error => {
      console.error("Photos page error:", error);
      renderLayout(`
        <div class="empty-state">
          <strong>بارگذاری تصاویر ممکن نشد</strong>
          <p>لطفاً صفحه را دوباره باز کن.</p>
        </div>
      `, "photos");
    });
  }
}

document.addEventListener("click", event => {
  const moreToggle = event.target.closest("[data-more-toggle]");
  if (moreToggle) {
    document.getElementById("mobile-more-panel")?.classList.toggle("open");
    return;
  }

  if (event.target.closest("[data-more-close]")) {
    document.getElementById("mobile-more-panel")?.classList.remove("open");
    return;
  }

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
    const index = Number(completeButton.dataset.complete);
    workoutData[selectedDay][index].completed =
      !workoutData[selectedDay][index].completed;
    saveWorkouts();
    renderWorkout();
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    const index = Number(deleteButton.dataset.delete);
    workoutData[selectedDay].splice(index, 1);
    saveWorkouts();
    renderWorkout();
  }
});

document.addEventListener("submit", event => {
  if (event.target.id === "exercise-form") {
    event.preventDefault();

    const formData = new FormData(event.target);
    const exercise = {
      exercise: formData.get("exercise").trim(),
      sets: formData.get("sets"),
      reps: formData.get("reps"),
      weight: formData.get("weight"),
      note: formData.get("note").trim(),
      completed: false
    };

    if (!workoutData[selectedDay]) {
      workoutData[selectedDay] = [];
    }

    workoutData[selectedDay].push(exercise);
    saveWorkouts();
    renderWorkout();
  }
});

renderHome();
