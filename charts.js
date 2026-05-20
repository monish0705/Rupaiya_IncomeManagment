/**
 * RUPAIYA — Smart Daily Expense Tracker
 * charts.js — All Chart.js chart builders
 */

'use strict';

/* ═══════════════════════════════════
   SHARED CHART DEFAULTS
═══════════════════════════════════ */

// Detect theme-aware colors
function chartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    tickColor: isDark ? '#4a5578' : '#9aa3c4',
    tooltipBg: isDark ? '#111520' : '#ffffff',
    tooltipText: isDark ? '#f0f2ff' : '#0f1432',
    tooltipBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
  };
}

Chart.defaults.font.family = "'DM Sans', sans-serif";

// Active chart instances keyed by canvas ID
const charts = {};

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

/* ═══════════════════════════════════
   CATEGORY COLORS
═══════════════════════════════════ */

const CAT_COLORS = {
  Food: '#f97316',
  Shopping: '#a78bfa',
  Entertainment: '#ec4899',
  Travel: '#3b82f6',
  Bills: '#fbbf24',
  Education: '#06b6d4',
  Health: '#10b981',
  Others: '#6b7280',
};

/* ═══════════════════════════════════
   DASHBOARD CHARTS
═══════════════════════════════════ */

function buildDashboardCharts(allExpenses, thisMonth) {
  buildWeeklyChart(allExpenses);
  buildCategoryPieChart(allExpenses, thisMonth);
}

/* Weekly bar chart — last 7 days */
function buildWeeklyChart(allExpenses) {
  const colors = chartColors();
  destroyChart('weeklyChart');

  const canvas = document.getElementById('weeklyChart');
  if (!canvas) return;

  // Build last 7 days
  const labels = [];
  const data = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayTotal = allExpenses
      .filter(e => e.date === key)
      .reduce((s, e) => s + e.amount, 0);
    labels.push(label);
    data.push(dayTotal);
  }

  const budget = DB.budget.get();
  const dailyLimit = budget.daily_limit || 2000;

  // Color bars: red if over limit, amber if >80%, green otherwise
  const barColors = data.map(v =>
    v > dailyLimit ? 'rgba(255,92,122,0.75)' :
    v > dailyLimit * 0.8 ? 'rgba(251,191,36,0.75)' :
    'rgba(102,126,234,0.65)'
  );
  const barBorders = data.map(v =>
    v > dailyLimit ? '#ff5c7a' :
    v > dailyLimit * 0.8 ? '#fbbf24' :
    '#667eea'
  );

  charts['weeklyChart'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Spending (₹)',
        data,
        backgroundColor: barColors,
        borderColor: barBorders,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }, {
        label: 'Daily Limit',
        data: new Array(7).fill(dailyLimit),
        type: 'line',
        borderColor: 'rgba(255,92,122,0.4)',
        borderWidth: 1.5,
        borderDash: [5, 4],
        pointRadius: 0,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ₹${Math.round(ctx.raw).toLocaleString('en-IN')}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.tickColor, font: { size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            font: { size: 11 },
            callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v),
          },
          border: { display: false },
        },
      },
    },
  });
}

