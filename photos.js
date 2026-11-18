
const PhotosManager = {
  dbName: "BodyTrackPhotos",
  storeName: "photos",
  db: null,

  openDB() {
    return new Promise((resolve, reject) => {
      if (this.db) {
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

          store.createIndex("date", "date", {
            unique: false
          });
        }
      };

      request.onsuccess = event => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  async getAll() {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readonly");
      const request = transaction.objectStore(this.storeName).getAll();

      request.onsuccess = () => {
        resolve(request.result.sort((a, b) =>
          b.date.localeCompare(a.date)
        ));
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

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deletePhoto(id) {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");
      const request = transaction.objectStore(this.storeName).delete(Number(id));

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async render() {
    try {
      const photos = await this.getAll();

      const cards = photos.length
        ? photos.map(photo => `
          <article class="photo-card">
            <img
              src="${URL.createObjectURL(photo.image)}"
              alt="تصویر ثبت‌شده در ${photo.date}"
            />

            <div class="photo-card-info">
              <strong>${this.escape(photo.date)}</strong>
              <p>${this.escape(photo.note || "بدون توضیحات")}</p>

              <div class="photo-actions">
                <button
                  class="secondary-btn"
                  data-photo-compare="${photo.id}"
                >
                  مقایسه
                </button>

                <button
                  class="delete-btn"
                  data-photo-delete="${photo.id}"
                >
                  حذف
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
          <p>عکس‌های ماهانه‌ات رو ثبت کن تا مسیر تغییراتت رو دنبال کنی.</p>

          <form id="photo-form">
            <label>
              انتخاب تصویر
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                required
              />
            </label>

            <label>
              تاریخ ثبت
              <input
                type="date"
                name="date"
                value="${new Date().toLocaleDateString("en-CA")}"
                required
              />
            </label>

            <label>
              توضیحات
              <textarea
                name="note"
                placeholder="مثلاً ماه اول، شروع مسیر..."
              ></textarea>
            </label>

            <button type="submit" class="primary-btn">
              ذخیره تصویر
            </button>
          </form>
        </section>

        <section class="photo-comparison" id="photo-comparison">
          <h3>مقایسه تصاویر</h3>
          <p>برای مقایسه، دو عکس از گالری انتخاب کن.</p>

          <div class="comparison-grid">
            <div>
              <span>تصویر اول</span>
              <img id="compare-image-one" alt="تصویر اول" />
            </div>
            <div>
              <span>تصویر دوم</span>
              <img id="compare-image-two" alt="تصویر دوم" />
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
          ${cards}
        </div>
      `;
    } catch (error) {
      return `
        <div class="empty-state">
          <strong>گالری در دسترس نیست</strong>
          <p>مرورگر از ذخیره‌سازی تصاویر پشتیبانی نکرد یا دسترسی لازم را نداشت.</p>
        </div>
      `;
    }
  },

  selectedPhotos: [],

  async handleCompare(id) {
    const photos = await this.getAll();
    const selected = photos.find(photo => photo.id === Number(id));

    if (!selected) return;

    this.selectedPhotos = this.selectedPhotos.filter(
      photo => photo.id !== selected.id
    );

    this.selectedPhotos.push(selected);

    if (this.selectedPhotos.length > 2) {
      this.selectedPhotos.shift();
    }

    if (this.selectedPhotos.length === 2) {
      const first = this.selectedPhotos[0];
      const second = this.selectedPhotos[1];

      const firstImage = document.getElementById("compare-image-one");
      const secondImage = document.getElementById("compare-image-two");

      firstImage.src = URL.createObjectURL(first.image);
      secondImage.src = URL.createObjectURL(second.image);

      document.querySelector("#photo-comparison").scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    } else {
      alert("حالا یک تصویر دیگر هم برای مقایسه انتخاب کن.");
    }
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

  async handleSubmit(event) {
    if (event.target.id !== "photo-form") return;

    event.preventDefault();

    const form = event.target;
    const file = form.elements.photo.files[0];
    const date = form.elements.date.value;
    const note = form.elements.note.value.trim();

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("فقط تصاویر JPG، PNG و WEBP قابل قبول هستند.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.");
      return;
    }

    try {
      await this.addPhoto(file, date, note);
      alert("تصویر با موفقیت ذخیره شد.");
      showPage("photos");
    } catch (error) {
      alert("ذخیره تصویر انجام نشد. فضای ذخیره‌سازی مرورگر را بررسی کن.");
    }
  },

  async handleDelete(id) {
    if (!confirm("از حذف این تصویر مطمئنی؟")) return;

    try {
      await this.deletePhoto(id);
      this.selectedPhotos = this.selectedPhotos.filter(
        photo => photo.id !== Number(id)
      );
      showPage("photos");
    } catch (error) {
      alert("حذف تصویر انجام نشد.");
    }
  }
};

document.addEventListener("submit", event => {
  PhotosManager.handleSubmit(event);
});

document.addEventListener("click", event => {
  const compareButton = event.target.closest("[data-photo-compare]");

  if (compareButton) {
    PhotosManager.handleCompare(compareButton.dataset.photoCompare);
  }

  const deleteButton = event.target.closest("[data-photo-delete]");

  if (deleteButton) {
    PhotosManager.handleDelete(deleteButton.dataset.photoDelete);
  }
});

