/* script.js – Vanilla ES module */

// Mock Data ---------------------------------------------------------------
const transactions = [
  { id: 't1', date: '2024-01-15', amount: 2500, category: 'Salary', type: 'income' },
  { id: 't2', date: '2024-01-20', amount: -150, category: 'Groceries', type: 'expense' },
  { id: 't3', date: '2024-01-22', amount: -75, category: 'Transport', type: 'expense' },
  { id: 't4', date: '2024-02-01', amount: 2500, category: 'Salary', type: 'income' },
  { id: 't5', date: '2024-02-05', amount: -200, category: 'Utilities', type: 'expense' },
  { id: 't6', date: '2024-02-10', amount: -120, category: 'Dining', type: 'expense' },
  { id: 't7', date: '2024-03-03', amount: 2500, category: 'Salary', type: 'income' },
  { id: 't8', date: '2024-03-12', amount: -180, category: 'Groceries', type: 'expense' },
  { id: 't9', date: '2024-03-15', amount: -90, category: 'Entertainment', type: 'expense' },
];

const categoryColors = [
  '#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

// Utilities ---------------------------------------------------------------
const fmtCurrency = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
const fmtMonth = (iso) => iso.slice(0, 7); // YYYY-MM

// Compute summaries -------------------------------------------------------
function computeDashboardSummary(data) {
  const totalIncome = data.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpenses = data.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const totalBalance = totalIncome + totalExpenses; // expenses are negative
  const totalSavings = totalIncome + totalExpenses; // same as balance for this mock
  return { totalBalance, totalIncome, totalExpenses: Math.abs(totalExpenses), totalSavings };
}

function computeCategorySummary(data) {
  const map = {};
  data.filter(t => t.type === 'expense').forEach(t => {
    if (!map[t.category]) map[t.category] = 0;
    map[t.category] += Math.abs(t.amount);
  });
  return Object.entries(map).map(([category, total], i) => ({
    category,
    total,
    color: categoryColors[i % categoryColors.length]
  }));
}

function computeMonthlyTrend(data) {
  const months = {};
  data.forEach(t => {
    const month = fmtMonth(t.date);
    if (!months[month]) months[month] = { income: 0, expenses: 0 };
    if (t.type === 'income') months[month].income += t.amount;
    else months[month].expenses += Math.abs(t.amount);
  });
  return Object.entries(months).map(([month, vals]) => ({
    month,
    income: vals.income,
    expenses: vals.expenses,
    savings: vals.income - vals.expenses
  })).sort((a, b) => a.month.localeCompare(b.month));
}

// Chart instances ----------------------------------------------------------
let barChart, lineChart;
let currentCategory = 'All';

function initCharts() {
  const barCtx = document.getElementById('categoryBarChart').getContext('2d');
  const lineCtx = document.getElementById('monthlyLineChart').getContext('2d');

  const categoryData = computeCategorySummary(transactions);
  const monthlyData = computeMonthlyTrend(transactions);

  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: categoryData.map(c => c.category),
      datasets: [{
        label: 'Expenses',
        data: categoryData.map(c => c.total),
        backgroundColor: categoryData.map(c => c.color)
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  lineChart = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: monthlyData.map(m => m.month),
      datasets: [
        {
          label: 'Income',
          data: monthlyData.map(m => m.income),
          borderColor: 'var(--color-success)',
          tension: 0.3,
          fill: false
        },
        {
          label: 'Expenses',
          data: monthlyData.map(m => m.expenses),
          borderColor: 'var(--color-danger)',
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Filter UI ---------------------------------------------------------------
function initFilters() {
  const container = document.getElementById('category-filters');
  const categories = ['All', ...new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))];
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn';
    btn.textContent = cat;
    btn.dataset.category = cat;
    if (cat === 'All') btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = cat;
      updateCharts();
    });
    container.appendChild(btn);
  });
}

function updateCharts() {
  // Filter data based on currentCategory
  const filtered = currentCategory === 'All' ? transactions : transactions.filter(t => t.category === currentCategory || t.type === 'income');

  // Update summary cards
  const summary = computeDashboardSummary(filtered);
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    el.textContent = fmtCurrency(summary[key]);
  });

  // Update bar chart (expenses only)
  const catSummary = computeCategorySummary(filtered);
  barChart.data.labels = catSummary.map(c => c.category);
  barChart.data.datasets[0].data = catSummary.map(c => c.total);
  barChart.data.datasets[0].backgroundColor = catSummary.map(c => c.color);
  barChart.update();

  // Update line chart (monthly trend)
  const monthSummary = computeMonthlyTrend(filtered);
  lineChart.data.labels = monthSummary.map(m => m.month);
  lineChart.data.datasets[0].data = monthSummary.map(m => m.income);
  lineChart.data.datasets[1].data = monthSummary.map(m => m.expenses);
  lineChart.update();
}

// Init ---------------------------------------------------------------
export function init() {
  initFilters();
  initCharts();
  updateCharts();
}

document.addEventListener('DOMContentLoaded', init);
