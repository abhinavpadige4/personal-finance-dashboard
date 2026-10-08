// script.js – Dashboard logic for the personal finance dashboard
// Imports the data module (which attaches FINANCE_DATA to window)
// No explicit import syntax because data.js is loaded as a regular script before this module.

// Ensure Chart.js is available via the CDN (global Chart variable)

// Utility: format numbers as currency
function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);
}

// Render the three summary cards (Income, Expense, Net Savings)
function renderSummary(filteredCategory = null) {
  const { summary, monthlyPoints, categoryBreakdowns } = window.FINANCE_DATA;

  // If a category filter is applied, recompute totals based on that category only
  let totalIncome = 0,
    totalExpense = 0;

  if (filteredCategory) {
    // Sum only expenses that belong to the selected category
    const cat = categoryBreakdowns.find(c => c.category === filteredCategory);
    totalExpense = cat ? cat.amount : 0;
    // Income is not category‑specific, keep overall income
    totalIncome = summary.totalIncome;
  } else {
    totalIncome = summary.totalIncome;
    totalExpense = summary.totalExpense;
  }

  const netSavings = totalIncome - totalExpense;

  const cards = [
    { id: "income", label: "Total Income", value: totalIncome, bg: "var(--color-primary)" },
    { id: "expense", label: "Total Expense", value: totalExpense, bg: "var(--color-danger)" },
    { id: "savings", label: "Net Savings", value: netSavings, bg: "var(--color-success)" },
  ];

  const container = document.querySelector("#summary-cards");
  container.innerHTML = ""; // clear
  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "summary-card";
    div.style.setProperty("--card-bg", card.bg);
    div.innerHTML = `
      <h3 class="summary-card__label">${card.label}</h3>
      <p class="summary-card__value">${formatCurrency(card.value)}</p>
    `;
    container.appendChild(div);
  });
}

// Global references to chart instances so we can destroy them on update
let barChart = null;
let lineChart = null;

function renderCharts(filteredCategory = null) {
  const { monthlyPoints, categoryBreakdowns } = window.FINANCE_DATA;

  // ---------- Bar Chart – Spending by Category ----------
  const barCtx = document.getElementById("category-bar").getContext("2d");
  const barData = (() => {
    if (filteredCategory) {
      const cat = categoryBreakdowns.find(c => c.category === filteredCategory);
      return cat
        ? {
            labels: [cat.category],
            datasets: [{
              label: "Expense",
              data: [cat.amount],
              backgroundColor: [cat.color],
            }],
          }
        : { labels: [], datasets: [] };
    }
    return {
      labels: categoryBreakdowns.map(c => c.category),
      datasets: [{
        label: "Expense",
        data: categoryBreakdowns.map(c => c.amount),
        backgroundColor: categoryBreakdowns.map(c => c.color),
      }],
    };
  })();

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { title: { display: true, text: "Category" } },
      y: { title: { display: true, text: "Amount" }, beginAtZero: true },
    },
  };

  if (barChart) barChart.destroy();
  barChart = new Chart(barCtx, {
    type: "bar",
    data: barData,
    options: barOptions,
  });

  // ---------- Line Chart – Monthly Income/Expense Trend ----------
  const lineCtx = document.getElementById("monthly-line").getContext("2d");
  const months = monthlyPoints.map(p => p.month);
  const incomeVals = monthlyPoints.map(p => p.income);
  const expenseVals = monthlyPoints.map(p => p.expense);

  const lineData = {
    labels: months,
    datasets: [
      {
        label: "Income",
        data: incomeVals,
        borderColor: "var(--color-primary)",
        backgroundColor: "var(--color-primary)",
        tension: 0.3,
        fill: false,
      },
      {
        label: "Expense",
        data: expenseVals,
        borderColor: "var(--color-danger)",
        backgroundColor: "var(--color-danger)",
        tension: 0.3,
        fill: false,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { title: { display: true, text: "Month" } },
      y: { title: { display: true, text: "Amount" }, beginAtZero: true },
    },
  };

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(lineCtx, {
    type: "line",
    data: lineData,
    options: lineOptions,
  });
}

// Update both summary and charts when a filter button is clicked
function updateCharts(category) {
  renderSummary(category);
  renderCharts(category);
}

// Setup filter button event listeners
function initFilters() {
  const container = document.querySelector("#category-filters");
  container.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "filter-btn active";
  allBtn.textContent = "All";
  allBtn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    allBtn.classList.add("active");
    updateCharts(null);
  });
  container.appendChild(allBtn);

  window.FINANCE_DATA.categoryBreakdowns.forEach(cat => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-btn";
    btn.textContent = cat.category;
    btn.style.setProperty("--btn-color", cat.color);
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      updateCharts(cat.category);
    });
    container.appendChild(btn);
  });
}

// Main init – called on DOMContentLoaded from index.html
export function init() {
  // Ensure data is ready (data.js attaches FINANCE_DATA to window)
  if (!window.FINANCE_DATA) {
    console.error("FINANCE_DATA not found. Ensure data.js is loaded before script.js.");
    return;
  }
  renderSummary();
  renderCharts();
  initFilters();

  // Re‑render on window resize to keep canvas sizes correct (Chart.js handles it, but we force a redraw)
  window.addEventListener("resize", () => {
    if (barChart) barChart.resize();
    if (lineChart) lineChart.resize();
  });
}

// Auto‑initialize when the module is loaded (index.html will also call init on DOMContentLoaded for safety)
if (document.readyState !== "loading") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}
