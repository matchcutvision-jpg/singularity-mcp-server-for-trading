# 🧠 Singularity MCP Server

**10-Agent Trading Intelligence Framework** — A Model Context Protocol (MCP) server that connects Claude AI to TradingView Desktop for multi-angle market analysis.

## What It Does

You say to Claude: *"Analyze Nifty 50"*  
Claude uses 10 specialized agents to scan the market and returns:
- **Verdict:** LONG / SHORT / NEUTRAL
- **Confidence:** 0-10 score
- **Entry / Stop / Target** prices
- **Risk:Reward** ratio
- **Full breakdown** from all 10 agents

## The 10 Agents

| Agent | Analysis | Signal |
|-------|----------|--------|
| 1 | Support & Resistance | Key levels, distance % |
| 2 | Volume Profile | Point of Control, premium/discount |
| 3 | Trend | EMA 9/21/50 alignment |
| 4 | Momentum | RSI, MACD, divergence |
| 5 | Institutional Flow | Accumulation vs Distribution |
| 6 | Volatility | Bollinger Bands, ATR, squeeze |
| 7 | Fibonacci | 38.2%, 50%, 61.8% zones |
| 8 | Multi-Timeframe | 15m/1H/4H/1D/1W alignment |
| 9 | Chart Patterns | Triangles, channels, double bottoms |
| 10 | **Singularity Fusion** | **Weighted consensus vote** |

## Installation

### Requirements
- macOS or Linux
- Node.js 18+
- TradingView Desktop (paid plan for real-time data)

### Step 1: Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/singularity-mcp-server.git
cd singularity-mcp-server
npm install
```

### Step 2: Configure Claude MCP
```bash
mkdir -p ~/.claude
cp .claude/mcp.json ~/.claude/
```

### Step 3: Launch TradingView Desktop in Debug Mode
```bash
/Applications/TradingView.app/Contents/MacOS/TradingView --remote-debugging-port=9222
```

### Step 4: Start the Server
```bash
npm start
```

### Step 5: Use Claude
```bash
claude
```
## Quick Start

```bash
git clone https://github.com/matchcutvision-jpg/singularity-mcp-server-for-trading.git
cd singularity-mcp-server-for-trading
bash setup.sh

Then type: `Analyze Nifty 50 using singularity_analyze`

## MCP Tools

| Tool | Description |
|------|-------------|
| `singularity_analyze` | Run all 10 agents on any symbol |
| `agent_support_resistance` | Agent 1 — S&R levels |
| `agent_volume_profile` | Agent 2 — Volume analysis |
| `agent_trend` | Agent 3 — EMA trend |
| `agent_momentum` | Agent 4 — RSI + MACD |
| `agent_institutional_flow` | Agent 5 — Smart money |
| `agent_volatility` | Agent 6 — BB + ATR |
| `agent_fibonacci` | Agent 7 — Fib levels |
| `agent_multitimeframe` | Agent 8 — Multi-TF |
| `agent_chart_patterns` | Agent 9 — Pattern detection |
| `tv_set_symbol` | Control TV — change symbol |
| `tv_read_indicators` | Control TV — read values |
| `tv_screenshot` | Control TV — capture chart |
| `tv_add_indicator` | Control TV — add RSI/MACD etc |
| `market_scan` | Scan multiple symbols, rank best |

## Example Commands

```
"Analyze RELIANCE on daily timeframe"
"Run Agent 1 on TCS — what are the support levels?"
"Switch TradingView to Bank Nifty 15m and add RSI"
"Scan Nifty, Bank Nifty, RELIANCE, TCS, INFY — top 3 longs"
"Screenshot my chart and tell me what pattern you see"
```

## TradingView Pine Script

The file `pinescripts/Singularity_10_Agents.pine` is a visual indicator:
- Draws S/R lines, Volume Profile POC, Fibonacci levels
- Shows EMA 9/21/50
- Colors background by trend
- Displays info table with verdict, confidence, entry/stop/target
- Built-in alerts for LONG/SHORT signals

To use: Open TradingView → Pine Editor → Paste → Add to Chart

## Monetization

| Model | Revenue |
|-------|---------|
| Telegram signals | ₹999–2,999/mo |
| Pine Script indicator | ₹4,999 lifetime |
| White-label to influencers | 30% rev share |
| SEBI Research Analyst | ₹5,000–25,000/mo |

## License

MIT — Build your business on it.

**Not financial advice. Trade at your own risk.**
