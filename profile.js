
const ProfileManager = {
  key: "bodyTrackProfile",

  getData() {
    try {
      const data = JSON.parse(localStorage.getItem(this.key) || "{}");

      return data && typeof data === "object" && !Array.isArray(data)
        ? data
        : {};
    } catch (error) {
      console.error("Profile data error:", error);
      return {};
    }
  },

  saveData(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Profile save error:", error);
      return false;
    }
  },

  render() {
    const profile = this.getData();

    const goals = [
      ["muscle", "عضله‌سازی"],
      ["strength", "افزایش قدرت"],
      ["fitness", "تناسب اندام"],
      ["health", "سلامتی و فعالیت بیشتر"],
      ["other", "هدف دیگر"]
    ];

    return `
      <header class="topbar">
        <div>
          <span class="english topbar-caption">YOUR PERSONAL SPACE</span>
          <h2>پروفایل من</h2>
        </div>
        <div class="avatar">B</div>
      </header>

      <section class="welcome-card">
        <div>
          <span class="english welcome-tag">YOUR IDENTITY</span>
          <h1>مسیر تو،<br>قوانین تو.</h1>
          <p>فضای شخصی BODY TRACK رو مطابق سلیقه‌ات تنظیم کن.</p>
        </div>
        <div class="welcome-decoration english">04</div>
      </section>

      <section class="section-heading">
        <div>
          <span class="english section-caption">PERSONAL INFORMATION</span>
          <h2>اطلاعات شخصی</h2>
        </div>
      </section>

      <section class="empty-card" style="text-align:right">
        <form id="profile-form" class="form-grid">

          <label class="stat-label" for="profile-name">نام نمایشی</label>
          <input
            id="profile-name"
            name="name"
            type="text"
            maxlength="40"
            value="${this.escape(profile.name || "")}"
            placeholder="نام خودت رو وارد کن"
          >

          <label class="stat-label" for="profile-age">سن</label>
          <input
            id="profile-age"
            name="age"
            type="number"
            min="1"
            max="120"
            step="1"
            value="${this.escape(profile.age ?? "")}"
            placeholder="سن"
          >

          <label class="stat-label" for="profile-goal">هدف اصلی</label>
          <select id="profile-goal" name="goal">
            ${goals.map(([value, label]) => `
              <option value="${value}"
                ${profile.goal === value ? "selected" : ""}>
                ${label}
              </option>
            `).join("")}
          </select>

          <label class="stat-label" for="profile-unit">
            واحد اندازه‌گیری وزن
          </label>
          <select id="profile-unit" name="unit">
            <option value="kg" ${profile.unit !== "lb" ? "selected" : ""}>
              کیلوگرم (kg)
            </option>
            <option value="lb" ${profile.unit === "lb" ? "selected" : ""}>
              پوند (lb)
            </option>
          </select>

          <button class="primary-button" type="submit">
            ذخیره تغییرات
          </button>
        </form>
      </section>

      <section class="section-heading">
        <div>
          <span class="english section-caption">APP INFORMATION</span>
          <h2>درباره BODY TRACK</h2>
        </div>
      </section>

      <section class="stat-card">
        <h3 class="english">BODY TRACK</h3>
        <p class="stat-note">YOUR BODY. YOUR JOURNEY. YOUR PROGRESS.</p>
        <p class="stat-note">نسخه 1.0.0</p>
        <p class="stat-note">
          اطلاعات شخصی تو روی همین دستگاه ذخیره می‌شود.
        </p>
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
    if (!event.target || event.target.id !== "profile-form") return;

    event.preventDefault();

    const form = new FormData(event.target);

    const name = String(form.get("name") || "").trim();
    const ageValue = String(form.get("age") || "").trim();
    const age = ageValue ? Number(ageValue) : "";

    if (name.length > 40) {
      alert("نام نمایشی نباید بیشتر از ۴۰ کاراکتر باشد.");
      return;
    }

    if (
      ageValue &&
      (!Number.isInteger(age) || age < 1 || age > 120)
    ) {
      alert("لطفاً یک سن معتبر وارد کن.");
      return;
    }

    const profile = {
      name,
      age,
      goal: form.get("goal") || "muscle",
      unit: form.get("unit") === "lb" ? "lb" : "kg"
    };

    const saved = this.saveData(profile);

    if (!saved) {
      alert("ذخیره اطلاعات انجام نشد. فضای ذخیره‌سازی دستگاه را بررسی کن.");
      return;
    }

    if (typeof showPage === "function") {
      showPage("profile");
    }
  }
};

document.addEventListener("submit", event => {
  ProfileManager.handleSubmit(event);
});
