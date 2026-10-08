// script.js – Personal Finance Dashboard
// Loads mock data, computes summaries, builds Chart.js charts, and handles category filtering.

// ------------------------------------------------------------
// Mock Finance Data (as described in the shared contract)
// ------------------------------------------------------------
const MOCK_FINANCE_DATA = {
  currency: "USD",
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  categories: ["Housing", "Food", "Transport", "Utilities", "Entertainment", "Other"],
  monthly: [
    { month: "Jan", income: 5200, expenses: { Housing: 1500, Food: 420, Transport: 180, Utilities: 150, Entertainment: 200, Other: 100 } },
    { month: "Feb", income: 5300, expenses: { Housing: 1500, Food: 430, Transport: 190, Utilities: 155, Entertainment: 210, Other: 110 } },
    { month: "Mar", income: 5400, expenses: { Housing: 1500, Food: 440, Transport: 200, Utilities: 160, Entertainment: 220, Other: 120 } },
    { month: "Apr", income: 5500, expenses: { Housing: 1500, Food: 450, Transport: 210, Utilities: 165, Entertainment: 230, Other: 130 } },
    { month: "May", income: 5600, expenses: { Housing: 1500, Food: 460, Transport: 220, Utilities: 170, Entertainment: 240, Other: 140 } },
    { month: "Jun", income: 5700, expenses: { Housing: 1500, Food: 470, Transport: 230, Utilities: 175, Entertainment: 250, Other: 150 } },
    { month: "Jul", income: 5800, expenses: { Housing: 1500, Food: 480, Transport: 240, Utilities: 180, Entertainment: 260, Other: 160 } },
    { month: "Aug", income: 5900, expenses: { Housing: 1500, Food: 490, Transport: 250, Utilities: 185, Entertainment: 270, Other: 170 } },
    { month: "Sep", income: 6000, expenses: { Housing: 1500, Food: 500, Transport: 260, Utilities: 190, Entertainment: 280, Other: 180 } },
    { month: "Oct", income: 6100, expenses: { Housing: 1500, Food: 510, Transport: 270, Utilities: 195, Entertainment: 290, Other: 190 } },
    { month: "Nov", income: 6200, expenses: { Housing: 1500, Food: 520, Transport: 280, Utilities: 200, Entertainment: 300, Other: 200 } }
  ]
};

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------
/**
 * Compute summary values based on the selected category.
 * @param {Object} data - MOCK_FINANCE_DATA
 * @param {string} category - "All" or a specific category name
 * @returns {Object} { balance, income, expenses, savings }
 */
function computeSummary(data, category) {
  const totalIncome = data.monthly.reduce((sum, m) => sum + m.income, 0);
  let totalExpenses = 0;

  if (category === "All") {
    totalExpenses = data.monthly.reduce((sum, m) => {
      return sum + Object.values(m.expenses).reduce((s, v) => s + v, 0);
    }, 0);
  } else {
    totalExpenses = data.monthly.reduce((sum, m) => sum + (m.expenses[category] || 0), 0);
  }

  const balance = totalIncome - totalExpenses;
  const savings = balance; // per spec, savings equals total balance

  return {
    balance,
    income: totalIncome,
    expenses: totalExpenses,
    savings
  };
}

/**
 * Build or update the spending by category bar chart.
 * @param {Object} chartInstance - Chart.js instance (may be null on first call)
 * @param {Object} data - MOCK_FINANCE_DATA
 * @param {string} category - "All" or specific category
 * @returns {Chart} Updated Chart.js instance
 */
function buildSpendingChart(chartInstance, data, category) {
  const ctx = document.getElementById('spendingChart').getContext('2d');

  // Aggregate expenses per category (or single category)
  const categories = category === "All" ? data.categories : [category];
  const expenseTotals = categories.map(cat => {
    return data.monthly.reduce((sum, m) => sum + (m.expenses[cat] || 0), 0);
  });

  const chartData = {
    labels: categories,
    datasets: [{
      label: 'Expenses ($)',
      data: expenseTotals,
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-expense').trim() || '#ef4444'
    }]
  };

  const config = {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Spending by Category' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  };

  if (chartInstance) {
    chartInstance.data = chartData;
    chartInstance.options = config.options;
    chartInstance.update();
    return chartInstance;
  }

  return new Chart(ctx, config);
}

/**
 * Build or update the monthly trend line chart.
 * @param {Object} chartInstance - Chart.js instance (may be null on first call)
 * @param {Object} data - MOCK_FINANCE_DATA
 * @param {string} category - "All" or specific category
 * @returns {Chart} Updated Chart.js instance
 */
function buildTrendChart(chartInstance, data, category) {
  const ctx = document.getElementById('trendChart').getContext('2d');

  const labels = data.months;
  const incomeData = data.monthly.map(m => m.income);

  let expenseData;
  if (category === "All") {
    expenseData = data.monthly.map(m => {
      return Object.values(m.expenses).reduce((s, v) => s + v, 0);
    });
  } else {
    expenseData = data.monthly.map(m => m.expenses[category] || 0);
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-income').trim() || '#10b981',
        tension: 0.3,
        fill: false
      },
      {
        label: category === "All" ? 'Total Expenses' : `${category} Expenses`,
        data: expenseData,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-expense').trim() || '#ef4444',
        tension: 0.3,
        fill: false
      }
    ]
  };

  const config = {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Monthly Income vs Expenses' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  };

  if (chartInstance) {
    chartInstance.data = chartData;
    chartInstance.options = config.options;
    chartInstance.update();
    return chartInstance;
  }

  return new Chart(ctx, config);
}

/**
 * Render all UI parts for a given category.
 * @param {string} category - selected category ("All" or specific)
 */
function renderAll(category) {
  // Update summary cards
  const summary = computeSummary(MOCK_FINANCE_DATA, category);
  document.getElementById('card-balance').textContent = formatCurrency(summary.balance);
  document.getElementById('card-income').textContent = formatCurrency(summary.income);
  document.getElementById('card-expenses').textContent = formatCurrency(summary.expenses);
  document.getElementById('card-savings').textContent = formatCurrency(summary.savings);

  // Update charts (reuse existing instances if they exist)
  window.spendingChart = buildSpendingChart(window.spendingChart, MOCK_FINANCE_DATA, category);
  window.trendChart = buildTrendChart(window.trendChart, MOCK_FINANCE_DATA, category);
}

/** Simple currency formatter based on the data's currency */
function formatCurrency(value) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: MOCK_FINANCE_DATA.currency
  });
  return formatter.format(value);
}

// ------------------------------------------------------------
// Event Listeners & Initialization
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Attach click handlers to filter buttons
  const filterButtons = document.querySelectorAll('[data-category]');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all, add to clicked
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category');
      renderAll(cat);
    });
  });

  // Set initial active state to "All"
  const allBtn = document.querySelector('[data-category="All"]');
  if (allBtn) allBtn.classList.add('active');

  // Initial render
  renderAll('All');
});
