# Online Information Search Survey

A mobile-first research instrument on **product involvement and online information
search behaviour**. It reproduces the flow from the study flow PDF, uses the scenario
content published on the study site, and records every behavioural indicator defined
in the measurement PDF.

- **Content** — the eight search situations from
  [sites.google.com/view/research-on-search](https://sites.google.com/view/research-on-search/multiple-situations)
- **Stimuli** — the eight advertisement videos from the study Drive folder
- **Flow** — the seven screens from the flow PDF (details → ad selection → stimulus →
  ad feedback → involvement → search → purchase intention)
- **Design** — the visual language in `public/design`, in light and dark themes
- **Storage** — private per-participant Drive folders plus `master-data.json`
- **Session replay** — privacy-masked DOM event capture stored as compressed chunks in Drive
- **Target** — iPhone SE (375 × 667) upward, adapting to desktop

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Researcher dashboard: **`/dashboard`** — charts, tables and CSV downloads. Also
linked from the completion screen.

Responses are written to Google Drive. The dashboard reads the private
`master-data.json` file through the server-side Apps Script receiver.

---

## The eight situations

Each "Ad" in the flow PDF is one search situation from the study site. `(h)` is the
high-involvement framing, `(l)` the low-involvement one.

| Ad | Site page | Involvement | Category | Sites offered |
|----|-----------|-------------|----------|---------------|
| 1 | Search Situation (h)L | high | Laptop | Flipkart, Amazon, Myntra, Croma, Reliance Digital |
| 2 | Search Situation (l)L | low | Laptop | Flipkart, Amazon, Myntra, Reliance Digital, Croma |
| 3 | Search Situation (h)F | high | Footwear | Flipkart, Amazon, Myntra, AJIO, Nykaa Fashion |
| 4 | Search Situation (l)F | low | Footwear | Flipkart, Myntra, Amazon, AJIO, Nykaa Fashion |
| 5 | Search Situation (h)H | high | Online Course | Coursera, edX, Udemy, LinkedIn Learning, SWAYAM |
| 6 | Search Situation (l)H | low | Online Course | SWAYAM, Udemy, edX, Coursera, LinkedIn Learning |
| 7 | Search Situation (h)D | high | Cold Drinks | Blinkit, Zomato, Zepto, Swiggy Instamart, bigbasket |
| 8 | Search Situation (l)D | low | Cold Drinks | Blinkit, Zomato, Zepto, Swiggy Instamart, bigbasket |

Scenario text is reproduced verbatim in `src/lib/situations-data.ts`.

Selection cards show **what is advertised** (Laptop, Footwear, Online Course,
Cold Drinks) plus the advertisement number — never the high/low message framing,
which is the experimental manipulation and must stay hidden. Two cards therefore
share each category, which is expected.

### The advertisements

The eight videos live in `public/ads/ad-1.mp4` … `ad-8.mp4` and are taken from
the `videos` subfolder of the study Drive folder, whose numbering matches the ad
numbering exactly. The ad **autoplays** the moment the participant reaches the ad
screen: it attempts playback with sound and falls back to muted with a visible
"Tap for sound" control when the browser blocks unattended audio. Participants
can pause, mute, replay, and use *Rewatch again*.

If a video file is missing, the player renders a generated motion advertisement
built from that situation's `adScript`, with identical autoplay, replay and
measurement behaviour — so the study still runs. See `public/ads/README.md`.

---

## What gets recorded

Captured for the **overall** task and separately per channel (Google Search / Direct
Website / Conversational AI):

| Code | Measure | Implementation |
|------|---------|----------------|
| SN1 | Result/source selection count | Every source-open event, repeat visits included |
| SN2 | Unique sources visited | Distinct sources |
| TE1 | Source/response dwell time (avg) | Total dwell ÷ items examined; numerator and denominator both exported |
| TE2 | Total search duration | Active seconds from task start to *Done* |
| CT1 | Scroll frequency | Distinct scroll gestures (events within 350 ms are one action) |
| CT2 | Maximum scroll depth (avg) | Per-source high-water mark, plus the PDF's 5-band coding |
| QD1 | Search request reformulation frequency | Requests after the initial one |
| QD2 | New information requirements introduced | Meaningful terms unseen in earlier requests; the terms themselves are exported |

Also recorded: Q1–Q10 responses, stimulus exposure seconds, rewatch count,
advertisement watch time and completion, whether live results were used, the
number of external site visits, and a timestamped event log of every query,
source open/close, scroll and external visit.

**Measurement notes**

- Durations are *active*: time while the tab is hidden is excluded from TE2 and dwell.
- CT2 is banded per the PDF — Top only 0–25%, Quarter 26–50%, Three quarters 51–75%,
  Near bottom 76–99%, Bottom reached 100%.
- In the AI channel, SN1/SN2 count **cited sources opened** (per the mapping table),
  while TE1 dwell also covers AI responses. `TE1_denominator` makes the difference
  explicit.
- The first result page opens on a seeded query, which is logged as the participant's
  initial search request, so QD1 counts genuine reformulations after it.
- Live counters are deliberately **not** shown to participants — visible metrics would
  influence the behaviour being measured.

---

## Storing responses in Google Drive

Every submission is written to `localStorage` first and then POSTed to
`/api/responses`. The server forwards it to the private Apps Script receiver; no
database or Turso account is required.

To write into the study's Drive folder:

1. Open [script.google.com](https://script.google.com) → **New project**.
2. Paste `scripts/drive-receiver.gs`. It already targets the study folder ID; set
   `SHARED_TOKEN` to a secret of your choice.
3. **Deploy → New deployment → Web app** — *Execute as: Me*, *Who has access: Anyone*.
4. Copy the `/exec` URL into `.env.local`:

```bash
SURVEY_WEBHOOK_URL=https://script.google.com/macros/s/…/exec
SURVEY_WEBHOOK_TOKEN=<the same secret>
ADMIN_TOKEN=<required in production to read GET /api/responses>
```

Each submission is stored in its own folder and upserted into the master file. A
spreadsheet row is also retained as a convenient human-readable index:

```text
participants/
  <name>-<age>-<gender>-<timestamp>/
    response.json
    replay/
      manifest.json
      chunk-<tab-id>-000000.json.gz
master-data.json
master-data.backup.json
Survey Responses
```

`master-data.json` contains every complete survey response, including behavioral
telemetry and replay metadata. Replay event chunks stay only in the participant folder
to avoid duplicating large payloads. The dashboard and every CSV/JSON export are derived
from the master file.

The receiver also supports event-only session replay. After updating
`scripts/drive-receiver.gs`, create a **new Apps Script deployment version** (editing the
source alone does not update an existing `/exec` deployment). Keep the same `/exec` URL
and token in the app environment.

The participant must consent before replay recording begins. Demographic fields appear
only after consent, so name, age, gender and the other entered answers are included in
the replay together with the final thank-you screen. It captures this app's DOM changes,
clicks, touch movement, scrolling and input events; it records only URL/timing annotations
for external websites. Replay chunks are packed and gzip-compressed before transport,
then stored as `.json.gz` files. Failed uploads are queued in IndexedDB and retried.
Researchers can open `/replays?token=<ADMIN_TOKEN>` or use the **Session replays** link
on the dashboard; the player includes fast playback, timeline seeking and per-participant
CSV/JSON downloads.

If Drive is temporarily unavailable, the completed response remains in the browser's
local backup and replay chunks remain in IndexedDB for retry. The Drive receiver is
required for the shared dashboard and exports.

### Exports

The researcher dashboard offers three downloads:

- **Responses CSV** — one row per participant, 83 columns (details, Q1–Q10, video, and all
  eight indicators × four channels)
- **Event log CSV** — one row per interaction, for sequence analysis
- **Raw JSON** — complete sessions

---

## Layout

```
src/
  app/
    layout.tsx                cookie-based theme, applied during SSR
    page.tsx                  stage machine for the seven screens
    dashboard/page.tsx        researcher dashboard (token-guarded)
    api/responses/route.ts    POST submit · GET list
    api/search/route.ts       live web search proxy
    api/reader/route.ts       page reader (SSRF-guarded)
    api/export/route.ts       CSV / JSON download
    globals.css               design tokens, light + dark
  components/
    DemographicsForm.tsx      screen 1 — participant details
    SituationGrid.tsx         screen 2 — the eight advertisements
    AdPlayer.tsx              autoplaying ad video + motion fallback
    StimulusScreen.tsx        screen 3 — advertisement + Q1-Q5
    ProductInvolvementForm.tsx screen 4 — Q6 + search briefing
    SearchInterface.tsx       screen 5 — three channels, all telemetry
    FinalIntentForm.tsx       screen 6 — Q7-Q10
    Dashboard.tsx             charts, tables, downloads
    ui.tsx                    shared primitives + theme toggle
  lib/
    situations-data.ts        the 8 situations, verbatim
    search-corpus.ts          fallback information environment per category
    telemetry-tracker.ts      SN/TE/CT/QD collection
    analytics.ts              in-memory dashboard rollups from the master file
    drive-data.ts             server-only master-data.json reader
    drive-replays.ts          server-only replay reader
    export.ts                 CSV builders
    local-store.ts            on-device backup
public/ads/                   the eight advertisement videos
scripts/drive-receiver.gs     Google Apps Script → Drive folder
```

### Notes for deployment

- `public/ads/*.mp4` is gitignored. The videos total ~235 MB —
  deploy them alongside the app, or track them with Git LFS if you want them in
  the repository.
- Redeploy the Apps Script as a new version whenever `drive-receiver.gs` changes;
  saving the Apps Script source alone does not update an existing web deployment.

### How the search channels work

Three modes run together, so the task stays realistic *and* measurable:

1. **Live results, read in-app.** `/api/search` fetches real web results
   server-side; opening one calls `/api/reader`, which fetches the page and
   returns extracted text. Because the text renders inside the app, scroll depth
   and dwell time stay observable — which is impossible inside a cross-origin
   iframe or a real browser tab.
2. **External visits.** Many commercial sites (Flipkart, Amazon, and similar)
   block server-side fetches. When the reader is refused, and from the *Visit
   site* button, the real site opens in a new window and the **time away is
   recorded as dwell** on that source, bracketed by `external_open` /
   `external_return` events.
3. **Fixed corpus fallback.** If live search is unavailable the built-in corpus
   (`src/lib/search-corpus.ts`) takes over, so a network problem never breaks a
   session. Set `SEARCH_MODE=corpus` to force it for every participant, which
   gives every participant an identical information environment — worth doing if
   you need strict experimental control.

The badge above the results tells the participant which mode is live.

## Accessibility

Built to WCAG 2.2 AA:

- All text meets 4.5:1 contrast in both themes (token values were solved for it).
- Visible keyboard focus on every control; a skip link is the first tab stop.
- One `<main>` landmark per screen, ordered headings, labelled form controls.
- The 7-point scales are real radio groups whose options announce their anchors
  ("1, Strongly disagree") rather than a bare digit.
- Touch targets are at least 44 × 44 px.
- `prefers-reduced-motion` is honoured.
- Theme follows the OS until the participant chooses; the choice is stored in a
  cookie and applied during SSR, so there is no flash of the wrong theme.
- Chart colours were validated for colour-vision deficiency, and every chart
  also carries direct labels and a table view.

**One gap:** the supplied videos have no captions, which WCAG 1.2.2 requires for
prerecorded audio. Add `.vtt` files and set `captionsSrc` per situation — see
`public/ads/README.md`.
