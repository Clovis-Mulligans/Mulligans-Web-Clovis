# Questions — `task/dash-spec-key-alignment-final`

## Security Scan

1. **No new attack surface.** All three changes are structural (key map scoping, option display, DOM attribute). No new user inputs, no new data paths, no `dangerouslySetInnerHTML`.

2. **BallsFields `(existing)` option:** The pack-size value displayed in the `(existing)` option comes from `specifications.packSize` (a stored number). It's rendered via React JSX auto-escaping into an `<option>` element — no XSS vector.

3. **Auth/data unchanged.** No middleware, route, or API client modifications.

## Items Not Verified

1. **Live browser testing.** Changes validated via typecheck + 37 unit tests only. Dev server not started.
