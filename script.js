// script.js – Personal Finance Dashboard
// ------------------------------------------------------------
// This script creates mock finance data, aggregates it, and renders two
// Chart.js visualizations: a bar chart for spending by category and a line
// chart for monthly income/expenses trends. It also wires up filter buttons
// to allow the user to view data for a specific category or all categories.
// ------------------------------------------------------------

// ----- Design Tokens (mirroring style.css) -----
const COLORS = {
  primary: "#2563eb",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#f59e0b",
  background: "#f8fafc",
  surface: "#ffffff",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  border: "#e2e8f0",
  categoryPalette: [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16"
  ]
};

// ----- Mock Finance Data -----
// A small but varied dataset to demonstrate aggregation and filtering.
const mockFinanceData = [
  { id: "1", date: "2024-01-05", amount: 2500, type: "income", category: "Salary", description: "January salary" },
  { id: "2", date: "2024-01-12", amount: -150, type: "expense", category: "Food", description: "Groceries" },
  { id: "3", date: "2024-01-15", amount: -60, type: "expense", category: "Transport", description: "Monthly metro pass" },
  { id: "4", date: "2024-01-20", amount: -200, type: "expense", category: "Entertainment", description: "Concert tickets" },
  { id: "5", date: "2024-02-03", amount: 2600, type: "income", category: "Salary", description: "February salary" },
  { id: "6", date: "2024-02-10", amount: -180, type: "expense", category: "Food", description: "Dining out" },
  { id: "7", date: "2024-02-14", amount: -90, type: "expense", category: "Utilities", description: "Electricity bill" },
  { id: "8", date: "2024-02-18", amount: -120, type: "expense", category: "Transport", description: "Gas" },
  { id: "9", date: "2024-03-01", amount: 2700, type: "income", category: "Salary", description: "March salary" },
  { id: "10", date: "2024-03-07", amount: -200, type: "expense", category: "Freelance", description: "Client payment fee" },
  { id: "11", date: "2024-03-12", amount: -130, type: "expense", category: "Food", description: "Supermarket" },
  { id: "12", date: "2024-03-15", amount: -75, type: "expense", category: "Entertainment", description: "Streaming subscription" },
  { id: "13", date: "2024-03-20", amount: -50, type: "expense", category: "Utilities", description: "Water bill" },
  { id: "14", date: "2024-04-02", amount: 2800, type: "income", category: "Salary", description: "April salary" },
  { id: "15", date: "2024-04-08", amount: -160, type: "expense", category: "Food", description: "Restaurant" },
  { id: "16", date: "2024-04-12", amount: -100, type: "expense", category: "Transport", description: "Ride‑share" },
  { id: "17", date: "2024-04-18", amount: -250, type: "expense", category: "Freelance", description: "Software license" },
  { id: "18", date: "2024-04-22", amount: -90, type: "expense", category: "Entertainment", description: "Video game" }
];

// ----- Helper Functions -----
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

// Aggregate expenses by category (only expenses are considered for the bar chart)
function aggregateByCategory(data) {
  const map = {};
  data.forEach(tx => {
    if (tx.type !== "expense") return;
    if (!map[tx.category]) {
      map[tx.category] = { total: 0, count: 0 };
    }
    map[tx.category].total += Math.abs(tx.amount);
    map[tx.category].count += 1;
  });
  // Convert to array and sort descending by total
  return Object.entries(map).map(([category, agg]) => ({
    category,
    total: agg.total,
    transactionCount: agg.count
  })).sort((a, b) => b.total - a.total);
}

// Aggregate monthly income & expenses for the line chart
function aggregateByMonth(data) {
  const map = {};
  data.forEach(tx => {
    const month = tx.date.slice(0, 7); // YYYY-MM
    if (!map[month]) {
      map[month] = { income: 0, expenses: 0 };
    }
    if (tx.type === "income") {
      map[month].income += tx.amount;
    } else {
      map[month].expenses += Math.abs(tx.amount);
    }
  });
  // Ensure months are sorted chronologically
  const sortedMonths = Object.keys(map).sort();
  return sortedMonths.map(month => ({
    month,
    income: map[month].income,
    expenses: map[month].expenses,
    balance: map[month].income - map[month].expenses
  }));
}

