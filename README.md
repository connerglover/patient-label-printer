# GreenwayXLS2Label

A browser-based tool that turns a Greenway EMR **daily summary report** into a print-ready sheet of patient labels for lab and radiology orders.

Drop in the day's exported spreadsheet, review the patient list, and download a PDF sized for your label stock. What used to be manual transcription — one label at a time, per patient, per order — becomes a few seconds of work. For a busy practice, that's hours back every day, with no hand-typed MRNs to get wrong.

## What's on a label

Each label carries the three identifiers a specimen or requisition needs:

```
Name: Doe, Jane
ID: 123456
Date of Birth: 04/12/1978
```

Text is rendered rotated 90° so it reads correctly on portrait-fed label stock, and the default geometry (1.125" × 3.5") matches standard patient-ID label rolls.

## How it works

1. **Export** the daily summary report from Greenway EMR as `.xls` / `.xlsx`.
2. **Upload** it — click or drag-and-drop onto the upload card.
3. **Review** the parsed patient list. Remove anyone who doesn't need labels (individually, or check several and remove in bulk).
4. **Configure** labels if the defaults don't match your stock — copies per patient, dimensions, font, output filename. A live preview shows the result.
5. **Generate** the PDF. It downloads straight to your machine, ready to print.

### Parsing rules

The parser reads the first worksheet and scans every row, keeping the ones that look like patient entries:

| Source | Field |
| --- | --- |
| Column **B**, text before `[` | Patient name |
| Column **B**, digits inside trailing `[...]` | Medical record number |
| Column **D** | Date of birth |

A row qualifies as patient data when column B contains a comma and a bracketed ID (`Doe, Jane [123456]`). Everything else — headers, spacers, totals — is skipped silently. The scheduling placeholder `Surgery, Surgery [37222]` is excluded by name. Excel serial dates in column D are converted to `MM/DD/YYYY`; a blank DOB becomes `N/A`.

Rows that can't be parsed are logged to the browser console and skipped rather than aborting the run, so one malformed line never costs you the whole report. If nothing parses at all, the app reports an error instead of producing an empty PDF.

## Patient data stays local

Everything runs client-side. The spreadsheet is read in the browser via `FileReader`, parsed in memory, and rendered to PDF with jsPDF. **No patient data is uploaded, transmitted, or stored anywhere** — there is no backend. Closing the tab discards it all.

That said, the generated PDF contains PHI. Handle the downloaded file, and the printed labels, under your practice's normal HIPAA safeguards.

## Configuration

Defaults are set in [`LabelConfig`](src/utils/pdfGenerator.js), and all of these are adjustable from the Label Configuration panel at runtime:

| Setting | Default | Notes |
| --- | --- | --- |
| Labels per patient | `2` | 1–10 duplicate copies |
| Label dimensions | `1.125" × 3.5"` | Width × height, in inches |
| Font | Helvetica, 10 pt | Also Times or Courier |
| Output filename | `Patient_Labels.pdf` | |
| Margin | `0.12"` | Code-level default |
| Line height | `0.22"` | Code-level default |

## Development

Requires Node.js 18+.

```bash
cd web-app
npm install
npm run dev        # dev server with HMR
npm run build      # production build to dist/
npm run preview    # serve the production build
npm run lint       # ESLint
```

The build is fully static — `dist/` can be served from any web host or opened from an internal file share.

## Project structure

```
web-app/src/
├── App.jsx                      # top-level state: patients, config, errors
├── components/
│   ├── FileUpload.jsx           # drag-and-drop / picker, .xls & .xlsx validation
│   ├── PatientList.jsx          # review table, single + bulk removal
│   ├── LabelConfigPanel.jsx     # label settings with live preview
│   └── ui/                      # shadcn/ui primitives (Radix + Tailwind)
└── utils/
    ├── excelParser.js           # Patient model, spreadsheet → patient records
    └── pdfGenerator.js          # LabelConfig, patient records → PDF
```

Built with React 19, Vite 7, Tailwind CSS 4, shadcn/ui, [SheetJS (`xlsx`)](https://sheetjs.com/) for spreadsheet parsing, and [jsPDF](https://github.com/parallax/jsPDF) for PDF output.

## Troubleshooting

**"No valid patient data found in the Excel file"** — the report layout doesn't match the expected columns. Confirm names with bracketed IDs are in column B and DOB is in column D on the *first* worksheet, and that you exported the daily summary report rather than another view.

**Some patients are missing** — open the browser console; skipped rows are logged with the reason. A name missing its `[ID]` bracket or a row shorter than four columns is the usual cause.

**Labels print off-center or clipped** — adjust width and height in the configuration panel to match your stock exactly, and print at 100% scale with page scaling off.
