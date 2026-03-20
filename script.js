/**
 * EX0DUS-CALISTHENICS
 * Core architecture:
 * - data model: state object persisted in localStorage
 * - logic: plan recommendation, XP/leveling, streak, quests, shop effects
 * - ui: rendering functions for dashboard sections
 */

const STORAGE_KEY = "exodus_calisthenics_v1";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const PLAN_TEMPLATES = {
  Starter: {
    baseXp: 24,
    days: [
      [["Pushups", 8], ["Bodyweight Squats", 16], ["Plank (sec)", 30]],
      [["Incline Pushups", 10], ["Lunges (each leg)", 8], ["Dead Hang (sec)", 20]],
      [["Restorative Mobility", 12], ["Light Core Twists", 20], ["Walk (mins)", 20]],
      [["Pushups", 10], ["Assisted Pullups", 4], ["Glute Bridges", 16]],
      [["Dips (bench)", 8], ["Squats", 18], ["Plank (sec)", 35]],
      [["Jumping Jacks", 30], ["Mountain Climbers", 20], ["Calf Raises", 20]],
      [["Recovery Stretch", 15], ["Breathing Drill", 5], ["Walk (mins)", 25]]
    ]
  },
  Intermediate: {
    baseXp: 34,
    days: [
      [["Pushups", 18], ["Pullups", 5], ["Squats", 25], ["Plank (sec)", 45]],
      [["Dips", 10], ["Chin-ups", 5], ["Lunges (each leg)", 12], ["Hollow Hold (sec)", 30]],
      [["Active Recovery (mins)", 25], ["Core Raises", 20], ["Dead Hang (sec)", 35]],
      [["Decline Pushups", 12], ["Pullups", 6], ["Jump Squats", 15], ["Side Plank (sec)", 25]],
      [["Diamond Pushups", 10], ["Dips", 12], ["Bulgarian Split Squats", 10], ["Leg Raises", 12]],
      [["Burpees", 12], ["Pullups", 4], ["Mountain Climbers", 40], ["Plank (sec)", 50]],
      [["Mobility Flow (mins)", 20], ["Scapular Pulls", 12], ["Walk/Jog (mins)", 25]]
    ]
  },
  Advanced: {
    baseXp: 48,
    days: [
      [["Pushups", 30], ["Pullups", 10], ["Dips", 18], ["Pistol Squat (assisted)", 8]],
      [["Archer Pushups", 16], ["Wide Pullups", 8], ["Jump Squats", 22], ["L-Sit (sec)", 25]],
      [["Core Circuit Rounds", 4], ["Hanging Leg Raises", 14], ["Dead Hang (sec)", 60]],
      [["Explosive Pushups", 18], ["Weighted/Slow Pullups", 8], ["Nordic Negatives", 8], ["Plank (sec)", 70]],
      [["Ring/Bar Dips", 20], ["Chin-ups", 10], ["Bulgarian Split Squats", 15], ["Dragon Flag Negatives", 6]],
      [["Burpees", 20], ["Pullups", 12], ["High Knees (sec)", 80], ["Lunges (each leg)", 18]],
      [["Mobility + Recovery (mins)", 30], ["Hollow Hold (sec)", 70], ["Breathing Drill", 8]]
    ]
  }
};

const SHOP_ITEMS = [
  { id: "x2xp", name: "XP Multiplier x2 (24h)", cost: 100, description: "Double XP gains for one day.", type: "xpMultiplier" },
  { id: "freeze", name: "Freeze Streak +1", cost: 80, description: "Protect your streak for one missed day.", type: "freeze" },
  { id: "skin", name: "UI Pulse Customization", cost: 60, description: "Unlock animated UI pulse accent.", type: "themeUnlock" }
];

const MUSCLE_GROUPS = ["chest", "arms", "back", "core", "legs", "shoulders"];
const RANK_TIERS = [
  { name: "Bronze", min: 0, color: "#8b5a2b" },
  { name: "Silver", min: 200, color: "#b0bec5" },
  { name: "Gold", min: 420, color: "#f2c14e" },
  { name: "Platinum", min: 700, color: "#67d5c6" },
  { name: "Diamond", min: 980, color: "#64b5ff" },
  { name: "Exodus", min: 1300, color: "#ff4d6d" }
];

