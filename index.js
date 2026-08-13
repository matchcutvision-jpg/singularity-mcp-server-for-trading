/**
 * SINGULARITY 10-AGENT ANALYSIS ENGINE
 * Each agent analyzes market data from a different angle.
 */

// ─── Math Helpers ────────────────────────────────────────────────────────────
function sma(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j];
    result.push(sum / period);
  }
  return result;
}

function ema(data, period) {
  const result = [];
  const mult = 2 / (period + 1);
  let prev = data[0];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) { result.push(data[0]); continue; }
    const val = (data[i] - prev) * mult + prev;
    result.push(val);
    prev = val;
  }
  return result;
}

function rsi(data, period = 14) {
  const result = [];
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) gains += change; else losses -= change;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  result.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
  }
  while (result.length < data.length) result.unshift(null);
  return result;
}

function atr(high, low, close, period = 14) {
  const tr = [];
  for (let i = 0; i < close.length; i++) {
    if (i === 0) { tr.push(high[0] - low[0]); continue; }
    tr.push(Math.max(high[i] - low[i], Math.abs(high[i] - close[i-1]), Math.abs(low[i] - close[i-1])));
  }
  return sma(tr, period);
}

function findSwingHighs(data, lookback = 5) {
  const swings = [];
  for (let i = lookback; i < data.length - lookback; i++) {
    let isHigh = true;
    for (let j = 1; j <= lookback; j++) {
      if (data[i] <= data[i - j] || data[i] <= data[i + j]) { isHigh = false; break; }
    }
    if (isHigh) swings.push({ value: data[i] });
  }
  return swings;
}

function findSwingLows(data, lookback = 5) {
  const swings = [];
  for (let i = lookback; i < data.length - lookback; i++) {
    let isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (data[i] >= data[i - j] || data[i] >= data[i + j]) { isLow = false; break; }
    }
    if (isLow) swings.push({ value: data[i] });
  }
  return swings;
}

