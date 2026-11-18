
const BackupManager = {
  exportKeys: [
    "bodyTrackWorkouts",
    "bodyTrackMeasurements",
    "bodyTrackProfile"
  ],

  exportData() {
    const backup = {
      app: "BODY TRACK",
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      data: {}
    };

    this.exportKeys.forEach(key => {
      backup.data[key] = localStorage.getItem(key);
    });

    const file = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = `body-track-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  },

  importData(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);

        if (
          backup.app !== "BODY TRACK" ||
          !backup.data ||
          typeof backup.data !== "object"
        ) {
          throw new Error("Invalid backup");
        }

        this.exportKeys.forEach(key => {
          const value = backup.data[key];

          if (typeof value === "string") {
            JSON.parse(value);
          }
        });

        const confirmed = confirm(
          "با بازیابی نسخه پشتیبان، اطلاعات فعلی جایگزین می‌شوند. ادامه می‌دهی؟"
        );

        if (!confirmed) return;

        this.exportKeys.forEach(key => {
          const value = backup.data[key];

          if (typeof value === "string") {
            localStorage.setItem(key, value);
          } else {
            localStorage.removeItem(key);
          }
        });

        alert("نسخه پشتیبان با موفقیت بازیابی شد.");
        location.reload();

      } catch (error) {
        alert("فایل پشتیبان معتبر نیست یا قابل خواندن نیست.");
      }
    };

    reader.onerror = () => {
      alert("خواندن فایل با مشکل مواجه شد.");
    };

    reader.readAsText(file);
  },

  render() {
    return `
      <div class="section-heading">
        <div>
          <span class="eyebrow">DATA MANAGEMENT</span>
          <h3>پشتیبان‌گیری اطلاعات</h3>
        </div>
      </div>

      <div class="backup-card">
        <div class="backup-icon">↗</div>
        <h3>خروجی گرفتن از اطلاعات</h3>
        <p>
          یک نسخه از برنامه تمرینی، اندازه‌های بدن و پروفایل خودت
          در قالب فایل JSON ذخیره کن.
        </p>
        <button class="primary-btn" data-backup-export>
          دریافت نسخه پشتیبان
        </button>
      </div>

      <div class="backup-card">
        <div class="backup-icon">↙</div>
        <h3>بازیابی اطلاعات</h3>
        <p>
          فایل پشتیبانی که قبلاً دریافت کرده‌ای انتخاب کن.
          اطلاعات فعلی با اطلاعات نسخه پشتیبان جایگزین می‌شوند.
        </p>

        <label class="backup-file-label" for="backup-file">
          انتخاب فایل پشتیبان
        </label>
        <input
          id="backup-file"
          type="file"
          accept=".json,application/json"
        />
        <button class="secondary-btn" data-backup-import>
          بازیابی نسخه پشتیبان
        </button>
      </div>

      <div class="backup-warning">
        <strong>نکته مهم</strong>
        <p>
          اطلاعات BODY TRACK روی همین مرورگر و دستگاه ذخیره می‌شوند
          و به‌صورت خودکار بین دستگاه‌ها همگام‌سازی نمی‌شوند.
          فایل پشتیبان را در جای امنی نگه دار.
        </p>
      </div>
    `;
  },

  handleImport() {
    const input = document.getElementById("backup-file");

    if (!input || !input.files.length) {
      alert("ابتدا فایل پشتیبان را انتخاب کن.");
      return;
    }

    this.importData(input.files[0]);
  }
};

document.addEventListener("click", event => {
  if (event.target.closest("[data-backup-export]")) {
    BackupManager.exportData();
  }

  if (event.target.closest("[data-backup-import]")) {
    BackupManager.handleImport();
  }
});
