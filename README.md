# 🧹 Allowance & Chore Tracker
A lightweight, multi-user web application for families to track kid chores, manage allowance balances, and approve submissions in real time. Powered by a Google Apps Script backend and Google Sheets database.

---

## 📑 Features
* **Multi-User Dashboards:** Dedicated kid view for completing chores and tracking total balance.
* **Parent Panel:** Instant approval/rejection workflows, manual bonus/deduction options, and full ledger filtering.
* **Custom Themes:** Built-in Light, Dark, and Custom color/font theme controls.
* **No Database Costs:** Uses Google Sheets as a free, transparent backend database.
* **Optional Webhooks:** Real-time event notifications triggered on chore submission, approval, or rejection.

---

## 🛠️ Step 1: Set Up the Google Sheets Backend
1. **Copy the Sample Database:** Open and make a copy of the [Sample Chore Database](https://docs.google.com/spreadsheets/d/1a8B-zOGXXwN8xOleC8wJgQupmhDDppsZCdMInr0XUTs) to your own Google Drive. *(Note: Make sure to clear out or customize the sample records in the rows before going live).*
1. **Verify Sheet Tabs:** Your copied spreadsheet should include the following four tabs:
   * **`Users`**
   * **`Chores`**
   * **`Transactions`**
   * **`Configuration`**


1. **Check Tab Configurations:**
   * **`Users` tab:** Row 1 headers → `ID | Name | Pin | Balance | Multiplier`
   * *Note:* Add a parent row with `ID` = `parent` and a secret PIN. Add kids with numeric or text IDs and their own PIN.
   * **`Chores` tab:** Row 1 headers → `Chore ID | Title | Value | Icon | Cadence | UseMultiplier | AssignedKids`
   * **`Transactions` tab:** Row 1 headers → `Transaction ID | User ID | Chore Title | Value | Status | Timestamp`
   * **`Configuration` tab (Optional Webhooks):** Row 1 headers → `Key | Value`
      * `WEBHOOK_CHORE_SUBMITTED` | `https://your-webhook-endpoint-url`
      * `WEBHOOK_CHORE_APPROVED` | `https://your-webhook-endpoint-url`
      * `WEBHOOK_CHORE_REJECTED` | `https://your-webhook-endpoint-url`
      * *(If key values are left blank, webhook execution is automatically skipped).*

1. **Deploy Apps Script:**
   1. In your copied Google Sheet, navigate to **Extensions > Apps Script**.
   1. Clear any default code and paste the contents of `Code.gs`.
   1. Click **Deploy > New deployment**.
   1. Choose **Web app** as the deployment type:
      * **Execute as:** *Me*
      * **Who has access:** *Anyone*
   1. Click **Deploy**, authorize permissions, and copy the **Web App URL**.
---

## ⚙️ Step 2: Configure Your Environment

1. Copy the example configuration file, `config.example.js`.

1. Open `config.js` and paste your Google Apps Script Web App URL:
    ```javascript
    window.APP_CONFIG = {
      API_URL: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
    };
    ```
    *(Note: config.js is ignored by git so your deployment URL stays private).*
---

## 🚀 Step 3: Host Your Frontend Online

Since the web app is a single, static frontend, it can be hosted for free on any web server or static host (such as GitHub Pages, Vercel, Netlify, or Cloudflare Pages).

### Deploying for Free with Cloudflare Pages (Recommended)

1. **Push your code to GitHub:** Commit `index.html`, `Code.gs`, and `config.js` to a **private** repository on your GitHub account. *(Do not commit your `config.js` file to a public repository)*. Alternatively, you can simply clone this repository.
1. **Connect Cloudflare Pages:**
   * Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
   * Navigate to **Workers & Pages > Overview** in the left sidebar.
   * Click **Create application > Pages tab > Connect to Git**.
   * Select your GitHub account and repository.
1. **Configure Build Settings:**
   * **Framework preset:** *None*
   * **Build command:** *(Leave empty)*
   * **Build output directory:** `/` *(or root directory)*
1. **Deploy:** Click **Save and Deploy**. Cloudflare will generate a live `*.pages.dev` URL for your chore application. Every future `git push` to your GitHub repo will update your live site automatically.

---

## 🔔 Optional Webhook Payloads

When webhooks are configured in the `Configuration` tab, your endpoint will receive `POST` requests with JSON payloads containing the unique `transactionId`:

### Chore Submitted

```json
{
  "event": "chore_submitted",
  "transactionId": "uuid-v4-string",
  "userId": "ella",
  "userName": "Ella",
  "choreTitle": "Clean Room",
  "value": "1.00",
  "timestamp": "2026-09-09T13:30:00.000Z"
}

```

### Chore Approved / Rejected

```json
{
  "event": "chore_approved",
  "transactionId": "uuid-v4-string",
  "userId": "ella",
  "value": "1.00",
  "timestamp": "2026-09-09T13:35:00.000Z"
}

```

---

## 📜 License
GNU Public License V3.0. Feel free to modify, extend, and adapt for family use!
