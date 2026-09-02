# EGX Pulse

Act as a Principal Full-Stack Engineer, UI/UX Architect, and Fintech Expert.

I need you to build a comprehensive, production-ready React Single Page Application (SPA) named "EGX AI Terminal". This will be a professional dashboard for Egyptian Stock Exchange (EGX) traders, integrating three advanced AI-driven tools into one seamless interface.

Tech Stack: React, Tailwind CSS (Dark Mode, TradingView/Bloomberg terminal aesthetic), Lucide-react for icons, and basic state management.

### Global UI/UX Requirements:

1. Application Layout: A modern dashboard layout featuring a sleek Sidebar (or Top Tabs for mobile responsiveness) to navigate between three main modules.

2. Theme: Deep dark mode (slate-900 or neutral-950 background) with high-contrast text. Use financial color coding (neon green for bullish/profit, bright red for bearish/loss, glowing blue for neutral/AI insights).

3. Smooth Transitions: Add subtle Framer Motion-style transitions between tabs and hover states on cards.

### Module 1: AI Pattern Scanner (The "Scanner" Tab)

- Concept: Auto-detects technical patterns on selected stocks.

- UI: A search bar for tickers (Default placeholders: "ARAB.CA", "OIH.CA").

- Content: Create a visually appealing grid showing mock analysis cards. Each card should display the ticker, current price, and an "AI Insight" badge (e.g., "Bullish MACD Crossover", "Oversold RSI").

- Visuals: Include a mock mini-chart area (you can use stylized CSS bars or SVG paths to simulate a sparkline chart) indicating the trend.

### Module 2: EGX Sentiment Analyzer (The "News AI" Tab)

- Concept: Scrapes market news and provides instant AI sentiment impact.

- UI: A feed of recent news cards.

- Content: Each news card must have:

  - Headline (e.g., "Company announces new dividend distribution").

  - An "AI Verdict" tag prominently displayed (Positive/Green, Negative/Red, Neutral/Gray).

  - A short, 1-sentence AI summary explaining the potential impact on the stock price.

### Module 3: Precision Pivot Tracker (The "Calculator" Tab)

- Concept: A manual override calculator for exact session highs/lows when screen data is delayed or inaccurate.

- UI: A clean, structured input form for Ticker, Exact High, Exact Low, and Actual Close.

- Placeholders: Use realistic examples. For the "Exact High" input, use a placeholder exactly like: "e.g., true high was 15.30 EGP".

- Logic: When the user clicks "Generate AI Targets", calculate standard Pivot Points:

  - PP = (High + Low + Close) / 3

  - R1 = (2 * PP) - Low, R2 = PP + (High - Low), R3 = High + 2 * (PP - Low)

  - S1 = (2 * PP) - High, S2 = PP - (High - Low), S3 = Low - 2 * (High - PP)

- Output: Display the targets in a sleek, color-coded dashboard matrix (Green for R1-R3, Red for S1-S3, Blue for PP).

### Development Instructions:

- Build the ENTIRE application in a single go. Do not leave placeholders like "insert code here".

- Use high-quality mock data (React useState) so the application is fully interactive immediately upon generation.

- Ensure the app is fully responsive across desktop, tablet, and mobile views.

- Write clean, modular, and maintainable code.

Initialize the Add a fourth module: "EGX Live Market Ticker & Interactive Chart".

1. Top Live Ticker Bar: Create a continuously scrolling ticker bar at the very top of the dashboard displaying live/simulated prices and percentage changes for top EGX30 stocks (e.g., COMI.CA, HRHO.CA, FWRY.CA, SWDY.CA, ABUK.CA). Color code changes in Green (+%) and Red (-%).

2. TradingView Chart Integration: Include an embedded interactive TradingView chart widget configured for EGX symbols.

3. Live Status Indicator: Add a visual "Live Data Stream: ACTIVE" indicator with a flashing green status light at the top of the interfacAdd these extra features for maximum user retention:

4. Share Analysis Card: Add a "Share Analysis" button that allows users to export calculated support/resistance levels as a clean, styled summary image or text snippet with the app brand.

5. Portfolio Quick-Check: A simple tab where users can type their stock holdings (symbol, quantity, buy price) to see live profit/loss and a 1-sentence AI diversification tip.

