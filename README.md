# Facewall

A modern, animated employee photo wall built with React, TypeScript, and Vite. Inspired by the original [HubSpot Facewall](https://github.com/HubSpot/facewall) open-source project, this version is a ground-up rewrite designed for today's web — featuring smooth animations, rich customization, multiple data sources, and a polished settings UI.

---

## What It Does

Facewall displays your team's photos as rows of continuously scrolling tiles. Periodically, one person is selected, highlighted with a glowing ring, and lifted from the wall to a featured card in the center of the screen — complete with their name, role, and a 3D wobble animation. The card then flies back to its tile and the cycle continues.

It's designed to run on a lobby display, a TV in the office, or any screen where you want a living, breathing view of your team.

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install & Run

```bash
git clone <your-repo-url>
cd facewall
npm install
npm run dev
```

The app runs at `http://localhost:5173/facewall/` by default (Vite will pick another port if 5173 is in use).

### Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host — Nginx, GitHub Pages, S3, Vercel, Netlify, etc. The app is served under the `/facewall/` base path. To change it, update the `base` field in `vite.config.ts`.

### Preview the Production Build Locally

```bash
npm run preview
```

---

## Data Sources

Configure your data source in **Settings → Profile Data Source**.

### Demo (randomuser.me)

The default mode. Fetches real random profile photos from [randomuser.me](https://randomuser.me) — great for testing and demos. You can choose how many users to load (10–100).

### Custom JSON URL

Point the app at any HTTP endpoint that returns JSON in this shape:

```json
{
  "users": [
    {
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "Engineering Manager"
    }
  ]
}
```

The endpoint must be reachable from the browser and support CORS. Photos are loaded from Gravatar using each user's email address. Use the **Test** button in Settings to verify connectivity before saving.

### Slack Workspace

Pull real profile photos and names directly from your Slack workspace via a local server-side proxy, so your Bot Token never touches the browser.

**Setup:**

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new Slack app.
2. Under **OAuth & Permissions**, add the `users:read` and `users:read.email` Bot Token Scopes.
3. Install the app to your workspace and copy the `xoxb-…` Bot Token.
4. Create a `.env` file in the project root:
   ```
   SLACK_TOKEN=xoxb-your-token-here
   ```
5. Restart `npm run dev` — the Vite dev server proxies `/api/slack/*` requests automatically.

Only members with a custom profile photo are shown. Bots and deactivated accounts are excluded automatically.

---

## Features

### Animated Photo Wall

Employees are shuffled into rows that scroll continuously, alternating direction (odd rows go left, even rows go right). The number of rows is calculated automatically based on your team size, or you can set it manually. Tiles are clickable and support a configurable gap between them.

### Featured Card Cycle

When a person is selected for the spotlight:

1. **Highlight** — a pulsing glow ring tracks their tile as it scrolls across the screen, following it in real time via `requestAnimationFrame`.
2. **Lift** — the card flies from the tile's current on-screen position to the center, flipping in with a `rotateY` animation and a blurred backdrop.
3. **Wobble** — the card settles into place with a left-right 3D wobble effect and a colored glow outline that matches your highlight color.
4. **Dismiss** — the card flies back to where the tile currently sits (which may have scrolled) and the tile fades back in seamlessly.

Selection is intentional: only employees in the middle rows are chosen (never top or bottom edge rows), and tiles too close to the left or right edge of the screen are skipped — so the highlight ring is always clearly visible.

### Click to Feature

Click any tile on the wall to immediately feature that person, bypassing the automatic cycle.

### Pause / Resume

Press **Space** to pause the cycle at any time. The featured card stays visible indefinitely until you press Space again. A pill-shaped badge in the top-right corner indicates when the wall is paused.

### Clock Overlay

An optional clock in the bottom-center of the screen shows the current time in large light numerals with the full date below it. Ideal for lobby and waiting room displays.

### Kiosk Mode

Hides the navigation bar without requiring the browser to enter full screen — useful for Raspberry Pi installations, dedicated lobby TVs, or embedded iframe displays.

### Full Screen

The Full Screen button in the navigation bar enters native browser full screen. The nav bar hides automatically so nothing overlaps the wall. The tile rows expand to fill the full viewport height.

---

## Settings

All settings are saved automatically to `localStorage` in the current browser. Click **Save & Reload** to apply them and return to the wall.

### Display

| Setting | Description | Default |
|---|---|---|
| Featured card duration | How long the featured card stays visible | 5s |
| Scroll speed | How fast the rows scroll (px/sec) | 8 |
| Number of rows | Auto-calculate or force a specific count (1–7) | Auto |
| Tile gap | Spacing between tiles in pixels | 0px |
| Pause between features | Gap between one cycle ending and the next beginning | 0.7s |

### Card Style

| Setting | Description | Default |
|---|---|---|
| Card size | Width and height of the featured card (150–500px) | 300px |
| Photo shape | Rounded rectangle or circular crop | Rounded |
| Show role/title | Display the person's role beneath their name | On |

### Animation

| Setting | Description | Default |
|---|---|---|
| Lift speed | How fast the card flies from the wall to the center | 0.8s |
| Dismiss speed | How fast the card flies back to its tile | 1.2s |

### Appearance

| Setting | Description | Default |
|---|---|---|
| Show clock | Display time and date at the bottom of the wall | Off |
| Kiosk mode | Hide the nav bar without going full screen | Off |

### Theme

| Setting | Description | Default |
|---|---|---|
| Highlight color | Color of the glow ring and card outline | Purple (`#a855f7`) |
| Nav bar color | Background color of the navigation bar | Dark navy (`#0f172a`) |
| Background color | Color of the wall background | Dark blue (`#1a2535`) |

### Filtering

Enter role names (one per line) to exclude employees with those roles from ever being featured. Matching is case-insensitive. Excluded employees still appear in the scrolling wall — they just won't be selected for the spotlight.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| Styling | CSS Modules |
| Photos | Gravatar / randomuser.me / Slack API |

No external UI component libraries. No global state management. All animations are pure CSS transitions and `@keyframes` driven by React state — no animation libraries.

---

## Project Structure

```
src/
├── components/
│   ├── Facewall/          # Wall, featured card, highlight ring, clock, pause badge
│   ├── Navigation/        # Top nav bar with full screen toggle
│   └── Settings/          # Settings page — all controls and data source config
├── services/
│   ├── employees.ts       # Data loading (demo / custom URL / Slack)
│   └── slack.ts           # Slack API pagination and profile mapping
├── store/
│   └── settings.ts        # AppSettings type, defaults, localStorage read/write
├── utils/
│   └── gravatar.ts        # Gravatar URL helpers
├── types.ts               # Employee and related types
├── App.tsx                # Router shell, employee loading, layout
└── config.ts              # Static config (company name, legacy defaults)
```

---

## Credits

Inspired by the original **[HubSpot Facewall](https://github.com/HubSpot/facewall)** — an open-source project that pioneered the scrolling employee photo wall as a fun office display. This project is a modern TypeScript rewrite built from scratch, with a new architecture, animation system, and feature set, but the core concept of a living facewall belongs to the HubSpot team.
