(function () {
  // Mock transaction data
  const mockData = [
    { id: '1', date: '2024-01-05', category: 'Food', amount: -45.2, type: 'expense', description: 'Groceries' },
    { id: '2', date: '2024-01-10', category: 'Salary', amount: 2500, type: 'income', description: 'Monthly salary' },
    { id: '3', date: '2024-01-12', category: 'Transport', amount: -30, type: 'expense', description: 'Gas' },
    { id: '4', date: '2024-02-03', category: 'Entertainment', amount: -60, type: 'expense', description: 'Concert' },
    { id: '5', date: '2024-02-15', category: 'Utilities', amount: -120, type: 'expense', description: 'Electricity bill' },
    { id: '6', date: '2024-02-20', category: 'Salary', amount: 2500, type: 'income', description: 'Monthly salary' },
    { id: '7', date: '2024-03-02', category: 'Shopping', amount: -200, type: 'expense', description: 'Clothes' },
    { id: '8', date: '2024-03-10', category: 'Food', amount: -70, type: 'expense', description: 'Dining out' },
    { id: '9', date: '2024-03-15', category: 'Salary', amount: 2500, type: 'income', description: 'Monthly salary' },
    { id: '10', date: '2024-03-18', category: 'Transport', amount: -25, type: 'expense', description: 'Bus pass' }
  ];

  const categories = ['All', ...Array.from(new Set(mockData.map(t => t.category)))];
  let activeCategory = 'All';

  // Elements
  const summaryContainer = document.getElementById('summary-cards');
  const filterContainer = document.getElementById('category-filters');
  const barCtx = document.getElementById('barChart').getContext('2d');
  const lineCtx = document.getElementById('lineChart').getContext('2d');

  // Chart instances
  let barChart, lineChart;

  // Initialize filter buttons
  function initFilters() {
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat;
      btn.className = 'filter-btn' + (cat === 'All' ? ' active' : '');
      btn.dataset.category = cat;
      btn.addEventListener('click', () => {
        activeCategory = cat;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.category === cat));
        updateDashboard();
      });
      filterContainer.appendChild(btn);
    });
  }

  // Compute aggregates based on filtered data
  function computeAggregates(data) {
    const summary = {
      totalBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0
    };
    const byCategory = {};
    const monthlyMap = {};

    data.forEach(t => {
      const amt = t.amount;
      summary.totalBalance += amt;
      if (t.type === 'income') summary.totalIncome += amt;
      else if (t.type === 'expense') summary.totalExpenses += amt;

      // Category aggregation for bar chart (expenses only)
      if (t.type === 'expense') {
        byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(amt);
      }

      // Monthly aggregation for line chart
      const month = t.date.slice(0, 7); // YYYY-MM
      if (!monthlyMap[month]) {
        monthlyMap[month] = { income: 0, expenses: 0 };
      }
      if (t.type === 'income') monthlyMap[month].income += amt;
      else monthlyMap[month].expenses += Math.abs(amt);
    });

    summary.totalSavings = summary.totalIncome + summary.totalExpenses; // expenses are negative

    const monthly = Object.keys(monthlyMap)
      .sort()
      .map(m => ({ month: m, income: monthlyMap[m].income, expenses: monthlyMap[m].expenses }));

    return { summary, byCategory, monthly };
  }

  // Render summary cards
  function renderSummaryCards(summary) {
    summaryContainer.innerHTML = '';
    const cards = [
      { title: 'Balance', value: summary.totalBalance.toFixed(2), color: 'primary' },
      { title: 'Income', value: summary.totalIncome.toFixed(2), color: 'success' },
      { title: 'Expenses', value: Math.abs(summary.totalExpenses).toFixed(2), color: 'danger' },
      { title: 'Savings', value: summary.totalSavings.toFixed(2), color: 'warning' }
    ];
    cards.forEach(c => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div class="card-title">${c.title}</div>
        <div class="card-value" style="color: var(--color-${c.color});">$${c.value}</div>
      `;
      summaryContainer.appendChild(div);
    });
  }

  // Initialize charts
  function initCharts() {
    barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Expenses by Category',
          data: [],
          backgroundColor: []
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
        labels: [],
        datasets: [
          {
            label: 'Income',
            borderColor: 'var(--color-success)',
            backgroundColor: 'var(--color-success)',
            fill: false,
            tension: 0.1,
            data: []
          },
          {
            label: 'Expenses',
            borderColor: 'var(--color-danger)',
            backgroundColor: 'var(--color-danger)',
            fill: false,
            tension: 0.1,
            data: []
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

  // Update charts with new data
  function updateCharts(aggregates) {
    // Bar chart (expenses by category)
    const catLabels = Object.keys(aggregates.byCategory);
    const catValues = catLabels.map(k => aggregates.byCategory[k]);
    const palette = [
      '#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
    ];
    barChart.data.labels = catLabels;
    barChart.data.datasets[0].data = catValues;
    barChart.data.datasets[0].backgroundColor = catLabels.map((_, i) => palette[i % palette.length]);
    barChart.update();

    // Line chart (monthly trend)
    const months = aggregates.monthly.map(m => m.month);
    const incomes = aggregates.monthly.map(m => m.income);
    const expenses = aggregates.monthly.map(m => m.expenses);
    lineChart.data.labels = months;
    lineChart.data.datasets[0].data = incomes;
    lineChart.data.datasets[1].data = expenses;
    lineChart.update();
  }

  // Main update flow
  function updateDashboard() {
    const filtered = activeCategory === 'All' ? mockData : mockData.filter(t => t.category === activeCategory);
    const aggregates = computeAggregates(filtered);
    renderSummaryCards(aggregates.summary);
    updateCharts(aggregates);
  }

  // Init
  initFilters();
  initCharts();
  updateDashboard();
})();