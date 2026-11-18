const ProfileManager = {
  key: "bodyTrackProfile",

  getData() {
    return JSON.parse(localStorage.getItem(this.key) || "{}");
  },

  saveData(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },

  render() {
    const profile = this.getData();

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
        <form id="profile-form">

          <label class="stat-label">نام نمایشی</label>
          <input name="name" value="${this.escape(profile.name || "")}"
            placeholder="نام خودت رو وارد کن">

          <label class="stat-label">سن</label>
          <input name="age" type="number" min="1" max="120"
            value="${this.escape(profile.age || "")}"
            placeholder="سن">

          <label class="stat-label">هدف اصلی</label>
          <select name="goal">
            <option value="muscle" ${profile.goal === "muscle" ? "selected" : ""}>
              عضله‌سازی
            </option>
            <option value="strength" ${profile.goal === "strength" ? "selected" : ""}>
              افزایش قدرت
            </option>
            <option value="fitness" ${profile.goal === "fitness" ? "selected" : ""}>
              تناسب اندام
            </option>
            <option value="health" ${profile.goal === "health" ? "selected" : ""}>
              سلامتی و فعالیت بیشتر
            </option>
            <option value="other" ${profile.goal === "other" ? "selected" : ""}>
              هدف دیگر
            </option>
          </select>

          <label class="stat-label">واحد اندازه‌گیری وزن</label>
          <select name="unit">
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
        <p class="stat-note">اطلاعات شخصی تو روی همین دستگاه ذخیره می‌شود.</p>
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
    if (event.target.id !== "profile-form") return;

    event.preventDefault();

    const form = new FormData(event.target);

    const profile = {
      name: form.get("name").trim(),
      age: form.get("age"),
      goal: form.get("goal"),
      unit: form.get("unit")
    };

    this.saveData(profile);

    if (typeof showPage === "function") {
      showPage("profile");
    }
  }
};

document.addEventListener("submit", event => {
  ProfileManager.handleSubmit(event);
});
