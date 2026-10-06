# Filing Flows · Disclosure Hub v2

An English-first, independent public-disclosure dashboard combining the earlier **13F standalone library** with **congressional PDF/OCR**, **CFTC COT**, **FDIC bank financials**, and **SEC N-PX**.

The original `eurikamonica/filing-flows` repository remains untouched. No repository was created, pushed or deployed during preparation of this package.

**Default contact:** `Eurika eurikamonica@gmail.com`. This is the default HTTP User-Agent and the identity used by the workflow's data commits. It is a public contact identifier, not a password. A nonempty `SEC_USER_AGENT` environment variable overrides it; an empty secret falls back to configuration.

## Open immediately

1. Extract the ZIP.
2. Open `START-HERE.html`, then select **Open the dashboard**. Alternatively open `docs/index.html` directly.
3. The default view uses the bundled official snapshot. The source selector switches to separately labeled fictional demo data.
4. Explore **13F Holdings**, **Congress**, **PDF / OCR**, **COT**, **Banks**, **N-PX**, and **Health**.

No installation is required just to view the bundled dashboard. No frontend CDN, paid data API or npm build is required.

## What is implemented

| Module | Acquisition | Analysis and visualization |
|---|---|---|
| 13F | SEC recent filings and historical submissions shards; XML cover + information tables; originals, restatements and new-holdings amendments | Manager/quarter selection, arbitrary earlier-period comparison, treemap, weight-change bars, portfolio value history, security quantity history, CUSIP/issuer search, Put/Call separation, CSV |
| Congressional disclosures | Automatic House annual-index discovery and PDF download for configured names/years; explicit Senate/state/local PDF imports | Reviewed annual asset ranges, reviewed transactions, comparison of reviewed annual excerpts, source links, ownership labels and separate filing/event dates |
| PDF / OCR | Text extraction with pdfplumber; scanned-page fallback using Poppler + Tesseract; optional forced OCR | Source-page review queue, editable asset/transaction fields, source-hash validation and reviewed CSV export |
| COT | Official Disaggregated and TFF futures-only APIs | Net positions, weekly changes, 52-observation range index, historical chart and CSV |
| Banks | FDIC BankFind selected Call Report-derived metrics | Historical quarterly balances, comparisons and YTD-to-quarter net income |
| N-PX | SEC submissions + XML vote tables | Per-filing votes, issuer/proposal search, direction filters and CSV |
| Operations | GitHub Actions + Pages template; retries, source hashes, previous valid data retention | Source health, partial/error coverage, source evidence artifacts |

### Scope of congressional coverage

Automatic acquisition is implemented for the **House watchlist**, not every legislator nationwide. The initial watchlist is Nancy Pelosi, with annual indexes for 2024–2026. Last-name matching is a discovery filter; the displayed full filer name and district come from the index.

Senate and state/local PDFs can be imported after obtaining them through their official access process. There is no bypass of portal acknowledgments, sessions or report-request procedures. Their automatic portal adapters are **not implemented**.

**OCR candidates are not holdings.** The Congress view contains only reviewed rows. The package includes six source-checked excerpts: five asset rows across two annual reports and one PTR transaction. This is deliberately labeled partial coverage, not a complete asset inventory. There are 294 extracted candidate intervals in total across the downloaded reports, including the six source-checked records; some candidates represent income or other amounts and require review.

## Bundled official snapshot

Collected or verified on 2026-10-06; report dates remain visible and may be older.

| Source | Snapshot coverage |
|---|---|
| 13F | Berkshire Hathaway: 8 filings resolved into 7 periods, through 2026-06-30. Pershing Square: 7 filings resolved into 6 periods, through 2026-03-31 in the retrieved submissions response. These are the periods returned by the source, not a promise that newer filings cannot exist. |
| House | 14 reports, 2024–2026 index years; two annual reports and twelve PTRs; 294 extracted candidate intervals; 6 source-checked records |
| COT | WTI, gold and Japanese yen; 2,940 category/date records, 2023-01-03 through 2026-09-29 |
| FDIC | CERT 628, 3510 and 3511; 78 bank-quarter observations, 2020 Q1 through 2026 Q2 |
| N-PX | Two Nitorum Capital filings, 2024 and 2025; 70 vote-table rows |

A 13F position is a disclosed quarter-end position, not a real-time trading position. Congressional value ranges and PTRs cannot reconstruct exact current portfolios. See `METHODOLOGY.md`.

## Local collection — Windows

From the extracted project root, use PowerShell:

