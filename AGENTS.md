# Simple Expense Tracker — Workspace Instructions

This is a **static single-page expense tracker** with no backend, no build step, and no framework.
Always follow these project-wide conventions regardless of which file is being edited.

## Project Structure

| File         | Role                                                              |
| ------------ | ----------------------------------------------------------------- |
| `index.html` | Page structure, CDN links, tab nav, table, chart canvases         |
| `script.js`  | All logic — table generation, data reading, charts, tab switching |
| `plan.md`    | Project plan and decision log — do not delete or overwrite        |

Never create additional `.js` or `.html` files. All logic belongs in `script.js`.

## Key Patterns

### UI elements

All buttons must be a light pink color.

## General Coding Style

- Use `'use strict';` at the top of `script.js`.
- Prefer `const` and `let`; never use `var`.
- Use standard DOM APIs (`getElementById`, `createElement`, `querySelector`). No jQuery.
- Keep all logic in named functions. No anonymous top-level code outside `DOMContentLoaded`.

## Constraints (always apply)

- **No npm, no bundler, no build step.** The project must open directly in a browser as a local file.
- **No JavaScript frameworks.** Vanilla JS only.
- **CDN-only dependencies**, MIT-licensed or similarly permissive. Do not suggest libraries with commercial-use restrictions (e.g. Highcharts).
- **No Bootstrap JS bundle.** Tab switching is done entirely in vanilla JS via `initTabs()`.
- **No data persistence.** No `localStorage`, `sessionStorage`, cookies, or network requests.
- Current CDN dependencies (do not change versions without explicit approval):
  - Bootstrap CSS `5.3.3` — `cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css`
  - Chart.js `4.4.3` — `cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js`

## Tab Switching

- Tab switching is handled entirely by `initTabs()` in `script.js` using vanilla JS click handlers.
- Do not use `data-bs-toggle="tab"` or any Bootstrap JS tab API.
- Tab buttons use a custom `data-tab-target` attribute to identify the panel to show.
- When the Chart tab is activated, `updateAll()` must be called to ensure charts render correctly.

## Currency

- Indian Rupee (**₹**) only. Never introduce other currencies or currency-switching logic.
- Use the `fmt()` helper for all displayed monetary values (`en-IN` locale, `INR` currency).
- All monetary values must be formatted using `fmt()`:
  ```js
  fmt(value); // → ₹X,XX,XXX.00 using Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
  ```

## Chart.js Conventions

- Each chart instance is stored in a module-level variable (`barChartInstance`, `pieMonthlyInstance`, `pieYearlyInstance`).
- **Always call `.destroy()` on the existing instance before creating a new one** to prevent canvas reuse errors.
  ```js
  if (barChartInstance) { barChartInstance.destroy(); }
  barChartInstance = new Chart(...);
  ```
- Chart tooltips that display monetary values must prefix with `₹` and use the `en-IN` locale.
- Zero/empty state: when all inputs are 0 or empty, charts must render a graceful placeholder (e.g. equal slices with "No data yet" label) — never crash or render a blank canvas.

## Data Model & State

- **No localStorage, no sessionStorage, no backend.** Data is read from DOM inputs on every `input` event.
- The canonical data shape is an array of 12 objects: `{ month: string, income: number, expense: number }`.
- All data reads go through `getInputData()`. Do not access input elements directly outside that function.
- Net value per row = `income − expense`. Positive → `net-positive` class (green). Negative → `net-negative` class (red).

## Scope Boundaries (out of scope — do not add)

- Expense categories or sub-categories
- Budget targets or alerts
- Line or trend charts
- Data export (CSV, PDF)
- Multi-currency support
- Data persistence of any kind