/* Category doughnut — this month */
function buildCategoryPieChart(allExpenses, thisMonth) {
  const colors = chartColors();
  destroyChart('categoryChart');

  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;

  const monthExp = allExpenses.filter(e => e.date && e.date.startsWith(thisMonth));
  const catTotals = {};
  monthExp.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });

  const entries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    canvas.getContext('2d').fillStyle = colors.tickColor;
    return;
  }

  const labels = entries.map(([k]) => k);
  const data = entries.map(([, v]) => v);
  const bgColors = labels.map(l => (CAT_COLORS[l] || '#6b7280') + 'cc');
  const borderColors = labels.map(l => CAT_COLORS[l] || '#6b7280');

  charts['categoryChart'] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: colors.tickColor,
            font: { size: 11 },
            padding: 10,
            usePointStyle: true,
            pointStyleWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ₹${Math.round(ctx.raw).toLocaleString('en-IN')} (${Math.round(ctx.parsed / data.reduce((a, b) => a + b, 0) * 100)}%)`,
          },
        },
      },
    },
  });
}

/* ═══════════════════════════════════
   ANALYTICS CHARTS
═══════════════════════════════════ */

function buildAnalyticsCharts() {
  buildMonthlyTrendChart();
  buildIncomeExpenseChart();
}

/* Monthly trend — last 6 months bar */
function buildMonthlyTrendChart() {
  const colors = chartColors();
  destroyChart('monthlyTrendChart');

  const canvas = document.getElementById('monthlyTrendChart');
  if (!canvas) return;

  const uid = App.user.id;
  const allExp = DB.expenses.byUser(uid);
  const now = new Date();

  const labels = [];
  const data = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    labels.push(d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
    data.push(allExp.filter(e => e.date && e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0));
  }

  const budget = DB.budget.get();
  const monthBudget = budget.monthly_budget || 30000;

  charts['monthlyTrendChart'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Monthly Expenses',
        data,
        backgroundColor: data.map(v => v > monthBudget ? 'rgba(255,92,122,0.65)' : 'rgba(102,126,234,0.6)'),
        borderColor: data.map(v => v > monthBudget ? '#ff5c7a' : '#667eea'),
        borderWidth: 1.5,
        borderRadius: 7,
        borderSkipped: false,
      }, {
        label: 'Monthly Budget',
        data: new Array(6).fill(monthBudget),
        type: 'line',
        borderColor: 'rgba(251,191,36,0.5)',
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: colors.tickColor,
            font: { size: 11 },
            usePointStyle: true,
            pointStyleWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ₹${Math.round(ctx.raw).toLocaleString('en-IN')}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.tickColor, font: { size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            font: { size: 11 },
            callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v),
          },
          border: { display: false },
        },
      },
    },
  });
}

/* Income vs Expenses — grouped bar */
function buildIncomeExpenseChart() {
  const colors = chartColors();
  destroyChart('incomeExpenseChart');

  const canvas = document.getElementById('incomeExpenseChart');
  if (!canvas) return;

  const uid = App.user.id;
  const allExp = DB.expenses.byUser(uid);
  const allInc = DB.income.byUser(uid);
  const now = new Date();

  const labels = [];
  const expData = [];
  const incData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    labels.push(d.toLocaleDateString('en-IN', { month: 'short' }));
    expData.push(allExp.filter(e => e.date && e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0));
    incData.push(allInc.filter(i => i.date && i.date.startsWith(key)).reduce((s, i) => s + i.amount, 0));
  }

  charts['incomeExpenseChart'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incData,
          backgroundColor: 'rgba(0,229,160,0.55)',
          borderColor: '#00e5a0',
          borderWidth: 1.5,
          borderRadius: 5,
          borderSkipped: false,
        },
        {
          label: 'Expenses',
          data: expData,
          backgroundColor: 'rgba(255,92,122,0.55)',
          borderColor: '#ff5c7a',
          borderWidth: 1.5,
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: colors.tickColor,
            font: { size: 11 },
            usePointStyle: true,
            pointStyleWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ₹${Math.round(ctx.raw).toLocaleString('en-IN')}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.tickColor, font: { size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            font: { size: 11 },
            callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v),
          },
          border: { display: false },
        },
      },
    },
  });
}

/* ═══════════════════════════════════
   THEME CHANGE — rebuild charts
═══════════════════════════════════ */

// Hook into theme toggle to redraw charts with correct colors
const _originalToggle = window.toggleTheme;
window.toggleTheme = function () {
  _originalToggle();
  setTimeout(() => {
    const uid = App.user.id;
    const thisMonth = new Date().toISOString().slice(0, 7);
    if (App.currentPage === 'dashboard') buildDashboardCharts(DB.expenses.byUser(uid), thisMonth);
    if (App.currentPage === 'analytics') buildAnalyticsCharts();
  }, 80);
};