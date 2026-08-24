# Greenway Label Printer

Turn the **Greenway EMR daily summary report** into a print-ready PDF of patient ID labels — entirely in your browser.

> **Greenway only.** The parser is written against the column layout of Greenway's daily summary report. Exports from other EMRs — and other Greenway reports — will not parse. See [Parsing rules](#parsing-rules) for the exact layout it expects.

Drop in the day's exported report, trim the patient list, and download a PDF sized for your label stock. What used to be manual transcription — one label at a time, per patient, per order — becomes a few seconds of work. For a busy practice, that's hours back every day, with no hand-typed MRNs to get wrong.

## What's on a label

Each label carries the three identifiers a specimen or requisition needs:

```
Name: Doe, Jane
ID: 123456
Date of Birth: 04/12/1978
```

On stock that is taller than it is wide, text is rotated 90° so it reads along the length of the label. On wider stock it prints horizontally. Long names shrink to fit rather than running off the edge.

## How it works

1. **Export** the daily summary report from Greenway EMR as `.xls` / `.xlsx`.
2. **Upload** it — drag onto the drop zone or browse.
3. **Review** the parsed list. Filter by name or MRN, and remove anyone who doesn't need labels — individually or in bulk. Patients booked twice in one day are flagged as duplicates. Removals are undoable until you load a different file.
4. **Configure** the label stock. Pick a preset or set exact dimensions, copies per patient, font, and file name. A to-scale preview updates live.
5. **Generate** the PDF. It downloads straight to your machine, ready to print.

### Label stock presets

| Preset | Size | Notes |
| --- | --- | --- |
| Patient ID roll | 1.125″ × 3.5″ | Standard chart/lab label — the default |
| Avery 5160 | 2.625″ × 1″ | 30-up address sheet |
| Avery 5163 | 4″ × 2″ | 10-up shipping sheet |
| DYMO 30252 | 3.5″ × 1.125″ | Address roll (landscape) |
| Wristband insert | 1″ × 4″ | Tall narrow insert |

Any custom width and height works too.

### Parsing rules

The parser reads the first worksheet of the Greenway daily summary report and scans every row, keeping the ones that look like patient entries:

| Source | Field |
| --- | --- |
| Column **B**, text before `[` | Patient name |
| Column **B**, digits inside trailing `[...]` | Medical record number |
| Column **D** | Date of birth |

A row qualifies as patient data when column B contains a comma and a bracketed ID (`Doe, Jane [123456]`). Everything else — headers, spacers, totals — is skipped silently. The scheduling placeholder `Surgery, Surgery [37222]` is excluded by name. Excel serial dates in column D are converted to `MM/DD/YYYY`, including cells that arrive as bare serial numbers because the source column carried no date format; a blank DOB becomes `N/A`.

Rows that can't be parsed are logged to the browser console and skipped rather than aborting the run, so one malformed line never costs you the whole report. If nothing parses at all, the app reports an error instead of producing an empty PDF.

## Patient data stays local

Everything runs client-side. The spreadsheet is read in the browser via `FileReader`, parsed in memory, and rendered to PDF with jsPDF. **No patient data is uploaded, transmitted, or stored anywhere** — there is no backend. Closing the tab discards it all. The deployed site ships a Content-Security-Policy that blocks outbound connections to anything but its own origin.

That said, the generated PDF contains PHI. Handle the downloaded file, and the printed labels, under your practice's normal HIPAA safeguards.

## Configuration

Defaults live in [`LabelConfig`](src/utils/pdfGenerator.js); all of them are adjustable at runtime from the Label setup panel.

| Setting | Default | Range |
| --- | --- | --- |
| Labels per patient | `2` | 1–20 |
| Label dimensions | `1.125″ × 3.5″` | Width × height, in inches |
| Font | Helvetica, 10 pt | Also Times or Courier; shrinks automatically to fit |
| Output filename | `Patient_Labels.pdf` | `.pdf` appended if omitted |
| Margin | `0.2″` | Under **Typography & spacing** |
| Line height | `0.22″` | Under **Typography & spacing** |

## Development

Requires Node.js 20+ (Cloudflare builds pin 22 via [`.node-version`](.node-version)).

```bash
npm install
```

