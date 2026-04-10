'use strict';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Distinct colour palette for 12 monthly pie slices
const PIE_COLORS = [
  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
  '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac',
  '#7fc97f', '#fd8d3c'
];

let barChartInstance    = null;
let pieMonthlyInstance  = null;
let pieYearlyInstance   = null;

// ─── Build table rows ────────────────────────────────────────────────────────

/** Returns a random integer between 50 and 1000 inclusive */
function randDefault() {
  return Math.floor(Math.random() * 951) + 50;
}

function buildTableRows() {
  const tbody = document.getElementById('tableBody');
  MONTHS.forEach((month, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-medium text-center">${month}</td>
      <td>
        <input
          type="number"
          class="form-control form-control-sm income-input"
          id="income-${i}"
          min="0"
          step="0.01"
          value="${randDefault()}"
        />
      </td>
      <td>
        <input
          type="number"
          class="form-control form-control-sm expense-input"
          id="expense-${i}"
          min="0"
          step="0.01"
          value="${randDefault()}"
        />
      </td>
      <td class="text-center net-positive" id="net-${i}">₹0.00</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a number as ₹X,XX,XXX.XX (Indian locale) */
function fmt(value) {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return (value < 0 ? '-' : '') + '₹' + formatted;
}

/** Read all 12 income/expense pairs from the DOM */
function getInputData() {
  return MONTHS.map((month, i) => {
    const income  = parseFloat(document.getElementById(`income-${i}`).value)  || 0;
    const expense = parseFloat(document.getElementById(`expense-${i}`).value) || 0;
    return { month, income, expense };
  });
}

// ─── Update Data tab ─────────────────────────────────────────────────────────

function updateNetCells(data) {
  let totalIncome = 0;
  let totalExpense = 0;

  data.forEach(({ income, expense }, i) => {
    const net = income - expense;
    totalIncome  += income;
    totalExpense += expense;

    const cell = document.getElementById(`net-${i}`);
    cell.textContent = fmt(net);
    cell.className   = 'text-center ' + (net >= 0 ? 'net-positive' : 'net-negative');
  });

  const totalNet = totalIncome - totalExpense;
  document.getElementById('totalIncome').textContent  = fmt(totalIncome);
  document.getElementById('totalExpense').textContent = fmt(totalExpense);

  const totalNetCell = document.getElementById('totalNet');
  totalNetCell.textContent = fmt(totalNet);
  totalNetCell.className   = totalNet >= 0 ? 'net-positive' : 'net-negative';
}

// ─── Chart renderers ─────────────────────────────────────────────────────────

function renderBarChart(data) {
  if (barChartInstance) barChartInstance.destroy();

  barChartInstance = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Income',
          data: data.map(d => d.income),
          backgroundColor: 'rgba(13, 110, 253, 0.75)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 1
        },
        {
          label: 'Expense',
          data: data.map(d => d.expense),
          backgroundColor: 'rgba(220, 53, 69, 0.75)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => fmt(value)
          }
        }
      }
    }
  });
}

/**
 * Pie chart 1 — monthly expense proportions (12 slices).
 * When all expenses are zero, renders equal placeholder slices with a
 * "No data yet" tooltip to avoid an empty/broken chart.
 */