const MUSCLE_KEYWORDS = [
  { key: "push", gains: { chest: 8, arms: 5, shoulders: 4, core: 2 } },
  { key: "dip", gains: { chest: 7, arms: 6, shoulders: 4 } },
  { key: "pull", gains: { back: 8, arms: 6, shoulders: 4, core: 2 } },
  { key: "chin", gains: { back: 7, arms: 7, core: 2 } },
  { key: "squat", gains: { legs: 9, core: 3 } },
  { key: "lunge", gains: { legs: 8, core: 3 } },
  { key: "plank", gains: { core: 9, shoulders: 2 } },
  { key: "raise", gains: { core: 7, legs: 3 } },
  { key: "burpee", gains: { chest: 4, arms: 4, legs: 5, core: 4 } },
  { key: "hang", gains: { back: 5, arms: 5, shoulders: 4 } },
  { key: "mobility", gains: { shoulders: 3, core: 3, legs: 3 } }
];

const state = {
  profile: null,
  metrics: { xp: 0, level: 1, coins: 0, streak: 0, freezeStreaks: 0, lastActiveDate: null },
  plan: null,
  progress: {},
  quests: [],
  muscles: { chest: 0, arms: 0, back: 0, core: 0, legs: 0, shoulders: 0 },
  shop: { xpMultiplierUntil: null, pulseTheme: false },
  dayIndex: 0,
  createdAt: null
};

const el = {
  onboarding: document.getElementById("onboarding"),
  onboardingForm: document.getElementById("onboardingForm"),
  dashboard: document.getElementById("dashboard"),
  planRanking: document.getElementById("planRanking"),
  welcomeText: document.getElementById("welcomeText"),
  planSummary: document.getElementById("planSummary"),
  levelValue: document.getElementById("levelValue"),
  xpValue: document.getElementById("xpValue"),
  coinsValue: document.getElementById("coinsValue"),
  streakValue: document.getElementById("streakValue"),
  nextLevelText: document.getElementById("nextLevelText"),
  xpBar: document.getElementById("xpBar"),
  exerciseList: document.getElementById("exerciseList"),
  questList: document.getElementById("questList"),
  shopList: document.getElementById("shopList"),
  muscleMap: document.getElementById("muscleMap"),
  muscleLegend: document.getElementById("muscleLegend"),
  badgeRow: document.getElementById("badgeRow"),
  currentDayLabel: document.getElementById("currentDayLabel"),
  updateStatsForm: document.getElementById("updateStatsForm"),
  newDayBtn: document.getElementById("newDayBtn"),
  rerollQuestBtn: document.getElementById("rerollQuestBtn"),
  toastStack: document.getElementById("toastStack"),
  levelUpModal: document.getElementById("levelUpModal"),
  levelUpText: document.getElementById("levelUpText"),
  closeLevelModal: document.getElementById("closeLevelModal")
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    Object.assign(state, JSON.parse(raw));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  if (!state.muscles) {
    state.muscles = { chest: 0, arms: 0, back: 0, core: 0, legs: 0, shoulders: 0 };
  }
  if (state.profile && typeof state.profile.weight === "number" && typeof state.profile.height === "number") {
    state.profile = {
      weightLbs: Number((state.profile.weight * 2.20462262).toFixed(1)),
      heightFeet: Number((state.profile.height / 30.48).toFixed(2)),
      maxPushups: state.profile.maxPushups,
      maxPullups: state.profile.maxPullups
    };
  }
}

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dayDiff(from, to) {
  const ms = new Date(to) - new Date(from);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function calculatePlanRanking(profile) {
  const metric = toMetric(profile);
  const bmi = metric.weightKg / ((metric.heightCm / 100) ** 2);
  const bmi = profile.weight / ((profile.height / 100) ** 2);
  const strength = profile.maxPushups * 1.1 + profile.maxPullups * 2.6;

  const scores = {
    Starter: Math.max(0, 80 - strength + Math.abs(23 - bmi) * 5),
    Intermediate: Math.max(0, 100 - Math.abs(55 - strength) - Math.abs(23 - bmi) * 2),
    Advanced: Math.max(0, strength + (24 - Math.abs(24 - bmi)) * 2)
  };

  return Object.entries(scores)
    .map(([name, score]) => ({ name, score: Math.round(score) }))
    .sort((a, b) => b.score - a.score);
}

function toMetric(profile) {
  return {
    weightKg: profile.weightLbs * 0.45359237,
    heightCm: profile.heightFeet * 30.48
  };
}

function generatePlan(planName) {
  return {
    name: planName,
    week: PLAN_TEMPLATES[planName].days.map((day) =>
      day.map(([name, target]) => ({ id: crypto.randomUUID(), name, target, completed: false }))
    )
  };
}

function buildQuests() {
  const qPool = [
    () => ({ text: `Complete ${Math.max(10, state.profile.maxPushups)} pushups today`, rewardXp: 40, rewardCoins: 20, type: "pushups" }),
    () => ({ text: `Do ${Math.max(3, state.profile.maxPullups + 1)} pullups in total`, rewardXp: 45, rewardCoins: 24, type: "pullups" }),
    () => ({ text: "Finish every exercise listed for today", rewardXp: 60, rewardCoins: 30, type: "perfect_day" }),
    () => ({ text: "Maintain your streak without skipping", rewardXp: 55, rewardCoins: 16, type: "streak" }),
    () => ({ text: "Add one bonus core set", rewardXp: 30, rewardCoins: 15, type: "core" })
  ];

  state.quests = Array.from({ length: 3 }, (_, idx) => ({
    id: `quest-${idx}-${Date.now()}`,
    completed: false,
    ...qPool[Math.floor(Math.random() * qPool.length)]()
  }));
}

function xpForExercise() {
  const base = PLAN_TEMPLATES[state.plan.name].baseXp;
  const multiplier = state.shop.xpMultiplierUntil && new Date(state.shop.xpMultiplierUntil) > new Date() ? 2 : 1;
  return base * multiplier;
}

function addXp(amount) {
  let xp = state.metrics.xp + amount;
  let level = state.metrics.level;
  while (xp >= xpNeeded(level)) {
    xp -= xpNeeded(level);
    level += 1;
    showLevelUp(level);
    state.metrics.coins += 40 + level * 4;
  }
  state.metrics.level = level;
  state.metrics.xp = xp;
}

function xpNeeded(level) {
  return 100 + (level - 1) * 35;
}

function markExercise(dayIdx, exerciseId, completed) {
  const day = state.plan.week[dayIdx];
  const ex = day.find((entry) => entry.id === exerciseId);
  if (!ex || ex.completed === completed) return;

  ex.completed = completed;

  if (completed) {
    addXp(xpForExercise());
    addMuscleProgress(ex.name, ex.target);
    state.metrics.coins += 8;
    showToast(`+${xpForExercise()} XP • +8 coins`);
    animateBurst(el.xpBar);
  }

  updateDailyProgress();
  saveState();
  render();
}

function addMuscleProgress(exerciseName, target) {
  const lower = exerciseName.toLowerCase();
  const reps = Number(target) || 10;
  const intensity = Math.max(1, Math.min(2.4, reps / 20));
  let matched = false;

  MUSCLE_KEYWORDS.forEach((rule) => {
    if (!lower.includes(rule.key)) return;
    matched = true;
    Object.entries(rule.gains).forEach(([muscle, gain]) => {
      state.muscles[muscle] += Math.round(gain * intensity);
    });
  });

  if (!matched) {
    state.muscles.core += Math.round(3 * intensity);
    state.muscles.legs += Math.round(2 * intensity);
  }
}

function rankForPoints(points) {
  let tier = RANK_TIERS[0];
  for (const entry of RANK_TIERS) {
    if (points >= entry.min) tier = entry;
  }
  return tier;
}

function completeQuest(questId, completed) {
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest || quest.completed === completed) return;
  quest.completed = completed;

  if (completed) {
    addXp(quest.rewardXp);
    state.metrics.coins += quest.rewardCoins;
    showToast(`Quest complete: +${quest.rewardXp} XP / +${quest.rewardCoins} coins`);
    animateBurst(el.coinsValue);
  }

  saveState();
  render();
}