```bash
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build via Vite |
| `npm run preview:cf` | Build, then serve through Cloudflare's own runtime — the only way to exercise `_headers` |
| `npm run lint` | ESLint |
| `npm run deploy` | Build and deploy to Cloudflare with Wrangler |

## Deploying to Cloudflare

The build is fully static, so Cloudflare serves `dist/` directly through **Workers Static Assets** — no Worker script, no Functions, no runtime config. [`wrangler.toml`](wrangler.toml) points at the output directory; `npx wrangler deploy` is all the deploy step needs.

### Connected to Git (how it deploys today)

In the Cloudflare dashboard the project is built from this repository with:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

Cloudflare reads the Node version from [`.node-version`](.node-version). Every push to `main` publishes; other branches get preview URLs.

> If you ever see **"Missing entry-point to Worker script or to assets directory"**, `wrangler.toml` and the deploy command have drifted apart — `[assets] directory` must be present for `wrangler deploy` to have anything to upload.

### Deploying from your machine

```bash
npx wrangler login
```

```bash
npm run deploy
```

To exercise the production build through Cloudflare's own runtime — the only way to see `_headers` actually applied:

```bash
npm run preview:cf
```

### Custom domain

Recommended subdomain: **`labels.<yourdomain>`** — short, unambiguous, and it reads naturally next to the product name.

Add it under **the Worker → Settings → Domains & Routes → Add custom domain**. If the apex domain is already on Cloudflare, the DNS record is created for you.

After the domain is live, set `VITE_SITE_URL` so the canonical and Open Graph tags match. Either edit [`.env`](.env) or add an environment variable of the same name in the dashboard — it is read at build time and substituted into `index.html`.

### What ships alongside the build

| File | Purpose |
| --- | --- |
| [`public/_headers`](public/_headers) | CSP, HSTS, frame/sniff protection, and immutable caching for hashed assets |
| [`public/theme-init.js`](public/theme-init.js) | Applies the saved theme before first paint (a separate file because the CSP forbids inline scripts) |
| [`public/robots.txt`](public/robots.txt), [`public/site.webmanifest`](public/site.webmanifest) | Crawler and install metadata |

There is no `_redirects` file, and `not_found_handling` is set to `"none"`: the app is a single route, so unknown paths return a genuine 404 rather than a soft 200 that would let search engines index every typo'd URL as a copy of the homepage.

## Project structure

```
src/
├── App.jsx                      # top-level state: patients, config, messages
├── hooks/
│   └── useTheme.js              # class-based dark mode, persisted
├── components/
│   ├── AppHeader.jsx            # brand, privacy badge, theme toggle
│   ├── StepRail.jsx             # Upload → Review → Print progress
│   ├── DropZone.jsx             # drag-and-drop / picker with validation
│   ├── PatientTable.jsx         # filter, select, bulk remove, restore
│   ├── LabelSettings.jsx        # presets, dimensions, typography
│   ├── LabelPreview.jsx         # to-scale label render
│   ├── HowItWorks.jsx           # empty-state explainer
│   ├── BrandMark.jsx            # inline SVG logo
│   └── ui/                      # shadcn-style primitives (Radix + Tailwind)
└── utils/
    ├── excelParser.js           # Patient model, spreadsheet → patient records
    └── pdfGenerator.js          # LabelConfig, presets, records → PDF
```

Built with React 19, Vite 7, Tailwind CSS 4 (CSS-first `@theme`), Radix primitives, [SheetJS (`xlsx`)](https://sheetjs.com/) for spreadsheet parsing, and [jsPDF](https://github.com/parallax/jsPDF) for PDF output.

## Troubleshooting

**"No patient rows found"** — the layout doesn't match what Greenway's daily summary report produces. Confirm you exported the *daily summary report* from Greenway rather than another view, and that names with bracketed IDs are in column B with DOB in column D on the **first** worksheet. This tool does not read exports from other EMRs.

**Some patients are missing** — open the browser console; skipped rows are logged with the reason. A name missing its `[ID]` bracket or a row shorter than four columns is the usual cause.

**Labels print off-center or clipped** — match width and height to your stock exactly, and print at 100% scale with page scaling off. If text still crowds the edges, raise the margin under **Typography & spacing**.

**Text is smaller than the size I set** — that's the auto-fit shrinking a long name to keep it on the label. Widen the stock or shorten the margin to get the requested size back.

---

*Greenway Label Printer is an independent tool and is not affiliated with, authorised by, or endorsed by Greenway Health, LLC. "Greenway" is a trademark of its respective owner and is used here only to describe the report format this tool reads.*
