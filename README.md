# Spec Record

A small, installable **mobile web app (PWA)** for recording quality-control
measurements. Set a spec range and tap value buttons, or use the built-in
**calculator keypad** — then jump to the summary to see the statistics, a
distribution bar graph, and the **over / under specification** percentages
against your limits.

No app store, no build step, no server. It runs in the phone browser, works
offline, and can be added to the home screen so it behaves like a native app.

## Features

- **Calculator keypad** – tap digits, `.`, and `±` like a calculator, then
  **Enter** to record. The running count, average, min and max update live.
- **Queue / bulk entry** – use **Next #** to line up several numbers before
  pressing Enter, or paste many at once separated by spaces, commas,
  semicolons or new lines (e.g. `12.1 12.3 11.9`). Handles 1–50 replications
  or many more.
- **Per-record name** – label what you're measuring (the "specification").
- **Summary page** with:
  - Replication count, **average**, **minimum**, **maximum**, range, std dev
  - **LSL / USL** specification-limit inputs
  - **% under**, **% in**, and **% over** specification, with a visual bar
  - A full list of every replication, with under/over values highlighted
- **Export CSV** of all replications plus the summary stats.
- **Offline & installable** – service worker caches everything; "Add to Home
  Screen" gives it an app icon and full-screen launch.
- **Auto-save** – your current record is kept in the browser (localStorage),
  so closing the tab won't lose data.

## How spec percentages are calculated

Using lower (LSL) and upper (USL) limits:

- **Under spec** = values `< LSL`
- **Over spec**  = values `> USL`
- **In spec**    = everything else

Each is shown as a percentage of the total number of replications. You can
fill in just one limit (only LSL or only USL) and it still works.

## Run it

It's all static files. Any of these work:

```bash
# Option A: Python
python3 -m http.server 8000
# then open http://localhost:8000 on a device on the same network

# Option B: Node
npx serve .
```

On your phone, open the page in the browser and choose **Add to Home Screen**
(Safari: Share → Add to Home Screen; Chrome: ⋮ menu → Install app).

> A service worker is used for offline support, which requires the page to be
> served over `http(s)` (not opened as a `file://` URL). Hosting the folder on
> any static host (GitHub Pages, Netlify, etc.) also works.

## Files

| File | Purpose |
|------|---------|
| `index.html` | App markup (entry + summary pages, tab bar) |
| `styles.css` | Mobile-first styling, light & dark themes |
| `app.js` | State, statistics, spec calculations, persistence |
| `manifest.json` | PWA metadata for installability |
| `sw.js` | Service worker for offline caching |
| `icons/` | App icons (192, 512, maskable) |
