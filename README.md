# PatientLabelPrinter

Turn an EMR daily schedule export into a print-ready PDF of patient ID labels — entirely in your browser.

Drop in the day's exported spreadsheet, trim the patient list, and download a PDF sized for your label stock. What used to be manual transcription — one label at a time, per patient, per order — becomes a few seconds of work. For a busy practice, that's hours back every day, with no hand-typed MRNs to get wrong.

Originally built against **Greenway EMR's** daily summary report; any export with the same column layout works.

## What's on a label

Each label carries the three identifiers a specimen or requisition needs:

```
Name: Doe, Jane
ID: 123456
Date of Birth: 04/12/1978
```

On stock that is taller than it is wide, text is rotated 90° so it reads along the length of the label. On wider stock it prints horizontally. Long names shrink to fit rather than running off the edge.

## How it works

1. **Export** the daily summary report from your EMR as `.xls` / `.xlsx`.
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

The parser reads the first worksheet and scans every row, keeping the ones that look like patient entries:

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

Requires Node.js 20+ (CI and Pages builds pin 22 via [`.node-version`](.node-version)).

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
| `npm run preview:cf` | Build, then serve through Cloudflare's local runtime — the only way to exercise `_headers` |
| `npm run lint` | ESLint |
| `npm run deploy` | Build and deploy to Cloudflare Pages with Wrangler |

## Deploying to Cloudflare Pages

The build is fully static, so Pages serves it directly — no Functions, no Workers, no runtime config.

### Option A — connect the Git repo (recommended)

In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, pick this repository, then set:

| Setting | Value |
| --- | --- |
| Framework preset | None (or Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

Pages reads the Node version from [`.node-version`](.node-version). Every push to `main` publishes; other branches get preview deployments.

### Option B — deploy from your machine

```bash
npx wrangler login
```

```bash
npm run deploy
```

[`wrangler.toml`](wrangler.toml) supplies the project name and output directory.

### Custom domain

Recommended subdomain: **`labels.<yourdomain>`** — short, unambiguous, and it reads naturally next to the product name.

Add it under **Pages project → Custom domains → Set up a custom domain**. If the apex domain is already on Cloudflare, the `CNAME` is created for you; otherwise point `labels` at `<project>.pages.dev`.

After the domain is live, set `VITE_SITE_URL` so the canonical and Open Graph tags match. Either edit [`.env`](.env) or add a Pages environment variable of the same name — it is read at build time and substituted into `index.html`.

### What ships alongside the build

| File | Purpose |
| --- | --- |
| [`public/_headers`](public/_headers) | CSP, HSTS, frame/sniff protection, and immutable caching for hashed assets |
| [`public/theme-init.js`](public/theme-init.js) | Applies the saved theme before first paint (a separate file because the CSP forbids inline scripts) |
| [`public/robots.txt`](public/robots.txt), [`public/site.webmanifest`](public/site.webmanifest) | Crawler and install metadata |

There is no `_redirects` file: the app is a single route, so unknown paths should return a genuine 404 rather than a soft 200.

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

**"No patient rows found"** — the report layout doesn't match the expected columns. Confirm names with bracketed IDs are in column B and DOB is in column D on the *first* worksheet, and that you exported the daily summary report rather than another view.

**Some patients are missing** — open the browser console; skipped rows are logged with the reason. A name missing its `[ID]` bracket or a row shorter than four columns is the usual cause.

**Labels print off-center or clipped** — match width and height to your stock exactly, and print at 100% scale with page scaling off. If text still crowds the edges, raise the margin under **Typography & spacing**.

**Text is smaller than the size I set** — that's the auto-fit shrinking a long name to keep it on the label. Widen the stock or shorten the margin to get the requested size back.
