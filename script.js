/* Mock Data */
const mockData = {
  transactions: [
    { id: 't1', date: '2024-01-05', amount: 2500, category: 'Salary', type: 'income' },
    { id: 't2', date: '2024-01-10', amount: -150, category: 'Food', type: 'expense' },
    { id: 't3', date: '2024-01-12', amount: -60, category: 'Transport', type: 'expense' },
    { id: 't4', date: '2024-01-15', amount: -200, category: 'Entertainment', type: 'expense' },
    { id: 't5', date: '2024-02-01', amount: 2500, category: 'Salary', type: 'income' },
    { id: 't6', date: '2024-02-08', amount: -180, category: 'Food', type: 'expense' },
    { id: 't7', date: '2024-02-14', amount: -70, category: 'Transport', type: 'expense' },
    { id: 't8', date: '2024-02-20', amount: -220, category: 'Utilities', type: 'expense' },
    { id: 't9', date: '2024-03-03', amount: 2500, category: 'Salary', type: 'income' },
    { id: 't10', date: '2024-03-11', amount: -200, category: 'Food', type: 'expense' },
    { id: 't11', date: '2024-03-15', amount: -90, category: 'Transport', type: 'expense' },
    { id: 't12', date: '2024-03-18', amount: -250, category: 'Entertainment', type: 'expense' }
  ],
  categoryTotals: [
    { category: 'Food', total: 0, color: '#ef4444' },
    { category: 'Transport', total: 0, color: '#f59e0b' },
    { category: 'Entertainment', total: 0, color: '#10b981' },
    { category: 'Utilities', total: 0, color: '#3b82f6' }
  ]
};

/* Utility Functions */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function parseDate(str) {
  return new Date(str);
}

function calculateSummary() {
  const income = mockData.transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expenses = mockData.transactions.filter(t => t.type === 'expense').reduce((a, t) => a + Math.abs(t.amount), 0);
  const balance = income - expenses;
  const savings = balance * 0.2; // arbitrary 20% savings
  return { totalBalance: balance, totalIncome: income, totalExpenses: expenses, totalSavings: savings };
}

function renderSummaryCards() {
  const summary = calculateSummary();
  document.getElementById('totalBalance').textContent = formatCurrency(summary.totalBalance);
  document.getElementById('totalIncome').textContent = formatCurrency(summary.totalIncome);
  document.getElementById('totalExpenses').textContent = formatCurrency(summary.totalExpenses);
  document.getElementById('totalSavings').textContent = formatCurrency(summary.totalSavings);
}

/* Chart Instances */
let categoryChart, trendChart;

function initCharts() {
  const ctxCategory = document.getElementById('categoryChart').getContext('2d');
  const ctxTrend = document.getElementById('trendChart').getContext('2d');

  // Prepare category data
  updateCategoryTotals();
  const categories = mockData.categoryTotals.map(c => c.category);
  const catValues = mockData.categoryTotals.map(c => c.total);
  const catColors = mockData.categoryTotals.map(c => c.color);

  categoryChart = new Chart(ctxCategory, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Spending ($)',
        data: catValues,
        backgroundColor: catColors,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Monthly trend data
  const monthly = aggregateMonthly();
  const months = monthly.map(m => m.month);
  const incomes = monthly.map(m => m.income);
  const expenses = monthly.map(m => m.expenses);

  trendChart = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomes,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim(),
          tension: 0.3,
          fill: false
        },
        {
          label: 'Expenses',
          data: expenses,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-danger').trim(),
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

function updateCategoryTotals(filter = 'all') {
  // Reset totals
  mockData.categoryTotals.forEach(c => c.total = 0);
  const filtered = filter === 'all' ? mockData.transactions : mockData.transactions.filter(t => t.category === filter && t.type === 'expense');
  filtered.forEach(t => {
    if (t.type === 'expense') {
      const cat = mockData.categoryTotals.find(c => c.category === t.category);
      if (cat) cat.total += Math.abs(t.amount);
    }
  });
}

function updateCharts(filter = 'all') {
  updateCategoryTotals(filter);
  const catValues = mockData.categoryTotals.map(c => c.total);
  categoryChart.data.datasets[0].data = catValues;
  categoryChart.update();

  // Trend chart does not depend on category filter, but we could recompute if needed.
}

/* Filter Interaction */
function initFilters() {
  const container = document.querySelector('.filter-group');
  container.addEventListener('click', (e) => {
    if (e.target.matches('.filter-btn')) {
      const selected = e.target.getAttribute('data-category');
      // Update active state
      container.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn === e.target));
      updateCharts(selected);
    }
  });
}

/* Monthly Aggregation Helper */
function aggregateMonthly() {
  const map = {};
  mockData.transactions.forEach(t => {
    const date = parseDate(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!map[monthKey]) {
      map[monthKey] = { month: monthKey, income: 0, expenses: 0 };
    }
    if (t.type === 'income') {
      map[monthKey].income += t.amount;
    } else {
      map[monthKey].expenses += Math.abs(t.amount);
    }
  });
  // Convert to sorted array
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  renderSummaryCards();
  initCharts();
  initFilters();
});