function updateDailyProgress() {
  const todayKey = formatDate();
  const dayComplete = state.plan.week[state.dayIndex].every((e) => e.completed);

  state.progress[todayKey] = { dayIndex: state.dayIndex, complete: dayComplete };

  if (dayComplete) {
    const now = formatDate();
    if (state.metrics.lastActiveDate !== now) {
      const diff = state.metrics.lastActiveDate ? dayDiff(state.metrics.lastActiveDate, now) : 1;
      if (diff === 1 || state.metrics.lastActiveDate === null) {
        state.metrics.streak += 1;
      } else if (diff > 1) {
        if (state.metrics.freezeStreaks > 0) {
          state.metrics.freezeStreaks -= 1;
          showToast("Freeze streak consumed. Streak protected.");
        } else {
          state.metrics.streak = 1;
        }
      }
      state.metrics.lastActiveDate = now;
    }
  }
}

function nextDay() {
  state.dayIndex = (state.dayIndex + 1) % 7;
  state.plan.week[state.dayIndex].forEach((e) => (e.completed = false));
  buildQuests();
  saveState();
  render();
}

function rerollQuest() {
  if (state.metrics.coins < 20) {
    showToast("Not enough coins to reroll quests.");
    return;
  }
  state.metrics.coins -= 20;
  buildQuests();
  saveState();
  showToast("New quests generated.");
  render();
}