// ----- Chart Instances -----
let categoryChart = null;
let trendChart = null;

function initCharts() {
  const ctxBar = document.getElementById("categoryChart").getContext("2d");
  const ctxLine = document.getElementById("trendChart").getContext("2d");

  // Initial empty datasets – will be populated via updateCharts()
  categoryChart = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: [],
      datasets: [{
        label: "Spending",
        data: [],
        backgroundColor: COLORS.categoryPalette,
        borderColor: COLORS.categoryPalette.map(c => c),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => formatCurrency(ctx.parsed.y)
          }
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => formatCurrency(v) } }
      }
    }
  });

  trendChart = new Chart(ctxLine, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Income",
          data: [],
          borderColor: COLORS.success,
          backgroundColor: COLORS.success + "33",
          tension: 0.2,
          fill: true
        },
        {
          label: "Expenses",
          data: [],
          borderColor: COLORS.danger,
          backgroundColor: COLORS.danger + "33",
          tension: 0.2,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => formatCurrency(v) } }
      }
    }
  });

  // Populate with full data initially
  updateCharts();
}

function updateCharts(filteredCategory = null) {
  // Filter data if a category is selected (only affect expense aggregation)
  const filteredData = filteredCategory && filteredCategory !== "All"
    ? mockFinanceData.filter(tx => tx.category === filteredCategory)
    : mockFinanceData;

  // ----- Update Category Bar Chart -----
  const categoryAgg = aggregateByCategory(filteredData);
  const barLabels = categoryAgg.map(item => item.category);
  const barValues = categoryAgg.map(item => item.total);
  const barColors = COLORS.categoryPalette.slice(0, barLabels.length);

  categoryChart.data.labels = barLabels;
  categoryChart.data.datasets[0].data = barValues;
  categoryChart.data.datasets[0].backgroundColor = barColors;
  categoryChart.data.datasets[0].borderColor = barColors;
  categoryChart.update();

  // ----- Update Monthly Trend Line Chart -----
  const monthAgg = aggregateByMonth(filteredData);
  const lineLabels = monthAgg.map(m => m.month);
  const incomeVals = monthAgg.map(m => m.income);
  const expenseVals = monthAgg.map(m => m.expenses);

  trendChart.data.labels = lineLabels;
  trendChart.data.datasets[0].data = incomeVals;
  trendChart.data.datasets[1].data = expenseVals;
  trendChart.update();
}

// ----- Filter Buttons Wiring -----
function initFilters() {
  const container = document.querySelector(".filter-buttons");
  if (!container) return;

  // Determine unique categories from the mock data (including an "All" option)
  const categories = Array.from(new Set(mockFinanceData.map(tx => tx.category))).sort();
  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.textContent = "All";
  allBtn.dataset.category = "All";
  allBtn.className = "filter-btn active";
  container.appendChild(allBtn);

  categories.forEach((cat, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = cat;
    btn.dataset.category = cat;
    btn.className = "filter-btn";
    // optional color hint via inline style using palette
    btn.style.borderColor = COLORS.categoryPalette[idx % COLORS.categoryPalette.length];
    container.appendChild(btn);
  });

  // Click handling
  container.addEventListener("click", e => {
    if (e.target.tagName !== "BUTTON") return;
    const selected = e.target.dataset.category;
    // Update active class
    container.querySelectorAll("button").forEach(b => b.classList.toggle("active", b === e.target));
    updateCharts(selected);
  });
}

// ----- Initialization -----
document.addEventListener("DOMContentLoaded", () => {
  initCharts();
  initFilters();
});
