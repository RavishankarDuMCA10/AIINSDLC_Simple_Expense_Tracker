# Project Plan: AIINSDLC Simple Expense Tracker

---

## Overview

A static single-page HTML expense tracker built from scratch with no backend or build tools.
All dependencies loaded via CDN. The UI is split into two tabs — **Data** (monthly input table)
and **Chart** (bar chart + two pie charts) — all reactive to user input.

---

## Iteration 1 — Initial Plan

### Requirements gathered
- Static HTML project (no framework, no build step)
- UI library for styling
- Income and expense inputs for months Jan–Dec
- Two tabs: **Data** and **Chart**
- Chart tab plots a bar chart and a pie chart from the Data tab inputs
- Suitable chart library to render charts

### Decisions made (via Q&A)
| Decision | Choice | Reason |
|---|---|---|
| UI library | Bootstrap 5.3 | Most popular, great components, easy tabs |
| Chart library | ~~Highcharts~~ → changed in Iteration 2 | Initially selected, changed due to licensing |
| Pie chart content | Monthly expense proportions (12 slices) | User selected |

### Initial architecture
- **`index.html`** — Bootstrap CDN, tab nav, Data tab table, Chart tab canvas containers
- **`script.js`** — input listeners, data reading, chart render functions

---

## Iteration 2 — Revised Plan (User Refinements)

### Changes requested
1. Currency symbol → **₹** (Indian Rupee) instead of £
2. Two pie charts instead of one:
   - **Pie chart 1** — Monthly expense proportions (12 slices, one per month)
   - **Pie chart 2** — Yearly income vs expense (2 slices: total income / total expense)
3. Chart library must be **free for commercial use** — Highcharts excluded

### Revised decisions
| Decision | Choice | Reason |
|---|---|---|
| Currency | ₹ (Indian Rupee) | User requirement |
| Chart library | **Chart.js 4.x** (MIT) | Free for commercial use, supports bar & pie natively |
| Pie chart 1 | 12 slices — monthly expense proportions | User requirement |
| Pie chart 2 | 2 slices — total annual income vs total expense | User selected |

---

## Final Architecture

### Libraries (all CDN, no install)
| Library | Version | License | CDN |
|---|---|---|---|
| Bootstrap | 5.3.3 | MIT | cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css |
| Chart.js | 4.4.3 | MIT | cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js |

> Bootstrap JS bundle was **removed** after the tab-switching bug fix (see Iteration 3).
> Tab switching is now handled entirely in `script.js`.

---

### Data Model
- 12 entries, one per month (Jan–Dec)
- Each entry: `{ month: string, income: number, expense: number }`
- Data is read from DOM inputs on every `input` event — no state object, no localStorage

---

### Tab 1: Data

- Bootstrap card containing a responsive `<table>`
- **Columns:** Month | Income (₹) | Expense (₹) | Net (₹)
- 12 `<tbody>` rows injected by `script.js` on `DOMContentLoaded`
- Each row has two `type="number"` inputs (income, expense) with `min="0" step="0.01"`
- **Net cell** is auto-computed (`income − expense`), coloured green if ≥ 0, red if negative
- `<tfoot>` totals row: summed Income | summed Expense | summed Net

---

### Tab 2: Chart

#### Bar chart
- **Type:** Grouped bar (Chart.js)
- **X-axis:** Jan–Dec
- **Series:** Income (blue) and Expense (red)
- **Tooltip:** prefixes values with ₹ in Indian locale format

#### Pie chart 1 — Monthly Expense Proportions
- **Type:** Pie (Chart.js)
- **Slices:** 12, one per month, sized proportionally to that month's expense
- **Zero state:** equal placeholder slices with "No data yet" tooltip

#### Pie chart 2 — Yearly Income vs Expense
- **Type:** Pie (Chart.js)
- **Slices:** 2 — total annual income (blue) vs total annual expense (red)
- **Zero state:** equal 50/50 placeholder with "No data yet" tooltip

---

### script.js Functions

| Function | Responsibility |
|---|---|
| `buildTableRows()` | Injects 12 month rows with input elements into `<tbody>` |
| `getInputData()` | Reads all 12 income/expense pairs from DOM inputs |
| `fmt(value)` | Formats a number as ₹X,XX,XXX.00 using en-IN locale |
| `updateNetCells(data)` | Computes net per row and totals, applies colour classes |
| `renderBarChart(data)` | Destroys previous instance and renders grouped bar chart |
| `renderPieMonthly(data)` | Destroys previous instance and renders monthly expense pie |
| `renderPieYearly(data)` | Destroys previous instance and renders yearly income/expense pie |
| `updateAll()` | Orchestrates all four update functions above |
| `initTabs()` | Self-contained tab switching — no Bootstrap JS required |

---

### Reactivity Strategy
- `input` event listeners on all `.income-input` and `.expense-input` → call `updateAll()`
- When Chart tab is opened (`initTabs` click handler), `updateAll()` re-renders all charts
- Chart instances stored in module-level variables; each render calls `.destroy()` first

---

## Iteration 3 — Bug Fix: Chart Tab Not Clickable

### Problem
The Chart tab button was unresponsive to clicks.

### Root cause
Tab switching relied entirely on Bootstrap JS (`data-bs-toggle="tab"`). If the Bootstrap JS
bundle failed to load, clicking the tab buttons silently did nothing.

### Fix applied
1. **`index.html`** — removed Bootstrap JS `<script>` tag; replaced `data-bs-toggle` /
   `data-bs-target` with a plain `data-tab-target` attribute
2. **`script.js`** — added `initTabs()`: vanilla JS click handlers toggle `active` / `show`
   Bootstrap CSS classes directly; calls `updateAll()` when Chart tab is activated
3. Removed the `shown.bs.tab` event listener (depended on Bootstrap JS)

### Outcome
Tab switching works with zero Bootstrap JS dependency — fully self-contained in `script.js`.

---

## Files

| File | Role |
|---|---|
| `index.html` | Page structure, Bootstrap CSS, tab nav, Data table, Chart canvases, CDN scripts |
| `script.js` | All logic — table generation, data reading, net calculation, charts, tab switching |
| `plan.md` | This file — full project plan and decision log |

---

## Verification Checklist

1. Open `index.html` directly in a browser (no server needed)
2. Bootstrap-styled page renders; two tabs visible
3. Click **Chart** tab → switches and charts render (bar + 2 pies in zero state)
4. Switch back to **Data** tab → enter values for multiple months
5. Net column updates correctly (green positive, red negative); totals row updates
6. Switch to **Chart** tab → all three charts reflect the entered data
7. Edit an input → charts re-render reactively on every keystroke
8. Clear all inputs → charts return to zero/placeholder state gracefully

---

## Scope Boundaries

| In scope | Out of scope |
|---|---|
| Monthly income & expense per row | Expense categories / sub-categories |
| Auto-computed net and totals | Budget targets or alerts |
| Bar chart + 2 pie charts | Line/trend charts |
| Reactive chart updates | Data persistence (localStorage, backend) |
| Indian Rupee (₹) formatting | Multi-currency support |
| Zero/empty state handling | Data export (CSV, PDF) |
