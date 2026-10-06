# Deploy with GitHub Actions and GitHub Pages

Create a **new, independent repository**: `filing-flows-disclosure-hub`. Do not install this workflow in the original Filing Flows repository; it would introduce another Pages deployment there.

Expected URL after successful deployment:
`https://eurikamonica.github.io/filing-flows-disclosure-hub/`

This URL is a suggested deployment target, not an already-published site.

## 1. Upload the project

1. Create a public GitHub repository named `filing-flows-disclosure-hub`.
2. Extract this ZIP and enter the folder containing `README.md`, `app`, `docs`, `config` and `automation`.
3. Use **Add file → Upload files**. Upload those files and directories, not the ZIP and not an extra outer folder.
4. Confirm that `docs/index.html` and `app/collect.py` are directly under the corresponding root folders.

The ZIP has no dot-prefixed names and does not depend on drag-uploading a hidden directory.

## 2. Enable Pages

Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.

If you first used branch-based Pages, switch the Source setting. Do not keep two competing deployment workflows.

## 3. Create the workflow in GitHub's web editor

1. **Code → Add file → Create new file**.
2. Enter the full filename: `.github/workflows/update-and-deploy.yml`.
3. Copy the entire contents of `automation/update-and-deploy.yml` into the editor.
4. Commit to `main`.

GitHub recognizes only the required workflow directory. The visible `automation/` copy is a template and will not execute by itself. Creating the path in the web editor avoids the drag-upload issue.

Alternative for Git users:

```powershell
py -3.12 automation/install-workflow.py
```

Then commit/push using Git or VS Code source control. The installer creates the hidden workflow directory locally; it never overwrites an existing workflow. Do not rely on dragging that directory into the browser.

## 4. Contact and optional keys

The SEC contact is already configured as:

```text
Eurika eurikamonica@gmail.com
```

No additional secret is required for this default. Optional repository secrets under **Settings → Secrets and variables → Actions**:

| Secret | Purpose |
|---|---|
| `SEC_USER_AGENT` | Nonempty value overrides the configured contact |
| `FDIC_API_KEY` | Free official API key if FDIC requires it for your requests |
| `CFTC_APP_TOKEN` | Optional Socrata application token |

The contact is public in this package. Keys remain in Secrets and are sent in request headers. No SEC account login is required for these public EDGAR downloads.

## 5. Check workflow permissions

The supplied workflow declares:

```yaml
permissions:
  contents: write
  pages: write
  id-token: write
```

If organization/repository policy blocks writing, inspect **Settings → Actions → General → Workflow permissions**. The workflow commits updated snapshots to `main`; protected-branch rules must allow your chosen deployment design. It does not bypass branch protection.

## 6. Start the first run

Open **Actions → Collect disclosures and deploy → Run workflow**:

- Branch: `main`
- Module: `all`
- Revalidate: `false` for ordinary use; `true` to freshly verify stored SEC and House documents

The runner installs Python 3.12, pdfplumber, Poppler and Tesseract, runs tests, collects data, commits the snapshot, uploads evidence, and deploys **only `docs/`** to Pages.

After success, open the URL shown under **Settings → Pages** or the workflow's deployment environment.

## 7. Verify after deployment

1. **13F:** switch managers and periods; select an earlier baseline; test issuer/CUSIP and Put/Call filters; export CSV.
2. **Congress:** choose an annual report for asset ranges, or select transactions for a PTR. Empty reviewed rows are not zero holdings.
3. **PDF / OCR:** inspect a candidate and its original page; correct the fields; keep it as reviewed; export `reviewed-disclosures.csv`.
4. Save/upload that CSV to `config/reviewed-disclosures.csv`. Commit it, then run the Congress collection again. It becomes visible only after validation and deployment.
5. **COT / Banks / N-PX:** confirm source dates and CSV exports.
6. **Health:** inspect source errors, selected coverage and truncation.
7. Check layout and table scrolling on mobile. Real-browser visual QA was not available during package preparation.

## Schedules and behavior

| Trigger | Work performed |
|---|---|
| `7,22,37,52 * * * *` | 13F every 15 minutes |
| `17 * * * *` | House watchlist and imports hourly |
| `43 10 * * *` | All modules daily at 10:43 UTC; Sunday also revalidates stored documents |
| Manual dispatch | Selected module, optional revalidation |
| Source/config/import changes | All modules |

10:43 UTC is 06:43 in New York during daylight time and 05:43 during standard time. GitHub schedules are best effort and can be delayed or disabled under platform policies. Monitoring is not a promise of instant filing updates.

Jobs are serialized to prevent simultaneous snapshot writes. The fast 13F path skips installing system OCR packages; the PDF library remains available for tests.

A collector error preserves prior valid data where possible, publishes the source-health status, and then marks the workflow as failed. Review missing credentials, source responses, unsupported formats or coverage caps in the logs.

## Source evidence and storage

- `docs/data/live.json` and `live.js` retain the public snapshot and parsed 13F records needed for incremental reuse.
- Each run saves newly downloaded files and OCR page text under `storage/`.
- These files are uploaded as a `source-evidence-<run-id>` artifact with 30-day retention.
- Raw PDF/OCR artifacts are not included in the Pages output. Artifact retention is not a permanent archive.
- A public repository can still make committed source files and artifacts accessible. Use only appropriately obtained public documents in this project.

For long-running or broad coverage, use object storage for raw documents and a database for records. The simple commit-on-update approach will grow repository history, especially at a 15-minute schedule.

## Snapshot-only option

To publish without Actions or OCR installation, choose **Deploy from a branch → main → /docs**. The bundled dashboard works, but it will not update automatically. Run the collector locally and upload both `docs/data/live.json` and `docs/data/live.js` to refresh it.

## Troubleshooting

| Symptom | Check |
|---|---|
| Workflow absent | Create the actual `.github/workflows/update-and-deploy.yml` path; the visible template alone is inert |
| Pages 404 | Check root directory nesting, Pages Source, and workflow deployment logs |
| SEC 403/429 | Verify the contact override, inspect the source status, keep conservative request intervals |
| FDIC 401/403 | Obtain an official key and set `FDIC_API_KEY` |
| Tesseract / pdftoppm missing locally | Use Actions, or install both and add their executable folders to PATH |
| Congress candidates but no new holdings | Review records, export CSV, commit and rerun; candidates are intentionally separate |
| Source hash mismatch | PDF changed; recheck that source and update the reviewed record's hash through the review desk |
| `partial` / truncated coverage | Inspect per-source coverage and increase the relevant configured cap |
| `git push` fails | Inspect repository permissions, concurrent manual commits and protected-branch rules; rerun from the new head |
| 13F period absent | Check the returned filings, configured date range, 13F-NT notices and source errors; do not infer zero holdings |
| Data looks old | Report period, filing date, collection time and browser cache are distinct; inspect Health and refresh |