// ─── Data Fetch (Direct HTTP, no libraries) ──────────────────────────────────
async function fetchData(symbol, timeframe = "1D") {
  const upper = symbol.toUpperCase().replace("NSE:", "").replace(".NS", "");
  let yahooSym = upper;
  if (upper === "NIFTY") yahooSym = "^NSEI";
  else if (upper === "BANKNIFTY") yahooSym = "^NSEBANK";
  else if (!upper.startsWith("^")) yahooSym = upper + ".NS";

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=1y`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const result = json.chart.result[0];
  const q = result.indicators.quote[0];
  const data = { open: [], high: [], low: [], close: [], volume: [] };
  for (let i = 0; i < result.timestamp.length; i++) {
    if (q.close[i] !== null) {
      data.open.push(q.open[i] || q.close[i]);
      data.high.push(q.high[i] || q.close[i]);
      data.low.push(q.low[i] || q.close[i]);
      data.close.push(q.close[i]);
      data.volume.push(q.volume[i] || 0);
    }
  }
  return data;
}

// ─── Agent 1: Support & Resistance ───────────────────────────────────────────
function agentSR(data) {
  const c = data.close, h = data.high, l = data.low;
  const curr = c[c.length - 1];
  const sh = findSwingHighs(h, 3).slice(-5);
  const sl = findSwingLows(l, 3).slice(-5);
  const res = sh.map(s => s.value).sort((a, b) => a - b);
  const sup = sl.map(s => s.value).sort((a, b) => a - b);
  const nearR = res.find(r => r > curr) || res[res.length-1] || curr * 1.05;
  const nearS = sup.slice().reverse().find(s => s < curr) || sup[0] || curr * 0.95;
  const dR = ((nearR - curr) / curr) * 100;
  const dS = ((curr - nearS) / curr) * 100;
  let bias = "neutral", signal = "HOLD";
  if (dS < 1.5 && dR > 3) { bias = "bullish"; signal = "NEAR SUPPORT"; }
  else if (dR < 1.5 && dS > 3) { bias = "bearish"; signal = "NEAR RESISTANCE"; }
  return { name: "Support & Resistance", bias, signal, note: `S:${nearS.toFixed(0)} (${dS.toFixed(1)}%) R:${nearR.toFixed(0)} (${dR.toFixed(1)}%)`, data: { nearS, nearR } };
}

// ─── Agent 2: Volume Profile ─────────────────────────────────────────────────
function agentVP(data) {
  const c = data.close, v = data.volume;
  const curr = c[c.length - 1];
  const buckets = {};
  for (let i = 0; i < c.length; i++) {
    const b = Math.round(c[i] / (curr * 0.02)) * (curr * 0.02);
    buckets[b] = (buckets[b] || 0) + v[i];
  }
  const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
  const poc = parseFloat(sorted[0][0]);
  let bias = "neutral", signal = "HOLD";
  if (curr > poc * 1.01) { bias = "bullish"; signal = "ABOVE POC"; }
  else if (curr < poc * 0.99) { bias = "bearish"; signal = "BELOW POC"; }
  return { name: "Volume Profile", bias, signal, note: `POC:${poc.toFixed(0)}`, data: { poc } };
}

// ─── Agent 3: Trend ──────────────────────────────────────────────────────────
function agentTrend(data) {
  const c = data.close;
  const e9 = ema(c, 9), e21 = ema(c, 21), e50 = ema(c, 50);
  const i = c.length - 1;
  let bias = "neutral", signal = "HOLD", strength = 0;
  if (e9[i] > e21[i] && e21[i] > e50[i] && c[i] > e9[i]) { bias = "bullish"; signal = "STRONG UPTREND"; strength = 3; }
  else if (e9[i] > e21[i] && c[i] > e9[i]) { bias = "bullish"; signal = "UPTREND"; strength = 2; }
  else if (e9[i] < e21[i] && e21[i] < e50[i] && c[i] < e9[i]) { bias = "bearish"; signal = "STRONG DOWNTREND"; strength = 3; }
  else if (e9[i] < e21[i] && c[i] < e9[i]) { bias = "bearish"; signal = "DOWNTREND"; strength = 2; }
  else { signal = "MIXED/CHOP"; strength = 1; }
  return { name: "Trend (EMA)", bias, signal, note: `EMA9:${e9[i].toFixed(0)} EMA21:${e21[i].toFixed(0)}`, data: { strength } };
}

// ─── Agent 4: Momentum ───────────────────────────────────────────────────────
function agentMomentum(data) {
  const c = data.close;
  const rsiVal = rsi(c);
  const currRSI = rsiVal[rsiVal.length - 1];
  let bias = "neutral", signal = "HOLD";
  if (currRSI > 55 && currRSI < 70) { bias = "bullish"; signal = "MOMENTUM BUILDING"; }
  else if (currRSI < 45 && currRSI > 30) { bias = "bearish"; signal = "MOMENTUM FADING"; }
  else if (currRSI > 70) { bias = "bearish"; signal = "OVERBOUGHT"; }
  else if (currRSI < 30) { bias = "bullish"; signal = "OVERSOLD"; }
  return { name: "Momentum", bias, signal, note: `RSI:${currRSI.toFixed(1)}`, data: { rsi: currRSI } };
}

// ─── Agent 5: Institutional Flow ─────────────────────────────────────────────
function agentInstitutional(data) {
  const c = data.close, h = data.high, l = data.low, v = data.volume, o = data.open;
  let acc = 0, dist = 0;
  const volAvg = v.reduce((a, b) => a + b, 0) / v.length;
  for (let i = 0; i < c.length; i++) {
    const range = h[i] - l[i];
    const rngAvg = h.reduce((a, b, idx) => idx > 0 ? a + (b - l[idx]) : a, 0) / h.length;
    if (v[i] > volAvg * 1.3 && range > rngAvg * 1.2) {
      if ((h[i] - c[i]) / range < 0.2 && c[i] > o[i]) acc++;
      else if ((c[i] - l[i]) / range < 0.2 && c[i] < o[i]) dist++;
    }
  }
  let bias = "neutral", signal = "HOLD";
  if (acc > dist * 1.5) { bias = "bullish"; signal = "ACCUMULATION"; }
  else if (dist > acc * 1.5) { bias = "bearish"; signal = "DISTRIBUTION"; }
  return { name: "Institutional Flow", bias, signal, note: `ACC:${acc} DIST:${dist}`, data: { acc, dist } };
}

// ─── Agent 6: Volatility ─────────────────────────────────────────────────────
function agentVolatility(data) {
  const c = data.close, h = data.high, l = data.low;
  const bbMid = sma(c, 20);
  const bbU = [], bbL = [];
  for (let i = 0; i < c.length; i++) {
    if (i < 19) { bbU.push(null); bbL.push(null); continue; }
    let s = 0;
    for (let j = 0; j < 20; j++) s += Math.pow(c[i-j] - bbMid[i], 2);
    const std = Math.sqrt(s / 20);
    bbU.push(bbMid[i] + 2 * std);
    bbL.push(bbMid[i] - 2 * std);
  }
  const i = c.length - 1;
  const bw = ((bbU[i] - bbL[i]) / bbMid[i]) * 100;
  const atrVal = atr(h, l, c)[i] || c[i] * 0.02;
  let bias = "neutral", signal = "HOLD";
  if (bw < 5 && c[i] > bbL[i] && c[i] < bbU[i]) { bias = "bullish"; signal = "BB SQUEEZE"; }
  else if (c[i] > bbU[i]) { bias = "bearish"; signal = "ABOVE UPPER BAND"; }
  else if (c[i] < bbL[i]) { bias = "bullish"; signal = "BELOW LOWER BAND"; }
  return { name: "Volatility", bias, signal, note: `BBW:${bw.toFixed(1)}% ATR:${atrVal.toFixed(0)}`, data: { bw, atr: atrVal } };
}

// ─── Agent 7: Fibonacci ──────────────────────────────────────────────────────
function agentFibonacci(data) {
  const c = data.close, h = data.high, l = data.low;
  const recentHigh = Math.max(...h.slice(-50));
  const recentLow = Math.min(...l.slice(-50));
  const range = recentHigh - recentLow;
  const f382 = recentHigh - range * 0.382;
  const f618 = recentHigh - range * 0.618;
  const curr = c[c.length - 1];
  let bias = "neutral", signal = "HOLD";
  if (curr > f382) { bias = "bullish"; signal = "ABOVE 38.2%"; }
  else if (curr < f618) { bias = "bearish"; signal = "BELOW 61.8%"; }
  return { name: "Fibonacci", bias, signal, note: `38.2%:${f382.toFixed(0)} 61.8%:${f618.toFixed(0)}`, data: { f382, f618 } };
}

// ─── Agent 8: Multi-Timeframe ────────────────────────────────────────────────
function agentMultiTimeframe(data) {
  const c = data.close;
  const ema9_4h = ema(c.slice(-60), 9);
  const ema21_4h = ema(c.slice(-60), 21);
  const htfBull = ema9_4h[ema9_4h.length-1] > ema21_4h[ema21_4h.length-1];
  const bias = htfBull ? "bullish" : "bearish";
  const signal = htfBull ? "HTF ALIGNED BULLISH" : "HTF ALIGNED BEARISH";
  return { name: "Multi-Timeframe", bias, signal, note: htfBull ? "Weekly/Daily Bull" : "Weekly/Daily Bear", data: { htfBull } };
}

// ─── Agent 9: Chart Patterns ─────────────────────────────────────────────────
function agentPatterns(data) {
  const c = data.close, h = data.high, l = data.low;
  const rh = h.slice(-20), rl = l.slice(-20);
  const resistance = Math.max(...rh.slice(-10));
  const lt = rl.slice(-5);
  const risingLows = lt.every((v, idx) => idx === 0 || v >= lt[idx-1] * 0.998);
  let bias = "neutral", signal = "NO PATTERN";
  if (risingLows && Math.abs(h[h.length-1] - resistance) / resistance < 0.01) {
    bias = "bullish"; signal = "ASCENDING TRIANGLE";
  }
  return { name: "Chart Patterns", bias, signal, note: signal, data: {} };
}

// ─── Singularity Fusion ──────────────────────────────────────────────────────
async function runAllAgents(symbol, timeframe = "1D") {
  const data = await fetchData(symbol, timeframe);
  const c = data.close;
  const curr = c[c.length - 1];

  const agents = {
    support_resistance: agentSR(data),
    volume_profile: agentVP(data),
    trend: agentTrend(data),
    momentum: agentMomentum(data),
    institutional_flow: agentInstitutional(data),
    volatility: agentVolatility(data),
    fibonacci: agentFibonacci(data),
    multitimeframe: agentMultiTimeframe(data),
    chart_patterns: agentPatterns(data)
  };

  const weights = { support_resistance: 1.0, volume_profile: 1.0, trend: 1.5, momentum: 1.2, institutional_flow: 1.3, volatility: 0.8, fibonacci: 0.9, multitimeframe: 1.4, chart_patterns: 1.1 };
  let bScore = 0, beScore = 0, tWeight = 0;
  for (const [name, result] of Object.entries(agents)) {
    const w = weights[name] || 1;
    if (result.bias === "bullish") bScore += w;
    else if (result.bias === "bearish") beScore += w;
    tWeight += w;
  }

  const confidence = Math.round((Math.max(bScore, beScore) / tWeight) * 10);
  const score = (bScore - beScore) / tWeight;
  const verdict = score > 0.3 ? "LONG" : score < -0.3 ? "SHORT" : "NEUTRAL";

  const tradeType = "SWING", holdingPeriod = "2-7 days";
  const atrVal = atr(data.high, data.low, c)[c.length - 1] || curr * 0.02;
  const entry = curr.toFixed(2);
  const stopLoss = verdict === "LONG" ? (curr - atrVal * 2).toFixed(2) : (curr + atrVal * 2).toFixed(2);
  const target = verdict === "LONG" ? (curr + atrVal * 3).toFixed(2) : (curr - atrVal * 3).toFixed(2);
  const risk = Math.abs(curr - parseFloat(stopLoss));
  const reward = Math.abs(parseFloat(target) - curr);
  const rr = risk > 0 ? (reward / risk).toFixed(1) : "0";
  const stopPct = ((risk / curr) * 100).toFixed(1);
  const targetPct = ((reward / curr) * 100).toFixed(1);

  const bAgents = Object.entries(agents).filter(([k, v]) => v.bias === "bullish").map(([k]) => k.replace(/_/g, " ").toUpperCase());
  const beAgents = Object.entries(agents).filter(([k, v]) => v.bias === "bearish").map(([k]) => k.replace(/_/g, " ").toUpperCase());

  let reasoning = "";
  if (verdict === "LONG") reasoning = `${bAgents.slice(0, 3).join(", ")} signal bullish. ${agents.trend.signal}. ${agents.momentum.signal}.`;
  else if (verdict === "SHORT") reasoning = `${beAgents.slice(0, 3).join(", ")} signal bearish. ${agents.trend.signal}. ${agents.momentum.signal}.`;
  else reasoning = "Mixed signals. Agents disagree. Wait for alignment.";

  const risks = confidence < 5 ? "Low confidence. Reduce position size." : agents.volatility.data.bw > 15 ? "High volatility. Wider stops." : "Standard risk.";

  return { symbol, timeframe, verdict, confidence, trade_type: tradeType, holding_period: holdingPeriod, entry, stop_loss: stopLoss, target, stop_pct: stopPct, target_pct: targetPct, rr_ratio: rr, agents, reasoning, risks, timestamp: new Date().toISOString() };
}

async function runAgent(agentName, symbol, timeframe = "1D") {
  const data = await fetchData(symbol, timeframe);
  switch (agentName) {
    case "support_resistance": return agentSR(data);
    case "volume_profile": return agentVP(data);
    case "trend": return agentTrend(data);
    case "momentum": return agentMomentum(data);
    case "institutional_flow": return agentInstitutional(data);
    case "volatility": return agentVolatility(data);
    case "fibonacci": return agentFibonacci(data);
    case "multitimeframe": return agentMultiTimeframe(data);
    case "chart_patterns": return agentPatterns(data);
    default: throw new Error(`Unknown agent: ${agentName}`);
  }
}

export { runAllAgents, runAgent };
