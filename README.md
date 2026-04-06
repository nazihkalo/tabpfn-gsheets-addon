# TabPFN Google Sheets Add-on

A Google Sheets add-on for training and predicting with [TabPFN](https://github.com/PriorLabs/tabpfn) — a large pre-trained foundation model for tabular data. Run **classification** and **regression** tasks directly from your spreadsheet with zero feature engineering, hyperparameter tuning, or ML expertise.

TabPFN is developed by [Prior Labs](https://priorlabs.ai) and works out of the box on mixed data types (numbers, text, dates, missing values) without any preprocessing.

## How It Works

The add-on provides a sidebar UI with a simple 3-step workflow:

1. **Connect** — Enter your free PriorLabs API key
2. **Fit** — Select a training data range, pick the target column, and choose classification or regression
3. **Predict** — Select test data, choose an output type, and predictions are written back to your sheet

Under the hood, the add-on converts your selected ranges to CSV, sends them to the [TabPFN API](https://docs.priorlabs.ai) (`/v1/fit` and `/v1/predict`), and writes the results back into your spreadsheet.

## Video Walkthrough 

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/cFP1T_3isxo/0.jpg)](https://www.youtube.com/watch?v=cFP1T_3isxo)

## Setup

### 1. Get a PriorLabs API Key (free)

1. Go to [ux.priorlabs.ai](https://ux.priorlabs.ai) and create an account
2. Navigate to **Account → Access Tokens**
3. Create a new API token and copy it

### 2. Install the Add-on

#### Option A: Copy into Apps Script (quickest, no tools needed)

1. Open a Google Sheet with your data
2. Go to **Extensions → Apps Script**
3. Delete any existing code in `Code.gs`
4. For each `.gs` file in the `src/` folder, create a new script file (click **+ → Script**) and paste the contents
5. For `Sidebar.html`, create a new HTML file (click **+ → HTML**) and paste the contents
6. To update the manifest: go to **Project Settings** (gear icon) → enable **Show "appsscript.json" manifest file in editor**, then replace its contents with `src/appsscript.json`
7. Save all files and reload the spreadsheet

#### Option B: Using clasp CLI (for developers)

```bash
# Install dependencies
npm install

# Login to Google (opens browser)
npx clasp login

# Create a new Apps Script project bound to a sheet
npx clasp create --title "TabPFN Add-on" --type sheets --rootDir src

# Move .clasp.json to project root if created inside src/
mv src/.clasp.json .clasp.json

# Push the code
npx clasp push

# Open the spreadsheet in your browser
npx clasp open
```

> **Note:** If you have multiple Google accounts, open the spreadsheet in an incognito window with only one account logged in to avoid `PERMISSION_DENIED` errors with Apps Script's storage.

### 3. First Use

1. Reload your Google Sheet — a **TabPFN** menu will appear in the menu bar
2. Click **TabPFN → Open Sidebar**
3. You'll see a welcome screen — click **Get Started**
4. Paste your PriorLabs API key (it's stored securely in Apps Script's ScriptProperties)
5. You're ready to fit and predict!

## Usage

### Fitting a Model

1. Open the sidebar via **TabPFN → Open Sidebar**
2. Enter your training data range (must include a header row), or select cells and click **Use Selection**
3. Pick the **Target Column** from the dropdown (the column you want to predict)
4. Choose **Classification** or **Regression**
5. Click **Fit Model** — the add-on sends your data to TabPFN and returns a model ID

### Making Predictions

1. After fitting, the sidebar automatically advances to the Predict screen
2. Select your test data range (same feature columns as training, without the target column)
3. Choose the output type:
   - **Classification**: Predicted Classes or Class Probabilities
   - **Regression**: Mean Prediction or Full Distribution
4. Specify where to write results (e.g., `Sheet1!G1`)
5. Click **Predict** — predictions are written to your sheet

### Navigation

- Use the **back/forward links** at the bottom of each screen to navigate between steps
- Click **TabPFN → Clear Stored Model** in the menu bar to reset and start fresh
- The sidebar remembers your last fitted model, so you can close and reopen it without re-fitting

## API Limits

| Limit | Value |
|-------|-------|
| Max cells per request | 20 million (rows x columns) |
| Daily quota | 100 million cells |
| Optimal dataset size | < 100K rows, < 2K features |

See [TabPFN docs](https://docs.priorlabs.ai) for the latest limits and pricing.

## Data Format

- **Headers required** — first row must be column headers
- **Mixed types supported** — numbers, text, dates, booleans
- **No preprocessing needed** — TabPFN handles encoding, normalization, and missing values automatically
- **Empty cells** are treated as missing values

## Project Structure

```
tabpfn-gsheets-addon/
├── package.json          # Dev dependency (clasp)
├── .gitignore
├── README.md
└── src/
    ├── appsscript.json   # Apps Script manifest (runtime, scopes)
    ├── Code.gs           # onOpen menu trigger, sidebar launcher
    ├── Config.gs         # API endpoint constants
    ├── Auth.gs           # API key storage via ScriptProperties
    ├── TabPFNApi.gs      # Fit & predict API calls, multipart form handling
    ├── SheetUtils.gs     # Range ↔ CSV conversion, write predictions to sheet
    └── Sidebar.html      # Sidebar UI (welcome → API key → fit → predict)
```

## Tech Stack

- **Google Apps Script** — server-side logic (V8 runtime)
- **HtmlService** — sidebar UI
- **UrlFetchApp** — HTTP requests to TabPFN API
- **TabPFN REST API** — model training and inference ([docs](https://docs.priorlabs.ai))

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `PERMISSION_DENIED` storage error | Use an incognito window with a single Google account logged in |
| "Google hasn't verified this app" | Click **Advanced → Go to TabPFN Add-on (unsafe)** — this is normal for personal Apps Script projects |
| Fit/Predict times out | Apps Script has a 6-minute execution limit. Try a smaller dataset. |
| Sidebar doesn't appear | Reload the sheet. If the TabPFN menu is missing, re-run the script from the Apps Script editor. |

## License

MIT
