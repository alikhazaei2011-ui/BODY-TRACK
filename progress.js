const ProgressTracker = {
  getWorkouts() {
    return JSON.parse(localStorage.getItem("bodyTrackWorkouts") || "{}");
  },

  getMeasurements() {
    return JSON.parse(localStorage.getItem("bodyTrackMeasurements") || "[]");
  },

  render() {
    const workouts = this.getWorkouts();
    const measurements = this.getMeasurements();

    const exercises = Object.values(workouts).flat();
    const completed = exercises.filter(item => item.done).length;
    const total = exercises.length;

    const activeDays = Object.keys(workouts).filter(day =>
      workouts[day].length > 0
    ).length;

    const completion = total
      ? Math.round(completed / total * 100)
      : 0;

    const latest = measurements.length
      ? measurements[measurements.length - 1]
      : null;

    const first = measurements.length
      ? measurements[0]
      : null;

    const weightChange = latest && first &&
      latest.weight !== "" && first.weight !== ""
      ? Number(latest.weight) - Number(first.weight)
      : null;

    const weightRecords = measurements.filter(item =>
      item.weight !== "" && Number(item.weight) > 0
    );

    const chartWidth = 600;
    const chartHeight = 190;
    const padding = 25;

    let chart = "";

    if (weightRecords.length >= 2) {
      const values = weightRecords.map(item => Number(item.weight));
      const min = Math.min(...values) - 1;
      const max = Math.max(...values) + 1;
      const range = max - min || 1;

      const points = values.map((value, index) => {
        const x = padding +
          index * (chartWidth - padding * 2) /
          (values.length - 1);

        const y = chartHeight - padding -
          ((value - min) / range) *
          (chartHeight - padding * 2);

        return `${x},${y}`;
      });

      chart = `
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}"
          width="100%" role="img" aria-label="نمودار تغییرات وزن">

          ${[0, 1, 2, 3].map(index => {
            const y = padding + index *
              (chartHeight - padding * 2) / 3;

            return `
              <line x1="${padding}" y1="${y}"
                x2="${chartWidth - padding}" y2="${y}"
                stroke="#DED7CA" stroke-dasharray="4 5"/>
            `;
          }).join("")}

          <polyline
            points="${points.join(" ")}"
            fill="none"
            stroke="#B65B3D"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          ${points.map(point => {
            const [x, y] = point.split(",");
            return `
              <circle cx="${x}" cy="${y}" r="5"
                fill="#B65B3D" stroke="#FFFFFF" stroke-width="2"/>
            `;
          }).join("")}
        </svg>
      `;
    } else {
      chart = `
        <div class="empty-card">
          <div class="empty-icon">📊</div>
          <h3>اطلاعات کافی برای نمودار نداریم</h3>
          <p>برای مشاهده روند تغییر وزن، حداقل دو اندازه‌گیری ثبت کن.</p>
        </div>
      `;
    }

    return `
      <header class="topbar">
        <div>
          <span class="english topbar-caption">YOUR PERFORMANCE</span>
          <h2>تحلیل پیشرفت</h2>
        </div>
        <div class="avatar">B</div>
      </header>

      <section class="welcome-card">
        <div>
          <span class="english welcome-tag">YOUR PROGRESS</span>
          <h1>پیشرفتت رو<br>با چشم ببین.</h1>
          <p>هر قدم کوچیک، بخشی از مسیر بزرگ توئه.</p>
        </div>
        <div class="welcome-decoration english">03</div>
      </section>

      <section class="section-heading">
        <div>
          <span class="english section-caption">WORKOUT STATISTICS</span>
          <h2>آمار تمرین‌ها</h2>
        </div>
      </section>

      <section class="stats-grid">
        <article class="stat-card">
          <span class="stat-label">کل حرکات</span>
          <strong class="english">${total}</strong>
        </article>

        <article class="stat-card">
          <span class="stat-label">حرکات تکمیل‌شده</span>
          <strong class="english">${completed}</strong>
        </article>

        <article class="stat-card">
          <span class="stat-label">روزهای دارای برنامه</span>
          <strong class="english">${activeDays}</strong>
        </article>

        <article class="stat-card">
          <span class="stat-label">درصد تکمیل</span>
          <strong class="english">${completion}%</strong>
        </article>
      </section>

      <section class="section-heading">
        <div>
          <span class="english section-caption">WEIGHT HISTORY</span>
          <h2>نمودار تغییرات وزن</h2>
        </div>
      </section>

      <section class="stat-card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
          <span class="stat-label">روند ثبت وزن‌ها</span>
          <span class="english stat-note">${weightRecords.length} RECORDS</span>
        </div>

        <div style="margin-top:20px">
          ${chart}
        </div>

        ${weightChange !== null ? `
          <p class="stat-note" style="margin-top:12px">
            تغییر وزن از اولین ثبت:
            <strong class="english">
              ${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg
            </strong>
          </p>
        ` : ""}
      </section>

      <section class="section-heading">
        <div>
          <span class="english section-caption">BODY RECORDS</span>
          <h2>آخرین اندازه‌گیری</h2>
        </div>
      </section>

      ${latest ? `
        <section class="stats-grid">
          ${[
            ["وزن", latest.weight, "kg"],
            ["دور سینه", latest.chest, "cm"],
            ["دور کمر", latest.waist, "cm"],
            ["دور بازو", latest.arm, "cm"]
          ].map(([label, value, unit]) => `
            <article class="stat-card">
              <span class="stat-label">${label}</span>
              <strong class="english">
                ${value || "--"} <small>${unit}</small>
              </strong>
            </article>
          `).join("")}
        </section>
      ` : `
        <section class="empty-card">
          <h3>هنوز اطلاعاتی ثبت نشده</h3>
          <p>ابتدا اندازه‌گیری‌های بدنت رو ثبت کن.</p>
        </section>
      `}
    `;
  }
};
