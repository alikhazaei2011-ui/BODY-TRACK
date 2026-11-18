
const PhotosManager = {
  dbName: "BodyTrackPhotos",
  storeName: "photos",
  db: null,
  selectedPhotos: [],
  objectUrls: [],
  comparisonUrls: [],

  openDB() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB پشتیبانی نمی‌شود."));
        return;
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = event => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true
          });

          store.createIndex("date", "date", {
            unique: false
          });
        }
      };

      request.onsuccess = event => {
        this.db = event.target.result;

        this.db.onversionchange = () => {
          this.db.close();
          this.db = null;
        };

        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error("پایگاه داده مشغول است."));
    });
  },

  async getAll() {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readonly");
      const request = transaction.objectStore(this.storeName).getAll();

      request.onsuccess = () => {
        const photos = request.result || [];

        photos.sort((a, b) =>
          String(b.date || "").localeCompare(String(a.date || ""))
        );

        resolve(photos);
      };

      request.onerror = () => reject(request.error);
    });
  },

  async addPhoto(file, date, note) {
    const db = await this.openDB();

    const photo = {
      image: file,
      date,
      note,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");
      const request = transaction.objectStore(this.storeName).add(photo);

      let id;

      request.onsuccess = () => {
        id = request.result;
      };

      transaction.oncomplete = () => resolve(id);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error || new Error("ذخیره لغو شد."));
    });
  },

  async deletePhoto(id) {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");

      transaction.objectStore(this.storeName).delete(Number(id));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  },

  createObjectUrl(file) {
    const url = URL.createObjectURL(file);
    this.objectUrls.push(url);
    return url;
  },

  clearObjectUrls() {
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
  },

  clearComparisonUrls() {
    this.comparisonUrls.forEach(url => URL.revokeObjectURL(url));
    this.comparisonUrls = [];
  },

  isValidImage(file) {
    return file &&
      ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
      file.size <= 10 * 1024 * 1024;
  },

  render() {
    this.clearObjectUrls();
    this.clearComparisonUrls();

    return this.renderContent();
  },

  async renderContent() {
    try {
      const photos = await this.getAll();

      const cards = photos.length
        ? photos.map(photo => `
          <article class="photo-card">
            <img
              src="${this.createObjectUrl(photo.image)}"
              alt="تصویر ثبت‌شده"
              loading="lazy"
            />
            <div class="photo-card-info">
              <strong>${this.escape(photo.date)}</strong>
              <p>${this.escape(photo.note || "بدون توضیحات")}</p>

              <div class="photo-actions">
                <button
                  type="button"
                  class="delete-btn"
                  data-photo-delete="${Number(photo.id)}"
                >
                  حذف تصویر
                </button>
              </div>
            </div>
          </article>
        `).join("")
        : `
          <div class="empty-state">
            <strong>هنوز عکسی ثبت نکرده‌ای</strong>
            <p>اولین عکس مسیر تغییراتت رو اضافه کن.</p>
          </div>
        `;

      return `
        <div class="section-heading">
          <div>
            <span class="eyebrow">BODY TRANSFORMATION</span>
            <h3>گالری تغییرات بدن</h3>
          </div>
          <span class="muted-text">${photos.length} تصویر</span>
        </div>

        <section class="photo-upload-card">
          <div class="photo-upload-icon">＋</div>
          <h3>ثبت تصویر جدید</h3>
          <p>عکس‌های مسیر پیشرفتت رو ذخیره کن.</p>

          <form id="photo-form">
            <label class="photo-file-label" for="photo-file">
              <span>انتخاب عکس از گوشی</span>
              <input
                id="photo-file"
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                required
                style="display:none"
              />
            </label>

            <div id="photo-preview-box" style="display:none; margin:12px 0;">
              <img
                id="photo-preview"
                alt="پیش‌نمایش عکس"
                style="width:100%; max-height:260px; object-fit:contain; border-radius:16px;"
              />
            </div>

            <label>
              تاریخ ثبت
              <input
                type="date"
                name="date"
                value="${new Date().toISOString().slice(0, 10)}"
                max="${new Date().toISOString().slice(0, 10)}"
                required
              />
            </label>

            <label>
              توضیحات
              <textarea
                name="note"
                maxlength="300"
                placeholder="مثلاً ماه اول، شروع مسیر..."
              ></textarea>
            </label>

            <button type="submit" class="primary-btn" id="photo-save-btn">
              ذخیره تصویر در آرشیو
            </button>
          </form>
        </section>

        <section class="photo-comparison" id="photo-comparison">
          <h3>مقایسه دو تصویر</h3>
          <p>دو عکس را مستقیماً از گالری گوشی انتخاب کن.</p>

          <form id="photo-compare-form">
            <div class="comparison-grid">

              <label class="comparison-upload">
                <span>انتخاب عکس اول</span>
                <input
                  type="file"
                  name="first"
                  accept="image/jpeg,image/png,image/webp"
                  required
                />
                <img
                  id="compare-image-one"
                  alt="پیش‌نمایش عکس اول"
                  style="display:none; width:100%; max-height:300px; object-fit:contain; border-radius:14px;"
                />
              </label>

              <label class="comparison-upload">
                <span>انتخاب عکس دوم</span>
                <input
                  type="file"
                  name="second"
                  accept="image/jpeg,image/png,image/webp"
                  required
                />
                <img
                  id="compare-image-two"
                  alt="پیش‌نمایش عکس دوم"
                  style="display:none; width:100%; max-height:300px; object-fit:contain; border-radius:14px;"
                />
              </label>

            </div>

            <button type="submit" class="primary-btn">
              نمایش مقایسه
            </button>

            <button
              type="button"
              class="secondary-btn"
              id="clear-photo-comparison"
            >
              پاک‌کردن مقایسه
            </button>
          </form>
        </section>

        <div class="section-heading">
          <div>
            <span class="eyebrow">YOUR PHOTO JOURNEY</span>
            <h3>آرشیو تصاویر</h3>
          </div>
        </div>

        <div class="photo-gallery">
          ${cards}
        </div>
      `;
    } catch (error) {
      console.error("Photos render error:", error);

      return `
        <div class="empty-state">
          <strong>گالری در دسترس نیست</strong>
          <p>مشکل در دسترسی به حافظه تصاویر.</p>
        </div>
      `;
    }
  },

  showPreview(input, imageId, previewUrlKey) {
    const file = input.files && input.files[0];
    const image = document.getElementById(imageId);

    if (!image) return;

    if (!file) {
      image.removeAttribute("src");
      image.style.display = "none";
      return;
    }

    if (!this.isValidImage(file)) {
      alert("فقط عکس JPG، PNG یا WEBP تا حجم ۱۰ مگابایت مجاز است.");
      input.value = "";
      image.removeAttribute("src");
      image.style.display = "none";
      return;
    }

    if (this[previewUrlKey]) {
      URL.revokeObjectURL(this[previewUrlKey]);
    }

    const url = URL.createObjectURL(file);
    this[previewUrlKey] = url;

    image.src = url;
    image.style.display = "block";
  },

  previewPhotoUrl: null,
  previewFirstUrl: null,
  previewSecondUrl: null,

  escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  },

  async handleSubmit(event) {
    if (!event.target || event.target.id !== "photo-form") return;

    event.preventDefault();

    const form = event.target;
    const file = form.elements.photo.files[0];
    const date = form.elements.date.value;
    const note = form.elements.note.value.trim();
    const button = document.getElementById("photo-save-btn");

    if (!this.isValidImage(file)) {
      alert("لطفاً یک عکس معتبر JPG، PNG یا WEBP تا حجم ۱۰ مگابایت انتخاب کن.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      alert("لطفاً تاریخ معتبر انتخاب کن.");
      return;
    }

    if (date > today) {
      alert("تاریخ ثبت نمی‌تواند در آینده باشد.");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "در حال ذخیره...";
    }

    try {
      await this.addPhoto(file, date, note);

      this.selectedPhotos = [];

      alert("عکس با موفقیت در آرشیو ذخیره شد.");

      if (typeof showPage === "function") {
        showPage("photos");
      }
    } catch (error) {
      console.error("Photo save error:", error);
      alert("ذخیره عکس انجام نشد. دوباره تلاش کن.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "ذخیره تصویر در آرشیو";
      }
    }
  },

  async handleCompareSubmit(event) {
    if (!event.target || event.target.id !== "photo-compare-form") return;

    event.preventDefault();

    const form = event.target;
    const first = form.elements.first.files[0];
    const second = form.elements.second.files[0];

    if (!this.isValidImage(first) || !this.isValidImage(second)) {
      alert("لطفاً هر دو عکس معتبر تا حجم ۱۰ مگابایت انتخاب کن.");
      return;
    }

    this.showPreview(
      form.elements.first,
      "compare-image-one",
      "previewFirstUrl"
    );

    this.showPreview(
      form.elements.second,
      "compare-image-two",
      "previewSecondUrl"
    );

    const comparison = document.getElementById("photo-comparison");

    if (comparison) {
      comparison.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  },

  clearComparison() {
    this.clearComparisonUrls();

    ["previewFirstUrl", "previewSecondUrl"].forEach(key => {
      if (this[key]) {
        URL.revokeObjectURL(this[key]);
        this[key] = null;
      }
    });

    const form = document.getElementById("photo-compare-form");
    if (form) form.reset();

    ["compare-image-one", "compare-image-two"].forEach(id => {
      const image = document.getElementById(id);

      if (image) {
        image.removeAttribute("src");
        image.style.display = "none";
      }
    });
  },

  async handleDelete(id) {
    if (!confirm("از حذف این تصویر مطمئنی؟")) return;

    try {
      await this.deletePhoto(id);

      this.selectedPhotos = this.selectedPhotos.filter(
        photo => photo.id !== Number(id)
      );

      alert("تصویر حذف شد.");

      if (typeof showPage === "function") {
        showPage("photos");
      }
    } catch (error) {
      console.error("Photo delete error:", error);
      alert("حذف تصویر انجام نشد.");
    }
  }
};

document.addEventListener("submit", event => {
  if (event.target.id === "photo-form") {
    PhotosManager.handleSubmit(event);
  }

  if (event.target.id === "photo-compare-form") {
    PhotosManager.handleCompareSubmit(event);
  }
});

document.addEventListener("change", event => {
  if (event.target.id === "photo-file") {
    PhotosManager.showPreview(
      event.target,
      "photo-preview",
      "previewPhotoUrl"
    );
  }
});

document.addEventListener("click", event => {
  const deleteButton = event.target.closest("[data-photo-delete]");

  if (deleteButton) {
    PhotosManager.handleDelete(deleteButton.dataset.photoDelete);
  }

  if (event.target.closest("#clear-photo-comparison")) {
    PhotosManager.clearComparison();
  }
});
