# 🧠 Singularity MCP Server

**10-Agent Trading Intelligence Framework** — A Model Context Protocol (MCP) server that connects Claude AI to live market data for multi-angle analysis.

## What It Does

You say to Claude: *"Analyze Nifty 50"*  
Claude uses 10 specialized agents to scan the market and returns:
- **Verdict:** LONG / SHORT / NEUTRAL
- **Confidence:** 0-10 score
- **Entry / Stop / Target** prices
- **Risk:Reward** ratio
- **Full breakdown** from all 10 agents

## Quick Start (Recommended)

```bash
git clone https://github.com/matchcutvision-jpg/singularity-mcp-server-for-trading.git
cd singularity-mcp-server-for-trading
bash setup.sh
bash start.sh
```

Then open a **new terminal** and run:
```bash
claude
```

Inside Claude, type:
```
Analyze Nifty 50
```

---

## Manual Setup

If `setup.sh` does not work, configure manually:

```bash
git clone https://github.com/matchcutvision-jpg/singularity-mcp-server-for-trading.git
cd singularity-mcp-server-for-trading
npm install
```

Add the MCP server to Claude Code:
```bash
claude mcp add singularity node $(pwd)/server.js
```

Start the server:
```bash
bash start.sh
```

Then open a new terminal and run `claude`.

---

## Requirements

- macOS or Linux
- Node.js 18+
- Claude Code or Claude Desktop
- Internet connection (fetches live data from Yahoo Finance)

---

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

---

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
| `market_scan` | Scan multiple symbols, rank best |

---

## Example Commands

```
"Analyze Nifty 50"
"Analyze RELIANCE on daily timeframe"
"Run Agent 1 on TCS — what are the support levels?"
"Scan Nifty, Bank Nifty, RELIANCE, TCS, INFY — top 3 longs"
```

---

## TradingView Pine Script (Separate Product)

The file `pinescripts/Singularity_10_Agents.pine` is a visual indicator for TradingView:
- Draws S/R lines, Volume Profile POC, Fibonacci levels
- Shows EMA 9/21/50
- Colors background by trend
- Displays info table with verdict, confidence, entry/stop/target
- Built-in alerts for LONG/SHORT signals

To use: Open TradingView → Pine Editor → Paste `Singularity_10_Agents.pine` → Add to Chart

---

## Data Source

This server fetches market data from **Yahoo Finance** via direct HTTP calls. No API key required. No TradingView subscription required for analysis.

---

## License

MIT — Build your business on it.

**Not financial advice. Trade at your own risk.**
