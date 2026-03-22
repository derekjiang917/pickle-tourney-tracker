# SIGNUP-03: Frontend Design Demos

Create three self-contained HTML preview files showcasing different design approaches for the login + signup tracking UI. Each file should demonstrate the same set of UI states so the user can compare apples-to-apples:

1. **Header with login button** (logged-out state) and **user avatar/name** (logged-in state)
2. **Tournament cards** showing three states: normal (not registered), registered (with badge), and conflict (overlapping dates)
3. **Register button** in three states: default, registered/confirmed, conflict-warning
4. **"Did you sign up?" confirmation popup** — shown as an overlay on top of the card grid
5. **Conflict warning detail** — shown inside the modal/detail view when a conflict exists

Save all three files in `/home/coole/pickle-tourney-tracker/` (next to the existing `card-preview.html`).

The existing app aesthetic: dark background, DM Sans font, green primary (`#22c55e`), gradient radial bg. Each design should feel like a coherent evolution or alternative — not a clone of the existing app.

---

## Tasks

- [ ] **Create Design A: "Field Notes" aesthetic — `signup-design-a.html`**

  Save to `/home/coole/pickle-tourney-tracker/signup-design-a.html`.

  **Aesthetic direction**: Athletic training log / field notebook. Like a coach's clipboard crossed with a competition bracket sheet. Earthy warm tones (cream, khaki, forest green, inky black). Typewriter-style monospace for stats/dates, bold condensed sans-serif for headings. Rubber-stamp style badges. Paper texture via CSS noise. Cards look like index cards pinned to a cork board. The "registered" badge looks like a green ink stamp ("REGISTERED"). The conflict button state looks like a red stamp overlay ("CONFLICT"). Confirmation popup looks like a handwritten fill-in form with checkboxes.

  **UI elements to show**:
  - Header: app name in stencil/stamp font, "Sign in with Google" as a subtle text link on the right
  - Logged-in header variant: small passport-photo-style avatar circle + name + "Sign out" link
  - 3 tournament cards (index card style):
    - Card 1 (normal): register button as a bordered "REGISTER →" text button
    - Card 2 (registered): green ink stamp "REGISTERED ✓" overlaid on corner + dimmed register button
    - Card 3 (conflict): amber/red "CONFLICT" stamp, register button replaced with "⚠ Schedule Conflict" warning button in amber
  - Confirmation popup (shown as modal overlay): clipboard-style panel with tournament name, dates, and two large checkboxes: "✓ Yes, I registered" and "✗ No, remove it"
  - Conflict detail banner: a torn-paper style warning strip inside the modal showing conflicting tournament name + dates

  **Fonts**: Use Google Fonts — `Special Elite` (heading/stamp feel) + `IBM Plex Mono` (stats/dates) + `Oswald` (labels)
  **Colors**: `#f5f0e8` (cream bg), `#2d2416` (ink black), `#3d6b3f` (forest green), `#c44d2b` (warning red), `#c8a84b` (khaki gold)

  Make it fully interactive with JS: clicking the popup buttons should dismiss it with a satisfying animation.