6. Make the web app PWA-ready with an "Add to Home Screen" prompt for mobile deviceA modern, sleek, high-tech logo for a financial technology platform named "EGX Pulse Terminal". The icon features a stylized geometric green and neon-cyan pulse line (ECG/heartbeat) seamlessly transforming into a candlestick chart pattern and an upward growth arrow. Dark slate gray background, glowing neon green and teal accents, luxury fintech aesthetic, minimal vector design, clean lines, flat 2D vector, highly readable, ultra-modern financial icon, 8k resolution, centered composition._EGX Mid-Session Update – Broad-Based Strength Supports Market Advance_

The market is trading higher during today’s session, supported by broad-based buying interest across several sectors. Market sentiment remains constructive, with the EGX70 continuing to outperform the EGX30, reflecting stronger participation in small- and mid-cap stocks.

Market Snapshot (Mid-Session)

• _EGX30: [52,843]+0.42%_

• _Turnover: 5.5bn_

• _Top Liquidity_

• ⁠TMG

• ⁠PHDC

• ⁠BTFH

_Market Dynamics_

• Broad-based buying activity continues to support the market’s upward movement.

• The EGX70 remains stronger than the EGX30, highlighting improving risk appetite among investors.

• BTFH and Raya are among the key contributors supporting the EGX30’s advance.

• Liquidity remains concentrated in leading names, while market breadth favors advancing stocks.

_Market View_

The market maintains a positive tone heading into the second half of the session. A close above the 53,000-point level on the EGX30 would be a constructive technical development, improving the likelihood of continued upside momentum and supporting the potential for further gains in the coming sessions.

_Disclaimer_: This update is prepared by MINT, part of Cairo Capital Group, for informational purposes only and does not constitute investment advice or a recommendation to buy or sell any securities. Investors should make their own investment decisions based on their individual objectivAct as a Principal Full-Stack Engineer, UI/UX Architect, and Fintech Expert.

Build a complete, production-ready, highly professional React Single Page Application (SPA) named "EGX Pulse Terminal". This is a comprehensive, AI-driven financial dashboard tailored for Egyptian Stock Exchange (EGX) traders.

Tech Stack: React, Tailwind CSS (Dark Mode, TradingView/Bloomberg terminal aesthetic), Lucide-react for icons, Framer Motion transitions, and local state management.

### Global UI/UX Requirements:

1. Dashboard Layout: Modern dark-themed dashboard (slate-900 background) with a responsive Sidebar and Top Navigation.

2. Top Bar Status: A flashing green status light labeled "LIVE EGX STREAM: ACTIVE".

3. Top Live Ticker Bar: A continuously scrolling horizontal ticker displaying live/simulated price updates and percentage changes for top EGX30 stocks (e.g., COMI.CA, HRHO.CA, FWRY.CA, SWDY.CA, ABUK.CA, ARAB.CA, OIH.CA) with green (+%) and red (-%) indicators.

---

### Module 1: Live Market Ticker & TradingView Chart ("Market Live" Tab)

- Embed an interactive TradingView chart widget pre-configured for Egyptian market symbols.

- Include a quick-switch ticker selector to view chart data for top Egyptian companies.

### Module 2: AI Pattern Scanner ("Pattern Scanner" Tab)

- Scans and auto-detects technical patterns for EGX stocks.

- Display a rich grid of stock cards showing current price, volume, mini SVG sparkline chart, and "AI Technical Badge" (e.g., "Bullish MACD Crossover", "Oversold RSI Rebound", "Breaking Resistance").

- Search bar to filter tickers (e.g., "ARAB.CA", "OIH.CA", "COMI.CA").

### Module 3: EGX Sentiment Analyzer ("News & Sentiment" Tab)

- Scrapes/displays recent financial news and corporate disclosures for EGX companies.

- Each news card includes: Headline, Date, "AI Sentiment Verdict" badge (Positive/Green, Negative/Red, Neutral/Gray), and a concise 1-sentence AI impact summary on the stock price.

### Module 4: Precision Pivot Tracker ("Pivot Calculator" Tab)

- A manual override calculator for exact session high/lows when official platform feeds are delayed or inaccurate.

- Form inputs: Ticker Symbol, Exact High, Exact Low, Actual Close.

- Input Placeholders: Provide clear examples, e.g., for Exact High use a placeholder like "e.g., true high was 15.30 EGP".

