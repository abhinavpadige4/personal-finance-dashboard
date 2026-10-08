// data.js — Sample financial dataset for the personal finance dashboard
// Exports window.FINANCE_DATA with months, income, expenses, categories, and helper functions.

(function () {
  "use strict";

  // ── Monthly data (12 months) ──────────────────────────────────────────
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const income = [
    5200, 5400, 5100, 5600, 5300, 5800,
    5500, 5700, 5400, 5900, 5600, 6200
  ];

  const expenses = [
    3800, 4100, 3600, 4300, 3900, 4500,
    4000, 4200, 3700, 4400, 4100, 4800
  ];

  // ── Category breakdown (8 categories) ─────────────────────────────────
  const categoryPalette = [
    "#2563eb", "#16a34a", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
  ];

  const categories = [
    { category: "Housing",       amount: 14200, color: categoryPalette[0] },
    { category: "Food",          amount:  6800, color: categoryPalette[1] },
    { category: "Transport",     amount:  3400, color: categoryPalette[2] },
    { category: "Entertainment", amount:  2100, color: categoryPalette[3] },
    { category: "Healthcare",    amount:  1800, color: categoryPalette[4] },
    { category: "Shopping",      amount:  2900, color: categoryPalette[5] },
    { category: "Utilities",     amount:  2400, color: categoryPalette[6] },
    { category: "Education",     amount:  1500, color: categoryPalette[7] }
  ];

  // ── Per-category monthly breakdown for filtering ──────────────────────
  // Each category has a 12-month array of spending amounts.
  const categoryMonthly = {
    Housing:       [1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180],
    Food:          [560, 570, 550, 580, 560, 590, 570, 580, 560, 590, 570, 520],
    Transport:     [280, 290, 270, 300, 280, 310, 290, 300, 270, 310, 290, 310],
    Entertainment: [170, 180, 160, 190, 170, 200, 180, 190, 160, 200, 180, 220],
    Healthcare:    [140, 150, 130, 160, 140, 170, 150, 160, 130, 170, 150, 150],
    Shopping:      [240, 250, 230, 260, 240, 270, 250, 260, 230, 270, 250, 280],
    Utilities:     [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200],
    Education:     [120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120]
  };

  // ── Helper: compute summary totals ────────────────────────────────────
  function getSummary() {
    const totalIncome = income.reduce(function (sum, v) { return sum + v; }, 0);
    const totalExpense = expenses.reduce(function (sum, v) { return sum + v; }, 0);
    return {
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      netSavings: totalIncome - totalExpense
    };
  }

  // ── Helper: filter data by category ───────────────────────────────────
  // Returns an object with filtered monthly expenses, category list, and summary.
  function getFilteredData(category) {
    if (!category || category === "All") {
      return {
        months: months.slice(),
        income: income.slice(),
        expenses: expenses.slice(),
        categories: categories.slice(),
        summary: getSummary()
      };
    }

    // Filter to a single category
    const filteredCategories = categories.filter(function (c) {
      return c.category === category;
    });

    const filteredExpenses = categoryMonthly[category] || [];

    // Compute filtered summary
    const filteredTotalExpense = filteredExpenses.reduce(function (sum, v) { return sum + v; }, 0);
    const filteredSummary = {
      totalIncome: income.reduce(function (sum, v) { return sum + v; }, 0),
      totalExpense: filteredTotalExpense,
      netSavings: income.reduce(function (sum, v) { return sum + v; }, 0) - filteredTotalExpense
    };

    return {
      months: months.slice(),
      income: income.slice(),
      expenses: filteredExpenses,
      categories: filteredCategories,
      summary: filteredSummary
    };
  }

  // ── Helper: get all category names ────────────────────────────────────
  function getCategoryNames() {
    return categories.map(function (c) { return c.category; });
  }

  // ── Export ────────────────────────────────────────────────────────────
  window.FINANCE_DATA = {
    months: months,
    income: income,
    expenses: expenses,
    categories: categories,
    categoryMonthly: categoryMonthly,
    getSummary: getSummary,
    getFilteredData: getFilteredData,
    getCategoryNames: getCategoryNames
  };
})();
