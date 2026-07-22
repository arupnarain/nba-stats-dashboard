# Hardwood — NBA Stats & Analytics Dashboard

A live NBA statistics dashboard built with **React, Next.js, TypeScript, Tailwind CSS, and Radix UI**. It pulls real, current NBA data from public endpoints, normalizes it through a typed server-side layer, and presents it as a set of clean, reusable, performance-conscious React components.

**Live demo:** <!-- LIVE_URL -->

<!-- SCREENSHOT -->

---

## What it does

Six sections, each a self-contained feature module sharing one design system:

| Tab | What it shows | Data |
| --- | --- | --- |
| **Players** | Searchable grid of every rostered player with 2025-26 season averages | Per-athlete statistics |
| **Teams** | Team picker → full roster, sorted by scoring | Teams + statistics |
| **Leaders** | Interactive ranked bar chart across points, rebounds, assists, steals, blocks | Statistics |
| **Injuries** | Current injury reports grouped by team, with status badges | Injuries feed |
| **News** | Latest headlines with an **NBA / Summer League / G League** toggle | League news feeds |
| **Draft** | The full 2026 NBA Draft — picks, colleges, and drafting teams | Draft results |

All data is fetched at request time and cached; nothing is hard-coded or mocked.

## Architecture

The codebase is organized around a strict boundary between *the outside world* and *the UI*.

```
src/
├─ app/
│  ├─ api/                 # Route handlers: the ONLY thing that talks to the data source
│  │  ├─ players/route.ts  #   fetch → normalize → cache → typed JSON
│  │  ├─ teams/route.ts
│  │  ├─ injuries/route.ts
│  │  ├─ news/route.ts     #   validates ?league= against an allow-list
│  │  └─ draft/route.ts
│  ├─ layout.tsx           # React Query provider, metadata
│  └─ page.tsx
├─ lib/
│  ├─ types.ts             # Clean domain models — the app's vocabulary
│  ├─ espn/
│  │  ├─ client.ts         # Low-level fetch: timeout, caching, pagination
│  │  └─ mappers.ts        # Raw upstream JSON → domain models (defensive)
│  └─ api-client.ts        # Typed client the UI calls (never fetches upstream directly)
├─ hooks/useNbaData.ts     # React Query hooks
├─ components/
│  ├─ ui/                  # Design system: Card, Badge, Select, Avatar, …
│  ├─ features/            # One module per tab
│  └─ Dashboard.tsx        # Tabbed shell (Radix Tabs)
```

**Why the proxy layer?** Every upstream call goes through a Next.js route handler rather than the browser. That means:

- **Secrets stay server-side.** The public data source used here is keyless, but the moment an API key were required, it would live in this layer and never reach the client — the request shape wouldn't change at all.
- **CORS is a non-issue**, because the browser only ever calls same-origin `/api/*`.
- **Caching is centralized** at the edge (`s-maxage` + `stale-while-revalidate`), so repeat visitors and cold loads are fast.
- **The UI is insulated from the upstream shape.** The raw upstream JSON is messy and undocumented; the mapper layer turns it into clean, strictly-typed domain models. If the data source changed tomorrow, only the mappers would move — no component would.

## Performance

Frontend performance was a first-class concern, not an afterthought:

- **Minimal re-renders.** Player cards are `React.memo`'d, so typing in the search box never re-renders the cards on screen — only the list membership changes.
- **Responsive search over ~580 players.** The search input uses `useDeferredValue`, so keystrokes stay smooth while filtering runs against the deferred value. Derived/sorted lists are memoized with `useMemo`.
- **Server-side pagination aggregation.** The stats endpoint is paginated; the route handler pulls every page once, caches the result, and hands the client a single array — so all searching, sorting, and ranking happen in memory with zero extra round-trips.
- **Aggressive client cache.** React Query is configured with a 5-minute `staleTime` and `refetchOnWindowFocus: false` — the data changes at most daily, so the network stays quiet.
- **Zero web-font payload.** A system font stack means no font download and no layout shift.
- **Lazy media.** Headshots and logos lazy-load and are explicitly sized to prevent layout shift.

## Design system

A small `components/ui/` layer defines the shared vocabulary — `Card`, `Badge`, `Select`, `SegmentedControl`, `Avatar`, `Skeleton`, and consistent loading / empty / error states. Everything reads from a single set of CSS design tokens (surfaces, lines, text ramp, one accent), so the entire product can be re-skinned from `globals.css`. Interactive primitives (Select, Tabs) are built on **Radix UI** for accessibility and keyboard support out of the box.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Radix UI · TanStack React Query · Recharts

## Running locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

```bash
npm run build   # production build + type check
npm run lint    # eslint
```

---

*Data via ESPN's public endpoints. This project is a technical demonstration and is not affiliated with or endorsed by the NBA or ESPN.*
