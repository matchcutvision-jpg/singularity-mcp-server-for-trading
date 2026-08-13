#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SINGULARITY MCP SERVER — One-Command Setup
# Run this after cloning: bash setup.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "🧠 Setting up Singularity MCP Server..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Get absolute path to this repo
REPO_PATH="$(cd "$(dirname "$0")" && pwd)"

# 3. Create Claude MCP config
echo "🔧 Configuring Claude MCP..."
mkdir -p ~/.claude

cat > ~/.claude/.mcp.json << EOF
{
  "mcpServers": {
    "singularity": {
      "command": "node",
      "args": ["${REPO_PATH}/src/server.js"],
      "env": {
        "TV_DEBUG_PORT": "9222",
        "DEFAULT_SYMBOL": "NSE:NIFTY",
        "DEFAULT_TIMEFRAME": "1D"
      }
    }
  }
}
EOF

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ SETUP COMPLETE                                          ║"
echo "╠══════════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                              ║"
echo "║  🚀 NEXT STEPS:                                                              ║"
echo "║                                                                              ║"
echo "║  1. Launch TradingView Desktop in debug mode:                                ║"
echo "║     /Applications/TradingView.app/Contents/MacOS/TradingView \               ║"
echo "║       --remote-debugging-port=9222                                           ║"
echo "║                                                                              ║"
echo "║  2. Start the MCP server:                                                    ║"
echo "║     node src/server.js                                                       ║"
echo "║                                                                              ║"
echo "║  3. Open a new terminal and run:                                             ║"
echo "║     claude                                                                   ║"
echo "║                                                                              ║"
echo "║  4. In Claude, type:                                                         ║"
echo "║     "Analyze Nifty 50"                                                     ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
