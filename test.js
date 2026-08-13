import { runAllAgents } from "./agents/index.js";

async function test() {
  console.log("🧠 Singularity MCP Server — Test\n");
  try {
    const result = await runAllAgents("NIFTY", "1D");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                    SINGULARITY TEST RESULT");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`Symbol:     ${result.symbol}`);
    console.log(`Verdict:    ${result.verdict}`);
    console.log(`Confidence: ${result.confidence}/10`);
    console.log(`Entry:      ${result.entry}`);
    console.log(`Stop:       ${result.stop_loss}`);
    console.log(`Target:     ${result.target}`);
    console.log(`R:R:        1:${result.rr_ratio}`);
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("\n✅ All systems operational!");
  } catch (err) {
    console.error("❌ Test failed:", err.message);
  }
}

test();