function renderPieMonthly(data) {
  if (pieMonthlyInstance) pieMonthlyInstance.destroy();

  const expenses = data.map(d => d.expense);
  const total    = expenses.reduce((a, b) => a + b, 0);
  const noData   = total === 0;

  pieMonthlyInstance = new Chart(document.getElementById('pieMonthly'), {
    type: 'pie',
    data: {
      labels: MONTHS.map((m, i) => `${m}: ${fmt(expenses[i])}`),
      datasets: [{
        data: noData ? new Array(12).fill(1) : expenses,
        backgroundColor: PIE_COLORS,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 14, padding: 10 } },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (noData) return ' No data yet';
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${fmt(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Pie chart 2 — yearly income vs expense (2 slices).
 * Shows total annual income vs total annual expense as proportions.
 */
function renderPieYearly(data) {
  if (pieYearlyInstance) pieYearlyInstance.destroy();

  const totalIncome  = data.reduce((a, d) => a + d.income,  0);
  const totalExpense = data.reduce((a, d) => a + d.expense, 0);
  const noData       = totalIncome === 0 && totalExpense === 0;
  const grandTotal   = totalIncome + totalExpense;

  pieYearlyInstance = new Chart(document.getElementById('pieYearly'), {
    type: 'pie',
    data: {
      labels: [
        `Income: ${fmt(totalIncome)}`,
        `Expense: ${fmt(totalExpense)}`
      ],
      datasets: [{
        data: noData ? [1, 1] : [totalIncome, totalExpense],
        backgroundColor: [
          'rgba(13, 110, 253, 0.8)',
          'rgba(220, 53, 69, 0.8)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 14, padding: 10 } },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (noData) return ' No data yet';
              const pct = ((ctx.parsed / grandTotal) * 100).toFixed(1);
              return ` ${fmt(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

function updateAll() {
  const data = getInputData();
  updateNetCells(data);
  renderBarChart(data);
  renderPieMonthly(data);
  renderPieYearly(data);
}

// ─── Tab switching (no Bootstrap JS required) ────────────────────────────────

function initTabs() {
  const navLinks = document.querySelectorAll('#mainTabs .nav-link');
  const panes    = document.querySelectorAll('.tab-pane');

  navLinks.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab-target');

      // Update nav-link active states
      navLinks.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update tab-pane visibility
      panes.forEach(pane => pane.classList.remove('show', 'active'));
      document.getElementById(targetId).classList.add('show', 'active');

      // Re-render charts when Chart tab becomes visible so Chart.js
      // can calculate correct canvas dimensions
      if (targetId === 'chartPanel') {
        updateAll();
      }
    });
  });
}

// ─── Download chart as PNG ────────────────────────────────────────────────────

/**
 * Downloads a Chart.js chart as a PNG file.
 * @param {Chart}  chartInstance - The Chart.js instance to export.
 * @param {string} filename      - Suggested filename (without extension).
 */
function downloadChartAsPng(chartInstance, filename) {
  if (!chartInstance) return;

  // Render the chart onto a plain white background so the PNG isn't transparent
  const sourceCanvas = chartInstance.canvas;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width  = sourceCanvas.width;
  exportCanvas.height = sourceCanvas.height;

  const ctx = exportCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.drawImage(sourceCanvas, 0, 0);

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href     = exportCanvas.toDataURL('image/png');
  link.click();
}

// ─── Username validation ─────────────────────────────────────────────────────

function validateUsername(value) {
  const errors = [];
  if (value.length < 5)                      errors.push('at least 5 characters');
  if (!/[A-Z]/.test(value))                  errors.push('1 uppercase letter');
  if (!/[0-9]/.test(value))                  errors.push('1 number');
  if (!/[^A-Za-z0-9]/.test(value))           errors.push('1 special character');
  return errors;
}

function initUsernameValidation() {
  const input    = document.getElementById('usernameInput');
  const feedback = document.getElementById('usernameFeedback');
  const form     = document.getElementById('usernameForm');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const errors = validateUsername(input.value);
    if (input.value.length === 0) {
      input.classList.remove('is-valid', 'is-invalid');
      input.classList.add('is-invalid');
      feedback.textContent = 'Username is required.';
      feedback.classList.remove('d-none', 'text-success');
      feedback.classList.add('text-danger');
    } else if (errors.length === 0) {
      input.classList.add('is-valid');
      input.classList.remove('is-invalid');
      feedback.textContent = `Welcome, ${input.value}! Username accepted.`;
      feedback.classList.remove('d-none', 'text-danger');
      feedback.classList.add('text-success');
    } else {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      feedback.textContent = 'Must include: ' + errors.join(', ') + '.';
      feedback.classList.remove('d-none', 'text-success');
      feedback.classList.add('text-danger');
    }
  });

  input.addEventListener('input', () => {
    const errors = validateUsername(input.value);
    if (input.value.length === 0) {
      input.classList.remove('is-valid', 'is-invalid');
      feedback.textContent = '';
      feedback.classList.add('d-none');
      feedback.classList.remove('text-success', 'text-danger');
    } else if (errors.length === 0) {
      input.classList.add('is-valid');
      input.classList.remove('is-invalid');
      feedback.textContent = '';
      feedback.classList.add('d-none');
      feedback.classList.remove('text-success', 'text-danger');
    } else {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      feedback.textContent = 'Must include: ' + errors.join(', ') + '.';
      feedback.classList.remove('d-none', 'text-success');
      feedback.classList.add('text-danger');
    }
  });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  buildTableRows();
  initTabs();
  initUsernameValidation();

  // Attach reactive input listeners
  document.querySelectorAll('.income-input, .expense-input').forEach(input => {
    input.addEventListener('input', updateAll);
  });

  // Download buttons
  document.getElementById('downloadBarChart').addEventListener('click', () => {
    downloadChartAsPng(barChartInstance, 'monthly-income-vs-expense');
  });
  document.getElementById('downloadPieMonthly').addEventListener('click', () => {
    downloadChartAsPng(pieMonthlyInstance, 'monthly-expense-proportions');
  });
  document.getElementById('downloadPieYearly').addEventListener('click', () => {
    downloadChartAsPng(pieYearlyInstance, 'yearly-income-vs-expense');
  });

  // Initial render of Data tab totals (charts render on first tab switch)
  const data = getInputData();
  updateNetCells(data);
});
