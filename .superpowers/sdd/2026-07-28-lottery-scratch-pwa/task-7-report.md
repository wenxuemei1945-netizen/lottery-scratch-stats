# Task 7 Report

## Status
Completed.

## Files Changed
- `src/pages/HomePage.test.tsx`
- `src/pages/StatsPage.test.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/StatsPage.tsx`
- `src/App.tsx`
- `src/styles.css`

## Commits Made
- `feat: show lottery statistics`

## Tests Run
- `npm.cmd test -- src/pages/HomePage.test.tsx src/pages/StatsPage.test.tsx`
  - Result: failed first in RED with the expected missing-statistics assertions.
  - Result after implementation: passed.
- `npm.cmd test -- src/pages/HomePage.test.tsx src/pages/StatsPage.test.tsx src/App.test.tsx`
  - Result: passed.
- `npm.cmd run build`
  - Result: passed.

## TDD Notes
- RED: added page tests first and confirmed both failed because the placeholder pages did not render the requested statistics.
- GREEN: implemented `calculateOverallStats` and `calculateGameStats` wiring in the page components, passed `tickets` into `StatsPage` from `App`, and added the required styling.

## Concerns
- None beyond the existing mojibake text in unrelated legacy labels elsewhere in the app; the Task 7 pages and tests are green and the build passes.
