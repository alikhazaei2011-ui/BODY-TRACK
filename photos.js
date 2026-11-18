
const PhotosManager = {
  dbName: "BodyTrackPhotos",
  storeName: "photos",
  db: null,
  objectUrls: [],
  previewUrls: {},
  pendingDeleteId: null,
  toastTimer: null,

  localDate() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
  },

  openDB() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("مرورگر از آرشیو تصاویر پشتیبانی نمی‌کند."));
        return;
      }

      if (this.db && this.db.objectStoreNames.contains(this.storeName)) {
        resolve(this.db);
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
      request.onblocked = () => {
        reject(new Error("دسترسی به آرشیو مسدود شده است."));
      };
    });
  },

  async getAll() {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(this.storeName, "readonly");
        const request = tx.objectStore(this.storeName).getAll();

        request.onsuccess = () => {
          const result = request.result || [];

          result.sort((a, b) =>
            String(b.date || "").localeCompare(String(a.date || ""))
          );

          resolve(result);
        };

        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  },

  async getPhoto(id) {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(this.storeName, "readonly");
        const request = tx.objectStore(this.storeName).get(Number(id));

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  },

  isValidImage(file) {
    return file instanceof Blob &&
      ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
      file.size > 0 &&
      file.size <= 10 * 1024 * 1024;
  },

  async addPhoto(file, date, note) {
    if (!this.isValidImage(file)) {
      throw new Error("فایل انتخاب‌شده تصویر معتبر نیست.");
    }

    // Store image bytes instead of Blob.
    const imageBytes = await file.arrayBuffer();

    if (!imageBytes || imageBytes.byteLength === 0) {
      throw new Error("خواندن اطلاعات تصویر ناموفق بود.");
    }

    const db = await this.openDB();

    const id = await new Promise((resolve, reject) => {
      let tx;
      let photoId = null;

      try {
        tx = db.transaction(this.storeName, "readwrite");

        const request = tx.objectStore(this.storeName).add({
          imageBytes,
          imageType: file.type,
          date,
          note,
          createdAt: new Date().toISOString()
        });

        request.onsuccess = () => {
          photoId = request.result;
        };

        tx.oncomplete = () => {
          if (photoId === null) {
            reject(new Error("شناسه تصویر ایجاد نشد."));
          } else {
            resolve(photoId);
          }
        };

        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("ذخیره لغو شد."));
      } catch (error) {
        reject(error);
      }
    });

    const saved = await this.getPhoto(id);

    if (
      !saved ||
      !(saved.imageBytes instanceof ArrayBuffer) ||
      saved.imageBytes.byteLength === 0
    ) {
      throw new Error("تصویر در آرشیو قابل بازیابی نیست.");
    }

    return id;
  },

  async getImageBlob(photo) {
    // Support older records stored as Blob.
    if (photo.image instanceof Blob) {
      return photo.image;
    }

    // Support new ArrayBuffer records.
    if (photo.imageBytes instanceof ArrayBuffer) {
      return new Blob([photo.imageBytes], {
        type: photo.imageType || "image/jpeg"
      });
    }

    // Support typed arrays if encountered.
    if (ArrayBuffer.isView(photo.imageBytes)) {
      return new Blob([photo.imageBytes], {
        type: photo.imageType || "image/jpeg"
      });
    }

    throw new Error("اطلاعات تصویر معتبر نیست.");
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

  notify(message, type = "success") {
    let toast = document.getElementById("body-photo-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "body-photo-toast";
      toast.className = "body-photo-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }

    toast.className = `body-photo-toast ${type}`;
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(this.toastTimer);

    this.toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  },

  showDeleteDialog(id) {
    this.pendingDeleteId = id;

    let modal = document.getElementById("photo-delete-modal");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "photo-delete-modal";
      modal.className = "photo-delete-modal";

      modal.innerHTML = `
        <div class="photo-delete-dialog">
          <div class="photo-delete-symbol">!</div>
          <h3>حذف تصویر</h3>
          <p>آیا از حذف این تصویر از آرشیو مطمئنی؟</p>
          <div class="photo-delete-actions">
            <button type="button" class="secondary-btn" id="photo-delete-cancel">
              انصراف
            </button>
            <button type="button" class="delete-btn" id="photo-delete-confirm">
              بله، حذف کن
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }

    modal.classList.add("active");
  },

  closeDeleteDialog() {
    const modal = document.getElementById("photo-delete-modal");

    if (modal) modal.classList.remove("active");

    this.pendingDeleteId = null;
  },

  async confirmDelete() {
    if (this.pendingDeleteId === null) return;

    const id = this.pendingDeleteId;
    this.closeDeleteDialog();

    try {
      await this.deletePhoto(id);
      this.notify("تصویر با موفقیت حذف شد.");

      if (typeof showPage === "function") {
        showPage("photos");
      }
    } catch (error) {
      console.error("Photo delete error:", error);
      this.notify("حذف تصویر انجام نشد.", "error");
    }
  },

  async deletePhoto(id) {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(this.storeName, "readwrite");
        tx.objectStore(this.storeName).delete(Number(id));

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  },

  async render() {
    this.clearObjectUrls();

    try {
      const photos = await this.getAll();

      const cardResults = await Promise.all(
        photos.map(async photo => {
          try {
            const blob = await this.getImageBlob(photo);
            const imageUrl = this.createObjectUrl(blob);

            return `
              <article class="photo-card">
                <img
                  src="${imageUrl}"
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
                      <span>×</span>
                      حذف تصویر
                    </button>
                  </div>
                </div>
              </article>
            `;
          } catch (error) {
            console.error("Photo display error:", photo.id, error);
            return "";
          }
        })
      );

      const cards = cardResults.filter(Boolean).join("");

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
          <p>هر مرحله از مسیر پیشرفتت رو ثبت کن.</p>

          <form id="photo-form">
            <label class="photo-picker" for="photo-file">
              <span class="photo-picker-icon">📷</span>
              <strong>انتخاب تصویر</strong>
              <small>برای انتخاب عکس از گوشی ضربه بزن</small>
              <span class="photo-picker-button">انتخاب از گالری</span>

              <input
                id="photo-file"
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                required
              />
            </label>

            <div id="photo-preview-box" class="photo-preview-box" hidden>
              <img id="photo-preview" alt="پیش‌نمایش تصویر" />
              <span>پیش‌نمایش تصویر انتخاب‌شده</span>
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
          <p>دو تصویر از مراحل مختلف پیشرفتت انتخاب کن.</p>

          <form id="photo-compare-form">
            <div class="comparison-grid">
              <label class="comparison-upload" for="compare-first">
                <span class="comparison-number">01</span>
                <span class="comparison-icon">📷</span>
                <strong>تصویر اول</strong>
                <small>مثلاً قبل از شروع</small>
                <span class="comparison-select-button">انتخاب تصویر اول</span>

                <input
                  id="compare-first"
                  type="file"
                  name="first"
                  accept="image/jpeg,image/png,image/webp"
                  required
                />

                <img id="compare-image-one" alt="پیش‌نمایش تصویر اول" hidden />
              </label>

              <label class="comparison-upload" for="compare-second">
                <span class="comparison-number">02</span>
                <span class="comparison-icon">📷</span>
                <strong>تصویر دوم</strong>
                <small>مثلاً وضعیت فعلی</small>
                <span class="comparison-select-button">انتخاب تصویر دوم</span>

                <input
                  id="compare-second"
                  type="file"
                  name="second"
                  accept="image/jpeg,image/png,image/webp"
                  required
                />

                <img id="compare-image-two" alt="پیش‌نمایش تصویر دوم" hidden />
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

          <div id="photo-comparison-result" class="photo-comparison-result" hidden>
            <h3>نتیجه مقایسه</h3>
            <div class="comparison-result-grid">
              <div>
                <span>تصویر اول</span>
                <img id="comparison-result-one" alt="تصویر اول برای مقایسه" />
              </div>
              <div>
                <span>تصویر دوم</span>
                <img id="comparison-result-two" alt="تصویر دوم برای مقایسه" />
              </div>
            </div>
          </div>
        </section>

        <div class="section-heading">
          <div>
            <span class="eyebrow">YOUR PHOTO JOURNEY</span>
            <h3>آرشیو تصاویر</h3>
          </div>
        </div>

        <div class="photo-gallery">
          ${cards || `
            <div class="empty-state">
              <strong>هنوز تصویری ثبت نکرده‌ای</strong>
              <p>اولین عکس مسیر پیشرفتت رو به آرشیو اضافه کن.</p>
            </div>
          `}
        </div>
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
      image.hidden = true;
      return;
    }

    if (!this.isValidImage(file)) {
      this.notify(
        "فقط عکس JPG، PNG یا WEBP تا حجم ۱۰ مگابایت مجاز است.",
        "error"
      );

      input.value = "";
      image.removeAttribute("src");
      image.hidden = true;
      return;
    }

    const url = URL.createObjectURL(file);
    this.previewUrls[key] = url;
    image.src = url;
    image.hidden = false;
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
      this.notify("لطفاً یک تصویر معتبر انتخاب کن.", "error");
      return;
    }

    if (
      !date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      date > this.localDate()
    ) {
      this.notify("تاریخ انتخاب‌شده معتبر نیست.", "error");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "در حال ذخیره...";
    }

    try {
      await this.addPhoto(file, date, note);

      this.clearPreviewUrls();
      this.notify("تصویر با موفقیت در آرشیو ذخیره شد.");

      if (typeof showPage === "function") {
        showPage("photos");
      }
    } catch (error) {
      console.error("Photo save error:", error);

      this.notify(
        "ذخیره تصویر ناموفق بود: " + error.message,
        "error"
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "ذخیره تصویر در آرشیو";
      }
    }
  },

  handleCompareSubmit(event) {
    if (event.target?.id !== "photo-compare-form") return;

    event.preventDefault();

    const form = event.target;
    const first = form.elements.first.files[0];
    const second = form.elements.second.files[0];

    if (!this.isValidImage(first) || !this.isValidImage(second)) {
      this.notify("لطفاً هر دو تصویر معتبر را انتخاب کن.", "error");
      return;
    }

    this.showPreview(form.elements.first, "compare-image-one", "first");
    this.showPreview(form.elements.second, "compare-image-two", "second");

    const result = document.getElementById("photo-comparison-result");
    const resultOne = document.getElementById("comparison-result-one");
    const resultTwo = document.getElementById("comparison-result-two");

    if (result && resultOne && resultTwo) {
      resultOne.src = this.previewUrls.first;
      resultTwo.src = this.previewUrls.second;
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    this.notify("مقایسه تصاویر آماده شد.");
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

    [
      "compare-image-one",
      "compare-image-two",
      "comparison-result-one",
      "comparison-result-two"
    ].forEach(id => {
      const image = document.getElementById(id);

      if (image) {
        image.removeAttribute("src");
        image.hidden = id.startsWith("compare-");
      }
    });

    const result = document.getElementById("photo-comparison-result");
    if (result) result.hidden = true;

    this.notify("مقایسه پاک شد.");
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
  const target = event.target;

  if (target?.id === "photo-file") {
    PhotosManager.showPreview(target, "photo-preview", "upload");

    const box = document.getElementById("photo-preview-box");

    if (box) {
      box.hidden = !target.files?.length;
    }
  }

  if (target?.id === "compare-first") {
    PhotosManager.showPreview(
      target,
      "compare-image-one",
      "first"
    );
  }

  if (target?.id === "compare-second") {
    PhotosManager.showPreview(
      target,
      "compare-image-two",
      "second"
    );
  }
});

document.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;

  const deleteButton = event.target.closest("[data-photo-delete]");

  if (deleteButton) {
    PhotosManager.showDeleteDialog(deleteButton.dataset.photoDelete);
  }

  if (event.target.closest("#clear-photo-comparison")) {
    PhotosManager.clearComparison();
  }

  if (event.target.closest("#photo-delete-cancel")) {
    PhotosManager.closeDeleteDialog();
  }

  if (event.target.closest("#photo-delete-confirm")) {
    PhotosManager.confirmDelete();
  }

  if (event.target.id === "photo-delete-modal") {
    PhotosManager.closeDeleteDialog();
  }
});
