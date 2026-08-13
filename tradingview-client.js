import CDP from "chrome-remote-interface";

class TradingViewClient {
  constructor(options = {}) {
    this.port = options.port || 9222;
    this.host = options.host || "localhost";
    this.client = null;
    this.Page = null;
    this.Runtime = null;
  }

  async connect() {
    this.client = await CDP({ port: this.port, host: this.host });
    const { Page, Runtime } = this.client;
    this.Page = Page;
    this.Runtime = Runtime;
    await Page.enable();
    await Runtime.enable();

    const { result } = await Runtime.evaluate({ expression: `document.title`, returnByValue: true });
    if (!result.value || !result.value.includes("TradingView")) {
      throw new Error("TradingView Desktop not detected");
    }
    return true;
  }

  async disconnect() {
    if (this.client) { await this.client.close(); this.client = null; }
  }

  async setSymbol(symbol, timeframe = "1D") {
    const script = `
      (function() {
        if (window.tvWidget && window.tvWidget.activeChart) {
          window.tvWidget.activeChart().setSymbol("${symbol}");
          window.tvWidget.activeChart().setResolution("${timeframe}");
          return { success: true, method: "widget_api" };
        }
        return { success: false, error: "Widget API not available" };
      })()
    `;
    const { result } = await this.Runtime.evaluate({ expression: script, returnByValue: true });
    await new Promise(r => setTimeout(r, 2000));
    return result.value;
  }

  async readIndicators() {
    const script = `
      (function() {
        const results = {};
        if (window.tvWidget && window.tvWidget.activeChart) {
          const chart = window.tvWidget.activeChart();
          const studies = chart.getAllStudies();
          studies.forEach(study => {
            try {
              const data = chart.getStudyById(study.id);
              results[study.name || study.id] = { id: study.id, status: "active" };
            } catch(e) {}
          });
        }
        return { indicators: results, timestamp: new Date().toISOString() };
      })()
    `;
    const { result } = await this.Runtime.evaluate({ expression: script, returnByValue: true });
    return result.value;
  }

  async screenshot() {
    const { data } = await this.Page.captureScreenshot({ format: "png", fromSurface: true });
    return data;
  }

  async addIndicator(indicatorName, settings = {}) {
    const script = `
      (function() {
        if (window.tvWidget && window.tvWidget.activeChart) {
          window.tvWidget.activeChart().createStudy("${indicatorName}", false, false, ${JSON.stringify(settings)});
          return { success: true, indicator: "${indicatorName}" };
        }
        return { success: false, error: "Widget API not available" };
      })()
    `;
    const { result } = await this.Runtime.evaluate({ expression: script, returnByValue: true });
    return result.value;
  }
}

export default TradingViewClient;