- Calculation Logic:

  - PP = (High + Low + Close) / 3

  - R1 = (2 * PP) - Low, R2 = PP + (High - Low), R3 = High + 2 * (PP - Low)

  - S1 = (2 * PP) - High, S2 = PP - (High - Low), S3 = Low - 2 * (High - PP)

- Output: Display targets in a sleek matrix (Green for R1-R3, Red for S1-S3, Blue for PP).

- Include an "AI Session Insight" box providing a quick tactical advice for tomorrow's session.

- Add a "Share Analysis Card" button that generates a formatted, printable/copyable text snippet with the branding "EGX Pulse Terminal" for sharing on Telegram/WhatsApp.

### Module 5: Portfolio Quick-Check ("My Portfolio" Tab)

- Allow users to enter their stock holdings (Ticker, Quantity, Buy Price).

- Automatically calculate total portfolio value, total profit/loss (EGP and %), and display an "AI Diversification Tip" based on sector exposure.

### Module 6: EGX Events & Dividends Calendar ("Events" Tab)

- A streamlined calendar list showing upcoming coupon distributions, dividend dates, and shareholder meeting (AGM) deadlines for popular listed companies.

---

### Deployment & Additional Features:

- Fully responsive across Desktop, Tablet, and Mobile views.

- PWA Ready: Include an "Add to Home Screen" installation banner for mobile users.

- Use high-quality interactive mock data (React useState) so every single tab, calculator, and feature works out-of-the-box seamlessly without requiring external API setups init​"Use this uploaded logo image for the website header and navbar."Support Arabic language or translate sidebar module names into Arabic (e.g., Market Live -> البث المباشر, Pivot Calculator -> حاسبة النقاط المحورية)."Add a Smart Search Bar and a Thndr-style Historical Price Timeline component:

1. Global Search Bar:

   - Add a prominent, styled search bar at the top of the "Market Live" and "Pattern Scanner" modules.

   - Users should be able to search stocks by symbol, English name, or Arabic name (e.g., "ARAB", "Arab Developers", "المطورين العرب", "OIH", "أوراسكوم").

   - Display a clean autocomplete dropdown with stock logos/tickers.

2. Historical Price Timeline (Thndr Style):

   - Above the main chart, add time-frame buttons: [1D, 1W, 1M, 1Y, 5Y, ALL].

   - When a user selects a timeframe (e.g., 5Y or 1M), update the TradingView/Chart widget time range accordingly.

   - Display a "Historical Stats Card" right below the chart showing key price milestones:

     - Price 1 Month Ago vs. Today (% change)

     - Price 1 Year Ago vs. Today (% change)

     - Price 5 Years Ago vs. Today (% change)

     - 52-Week High & Low range bar.

3. Integration:

   - Ensure these stats update dynamically whenever a new stock is selected fromFix the stock price data and expand the stock list in the app:

4. Real-time Chart Data: Ensure the TradingView chart widget uses official EGX tickers (e.g., "EGX:COMI", "EGX:HRHO", "EGX:SWDY", "EGX:FWRY", "EGX:EAST").

5. Dynamic Stock Selector: Add a searchable dropdown menu that allows users to switch between major EGX stocks. Include tickers like:

   - COMI (Commercial International Bank)

   - HRHO (EFG Hermes)

   - FWRY (Fawry)

   - SWDY (Elsewedy Electric)

   - ARAB (Arab Developers Holding)

   - OIH (Orascom Investment Holding)

   - ABUK (Abu Qir Fertilizers)

   - AMOC (Alexandria Mineral Oils)

   - TMGH (TALAAT MOSTAFA GROUP)

6. Price Data Logic: Replace hardcoded static prices with a clean structure that either fetches real financial data via an API or uses the embedded TradingView ticker stream for live pricing so prices reflect actual maFix the TradingView chart component in the "Market Live" tab.

Requirements:

1. Embed the official TradingView Technical Analysis / Advanced Chart Widget via an iframe or script container.

2. Set the default symbol to "EGX:COMI" (Commercial International Bank) or "EGX:EGX30".

3. Ensure the chart container has an explicit height (e.g., height: 500px or flex-1) so it doesn't collapse to 0px height.

4. Set the theme to "dark" to match the UI style.

5. Make sure the chart scales properly on mobile screens.

rket levels.

the search bar.

ially.

Generate the complete, working code now.

es and risk tolerance.

s.

e.

project and generate the full code now.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/470920f6-96ad-44b2-ab96-3f5214a3301c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
