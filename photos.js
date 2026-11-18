
const PhotosManager = {
  dbName: "BodyTrackPhotos",
  storeName: "photos",
  db: null,
  selectedPhotos: [],
  objectUrls: [],
  previewUrls: {},

  localDate() {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000)
      .toISOString().slice(0, 10);
  },

  openDB() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        try {
          if (this.db.objectStoreNames.contains(this.storeName)) {
            resolve(this.db);
            return;
          }
        } catch (_) {
          this.db = null;
        }
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = event => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true
          });
          store.createIndex("date", "date", { unique: false });
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
        reject(new Error("دسترسی به پایگاه داده مسدود شده است."));
    });
  },

  async getAll() {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readonly");
      const request = tx.objectStore(this.storeName).getAll();

      let result = [];

      request.onsuccess = () => {
        result = request.result || [];
      };

      request.onerror = () => reject(request.error);
      tx.oncomplete = () => {
        result.sort((a, b) =>
          String(b.date || "").localeCompare(String(a.date || ""))
        );
        resolve(result);
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  },

  async addPhoto(file, date, note) {
    if (!(file instanceof Blob) || !file.type.startsWith("image/")) {
      throw new Error("فایل انتخاب‌شده تصویر معتبر نیست.");
    }

    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);

      const request = store.add({
        image: file,
        date,
        note,
        createdAt: new Date().toISOString()
      });

      let id = null;
      let requestError = null;

      request.onsuccess = () => {
        id = request.result;
      };

      request.onerror = () => {
        requestError = request.error;
      };

      tx.oncomplete = async () => {
        if (id === null || requestError) {
          reject(requestError || new Error("شناسه عکس ایجاد نشد."));
          return;
        }

        try {
          const saved = await this.getPhoto(id);

          if (!saved || !(saved.image instanceof Blob)) {
            reject(new Error("عکس در آرشیو قابل بازیابی نیست."));
            return;
          }

          resolve(id);
        } catch (error) {
          reject(error);
        }
      };

      tx.onerror = () =>
        reject(tx.error || new Error("خطای ذخیره عکس"));

      tx.onabort = () =>
        reject(tx.error || new Error("تراکنش ذخیره لغو شد."));
    });
  },

  async getPhoto(id) {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readonly");
      const request = tx.objectStore(this.storeName).get(Number(id));

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async deletePhoto(id) {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      tx.objectStore(this.storeName).delete(Number(id));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  },

  isValidImage(file) {
    return file instanceof Blob &&
      ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
      file.size > 0 &&
      file.size <= 10 * 1024 * 1024;
  },

  createObjectUrl(blob) {
    const url = URL.createObjectURL(blob);
    this.objectUrls.push(url);
    return url;
  },

  clearObjectUrls() {
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
  },

  clearPreviewUrls() {
    Object.values(this.previewUrls).forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.previewUrls = {};
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

  async render() {
    this.clearObjectUrls();

    try {
      const photos = await this.getAll();

      const cards = photos.length
        ? photos.map(photo => {
            if (!(photo.image instanceof Blob)) return "";

            return `
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
                    >حذف تصویر</button>
                  </div>
                </div>
              </article>
            `;
          }).join("")
        : `
          <div class="empty-state">
            <strong>هنوز عکسی ثبت نکرده‌ای</strong>
            <p>اولین عکس مسیر پیشرفتت رو اضافه کن.</p>
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

            <div id="photo-preview-box" style="display:none;margin:12px 0">
              <img
                id="photo-preview"
                alt="پیش‌نمایش عکس"
                style="width:100%;max-height:260px;object-fit:contain;border-radius:16px"
              />
            </div>

            <label>
              تاریخ ثبت
              <input
                type="date"
                name="date"
                value="${this.localDate()}"
                max="${this.localDate()}"
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
                  style="display:none;width:100%;max-height:300px;object-fit:contain;border-radius:14px"
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
                  style="display:none;width:100%;max-height:300px;object-fit:contain;border-radius:14px"
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
            >پاک‌کردن مقایسه</button>
          </form>
        </section>

        <div class="section-heading">
          <div>
            <span class="eyebrow">YOUR PHOTO JOURNEY</span>
            <h3>آرشیو تصاویر</h3>
          </div>
        </div>

        <div class="photo-gallery">${cards}</div>
      `;
    } catch (error) {
      console.error("Photos render error:", error);
      return `
        <div class="empty-state">
          <strong>بارگذاری آرشیو تصاویر ناموفق بود</strong>
          <p>${this.escape(error.message)}</p>
        </div>
      `;
    }
  },

  showPreview(input, imageId, key) {
    const file = input.files?.[0];
    const image = document.getElementById(imageId);

    if (!image) return;

    if (this.previewUrls[key]) {
      URL.revokeObjectURL(this.previewUrls[key]);
      delete this.previewUrls[key];
    }

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

    const url = URL.createObjectURL(file);
    this.previewUrls[key] = url;
    image.src = url;
    image.style.display = "block";
  },

  async handleSubmit(event) {
    if (event.target?.id !== "photo-form") return;

    event.preventDefault();

    const form = event.target;
    const file = form.elements.photo.files[0];
    const date = form.elements.date.value;
    const note = form.elements.note.value.trim();
    const button = document.getElementById("photo-save-btn");

    if (!this.isValidImage(file)) {
      alert("لطفاً یک عکس معتبر تا حجم ۱۰ مگابایت انتخاب کن.");
      return;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      alert("لطفاً تاریخ معتبر انتخاب کن.");
      return;
    }

    if (date > this.localDate()) {
      alert("تاریخ ثبت نمی‌تواند در آینده باشد.");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "در حال ذخیره...";
    }

    try {
      await this.addPhoto(file, date, note);

      alert("عکس ذخیره و بازیابی آن از آرشیو تأیید شد.");

      if (typeof showPage === "function") {
        showPage("photos");
      }
    } catch (error) {
      console.error("Photo save error:", error);
      alert("ذخیره عکس ناموفق بود: " + error.message);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "ذخیره تصویر در آرشیو";
      }
    }
  },

  async handleCompareSubmit(event) {
    if (event.target?.id !== "photo-compare-form") return;

    event.preventDefault();

    const form = event.target;
    const first = form.elements.first.files[0];
    const second = form.elements.second.files[0];

    if (!this.isValidImage(first) || !this.isValidImage(second)) {
      alert("لطفاً هر دو عکس معتبر تا حجم ۱۰ مگابایت انتخاب کن.");
      return;
    }

    this.showPreview(form.elements.first, "compare-image-one", "first");
    this.showPreview(form.elements.second, "compare-image-two", "second");
  },

  clearComparison() {
    ["first", "second"].forEach(key => {
      if (this.previewUrls[key]) {
        URL.revokeObjectURL(this.previewUrls[key]);
        delete this.previewUrls[key];
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
      alert("تصویر حذف شد.");

      if (typeof showPage === "function") {
        showPage("photos");
      }
    } catch (error) {
      console.error("Photo delete error:", error);
      alert("حذف تصویر انجام نشد: " + error.message);
    }
  }
};

document.addEventListener("submit", event => {
  if (event.target?.id === "photo-form") {
    PhotosManager.handleSubmit(event);
  }

  if (event.target?.id === "photo-compare-form") {
    PhotosManager.handleCompareSubmit(event);
  }
});

document.addEventListener("change", event => {
  if (event.target?.id === "photo-file") {
    PhotosManager.showPreview(
      event.target,
      "photo-preview",
      "upload"
    );
  }
});

document.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;

  const deleteButton = event.target.closest("[data-photo-delete]");

  if (deleteButton) {
    PhotosManager.handleDelete(deleteButton.dataset.photoDelete);
  }

  if (event.target.closest("#clear-photo-comparison")) {
    PhotosManager.clearComparison();
  }
});
