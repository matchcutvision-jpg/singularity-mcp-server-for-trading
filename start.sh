#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SINGULARITY MCP SERVER — Start
# Run: bash start.sh
# ═══════════════════════════════════════════════════════════════════════════════

cd "$(dirname "$0")"
echo "🧠 Starting Singularity MCP Server..."
node server.js