function purchase(itemId) {
  const item = SHOP_ITEMS.find((x) => x.id === itemId);
  if (!item || state.metrics.coins < item.cost) {
    showToast("Not enough coins.");
    return;
  }
  state.metrics.coins -= item.cost;

  if (item.type === "xpMultiplier") {
    const until = new Date();
    until.setHours(until.getHours() + 24);
    state.shop.xpMultiplierUntil = until.toISOString();
  }
  if (item.type === "freeze") state.metrics.freezeStreaks += 1;
  if (item.type === "themeUnlock") state.shop.pulseTheme = true;

  saveState();
  showToast(`Purchased: ${item.name}`);
  render();
}

function populateUpdateStatsForm() {
  const p = state.profile;
  el.updateStatsForm.innerHTML = `
    <label>Weight (lbs)<input name="weightLbs" type="number" step="0.1" value="${p.weightLbs}" required /></label>
    <label>Height (ft)<input name="heightFeet" type="number" step="0.1" value="${p.heightFeet}" required /></label>
    <label>Weight (kg)<input name="weight" type="number" step="0.1" value="${p.weight}" required /></label>
    <label>Height (cm)<input name="height" type="number" step="0.1" value="${p.height}" required /></label>
    <label>Max Pushups<input name="maxPushups" type="number" value="${p.maxPushups}" required /></label>
    <label>Max Pullups<input name="maxPullups" type="number" value="${p.maxPullups}" required /></label>
    <button class="btn" type="submit">Recalculate</button>
  `;

  el.updateStatsForm.onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(el.updateStatsForm);
    state.profile = {
      weightLbs: Number(form.get("weightLbs")),
      heightFeet: Number(form.get("heightFeet")),
      weight: Number(form.get("weight")),
      height: Number(form.get("height")),
      maxPushups: Number(form.get("maxPushups")),
      maxPullups: Number(form.get("maxPullups"))
    };

    const ranking = calculatePlanRanking(state.profile);
    const recommended = ranking[0].name;
    state.plan = generatePlan(recommended);
    state.dayIndex = 0;
    state.progress = {};
    buildQuests();
    showToast(`Plan updated: ${recommended}`);
    saveState();
    renderRanking(ranking);
    render();
  };
}

function renderRanking(ranking) {
  el.planRanking.classList.remove("hidden");
  el.planRanking.innerHTML = ranking
    .map((entry, idx) => {
      const icon = idx === 0 ? "◉" : idx === 1 ? "◎" : "○";
      return `<div class="ranking-row"><span>${icon} ${entry.name}</span><strong>${entry.score}</strong></div>`;
    })
    .join("");
}

function renderBadges() {
  const topMuscle = MUSCLE_GROUPS
    .map((muscle) => ({ muscle, points: state.muscles[muscle] }))
    .sort((a, b) => b.points - a.points)[0];
  const topTier = rankForPoints(topMuscle.points);

  const badges = [
    `Plan: ${state.plan.name}`,
    `Freeze: ${state.metrics.freezeStreaks}`,
    state.shop.xpMultiplierUntil && new Date(state.shop.xpMultiplierUntil) > new Date() ? "x2 XP Active" : "x1 XP",
    state.metrics.streak >= 7 ? "7-Day Streak" : "Streak Building",
    `Peak: ${topMuscle.muscle} ${topTier.name}`
    state.metrics.streak >= 7 ? "7-Day Streak" : "Streak Building"
  ];

  el.badgeRow.innerHTML = badges.map((b) => `<span class="badge">${b}</span>`).join("");
}

function renderMuscleSystem() {
  const parts = el.muscleMap.querySelectorAll("[data-muscle]");
  parts.forEach((node) => {
    const muscle = node.dataset.muscle;
    if (!state.muscles[muscle]) return;
    const tier = rankForPoints(state.muscles[muscle]);
    node.style.fill = tier.color;
    node.style.filter = `drop-shadow(0 0 10px ${tier.color}55)`;
  });

  const ordered = MUSCLE_GROUPS
    .map((muscle) => {
      const points = state.muscles[muscle];
      return { muscle, points, tier: rankForPoints(points) };
    })
    .sort((a, b) => b.points - a.points);

  el.muscleLegend.innerHTML = ordered
    .map(({ muscle, points, tier }) => {
      return `
        <div class="muscle-row">
          <div class="muscle-left">
            <span class="dot" style="background:${tier.color}"></span>
            <strong>${muscle.toUpperCase()}</strong>
          </div>
          <span class="tier">${tier.name} • ${points}</span>
        </div>
      `;
    })
    .join("");
}

