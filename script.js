/**
 * RUPAIYA — Smart Daily Expense Tracker
 * script.js — Core logic, API layer, smart warnings
 */

'use strict';

const API_BASE = 'http://localhost:5000/api';

/* ═══════════════════════════════════
   DATA LAYER (API-BASED)
═══════════════════════════════════ */

const DB = {
  /** Users API */
  users: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    current: async () => {
      const res = await fetch(`${API_BASE}/users/current`);
      const data = await res.json();
      return data.success ? data.data : null;
    },
  },

  /** Expenses API */
  expenses: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/expenses?user_id=${App.user.id}`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    add: async (record) => {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: record.user_id,
          title: record.title,
          category: record.category,
          amount: record.amount,
          payment_method: record.payment || 'Cash',
          notes: record.notes || '',
          date: record.date,
        }),
      });
      const data = await res.json();
      return data.success ? data.data : null;
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success;
    },
    byUser: async (userId) => {
      const all = await DB.expenses.getAll();
      return all.filter(e => e.user_id === userId);
    },
  },

  /** Income API */
  income: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/income?user_id=${App.user.id}`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    add: async (record) => {
      const res = await fetch(`${API_BASE}/income`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: record.user_id,
          source: record.source,
          amount: record.amount,
          date: record.date,
          notes: record.notes || '',
        }),
      });
      const data = await res.json();
      return data.success ? data.data : null;
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE}/income/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success;
    },
    byUser: async (userId) => {
      const all = await DB.income.getAll();
      return all.filter(i => i.user_id === userId);
    },
  },

  /** Budget API */
  budget: {
    get: async () => {
      const res = await fetch(`${API_BASE}/budgets/${App.user.id}`);
      const data = await res.json();
      return data.success ? data.data : { monthly_budget: 30000, daily_limit: 2000, warn_threshold: 80 };
    },
    save: async (data) => {
      const res = await fetch(`${API_BASE}/budgets/${App.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      return result.success;
    },
  },
};

/* ═══════════════════════════════════
   APP STATE
═══════════════════════════════════ */

const App = {
  user: { id: 1, name: 'John Doe', email: 'john@example.com' },
  currentPage: 'dashboard',
  shownWarningIds: new Set(),
};

/* ═══════════════════════════════════
   INIT
═══════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize user
    const currentUser = await DB.users.current();
    if (currentUser) {
      App.user = currentUser;
    }

    // Set today's date on date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('incDate').value = today;
    document.getElementById('expDate').value = today;

    // Header date
    const now = new Date();
    document.getElementById('headerDate').textContent =
      now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Greeting
    const hour = now.getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    document.getElementById('dashGreeting').textContent = `${greet}, ${App.user.name.split(' ')[0]} 👋`;

    // Load budget settings into form
    const budget = await DB.budget.get();
    document.getElementById('budgetAmount').value = budget.monthly_budget;
    document.getElementById('dailyLimit').value = budget.daily_limit;
    document.getElementById('warnThreshold').value = budget.warn_threshold;

    // Initial render
    await refreshDashboard();
    await refreshBudgetPage();

    // Theme restore
    const savedTheme = localStorage.getItem('rp_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('themeLabel').textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
  } catch (err) {
    console.error('Initialization error:', err);
    showToast('Backend connection error. Check if server is running.', 'error');
  }
});

/* ═══════════════════════════════════
   NAVIGATION
═══════════════════════════════════ */

function navigate(page, link) {
  // Deactivate current
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Activate new
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  if (link) {
    const navItem = typeof link === 'string'
      ? document.querySelector(`[data-page="${link}"]`)
      : link;
    if (navItem) navItem.classList.add('active');
  }

  App.currentPage = page;
  closeSidebar();

  // Page-specific render
  if (page === 'dashboard') refreshDashboard();
  if (page === 'history') refreshHistory();
  if (page === 'income') refreshIncomePage();
  if (page === 'expenses') refreshExpensePage();
  if (page === 'budget') refreshBudgetPage();
  if (page === 'analytics') {
    refreshAnalytics();
    setTimeout(buildAnalyticsCharts, 80);
  }

  return false;
}

/* ═══════════════════════════════════
   SMART WARNING ENGINE
═══════════════════════════════════ */

const WARN_UNNECESSARY_CATS = ['Shopping', 'Entertainment'];

async function runWarningEngine() {
  const uid = App.user.id;
  const budget = await DB.budget.get();
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7);

  const allExp = await DB.expenses.byUser(uid);
  const allInc = await DB.income.byUser(uid);
  
  const todayExp = allExp.filter(e => e.date === today);
  const monthExp = allExp.filter(e => e.date && e.date.startsWith(thisMonth));
  const totalIncome = allInc.reduce((s, i) => s + i.amount, 0);

  const todayTotal = todayExp.reduce((s, e) => s + e.amount, 0);
  const monthTotal = monthExp.reduce((s, e) => s + e.amount, 0);
  const dailyLimit = budget.daily_limit || 2000;
  const monthlyBudget = budget.monthly_budget || 30000;
  const warnPct = (budget.warn_threshold || 80) / 100;

  const warnings = [];

  // Rule 1: Daily limit exceeded
  if (todayTotal > dailyLimit) {
    warnings.push({
      id: 'daily_exceeded',
      level: 'red',
      icon: '🚨',
      msg: `Daily spending limit exceeded! You've spent ₹${fmtNum(todayTotal)} today (limit: ₹${fmtNum(dailyLimit)}).`,
      modal: true,
    });
  } else if (todayTotal > dailyLimit * 0.8) {
    warnings.push({
      id: 'daily_near',
      level: 'amber',
      icon: '⚠️',
      msg: `You're close to your daily limit. ₹${fmtNum(todayTotal)} spent of ₹${fmtNum(dailyLimit)}.`,
    });
  }

  // Rule 2: Monthly budget
  if (monthTotal > monthlyBudget) {
    warnings.push({
      id: 'monthly_exceeded',
      level: 'red',
      icon: '🚨',
      msg: `Monthly budget crossed! Spent ₹${fmtNum(monthTotal)} of ₹${fmtNum(monthlyBudget)} budget.`,
      modal: true,
    });
  } else if (monthTotal > monthlyBudget * warnPct) {
    const pct = Math.round(monthTotal / monthlyBudget * 100);
    warnings.push({
      id: 'monthly_near',
      level: 'amber',
      icon: '📊',
      msg: `Budget Alert: You've used ${pct}% of your monthly budget.`,
    });
  }

  // Rule 3: Shopping + Entertainment > 40% of income
  if (totalIncome > 0) {
    const unnecessaryTotal = monthExp
      .filter(e => WARN_UNNECESSARY_CATS.includes(e.category))
      .reduce((s, e) => s + e.amount, 0);
    const pct = Math.round(unnecessaryTotal / totalIncome * 100);

    if (pct > 40) {
      warnings.push({
        id: 'unnecessary_high',
        level: 'red',
        icon: '🛍️',
        msg: `Warning: Shopping + Entertainment is ${pct}% of your income (₹${fmtNum(unnecessaryTotal)}). Consider reducing!`,
        modal: true,
      });
    } else if (pct > 25) {
      warnings.push({
        id: 'unnecessary_watch',
        level: 'amber',
        icon: '👀',
        msg: `Shopping + Entertainment is ${pct}% of income. Watch your discretionary spending.`,
      });
    }
  }

  // Rule 4: 3+ unnecessary transactions today
  const unnecessaryToday = todayExp.filter(e => WARN_UNNECESSARY_CATS.includes(e.category));
  if (unnecessaryToday.length >= 3) {
    warnings.push({
      id: 'many_unnecessary',
      level: 'amber',
      icon: '🔁',
      msg: `You've made ${unnecessaryToday.length} discretionary purchases today. That's a lot!`,
    });
  }

  // Rule 5: Single expense unusually high
  const bigExpense = todayExp.find(e => e.amount > 5000);
  if (bigExpense) {
    warnings.push({
      id: 'big_expense',
      level: 'blue',
      icon: '💸',
      msg: `High expense detected: ₹${fmtNum(bigExpense.amount)} on "${bigExpense.title}". Was this necessary?`,
    });
  }

  return warnings;
}

