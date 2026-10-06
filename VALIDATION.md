# Validation report — v2

Date: 2026-10-06. Default acquisition identity: `Eurika eurikamonica@gmail.com`.

## Passed

- **50 Python unit tests**: 24 existing data/client tests, 17 reused 13F tests, 9 congressional extraction/review tests.
- **18 frontend template/logic checks**: seven views rendered in official and demo modes, plus escaping, safe links, CSV formula-text handling and null formatting. Uses a lightweight DOM substitute, not a browser.
- JavaScript syntax checks for both `docs/app.js` and `docs/extensions.js`.
- Live 13F collection: Berkshire 8 filings / 7 resolved periods; Pershing Square 7 filings / 6 resolved periods. Actual XML tables reconciled to their filing summaries.
- Live House acquisition: 14 PDFs discovered from official annual-index links, downloaded and text-extracted; 294 positional monetary-range candidates.
- Real OCR execution: forced Poppler/Tesseract extraction on House PTR 20035553, one page. It found the disclosed transaction interval; mean word confidence was approximately 91.96, which is not a financial accuracy score.
- Six congressional records checked against rendered official pages: five asset records on page 1 of the 2024/2025 annual reports and one transaction on page 1 of the 2026 PTR. Reviewed CSV source hashes and pages validated.
- Existing real COT, bank and N-PX snapshots retained from prior successful collection; their tests still pass.
- House annual-index year and filing date are separately preserved.
- Tests cover visually adjacent asset/income columns, open-ended intervals, unsupported filing codes, source-hash mismatches, missing transaction dates and candidate/approved separation.

## Not claimed

- No live GitHub Actions execution, remote repository write or Pages deployment was performed.
- No real-browser visual/interactivity/mobile/CSV-download validation was available in this environment. Perform the deployment acceptance checklist.
- The OCR smoke test used a real PDF rendered through forced OCR. It is not a benchmark across diverse historical scans, handwriting, rotated pages or damaged PDFs.
- Senate and state/local automatic portal acquisition is not implemented; PDF import and review are implemented.
- No exhaustive extraction or review of all congressional financial fields. Candidate intervals include non-asset amounts. The six reviewed examples are not a full portfolio.
- No automatic congressional amendment consolidation, ticker entity resolution, corporate-action adjustment or exact real-time holdings.
- No all-market coverage. Watchlists and configured date ranges control acquisition.
- No complete point-in-time backtest database or permanent raw-document archive. Workflow evidence expires after its configured retention.

## Reproduce checks

```powershell
py -3.12 -m pip install -r requirements.txt
py -3.12 -m unittest discover -s tests -v
node --check docs/app.js
node --check docs/extensions.js
node tests/test_ui.js
```

Node is needed only for the optional local JS checks, not for viewing or collecting data. The GitHub runner supplies Node for the included checks.

Live source verification:

```powershell
py -3.12 app/collect.py --only holdings --revalidate
py -3.12 app/collect.py --only congress --revalidate
```

Expect network and source changes; preserve and inspect any failed status rather than treating old data as freshly verified.
