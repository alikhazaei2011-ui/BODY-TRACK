
const ProgressTracker = {
  workoutKey: "bodyTrackWorkouts",
  measurementKey: "bodyTrackMeasurements",

  getWorkouts() {
    try {
      const data = JSON.parse(
        localStorage.getItem(this.workoutKey) || "{}"
      );

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {};
      }

      return data;
    } catch (error) {
      console.error("Workout data could not be loaded:", error);
      return {};
    }
  },

  getMeasurements() {
    try {
      const data = JSON.parse(
        localStorage.getItem(this.measurementKey) || "[]"
      );

      if (!Array.isArray(data)) return [];

      return data.filter(record =>
        record && typeof record === "object" && !Array.isArray(record)
      );
    } catch (error) {
      console.error("Measurement data could not be loaded:", error);
      return [];
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

  getValidNumber(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number) && number > 0
      ? number
      : null;
  },

  formatNumber(value, decimals = 1) {
    return Number(value).toFixed(decimals);
  },

  renderChart(weightRecords) {
    if (weightRecords.length < 2) {
      return `
        <div class="empty-state">
          <strong>اطلاعات کافی برای نمودار نداریم</strong>
          <p>
            برای مشاهده روند تغییر وزن، حداقل دو اندازه‌گیری
            با وزن معتبر ثبت کن.
          </p>
        </div>
      `;
    }

    const values = weightRecords.map(record =>
      this.getValidNumber(record.weight)
    );

    const chartWidth = 600;
    const chartHeight = 230;
    const padding = 35;

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const range = maxValue - minValue || 2;
    const chartMin = minValue - range * 0.2;
    const chartMax = maxValue + range * 0.2;
    const chartRange = chartMax - chartMin || 1;

    const points = values.map((value, index) => {
      const x = padding +
        index * (chartWidth - padding * 2) /
        (values.length - 1);

      const y = chartHeight - padding -
        ((value - chartMin) / chartRange) *
        (chartHeight - padding * 2);

      return { x, y, value };
    });

    const polylinePoints = points
      .map(point => `${point.x},${point.y}`)
      .join(" ");

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    const areaPoints = [
      `${firstPoint.x},${chartHeight - padding}`,
      ...points.map(point => `${point.x},${point.y}`),
      `${lastPoint.x},${chartHeight - padding}`
    ].join(" ");

    return `
      <div class="progress-chart">
        <svg
          viewBox="0 0 ${chartWidth} ${chartHeight}"
          width="100%"
          role="img"
          aria-label="نمودار تغییرات وزن"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="weightChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#39D98A" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#39D98A" stop-opacity="0.01"/>
            </linearGradient>
          </defs>

          ${[0, 1, 2, 3].map(index => {
            const y = padding + index *
              (chartHeight - padding * 2) / 3;

            return `
              <line
                x1="${padding}"
                y1="${y}"
                x2="${chartWidth - padding}"
                y2="${y}"
                stroke="currentColor"
                opacity="0.12"
                stroke-dasharray="5 6"
              />
            `;
          }).join("")}

          <polygon
            points="${areaPoints}"
            fill="url(#weightChartGradient)"
          />

          <polyline
            points="${polylinePoints}"
            fill="none"
            stroke="#39D98A"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          ${points.map(point => `
            <circle
              cx="${point.x}"
              cy="${point.y}"
              r="6"
              fill="#39D98A"
              stroke="#101A17"
              stroke-width="3"
            />
          `).join("")}
        </svg>

        <div class="chart-labels">
          <span>${this.escape(weightRecords[0].date || "اولین ثبت")}</span>
          <span>${this.escape(weightRecords[weightRecords.length - 1].date || "آخرین ثبت")}</span>
        </div>
      </div>
    `;
  },

  render() {
    const workouts = this.getWorkouts();
    const measurements = this.getMeasurements();

    const exercises = Object.values(workouts)
      .filter(Array.isArray)
      .flat()
      .filter(item => item && typeof item === "object");

    const total = exercises.length;

    // app.js وضعیت تمرین را با completed ذخیره می‌کند.
    const completed = exercises.filter(item =>
      item.completed === true
    ).length;

    const activeDays = Object.keys(workouts).filter(day =>
      Array.isArray(workouts[day]) && workouts[day].length > 0
    ).length;

    const completion = total
      ? Math.round((completed / total) * 100)
      : 0;

    const weightRecords = measurements.filter(record =>
      this.getValidNumber(record.weight) !== null
    );

    const firstWeight = weightRecords.length
      ? this.getValidNumber(weightRecords[0].weight)
      : null;

    const latestWeight = weightRecords.length
      ? this.getValidNumber(weightRecords[weightRecords.length - 1].weight)
      : null;

    const weightChange =
      firstWeight !== null && latestWeight !== null
        ? latestWeight - firstWeight
        : null;

    const latest = measurements.length
      ? measurements[measurements.length - 1]
      : null;

    const bodyFields = [
      ["weight", "وزن", "kg"],
      ["height", "قد", "cm"],
      ["chest", "دور سینه", "cm"],
      ["waist", "دور کمر", "cm"],
      ["arm", "دور بازو", "cm"],
      ["thigh", "دور ران", "cm"],
      ["shoulder", "دور شانه", "cm"]
    ];

    return `
      <section class="welcome-card">
        <div>
          <span class="eyebrow">YOUR PROGRESS</span>
          <h2>پیشرفتت رو با چشم ببین.</h2>
          <p>
            هر قدم کوچیک، بخشی از مسیر بزرگ توئه.
            عملکرد و تغییرات بدنت رو اینجا دنبال کن.
          </p>
        </div>

        <div class="welcome-decoration">03</div>
      </section>

      <div class="section-heading">
        <div>
          <span class="eyebrow">WORKOUT STATISTICS</span>
          <h3>آمار تمرین‌ها</h3>
        </div>
      </div>

      <div class="stats-grid">
        <article class="stat-card">
          <span>کل حرکات</span>
          <strong>${total}</strong>
          <small>حرکت ثبت‌شده</small>
        </article>

        <article class="stat-card">
          <span>حرکات تکمیل‌شده</span>
          <strong>${completed}</strong>
          <small>حرکت انجام‌شده</small>
        </article>

        <article class="stat-card">
          <span>روزهای دارای برنامه</span>
          <strong>${activeDays}</strong>
          <small>روز فعال</small>
        </article>

        <article class="stat-card">
          <span>درصد تکمیل</span>
          <strong>${completion}%</strong>
          <small>از کل تمرین‌ها</small>
        </article>
      </div>

      <div class="section-heading">
        <div>
          <span class="eyebrow">WEIGHT HISTORY</span>
          <h3>نمودار تغییرات وزن</h3>
        </div>
      </div>

      <section class="stat-card progress-weight-card">
        <div class="section-heading">
          <div>
            <span>روند ثبت وزن‌ها</span>
            <small class="muted-text">
              ${weightRecords.length} رکورد معتبر
            </small>
          </div>

          ${
            latestWeight !== null
              ? `
                <div class="weight-highlight">
                  <strong>${this.formatNumber(latestWeight)}</strong>
                  <small>کیلوگرم</small>
                </div>
              `
              : ""
          }
        </div>

        ${this.renderChart(weightRecords)}

        ${
          weightChange !== null
            ? `
              <div class="weight-change">
                <span>تغییر وزن از اولین ثبت</span>
                <strong>
                  ${weightChange > 0 ? "+" : ""}
                  ${this.formatNumber(weightChange)} kg
                </strong>
              </div>
            `
            : ""
        }
      </section>

      <div class="section-heading">
        <div>
          <span class="eyebrow">BODY RECORDS</span>
          <h3>آخرین اندازه‌گیری</h3>
        </div>
      </div>

      ${
        latest
          ? `
            <div class="stats-grid">
              ${bodyFields.map(([key, label, unit]) => {
                const value = latest[key];

                return `
                  <article class="stat-card">
                    <span>${label}</span>
                    <strong>
                      ${this.escape(value !== "" && value != null ? value : "--")}
                      <small>${unit}</small>
                    </strong>
                  </article>
                `;
              }).join("")}
            </div>

            ${
              latest.date
                ? `
                  <p class="muted-text">
                    تاریخ آخرین ثبت:
                    ${this.escape(latest.date)}
                  </p>
                `
                : ""
            }
          `
          : `
            <div class="empty-state">
              <strong>هنوز اطلاعاتی ثبت نشده</strong>
              <p>
                ابتدا از بخش اندازه‌های بدن،
                اطلاعاتت رو ثبت کن.
              </p>
            </div>
          `
      }

      <div class="section-heading">
        <div>
          <span class="eyebrow">MOTIVATION</span>
          <h3>ادامه بده!</h3>
        </div>
      </div>

      <div class="stat-card">
        <p>
          ${
            total === 0
              ? "اولین تمرینت رو ثبت کن و مسیر پیشرفتت رو شروع کن."
              : completion === 100
                ? "عالیه! تمام تمرین‌های ثبت‌شده‌ات رو تکمیل کردی."
                : `تا اینجا ${completed} تمرین از ${total} تمرین رو انجام دادی. به مسیرت ادامه بده!`
          }
        </p>
      </div>
    `;
  }
};