function renderExercises() {
  const exercises = state.plan.week[state.dayIndex];
  el.currentDayLabel.textContent = `${DAYS[state.dayIndex]} Routine • ${exercises.length} objectives`;
  el.exerciseList.innerHTML = exercises
    .map(
      (ex) => `
      <li class="check-item ${ex.completed ? "done" : ""}">
        <label>
          <span>${ex.name} — <span class="muted">${ex.target}</span></span>
          <input type="checkbox" data-exid="${ex.id}" ${ex.completed ? "checked" : ""} />
        </label>
      </li>`
    )
    .join("");

  el.exerciseList.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      markExercise(state.dayIndex, event.target.dataset.exid, event.target.checked);
    });
  });
}

function renderQuests() {
  el.questList.innerHTML = state.quests
    .map(
      (quest) => `
      <li class="quest-item ${quest.completed ? "done" : ""}">
        <label>
          <span>
            ${quest.text}
            <div class="quest-meta">+${quest.rewardXp} XP • +${quest.rewardCoins} coins</div>
          </span>
          <input type="checkbox" data-questid="${quest.id}" ${quest.completed ? "checked" : ""} />
        </label>
      </li>`
    )
    .join("");

  el.questList.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      completeQuest(event.target.dataset.questid, event.target.checked);
    });
  });
}

function renderShop() {
  el.shopList.innerHTML = SHOP_ITEMS.map((item) => {
    return `
      <div class="shop-item">
        <h4>${item.name}</h4>
        <p class="muted">${item.description}</p>
        <button class="btn" data-buy="${item.id}">Buy • ${item.cost} coins</button>
      </div>
    `;
  }).join("");

  el.shopList.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", () => purchase(btn.dataset.buy));
  });
}

function renderMetrics() {
  const xpNeed = xpNeeded(state.metrics.level);
  const progressPct = Math.min(100, (state.metrics.xp / xpNeed) * 100);

  el.welcomeText.textContent = `Welcome, Level ${state.metrics.level} Athlete`;
  el.planSummary.textContent = `Recommended plan: ${state.plan.name}`;
  el.levelValue.textContent = state.metrics.level;
  el.xpValue.textContent = state.metrics.xp;
  el.coinsValue.textContent = state.metrics.coins;
  el.streakValue.textContent = state.metrics.streak;
  el.nextLevelText.textContent = `${state.metrics.xp} / ${xpNeed} XP`;
  el.xpBar.style.width = `${progressPct}%`;

  if (state.shop.pulseTheme) {
    document.body.classList.add("burst");
    setTimeout(() => document.body.classList.remove("burst"), 500);
  }
}

function render() {
  if (!state.profile) {
    el.onboarding.classList.remove("hidden");
    el.dashboard.classList.add("hidden");
    return;
  }

  el.onboarding.classList.add("hidden");
  el.dashboard.classList.remove("hidden");

  renderMetrics();
  renderExercises();
  renderQuests();
  renderShop();
  renderBadges();
  renderMuscleSystem();
  populateUpdateStatsForm();
}

function showLevelUp(level) {
  el.levelUpText.textContent = `Level ${level} unlocked`;
  el.levelUpModal.classList.remove("hidden");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  el.toastStack.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function animateBurst(node) {
  node.classList.add("burst");
  setTimeout(() => node.classList.remove("burst"), 400);
}

function bootstrap() {
  loadState();

  el.onboardingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(el.onboardingForm);
    state.profile = {
      weightLbs: Number(form.get("weightLbs")),
      heightFeet: Number(form.get("heightFeet")),
      weight: Number(form.get("weight")),
      height: Number(form.get("height")),
      maxPushups: Number(form.get("maxPushups")),
      maxPullups: Number(form.get("maxPullups"))
    };
    const ranking = calculatePlanRanking(state.profile);
    const chosenPlan = ranking[0].name;
    state.plan = generatePlan(chosenPlan);
    state.createdAt = formatDate();
    buildQuests();
    renderRanking(ranking);
    showToast(`Plan selected: ${chosenPlan}`);
    saveState();
    render();
  });

  el.newDayBtn.addEventListener("click", nextDay);
  el.rerollQuestBtn.addEventListener("click", rerollQuest);
  el.closeLevelModal.addEventListener("click", () => el.levelUpModal.classList.add("hidden"));

  // Notifications / reminders (optional):
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => null);
  }

  render();
}

bootstrap();
