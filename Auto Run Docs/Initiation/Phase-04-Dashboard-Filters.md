# Phase 04: Frontend Dashboard & Filters

This phase builds the filter dashboard UI, connects it to the API, and creates a polished user experience with real tournament data from the database.

## Tasks

- [ ] Create FilterPanel component in `client/src/components/filters/FilterPanel.tsx` with: location text input, date range picker (start/end), multi-select for skill levels (2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0+), clear filters button

- [ ] Build DashboardLayout with sidebar/collapsible filter panel on desktop and slide-over sheet on mobile using shadcn Sheet component

- [ ] Implement filter state management in `client/src/hooks/useTournamentFilters.ts` with URL query param sync for shareable filtered views

- [ ] Create Pagination component using shadcn Pagination with prev/next and page number buttons, update API calls to use page param

- [ ] Add "No tournaments found" empty state with helpful message when filters return no results

- [ ] Enhance TournamentCard with hover effects, skeleton loading state, and truncate long tournament names gracefully

- [ ] Add search debouncing (300ms) to location filter to avoid excessive API calls

- [ ] Implement skill level badge coloring: different colors for beginner (green), intermediate (yellow), advanced (orange), pro (red).

- [ ] Add "Last updated" timestamp display showing when data was last scraped, fetch from scrape status API

- [ ] Test full filter flow: location search, date range, skill levels, pagination all working together correctly
