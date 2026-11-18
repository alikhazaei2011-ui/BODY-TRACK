
const app = document.getElementById("app");

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
        <button class="nav-item active" data-page="home">
          <span>⌂</span> خانه
        </button>
        <button class="nav-item" data-page="workout">
          <span>▤</span> برنامه تمرینی
        </button>
        <button class="nav-item" data-page="body">
          <span>◉</span> تغییرات بدن
        </button>
        <button class="nav-item" data-page="progress">
          <span>↗</span> پیشرفت
        </button>
        <button class="nav-item" data-page="profile">
          <span>♙</span> پروفایل
        </button>
      </nav>

      <div class="sidebar-footer">
        <span class="english">YOUR BODY.</span>
        <strong class="english">YOUR JOURNEY.</strong>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div>
          <span class="english topbar-caption">YOUR FITNESS SPACE</span>
          <h2>سلام! خوش اومدی 👋</h2>
        </div>
        <div class="avatar">U</div>
      </header>

      <section class="welcome-card">
        <div>
          <span class="english welcome-tag">BUILD YOURSELF</span>
          <h1>هر روز، یک قدم<br>نزدیک‌تر به هدفت.</h1>
          <p>مسیر پیشرفتت رو از همین امروز ثبت کن.</p>
          <button class="primary-button" data-page="workout">
            شروع تمرین
            <span>←</span>
          </button>
        </div>
        <div class="welcome-decoration english">01</div>
      </section>

      <section class="section-heading">
        <div>
          <span class="english section-caption">YOUR OVERVIEW</span>
          <h2>خلاصه وضعیت</h2>
        </div>
        <span class="date-label">امروز</span>
      </section>

      <section class="stats-grid">
        <article class="stat-card">
          <span class="stat-icon">⚖️</span>
          <span class="stat-label">وزن فعلی</span>
          <strong class="english">-- <small>kg</small></strong>
          <span class="stat-note">هنوز ثبت نشده</span>
        </article>

        <article class="stat-card">
          <span class="stat-icon">🏋️</span>
          <span class="stat-label">تمرین‌های انجام‌شده</span>
          <strong class="english">0</strong>
          <span class="stat-note">جلسه تمرینی</span>
        </article>

        <article class="stat-card">
          <span class="stat-icon">📅</span>
          <span class="stat-label">روزهای فعال</span>
          <strong class="english">0</strong>
          <span class="stat-note">این هفته</span>
        </article>

        <article class="stat-card">
          <span class="stat-icon">🎯</span>
          <span class="stat-label">هدف ماهانه</span>
          <strong class="english">0%</strong>
          <span class="stat-note">هنوز هدفی ثبت نشده</span>
        </article>
      </section>

      <section class="section-heading">
        <div>
          <span class="english section-caption">TODAY'S PLAN</span>
          <h2>برنامه امروز</h2>
        </div>
        <button class="text-button" data-page="workout">مشاهده برنامه ←</button>
      </section>

      <section class="empty-card">
        <div class="empty-icon">🏋️</div>
        <h3>هنوز برنامه‌ای نساختی!</h3>
        <p>اولین برنامه تمرینی خودت رو بساز و مسیرت رو شروع کن.</p>
        <button class="secondary-button" data-page="workout">
          ساخت برنامه تمرینی
        </button>
      </section>

      <footer class="main-footer">
        <span class="english">BODY TRACK © 2026</span>
        <span>پیشرفت، نتیجه استمرار است.</span>
      </footer>
    </main>

    <nav class="mobile-nav">
      <button class="mobile-nav-item active" data-page="home">
        <span>⌂</span><small>خانه</small>
      </button>
      <button class="mobile-nav-item" data-page="workout">
        <span>▤</span><small>تمرین</small>
      </button>
      <button class="mobile-nav-item" data-page="body">
        <span>◉</span><small>بدن</small>
      </button>
      <button class="mobile-nav-item" data-page="progress">
        <span>↗</span><small>پیشرفت</small>
      </button>
      <button class="mobile-nav-item" data-page="profile">
        <span>♙</span><small>پروفایل</small>
      </button>
    </nav>

  </div>
`;

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-page]");
  if (!button) return;

  const page = button.dataset.page;

  document.querySelectorAll(".nav-item, .mobile-nav-item")
    .forEach(item => {
      item.classList.toggle("active", item.dataset.page === page);
    });

  if (page !== "home") {
    alert("بخش موردنظر در مراحل بعدی ساخته می‌شود.");
  }
});