function renderWarnings(containerId, warnings, limit = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const toRender = limit ? warnings.slice(0, limit) : warnings;

  if (toRender.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = toRender.map(w => `
    <div class="warn-card ${w.level}">
      <span class="warn-icon">${w.icon}</span>
      <span>${w.msg}</span>
    </div>
  `).join('');

  // Show modal for critical new warnings
  const criticalNew = warnings.filter(w => w.modal && !App.shownWarningIds.has(w.id));
  if (criticalNew.length > 0) {
    const first = criticalNew[0];
    App.shownWarningIds.add(first.id);
    setTimeout(() => showModal('Spending Alert', first.msg), 600);
  }
}

/* ═══════════════════════════════════
   DASHBOARD
═══════════════════════════════════ */

async function refreshDashboard() {
  const uid = App.user.id;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().split('T')[0];

  const allExp = await DB.expenses.byUser(uid);
  const allInc = await DB.income.byUser(uid);
  const monthExp = allExp.filter(e => e.date && e.date.startsWith(thisMonth));
  const monthInc = allInc.filter(i => i.date && i.date.startsWith(thisMonth));

  const totalExpenses = monthExp.reduce((s, e) => s + e.amount, 0);
  const totalIncome = monthInc.reduce((s, i) => s + i.amount, 0);
  const balance = totalIncome - totalExpenses;
  const budget = await DB.budget.get();
  const budgetLeft = Math.max(0, budget.monthly_budget - totalExpenses);
  const budgetUsedPct = budget.monthly_budget ? Math.min(100, Math.round(totalExpenses / budget.monthly_budget * 100)) : 0;

  // Stat cards
  document.getElementById('statBalance').textContent = `₹${fmtNum(Math.abs(balance))}`;
  document.getElementById('statBalance').style.color = balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
  document.getElementById('statIncome').textContent = `₹${fmtNum(totalIncome)}`;
  document.getElementById('statExpenses').textContent = `₹${fmtNum(totalExpenses)}`;
  document.getElementById('statBudgetLeft').textContent = `₹${fmtNum(budgetLeft)}`;
  document.getElementById('balanceTrend').textContent = balance >= 0 ? '↑ In surplus' : '↓ In deficit';
  document.getElementById('dashBudgetBar').style.width = budgetUsedPct + '%';
  document.getElementById('dashBudgetBar').className = 'budget-bar ' +
    (budgetUsedPct > 90 ? 'fill-red' : budgetUsedPct > 70 ? 'fill-amber' : 'fill-green');

  // Warnings
  const warnings = await runWarningEngine();
  renderWarnings('inlineWarnings', warnings, 3);

  // Top banner for critical
  const criticalWarn = warnings.find(w => w.level === 'red');
  const banner = document.getElementById('warningBanner');
  if (criticalWarn) {
    banner.innerHTML = `${criticalWarn.icon} ${criticalWarn.msg}`;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }

  // Recent transactions
  const combined = [
    ...allExp.map(e => ({ ...e, _type: 'expense', created_at: e.created_at || e.date })),
    ...allInc.map(i => ({ ...i, _type: 'income', created_at: i.created_at || i.date })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);

  renderTxList('recentList', combined, true);

  // Charts
  setTimeout(() => buildDashboardCharts(allExp, thisMonth), 60);
}

/* ═══════════════════════════════════
   INCOME PAGE
═══════════════════════════════════ */

async function handleIncomeSubmit(e) {
  e.preventDefault();
  const uid = App.user.id;

  const record = {
    user_id: uid,
    source: document.getElementById('incSource').value.trim(),
    amount: parseFloat(document.getElementById('incAmount').value),
    date: document.getElementById('incDate').value,
    notes: document.getElementById('incNotes').value.trim(),
  };

  if (!record.source || !record.amount || !record.date) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  if (record.amount <= 0) {
    showToast('Amount must be positive', 'error');
    return;
  }

  await DB.income.add(record);

  // Reset form
  e.target.reset();
  document.getElementById('incDate').value = new Date().toISOString().split('T')[0];

  showToast(`Income of ₹${fmtNum(record.amount)} added ✓`, 'success');
  await refreshIncomePage();
  await refreshDashboard();
}

async function refreshIncomePage() {
  const uid = App.user.id;
  const allInc = await DB.income.byUser(uid);
  const sorted = allInc.sort((a, b) => new Date(b.date) - new Date(a.date));
  const total = sorted.reduce((s, i) => s + i.amount, 0);

  const listEl = document.getElementById('incomeSummaryList');
  if (sorted.length === 0) {
    listEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:1rem">No income recorded yet</p>';
  } else {
    listEl.innerHTML = sorted.map(i => `
      <div class="summary-item">
        <div class="summary-item-left">
          <span class="summary-item-title">${esc(i.source)}</span>
          <span class="summary-item-sub">${fmtDate(i.date)}${i.notes ? ' · ' + esc(i.notes) : ''}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span class="summary-item-amount" style="color:var(--accent-green)">+₹${fmtNum(i.amount)}</span>
          <button class="tx-delete" onclick="deleteIncome(${i.id})" title="Delete">×</button>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('totalIncomeDisplay').textContent = `₹${fmtNum(total)}`;
}

async function deleteIncome(id) {
  await DB.income.delete(id);
  await refreshIncomePage();
  await refreshDashboard();
  showToast('Income entry removed', 'warn');
}

/* ═══════════════════════════════════
   EXPENSE PAGE
═══════════════════════════════════ */

async function handleExpenseSubmit(e) {
  e.preventDefault();
  const uid = App.user.id;

  const amount = parseFloat(document.getElementById('expAmount').value);
  const category = document.getElementById('expCategory').value;
  const date = document.getElementById('expDate').value;
  const title = document.getElementById('expTitle').value.trim();

  if (!title || !amount || !category || !date) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  if (amount <= 0) {
    showToast('Amount must be positive', 'error');
    return;
  }

  const record = {
    user_id: uid,
    title,
    category,
    amount,
    date,
    payment: document.getElementById('expPayment').value,
    notes: document.getElementById('expNotes').value.trim(),
  };

  await DB.expenses.add(record);

  // Reset form
  e.target.reset();
  document.getElementById('expCategory').value = '';
  document.getElementById('expDate').value = new Date().toISOString().split('T')[0];

  showToast(`Expense of ₹${fmtNum(amount)} added ✓`, 'success');

  // Check today-specific warning
  await checkTodayWarning();
  await refreshExpensePage();
  await refreshDashboard();
}

async function refreshExpensePage() {
  const uid = App.user.id;
  const today = new Date().toISOString().split('T')[0];
  const allExp = await DB.expenses.byUser(uid);
  const todayExp = allExp.filter(e => e.date === today);
  const todayTotal = todayExp.reduce((s, e) => s + e.amount, 0);

  const listEl = document.getElementById('todayExpenses');
  if (todayExp.length === 0) {
    listEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:1rem">No expenses today yet</p>';
  } else {
    listEl.innerHTML = todayExp.map(e => `
      <div class="summary-item">
        <div class="summary-item-left">
          <span class="summary-item-title">${esc(e.title)}</span>
          <span class="summary-item-sub">${e.category} · ${e.payment_method || 'Cash'}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span class="summary-item-amount" style="color:var(--accent-red)">-₹${fmtNum(e.amount)}</span>
          <button class="tx-delete" onclick="deleteExpense(${e.id},'expenses')" title="Delete">×</button>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('todayTotalDisplay').textContent = `₹${fmtNum(todayTotal)}`;
  await checkTodayWarning();
}

async function checkTodayWarning() {
  const uid = App.user.id;
  const today = new Date().toISOString().split('T')[0];
  const budget = await DB.budget.get();
  const dailyLimit = budget.daily_limit || 2000;
  const allExp = await DB.expenses.byUser(uid);
  const todayExp = allExp.filter(e => e.date === today);
  const todayTotal = todayExp.reduce((s, e) => s + e.amount, 0);

  const warnBox = document.getElementById('todayWarnBox');
  if (!warnBox) return;

  if (todayTotal > dailyLimit) {
    warnBox.textContent = `⚠️ Daily limit exceeded! ₹${fmtNum(todayTotal)} spent vs ₹${fmtNum(dailyLimit)} limit.`;
    warnBox.classList.remove('hidden');
  } else if (todayTotal > dailyLimit * 0.8) {
    warnBox.textContent = `⚠️ Nearing daily limit. ₹${fmtNum(todayTotal)} of ₹${fmtNum(dailyLimit)} spent.`;
    warnBox.classList.remove('hidden');
  } else {
    warnBox.classList.add('hidden');
  }
}

async function deleteExpense(id, from) {
  await DB.expenses.delete(id);
  await refreshDashboard();
  if (from === 'history') await refreshHistory();
  if (from === 'expenses') await refreshExpensePage();
  showToast('Expense removed', 'warn');
}

/* ═══════════════════════════════════
   HISTORY PAGE
═══════════════════════════════════ */

async function refreshHistory() {
  await filterHistory();
}

async function filterHistory() {
  const uid = App.user.id;
  const search = document.getElementById('searchInput').value.toLowerCase();
  const catFilter = document.getElementById('filterCategory').value;
  const typeFilter = document.getElementById('filterType').value;
  const monthFilter = document.getElementById('filterMonth').value;

  const allExp = await DB.expenses.byUser(uid);
  const allInc = await DB.income.byUser(uid);

  let combined = [
    ...allExp.map(e => ({ ...e, _type: 'expense' })),
    ...allInc.map(i => ({ ...i, _type: 'income', category: 'Income', title: i.source })),
  ];

  if (search) {
    combined = combined.filter(t =>
      t.title?.toLowerCase().includes(search) ||
      t.category?.toLowerCase().includes(search) ||
      t.notes?.toLowerCase().includes(search)
    );
  }

  if (catFilter) {
    combined = combined.filter(t => t.category === catFilter);
  }

  if (typeFilter) {
    combined = combined.filter(t => t._type === typeFilter);
  }

  if (monthFilter) {
    combined = combined.filter(t => t.date && t.date.startsWith(monthFilter));
  }

  combined.sort((a, b) => new Date(b.date) - new Date(a.date));

  const listEl = document.getElementById('historyTable');
  const emptyEl = document.getElementById('historyEmpty');

  if (combined.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    renderTxList('historyTable', combined, true, 'history');
  }
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterMonth').value = '';
  filterHistory();
}

/* ═══════════════════════════════════
   BUDGET PAGE
═══════════════════════════════════ */

async function handleBudgetSubmit(e) {
  e.preventDefault();

  const budget = {
    monthly_budget: parseFloat(document.getElementById('budgetAmount').value),
    daily_limit: parseFloat(document.getElementById('dailyLimit').value) || 2000,
    warn_threshold: parseInt(document.getElementById('warnThreshold').value),
  };

  await DB.budget.save(budget);
  showToast('Budget settings saved ✓', 'success');
  await refreshBudgetPage();
  App.shownWarningIds.clear();
  await refreshDashboard();
}

async function refreshBudgetPage() {
  const uid = App.user.id;
  const budget = await DB.budget.get();
  const thisMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().split('T')[0];

  const allExp = await DB.expenses.byUser(uid);
  const monthExp = allExp.filter(e => e.date && e.date.startsWith(thisMonth));
  const todayExp = allExp.filter(e => e.date === today);

  const monthTotal = monthExp.reduce((s, e) => s + e.amount, 0);
  const todayTotal = todayExp.reduce((s, e) => s + e.amount, 0);
  const monthlyBudget = budget.monthly_budget || 30000;
  const dailyLimit = budget.daily_limit || 2000;

  const monthPct = Math.min(100, Math.round(monthTotal / monthlyBudget * 100));
  const dayPct = Math.min(100, Math.round(todayTotal / dailyLimit * 100));

  const statusEl = document.getElementById('budgetStatus');
  if (statusEl) {
    statusEl.innerHTML = `
      <div class="budget-stat-item">
        <div class="budget-stat-header">
          <span class="budget-stat-label">Monthly budget used</span>
          <span class="budget-stat-value">₹${fmtNum(monthTotal)} / ₹${fmtNum(monthlyBudget)}</span>
        </div>
        <div class="budget-stat-bar">
          <div class="budget-stat-fill ${monthPct > 90 ? 'fill-red' : monthPct > 70 ? 'fill-amber' : 'fill-green'}"
               style="width:${monthPct}%"></div>
        </div>
        <small style="color:var(--text-muted);font-size:0.72rem">${monthPct}% used · ₹${fmtNum(Math.max(0, monthlyBudget - monthTotal))} remaining</small>
      </div>
      <div class="budget-stat-item">
        <div class="budget-stat-header">
          <span class="budget-stat-label">Today's spending</span>
          <span class="budget-stat-value">₹${fmtNum(todayTotal)} / ₹${fmtNum(dailyLimit)}</span>
        </div>
        <div class="budget-stat-bar">
          <div class="budget-stat-fill ${dayPct > 90 ? 'fill-red' : dayPct > 70 ? 'fill-amber' : 'fill-green'}"
               style="width:${dayPct}%"></div>
        </div>
        <small style="color:var(--text-muted);font-size:0.72rem">${dayPct}% used · ₹${fmtNum(Math.max(0, dailyLimit - todayTotal))} remaining</small>
      </div>
      <div class="budget-stat-item" style="padding-top:0.5rem;border-top:1px solid var(--glass-border)">
        <div class="budget-stat-header">
          <span class="budget-stat-label">Warning fires at</span>
          <span class="budget-stat-value">${budget.warn_threshold}% spent</span>
        </div>
      </div>
    `;
  }

  // Category bars
  const catColors = {
    Food: '#f97316', Shopping: '#a78bfa', Entertainment: '#ec4899',
    Travel: '#3b82f6', Bills: '#fbbf24', Education: '#06b6d4',
    Health: '#10b981', Others: '#6b7280',
  };
  const catIcons = {
    Food: '🍜', Shopping: '🛍️', Entertainment: '🎬', Travel: '✈️',
    Bills: '⚡', Education: '📚', Health: '💊', Others: '📦',
  };

  const catTotals = {};
  monthExp.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });

  const maxCat = Math.max(...Object.values(catTotals), 1);

  const catBarsEl = document.getElementById('categoryBudgetBars');
  if (catBarsEl) {
    if (Object.keys(catTotals).length === 0) {
      catBarsEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No expenses this month yet.</p>';
    } else {
      catBarsEl.innerHTML = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => {
          const pct = Math.round(amt / maxCat * 100);
          const color = catColors[cat] || '#6b7280';
          return `
            <div class="cat-bar-item">
              <div class="cat-bar-header">
                <span class="cat-bar-name">${catIcons[cat] || '📦'} ${cat}</span>
                <span class="cat-bar-value">₹${fmtNum(amt)} (${Math.round(amt / monthTotal * 100)}%)</span>
              </div>
              <div class="cat-bar-track">
                <div class="cat-bar-fill" style="width:${pct}%;background:${color}"></div>
              </div>
            </div>
          `;
        }).join('');
    }
  }
}

/* ═══════════════════════════════════
   ANALYTICS PAGE
═══════════════════════════════════ */

async function refreshAnalytics() {
  const uid = App.user.id;
  const allExp = await DB.expenses.byUser(uid);
  const allInc = await DB.income.byUser(uid);

  const totalIncome = allInc.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = allExp.reduce((s, e) => s + e.amount, 0);
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round(savings / totalIncome * 100) : 0;

  const catTotals = {};
  allExp.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  const avgMonthly = totalExpenses / 3;

  const insightEl = document.getElementById('insightCards');
  if (insightEl) {
    insightEl.innerHTML = [
      { label: 'Total Income', value: `₹${fmtNum(totalIncome)}`, sub: 'All time', color: 'var(--accent-green)' },
      { label: 'Total Expenses', value: `₹${fmtNum(totalExpenses)}`, sub: 'All time', color: 'var(--accent-red)' },
      { label: 'Net Savings', value: `₹${fmtNum(Math.abs(savings))}`, sub: savings >= 0 ? '🎉 Surplus' : '⚠️ Deficit', color: savings >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
      { label: 'Savings Rate', value: `${savingsRate}%`, sub: 'of income', color: 'var(--accent-blue)' },
      { label: 'Avg Monthly Spend', value: `₹${fmtNum(avgMonthly)}`, sub: 'Past 3 months', color: 'var(--accent-amber)' },
      { label: 'Top Category', value: topCat ? topCat[0] : '—', sub: topCat ? `₹${fmtNum(topCat[1])} spent` : '', color: 'var(--accent-purple)' },
    ].map(card => `
      <div class="insight-card">
        <span class="insight-label">${card.label}</span>
        <span class="insight-value" style="color:${card.color}">${card.value}</span>
        <span class="insight-sub">${card.sub}</span>
      </div>
    `).join('');
  }
}

/* ═══════════════════════════════════
   TRANSACTION LIST RENDERER
═══════════════════════════════════ */

const CAT_ICONS = {
  Food: '🍜', Shopping: '🛍️', Entertainment: '🎬', Travel: '✈️',
  Bills: '⚡', Education: '📚', Health: '💊', Others: '📦', Income: '💚',
};

function renderTxList(containerId, items, showDelete = false, deleteFrom = '') {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (items.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:1rem;text-align:center">No transactions yet</p>';
    return;
  }

  el.innerHTML = items.map(item => {
    const isIncome = item._type === 'income';
    const cat = isIncome ? 'income' : item.category?.toLowerCase() || 'others';
    const icon = isIncome ? '💚' : (CAT_ICONS[item.category] || '📦');
    const title = isIncome ? item.source : item.title;
    const amount = isIncome ? `+₹${fmtNum(item.amount)}` : `-₹${fmtNum(item.amount)}`;
    const amtClass = isIncome ? 'positive' : 'negative';

    return `
      <div class="tx-item">
        <div class="tx-icon ${cat}">${icon}</div>
        <div class="tx-details">
          <div class="tx-title">${esc(title)}</div>
          <div class="tx-meta">${isIncome ? 'Income' : (item.category || '')}${item.payment_method ? ' · ' + item.payment_method : ''}</div>
        </div>
        <div class="tx-right">
          <div class="tx-amount ${amtClass}">${amount}</div>
          <div class="tx-date">${fmtDate(item.date)}</div>
        </div>
        ${showDelete ? `<button class="tx-delete" onclick="${isIncome ? `deleteIncome(${item.id})` : `deleteExpense(${item.id},'${deleteFrom}')`}" title="Delete">×</button>` : ''}
      </div>
    `;
  }).join('');
}

/* ═══════════════════════════════════
   EXPORT CSV
═══════════════════════════════════ */

async function exportCSV() {
  const uid = App.user.id;
  const allExp = await DB.expenses.byUser(uid);
  const allInc = await DB.income.byUser(uid);

  const expenses = allExp.map(e => ({
    Type: 'Expense', Date: e.date, Title: e.title,
    Category: e.category, Amount: e.amount,
    Payment: e.payment_method || '', Notes: e.notes || '',
  }));
  const income = allInc.map(i => ({
    Type: 'Income', Date: i.date, Title: i.source,
    Category: 'Income', Amount: i.amount,
    Payment: '', Notes: i.notes || '',
  }));

  const all = [...income, ...expenses].sort((a, b) => new Date(b.Date) - new Date(a.Date));
  if (all.length === 0) { showToast('No data to export', 'warn'); return; }

  const headers = Object.keys(all[0]);
  const csv = [
    headers.join(','),
    ...all.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rupaiya_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('CSV downloaded ✓', 'success');
}

/* ═══════════════════════════════════
   UI UTILITIES
═══════════════════════════════════ */

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('rp_theme', next);
  document.getElementById('themeLabel').textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠'}</span>
    <span>${msg}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

function showModal(title, msg) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMsg').textContent = msg;
  document.getElementById('warningModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('warningModal').classList.add('hidden');
}

/* ═══════════════════════════════════
   FORMATTERS
═══════════════════════════════════ */

function fmtNum(n) {
  return Math.round(n).toLocaleString('en-IN');
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
