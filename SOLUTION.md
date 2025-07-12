# Solution Overview & Trade-offs

## Approach

1. **Backend Refactor**
   - Replaced all synchronous file operations with async/await for non-blocking I/O.
   - Implemented server-side pagination and search for `/api/items` (using `limit`, `offset`, and `q` params).
   - For `/api/stats`, introduced in-memory caching with file watching to avoid unnecessary recalculation.
   - Added backend united tests for items routes.

2. **Frontend Refactor**
   - Updated data fetching logic to support pagination and search, and to handle aborting fetches on unmount to prevent memory leaks.
   - Integrated list virtualization (react-window) for smooth UI with large lists, but also provided a fallback to plain lists if needed.
   - Added loading skeletons and error states for better UX.
   - Added frontend tests to test core components.
   - Added the full URL of ItemDetail interface.

## Trade-offs

- **Performance vs. Simplicity**: 
  - Using in-memory cache with file watching for `/api/stats` is simple and fast for small to medium datasets, but may not scale for very large files or distributed deployments.Putting a simple API call in a useEffect hook may leads to race condition.Recommending react-query to call API in the production env to reduce some problems like race condition.

- **Virtualization vs. Accessibility**:
  - Virtualized lists (react-window) improve performance for large datasets, but can complicate accessibility and testing. Fallback to plain lists is easier to test and more accessible, but less performant for very large lists.

- **Error Handling**:
  - Error messages are now user-friendly, but some edge cases (e.g., network flakiness) may still result in less informative errors unless further refined.

- **Router/Context Usage in Tests**:
  - Wrapping components in the correct providers and routers is necessary for realistic tests, but can make test setup more verbose.

## Summary

The solution balances modern best practices (async I/O, pagination, virtualization, skeletons, robust testing) with simplicity and maintainability. 