```powershell
py -3.12 --version
py -3.12 -m pip install -r requirements.txt
py -3.12 -m unittest discover -s tests -v

# The supplied contact is already configured; this override is optional.
$env:SEC_USER_AGENT = "Eurika eurikamonica@gmail.com"

py -3.12 app/collect.py --only holdings
py -3.12 app/collect.py --only congress
py -3.12 app/collect.py --only all
py -3.12 app/serve.py
```

The server opens `http://127.0.0.1:8080`. `START-WINDOWS.cmd` launches the same server. No npm.ps1 or PowerShell activation script is required.

`requirements.txt` installs the PDF library. Scanned documents additionally require **Tesseract** and **Poppler** on PATH. If you prefer not to configure OCR on Windows, use the GitHub Actions workflow, which installs both automatically. See `OCR-AND-CONGRESS.md` for verification commands.

On Linux/macOS use `python3` instead of `py -3.12`. On Ubuntu:

```bash
python3 -m pip install -r requirements.txt
sudo apt-get update
sudo apt-get install -y tesseract-ocr poppler-utils
python3 app/collect.py --only all
python3 app/serve.py
```

Sources are independent. Use `--only holdings`, `congress`, `cot`, `banks`, or `npx`. Use `--revalidate` to re-download stored SEC/House documents. Do not run two collectors writing to the same output directory simultaneously.

## Configuration

Edit `config/settings.json`:

- `http.sec_user_agent`: already set to `Eurika eurikamonica@gmail.com`.
- `holdings.managers`: SEC CIK/name watchlist. Initial CIKs: Berkshire `1067983`, Pershing Square `1336528`. To add the earlier library's Bridgewater entry, add `{"cik":"1350694","name":"Bridgewater Associates"}`.
- `holdings.since`: filing-date lower bound, initially `2025-01-01`. An amendment filed after this date may refer to an older period. Set earlier dates for deeper XML-era history; pre-May-2013 text reports are unsupported.
- Optional `holdings.as_of`: ISO filing-date cutoff. It limits filings used but does not provide a complete tick-level point-in-time archive or adjust for stock splits.
- `congress.years`, `congress.last_names`: House annual-index years and last-name filters.
- `congress.max_reports_per_year`: 20 initially, across matching names in each index. Truncation is explicit; increase it as needed.
- `congress.max_pdf_pages`: 100. Larger PDFs fail explicitly rather than silently truncate.
- `congress.ocr_dpi`: 200.
- `config/imports.json`: explicit local PDF imports; examples in `imports/README.md`.
- `config/reviewed-disclosures.csv`: reviewed records, tied to the original PDF SHA-256.
- Existing `cot`, `banks`, and `npx` settings retain their previous functions.

FDIC accepts an optional `FDIC_API_KEY`; CFTC accepts an optional `CFTC_APP_TOKEN`. Do not place keys in public configuration. This package's FDIC snapshot was retrieved without a key, but that is not a guarantee of future access without one.

## Deployment

**Recommended: a new repository named `filing-flows-disclosure-hub`.** Follow `DEPLOY-GITHUB.md`.

The ZIP contains **no dot-prefixed file or directory**. Its workflow is stored visibly at `automation/update-and-deploy.yml`. GitHub requires workflows under `.github/workflows/`; create that path in GitHub's web editor after uploading, or run the included installer and upload using Git.

Schedules supplied:

- 13F: every 15 minutes, subject to GitHub's scheduling delays.
- House watchlist: hourly.
- All modules: daily at 10:43 UTC.
- Revalidate stored source files on the Sunday daily run or via manual dispatch.

This is a configured-source pilot. Large all-market coverage should move raw files to durable object storage and use a database/queue rather than growing one JSON file indefinitely.

## Project map

```text
app/core.py                 Shared client, COT, FDIC and N-PX
app/holdings13f/             Reused prior 13F parser, amendments and comparisons
app/holdings.py              Integrated 13F collector
app/congress.py              House acquisition, PDF/OCR, review validation
app/ocr_document.py          Local single-PDF extraction CLI
app/collect.py               Unified collector CLI
app/serve.py                 Local preview server
config/settings.json        Contact and source watchlists
config/imports.json         Senate/state/local PDF imports
config/reviewed-disclosures.csv  Reviewed source-bound records
imports/                    PDFs you choose to import
automation/                 Visible workflow template and installer
docs/                       Deploy only this folder to Pages
tests/                      Data and template tests
notes/                      Acquisition evidence and provenance
```

See `VALIDATION.md` for exact verified behavior and limitations. The web interface has template/logic checks but has not been tested in a real browser in this environment.