- [ ] **Create Design B: "Scoreboard" aesthetic — `signup-design-b.html`**

  Save to `/home/coole/pickle-tourney-tracker/signup-design-b.html`.

  **Aesthetic direction**: Electric retro sports scoreboard. Dark stadium background, neon cyan and hot magenta accents, LED dot-matrix style display for dates/numbers, segmented display font. Think 1980s sports arcade meets modern UI. Cards look like scoreboard panels with sharp contrast. Registered state uses a pulsing neon green glow "IN" indicator (like a "vacancy" sign). Conflict state triggers a flashing red "CONFLICT" alarm strip. Confirmation popup feels like a scoreboard prompt asking "CONFIRM? Y/N".

  **UI elements to show**:
  - Header: app logo in LED/pixel font, animated score ticker scrolling tournament count, "SIGN IN" button in neon cyan outline
  - Logged-in header: player tag style display with avatar, name in LED font, "SIGN OUT" as dim text
  - 3 tournament cards (scoreboard panel style, dark bg with bright borders):
    - Card 1 (normal): "REGISTER" button as a thick cyan outlined rectangle with hover glow effect
    - Card 2 (registered): pulsing neon green "● REGISTERED" indicator in top-right, register button grayed out showing "ENTERED"
    - Card 3 (conflict): flashing amber/red "⚡ CONFLICT" strip across card top, register button replaced with "SCHEDULE CONFLICT" in warning styling
  - Confirmation popup: full-screen dark overlay with centered scoreboard-style prompt: tournament name in big LED font, "DID YOU COMPLETE YOUR REGISTRATION?" in block caps, two big buttons "Y — CONFIRMED" (green) and "N — REMOVE" (red)
  - Conflict detail: inside modal, a horizontal flashing ticker banner showing conflicting tournament info

  **Fonts**: `Orbitron` (headings/numbers/LED display) + `Share Tech Mono` (body/stats) — via Google Fonts
  **Colors**: `#0a0a12` (deep dark), `#00e5ff` (electric cyan), `#ff2d78` (hot magenta), `#39ff14` (neon green), `#ff9500` (warning amber), `#ff1a1a` (alarm red)

  Include CSS animations: pulsing glow on registered badge, subtle scan-line effect on cards, flicker on conflict warning. Make it interactive — popup buttons dismiss with animation.

- [ ] **Create Design C: "Clean App" aesthetic — `signup-design-c.html`**

  Save to `/home/coole/pickle-tourney-tracker/signup-design-c.html`.

  **Aesthetic direction**: Polished modern sports tracking app. Soft but not pastel — think premium fitness app. Deep navy/slate background (a slight evolution from the current app's dark green palette), cards with frosted glass effect, smooth transitions, rounded corners, clean iconography. The registered state uses a tasteful green checkmark badge in the card corner. Conflict state uses a soft amber warning that doesn't feel aggressive. Confirmation popup is a bottom sheet with smooth slide-up animation, clear progressive disclosure. This is the most "shippable" design — close to what would actually go in the app.

  **UI elements to show**:
  - Header: current app style header but with avatar + name dropdown (chevron) on the right when logged in; "Sign in with Google" pill button with Google logo SVG when logged out
  - 3 tournament cards (current app's card style but with signup state overlays):
    - Card 1 (normal): existing green "Register" button
    - Card 2 (registered): small green "✓ Registered" badge pinned to top-right card corner (pill shape), Register button replaced with "Registered" (filled green, checkmark icon)
    - Card 3 (conflict): amber "⚠ Conflict" pill badge on card corner, Register button becomes amber-tinted "Register (Conflict)" with tooltip on hover
  - Confirmation popup: bottom sheet (slides up from bottom) with rounded top corners, tournament image banner, tournament name + dates, two buttons side by side: "Yes, I registered ✓" (filled green) and "No, remove it" (ghost red). For desktop, it's a centered card modal instead. Show both variants in the HTML.
  - Conflict detail: inside modal, a soft amber callout box: "⚠ Schedule Conflict — This overlaps with [Tournament Name] (Apr 12–14). You can still register if you want."

  **Fonts**: `Sora` (headings) + `Nunito Sans` (body) — via Google Fonts. Geometric, friendly, premium feel.
  **Colors**: `#0f1923` (deep navy bg), `#1a2840` (card bg), `#22c55e` (green primary — matches existing), `#f59e0b` (amber warning), `#ef4444` (danger), `#94a3b8` (muted text), `#ffffff` (primary text)

  Include smooth CSS transitions on all interactive states. The popup bottom sheet uses CSS `transform: translateY` animation. Cards have subtle `box-shadow` depth. Make it interactive with JS — popup buttons work, conflict tooltip appears on hover.
