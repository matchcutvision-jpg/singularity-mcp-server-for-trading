#!/usr/bin/env node
/**
 * SINGULARITY MCP SERVER v1.0
 * 10-Agent Trading Intelligence Framework
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import TradingViewClient from "./tradingview-client.js";
import { runAllAgents, runAgent } from "./index.js";

const CONFIG = {
  tvPort: process.env.TV_DEBUG_PORT || 9222,
  defaultSymbol: process.env.DEFAULT_SYMBOL || "NSE:NIFTY",
  defaultTimeframe: process.env.DEFAULT_TIMEFRAME || "1D"
};

let tvClient = null;
let tvConnected = false;

async function ensureTV() {
  if (tvConnected && tvClient) return tvClient;
  try {
    tvClient = new TradingViewClient({ port: CONFIG.tvPort });
    await tvClient.connect();
    tvConnected = true;
    console.error("[SERVER] ✅ TradingView Desktop connected");
    return tvClient;
  } catch (err) {
    console.error("[SERVER] ⚠️ TradingView not available:", err.message);
    tvConnected = false;
    return null;
  }
}

const TOOLS = [
  {
    name: "singularity_analyze",
    description: "Run ALL 10 agents on a symbol. Returns: verdict (LONG/SHORT/NEUTRAL), confidence (0-10), entry/stop/target prices, risk:reward, timeframe, holding period, and full agent breakdown.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Symbol. Examples: NSE:NIFTY, NSE:RELIANCE, BTC-USD" },
        timeframe: { type: "string", default: "1D" }
      },
      required: ["symbol"]
    }
  },
  {
    name: "agent_support_resistance",
    description: "Agent 1 — Support & Resistance. Identifies key S&R levels using pivot highs/lows.",
    inputSchema: { type: "object", properties: { symbol: { type: "string" }, timeframe: { type: "string", default: "1D" } }, required: ["symbol"] }
  },
  {
    name: "agent_volume_profile",
    description: "Agent 2 — Volume Profile. Calculates Point of Control (POC) and value area.",
    inputSchema: { type: "object", properties: { symbol: { type: "string" }, timeframe: { type: "string", default: "1D" } }, required: ["symbol"] }
  },
  {
    name: "agent_trend",
    description: "Agent 3 — Trend Analysis using EMA 9/21/50 alignment and ADX strength.",
    inputSchema: { type: "object", properties: { symbol: { type: "string" }, timeframe: { type: "string", default: "1D" } }, required: ["symbol"] }
  },
  {
    name: "agent_momentum",
    description: "Agent 4 — Momentum using RSI, MACD, Stochastic. Detects divergence and shifts.",
    inputSchema: { type: "object", properties: { symbol: { type: "string" }, timeframe: { type: "string", default: "1D" } }, required: ["symbol"] }
  },
  {
    name: "agent_institutional_flow",
    description: "Agent 5 — Smart Money Detection. Analyzes volume spikes, range, closing position for accumulation vs distribution.",
    inputSchema: { type: "object", properties: { symbol: { type: "string" }, timeframe: { type: "string", default: "1D" } }, required: ["symbol"] }
  },
  {
    name: "agent_volatility",
    description: "Agent 6 — Volatility using Bollinger Bands, ATR, and squeeze detection.",
    inputSchema: { type: "object", properties: { symbol: { type: "string" }, timeframe: { type: "string", default: "1D" } }, required: ["symbol"] }
  },
  {
    name: "agent_fibonacci",
    description: "Agent 7 — Fibonacci Retracement. Calculates 38.2%, 50%, 61.8% from recent swing high/low.",
    inputSchema: { type: "object", properties: { symbol: { type: "string" }, timeframe: { type: "string", default: "1D" } }, required: ["symbol"] }
  },
  {
    name: "agent_multitimeframe",
    description: "Agent 8 — Multi-Timeframe Alignment. Checks 15m, 1H, 4H, 1D, 1W trend consistency.",
    inputSchema: { type: "object", properties: { symbol: { type: "string" } }, required: ["symbol"] }
  },
  {
    name: "agent_chart_patterns",
    description: "Agent 9 — Chart Pattern Recognition. Detects triangles, channels, double tops/bottoms.",
    inputSchema: { type: "object", properties: { symbol: { type: "string" }, timeframe: { type: "string", default: "1D" } }, required: ["symbol"] }
  },
  {
    name: "tv_set_symbol",
    description: "Control TradingView Desktop — Change chart symbol and timeframe. Requires TV Desktop running in debug mode.",
    inputSchema: { type: "object", properties: { symbol: { type: "string" }, timeframe: { type: "string", default: "1D" } }, required: ["symbol"] }
  },
  {
    name: "tv_read_indicators",
    description: "Control TradingView Desktop — Read current indicator values from the active chart.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "tv_screenshot",
    description: "Control TradingView Desktop — Capture screenshot of current chart. Returns base64 image.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "tv_add_indicator",
    description: "Control TradingView Desktop — Add a built-in indicator (RSI, MACD, BollingerBands, EMA, VWAP).",
    inputSchema: { type: "object", properties: { indicator: { type: "string" }, settings: { type: "object", default: {} } }, required: ["indicator"] }
  },
  {
    name: "market_scan",
    description: "Run Singularity analyzer on multiple symbols and return ranked LONG/SHORT opportunities.",
    inputSchema: { type: "object", properties: { symbols: { type: "array", items: { type: "string" }, default: ["NSE:NIFTY", "NSE:BANKNIFTY", "NSE:RELIANCE"] }, min_confidence: { type: "number", default: 6 } } }
  }
];

const server = new Server(
  { name: "singularity-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error(`[SERVER] Tool called: ${name}`);

  try {
    // TradingView Control Tools
    if (name === "tv_set_symbol") {
      const tv = await ensureTV();
      if (!tv) throw new Error("TradingView Desktop not connected. Launch with: /Applications/TradingView.app/Contents/MacOS/TradingView --remote-debugging-port=9222");
      const result = await tv.setSymbol(args.symbol, args.timeframe);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, message: `Chart set to ${args.symbol} | ${args.timeframe}`, data: result }, null, 2) }] };
    }

    if (name === "tv_read_indicators") {
      const tv = await ensureTV();
      if (!tv) throw new Error("TradingView Desktop not connected");
      const result = await tv.readIndicators();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "tv_screenshot") {
      const tv = await ensureTV();
      if (!tv) throw new Error("TradingView Desktop not connected");
      const result = await tv.screenshot();
      return { content: [{ type: "text", text: JSON.stringify({ success: true, screenshot_base64: result.substring(0, 100) + "... [truncated]" }, null, 2) }] };
    }

    if (name === "tv_add_indicator") {
      const tv = await ensureTV();
      if (!tv) throw new Error("TradingView Desktop not connected");
      const result = await tv.addIndicator(args.indicator, args.settings || {});
      return { content: [{ type: "text", text: JSON.stringify({ success: true, message: `Added ${args.indicator}`, data: result }, null, 2) }] };
    }

    // Analysis Tools
    if (name === "singularity_analyze") {
      const result = await runAllAgents(args.symbol, args.timeframe || "1D");
      return { content: [{ type: "text", text: formatReport(result) }] };
    }

    if (name.startsWith("agent_")) {
      const agentName = name.replace("agent_", "");
      const result = await runAgent(agentName, args.symbol, args.timeframe || "1D");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "market_scan") {
      const symbols = args.symbols || ["NSE:NIFTY", "NSE:BANKNIFTY", "NSE:RELIANCE"];
      const minConf = args.min_confidence || 6;
      const results = [];
      for (const sym of symbols) {
        try {
          const result = await runAllAgents(sym, "1D");
          if (result.confidence >= minConf && result.verdict !== "NEUTRAL") results.push(result);
        } catch (e) { console.error(`[SCAN] Failed for ${sym}:`, e.message); }
      }
      results.sort((a, b) => b.confidence - a.confidence);
      return { content: [{ type: "text", text: formatScan(results) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    console.error(`[SERVER] Error in ${name}:`, error.message);
    return { content: [{ type: "text", text: `❌ Error: ${error.message}` }], isError: true };
  }
});

function formatReport(r) {
  const vEmoji = r.verdict === "LONG" ? "🟢" : r.verdict === "SHORT" ? "🔴" : "⚪";
  let out = `\n╔══════════════════════════════════════════════════════════════════════════════╗\n`;
  out += `║                    🧠 SINGULARITY 10-AGENT ANALYSIS REPORT                    ║\n`;
  out += `╠══════════════════════════════════════════════════════════════════════════════╣\n`;
  out += `║  Symbol: ${r.symbol.padEnd(66)}║\n`;
  out += `║  Timeframe: ${r.timeframe.padEnd(63)}║\n`;
  out += `╠══════════════════════════════════════════════════════════════════════════════╣\n`;
  out += `║   ${vEmoji} FINAL VERDICT: ${r.verdict.padEnd(12)} | Confidence: ${String(r.confidence).padEnd(2)}/10                        ║\n`;
  out += `║   ⏰ Trade Type: ${r.trade_type.padEnd(14)} | 📅 Hold: ${String(r.holding_period).padEnd(20)}   ║\n`;
  out += `╠══════════════════════════════════════════════════════════════════════════════╣\n`;
  out += `║  💰 ENTRY:    ${String(r.entry).padEnd(14)}                                              ║\n`;
  out += `║  🛑 STOP:     ${String(r.stop_loss).padEnd(14)}  (${String(r.stop_pct).padEnd(6)}%)                              ║\n`;
  out += `║  🎯 TARGET:   ${String(r.target).padEnd(14)}  (${String(r.target_pct).padEnd(6)}%)                              ║\n`;
  out += `║  ⚖️  R:R = 1:${String(r.rr_ratio).padEnd(10)}                                              ║\n`;
  out += `╠══════════════════════════════════════════════════════════════════════════════╣\n`;
  out += `║  AGENT BREAKDOWN                                                              ║\n`;
  out += `╠══════════════════════════════════════════════════════════════════════════════╣\n`;
  for (const [agentName, agentResult] of Object.entries(r.agents)) {
    const emoji = agentResult.bias === "bullish" ? "🟢" : agentResult.bias === "bearish" ? "🔴" : "⚪";
    out += `║  ${emoji} ${agentName.replace(/_/g, " ").toUpperCase().padEnd(18)} | ${agentResult.signal.padEnd(25)} | ${agentResult.note.substring(0, 25).padEnd(25)} ║\n`;
  }
  out += `╠══════════════════════════════════════════════════════════════════════════════╣\n`;
  out += `║  📝 REASONING: ${r.reasoning.substring(0, 60).padEnd(60)}║\n`;
  out += `║  ⚠️  RISKS:    ${r.risks.substring(0, 60).padEnd(60)}║\n`;
  out += `╚══════════════════════════════════════════════════════════════════════════════╝\n`;
  return out;
}

function formatScan(results) {
  if (results.length === 0) return "📊 No high-confidence setups found.";
  let out = "╔══════════════════════════════════════════════════════════════════════════════╗\n";
  out += "║                    📊 SINGULARITY MARKET SCAN RESULTS                         ║\n";
  out += "╠══════════════════════════════════════════════════════════════════════════════╣\n";
  out += "║ Symbol      | Verdict | Conf | Entry      | Stop       | Target     | R:R   ║\n";
  out += "╠══════════════════════════════════════════════════════════════════════════════╣\n";
  for (const r of results.slice(0, 10)) {
    const emoji = r.verdict === "LONG" ? "🟢" : "🔴";
    out += `║ ${emoji} ${r.symbol.padEnd(9)} | ${r.verdict.padEnd(7)} | ${String(r.confidence).padEnd(4)} | ${String(r.entry).padEnd(10)} | ${String(r.stop_loss).padEnd(10)} | ${String(r.target).padEnd(10)} | 1:${String(r.rr_ratio).padEnd(4)} ║\n`;
  }
  out += "╚══════════════════════════════════════════════════════════════════════════════╝";
  return out;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Singularity MCP Server running on stdio");
}

main().catch(err => { console.error("Fatal:", err.message); process.exit(1); });
