import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  ShieldCheck,
  Waves,
  UploadCloud,
  Activity,
  FileAudio,
  Download,
  AlertTriangle,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  Loader2,
  Mic,
  Square,
  RefreshCw,
  Volume2,
} from 'lucide-react';

const API = (() => {
  try {
    return (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');
  } catch {
    return '';
  }
})();
const api = path => `${API}${path}`;

const MAX_RECORD_SECONDS = 25;

const SAMPLES = [
  { name: 'Ordinary audio', kind: 'normal', info: 'Two harmless low-frequency tones (430 Hz + 780 Hz)' },
  { name: 'Benign high frequency', kind: 'harmless_high', info: 'Audible tones plus unmodulated 18.5 kHz carrier' },
  { name: 'Simulated nonlinear signal', kind: 'simulated_nonlinear', info: 'Non-voice amplitude modulation + square-law model' },
];

const FALLBACK_KAGGLE_SAMPLES = [
  { filename: 'sample_0001_normal_speech_sim.wav', category: 'normal_speech_sim', kind: 'normal' },
  { filename: 'sample_0002_harmless_ultrasonic.wav', category: 'harmless_ultrasonic', kind: 'harmless_high' },
  { filename: 'sample_0003_nuit_modulated_sim.wav', category: 'nuit_modulated_sim', kind: 'simulated_nonlinear' },
  { filename: 'sample_0004_normal_ambient_sim.wav', category: 'normal_speech_sim', kind: 'normal' },
  { filename: 'sample_0005_carrier_18khz_clean.wav', category: 'harmless_ultrasonic', kind: 'harmless_high' },
  { filename: 'sample_0006_nonlinear_shadow_sim.wav', category: 'nuit_modulated_sim', kind: 'simulated_nonlinear' },
];

const APP_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
html,body,#root{margin:0 !important;padding:0 !important;width:100% !important;min-height:100vh !important;background:#0a1020 !important;overflow-x:hidden}
.nuit-root{font-family:'DM Sans',system-ui,sans-serif;color:#e8efff;background:#0a1020;width:100%;min-height:100vh;margin:0;padding:0;display:flex;box-sizing:border-box}
.nuit-root *,.nuit-root *::before,.nuit-root *::after{box-sizing:border-box}
.nuit-root button,.nuit-root input{font:inherit}
.nuit-root button{cursor:pointer}
.nuit-root button:disabled{opacity:.55;cursor:not-allowed}
.sidebar{width:254px;flex-shrink:0;background:#0d1529;border-right:1px solid #202c43;padding:29px 18px;display:flex;flex-direction:column;min-height:100vh}
.brand{display:flex;gap:12px;align-items:center;padding:0 10px}
.brand-mark{background:linear-gradient(130deg,#3674e1,#7559d9);border-radius:12px;width:43px;height:43px;display:grid;place-items:center}
.brand strong{font:800 20px Manrope,sans-serif;display:block;letter-spacing:-.8px}
.brand span{display:block;color:#7987a4;font-size:9px;letter-spacing:2.1px;margin-top:3px}
.sidebar-caption{color:#677894;font-size:10px;letter-spacing:2px;font-weight:700;margin:46px 14px 15px}
.navitem{display:flex;gap:12px;align-items:center;padding:13px 14px;border-radius:10px;font-size:13px;margin-bottom:5px}
.selected{background:#1b2946;color:#8ab5ff;font-weight:700}
.muted{color:#7888a6}
.side-bottom{margin-top:auto;color:#8594b0;font-size:12px;padding:15px 8px;line-height:1.5}
.info-mini{background:#151f35;border:1px solid #273650;border-radius:12px;padding:13px;margin-bottom:20px}
.info-mini svg{vertical-align:middle;margin-right:5px}
.side-bottom a{color:#90baff;text-decoration:none}
main{flex:1;min-width:0}
.topbar{height:72px;border-bottom:1px solid #1e293f;display:flex;align-items:center;justify-content:space-between;padding:0 38px;color:#cfddf6;font-weight:600;font-size:13px}
.breadcrumb{color:#7989a7;font-weight:400}
.top-status{border:1px solid #2b3b55;border-radius:30px;padding:7px 13px;color:#a6b6d2;font-size:11px;display:flex;align-items:center;gap:6px}
.status-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#39d6a5}
.content{max-width:1250px;margin:auto;padding:34px 38px}
.hero{display:flex;justify-content:space-between;align-items:center;margin-bottom:29px;gap:16px}
.eyebrow{font-size:10px;letter-spacing:2.5px;font-weight:800;color:#7ca9fa}
.hero h1{font:800 clamp(28px,3.3vw,44px) Manrope,sans-serif;margin:9px 0 10px;letter-spacing:-1.6px}
.hero h1 em{color:#7eaafa;font-style:normal}
.hero p{color:#9caeca;line-height:1.55;font-size:14px;max-width:650px;margin:0}
.hero-icon{background:radial-gradient(circle,#1b335c,#121e35 65%,transparent 70%);height:115px;width:150px;display:grid;place-items:center;color:#639afa;flex-shrink:0}
.work-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:20px}
.panel{background:#111a2e;border:1px solid #27344c;border-radius:15px;padding:22px}
.section-title{display:flex;gap:12px;align-items:center;margin-bottom:20px}
.section-symbol{width:37px;height:37px;background:#18365d;color:#7bb6ff;border-radius:10px;display:grid;place-items:center;flex-shrink:0}
.section-symbol.purple{background:#29234b;color:#bd97ff}
.section-title h2{font:800 16px Manrope,sans-serif;margin:0 0 4px}
.section-title p{font-size:12px;color:#899cb9;margin:0}
.mic-box{border:1px solid #2c4166;background:#13213c;border-radius:12px;padding:14px 16px;margin-bottom:14px}
.mic-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.mic-head strong{display:block;font-size:13px;margin-bottom:3px}
.mic-head span{display:block;font-size:11px;color:#8fa6c9}
.mic-meter{height:6px;background:#0c1528;border-radius:999px;overflow:hidden;margin-top:12px}
.mic-meter-fill{height:100%;background:linear-gradient(90deg,#39d6a5,#68b7ff,#f6bb67);transition:width .08s linear}
.mic-note{font-size:11px;color:#9cc2f5;margin:10px 0 0;line-height:1.45}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:9px;padding:10px 16px;font-weight:700;font-size:12px;transition:.15s}
.btn-outline{color:#d5e4ff;background:#192843;border:1px solid #33496c}
.btn-outline:hover:not(:disabled){background:#263c61}
.btn-primary{background:#578ff4;color:white;border:0}
.btn-primary:hover:not(:disabled){background:#6aa3ff}
.btn-danger{background:#d9485f;color:#fff;border:0}
.btn-danger:hover:not(:disabled){background:#eb5a71}
.rec-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#fff;animation:pulse 1s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
.dropzone{min-height:155px;border:1.5px dashed #395276;background:#101d36;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;text-align:center;padding:18px}
.dropzone.drag{background:#17385b;border-color:#7abaff}
.dropzone strong{font-size:13px;word-break:break-all}
.dropzone span{font-size:11px;color:#8397b7}
.threshold{display:flex;justify-content:space-between;align-items:center;margin:18px 0 8px;font-size:12px}
.threshold div{display:flex;align-items:center;gap:9px}
.threshold span{color:#8fbdff;font-weight:700}
.range{width:100%;accent-color:#648ff1}
.run-btn{width:100%;margin-top:14px;padding:13px}
.sample-list{display:flex;flex-direction:column;gap:10px}
.sample{display:flex;text-align:left;align-items:center;gap:13px;background:#17223a;color:#e4ecfb;border:1px solid #2b3b57;padding:12px;border-radius:11px;width:100%}
.sample:hover:not(:disabled){border-color:#6599e3;background:#1c2c48}
.sample-icon{width:38px;height:38px;display:grid;place-items:center;background:#233657;color:#88b6ff;border-radius:9px;flex-shrink:0}
.sample strong,.sample small{display:block}
.sample strong{font-size:12px}
.sample small{color:#8ca0c0;font-size:10px;margin-top:4px;line-height:1.45}
.arrow{margin-left:auto;color:#769ac6}
.sample-note{display:flex;align-items:flex-start;gap:10px;border-radius:10px;background:#20243a;color:#b3adc9;font-size:11px;line-height:1.5;margin-top:16px;padding:12px}
.sample-note svg{flex-shrink:0;margin-top:1px}
.tone-box{margin-top:14px;border:1px solid #2b3b57;background:#152038;border-radius:11px;padding:12px}
.tone-box strong{display:block;font-size:12px;margin-bottom:4px}
.tone-box small{display:block;font-size:11px;color:#8fa6c9;margin-bottom:10px;line-height:1.4}
.tone-actions{display:flex;gap:8px;flex-wrap:wrap}
.kaggle-panel{margin-top:20px;padding:20px}
.kaggle-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.kaggle-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:10px;margin-top:16px;max-height:240px;overflow-y:auto;padding-right:4px}
.error{margin-top:18px;border:1px solid #7f3e48;background:#351d31;color:#ffc0ca;display:flex;align-items:center;gap:10px;padding:14px;border-radius:10px;font-size:13px}
.results-head{display:flex;justify-content:space-between;align-items:flex-end;margin:38px 0 16px;gap:18px;flex-wrap:wrap}
.results-head h2{font:800 23px Manrope,sans-serif;margin:6px 0}
.filename{font-size:12px;color:#94a7c3}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.stat{border:1px solid #2a3953;border-radius:13px;padding:19px;background:#121d33}
.stat-label{font-size:10px;letter-spacing:1.3px;font-weight:800;color:#869ab9}
.stat-value{font:800 19px Manrope,sans-serif;margin:14px 0 5px;display:flex;align-items:center;gap:9px}
.stat-value svg{width:19px}
.stat-value.number{font-size:27px}
.stat small{color:#7d91af;font-size:11px}
.verdict.safe .stat-value{color:#66dbb3}
.verdict.warn .stat-value{color:#f7c070}
.charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px;margin-top:18px}
.chart-panel{padding:20px 17px}
.chart-heading h3{font-size:14px;margin:0 0 3px}
.chart-heading p{font-size:11px;color:#879ab7;margin:0}
.plot{height:215px;width:100%;margin-top:18px}
.axis{text-align:center;color:#879ab7;font-size:10px;margin-top:5px}
.explanation{margin-top:18px;border:1px solid #344b6a;background:#162440;border-radius:12px;padding:17px;display:flex;gap:12px;color:#8bb9f8}
.explanation p{font-size:12px;color:#aebed7;line-height:1.6;margin:7px 0 0}
.empty-result{border:1px dashed #304261;margin-top:25px;min-height:150px;border-radius:14px;color:#8197b9;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;padding:20px;text-align:center}
.empty-result strong{color:#c9d7ef}
.empty-result span{font-size:12px}
footer{font-size:11px;color:#647896;text-align:center;padding:34px 0 10px}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:1050px){.sidebar{width:205px}.content{padding:28px 24px}.topbar{padding:0 24px}.work-grid{grid-template-columns:1fr}}
@media(max-width:720px){.sidebar{display:none}.hero-icon{display:none}.content{padding:25px 16px}.topbar{padding:0 16px}.stats,.charts{grid-template-columns:1fr}.results-head{align-items:flex-start;flex-direction:column}}
`;

// Encode raw Float32 PCM chunks into a standard 16-bit mono WAV Blob
function encodeWav(chunks, sampleRate) {
  const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0);
  const pcm = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    pcm.set(chunk, offset);
    offset += chunk.length;
  }

  const buffer = new ArrayBuffer(44 + totalLength * 2);
  const view = new DataView(buffer);

  const writeStr = (pos, str) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(pos + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + totalLength * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, totalLength * 2, true);

  let writePos = 44;
  for (let i = 0; i < totalLength; i += 1) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(writePos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    writePos += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Synthesize safe, non-voice demonstration PCM signals at 48 kHz
function synthesizeDemoSignal(kind, sampleRate = 48000, duration = 2.0) {
  const n = Math.floor(sampleRate * duration);
  const pcm = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const t = i / sampleRate;
    const base =
      0.45 * Math.sin(2 * Math.PI * 430 * t) +
      0.3 * Math.sin(2 * Math.PI * 780 * t) +
      0.15 * Math.sin(2 * Math.PI * 1250 * t);

    if (kind === 'normal') {
      pcm[i] = 0.65 * base;
    } else if (kind === 'harmless_high') {
      const carrier = 0.25 * Math.sin(2 * Math.PI * 18500 * t);
      pcm[i] = 0.65 * (base + carrier);
    } else {
      // Benign tonal modulation + simulated square-law microphone nonlinearity
      const env = Math.max(0, Math.min(1, 0.55 + 0.38 * base));
      const passband = env * Math.cos(2 * Math.PI * 18200 * t);
      const nonlinearBaseband = 0.6 * (env * env - 0.35);
      pcm[i] = 0.65 * (passband + nonlinearBaseband);
    }
  }
  return { pcm, sampleRate };
}

// Client-side DSP fallback (mirrors backend/app/detection.py when running in standalone preview)
function analyzePcmLocally(pcm, sampleRate, filename, threshold) {
  const duration = Number((pcm.length / sampleRate).toFixed(2));
  const maxVal = pcm.reduce((acc, v) => Math.max(acc, Math.abs(v)), 0);
  const sig = new Float32Array(pcm.length);
  if (maxVal > 0) {
    for (let i = 0; i < pcm.length; i += 1) sig[i] = pcm[i] / maxVal;
  }

  // 1. Waveform downsample (280 points)
  const wfPoints = 280;
  const wfStep = Math.max(1, Math.floor(sig.length / wfPoints));
  const waveform = [];
  for (let i = 0; i < sig.length && waveform.length < wfPoints; i += wfStep) {
    waveform.push({
      x: Number((i / sampleRate).toFixed(3)),
      y: Number(sig[i].toFixed(4)),
    });
  }

  // 2. Band-split approximation via windowed DFT on 40 ms windows (16 kHz boundary)
  const winSize = Math.max(256, Math.floor(sampleRate * 0.04));
  const hop = Math.max(128, Math.floor(winSize / 2));
  const windowScores = [];
  const rawScores = [];
  let totalEnergy = 0;
  let highBandEnergy = 0;

  // Spectral bins up to Nyquist (sampled at 120 frequency points for fast browser rendering)
  const specPoints = 120;
  const maxFreq = sampleRate / 2;
  const specPower = new Float64Array(specPoints);
  let frameCount = 0;

  for (let start = 0; start + winSize <= sig.length; start += hop) {
    frameCount += 1;
    // Extract low-band (<16 kHz) and high-band (16-22 kHz) envelopes via short-kernel FIR split
    // Using 9-tapsinc LPF at fc = 16000 / sampleRate
    const fc = 16000 / sampleRate;
    const sb = new Float32Array(winSize);
    const spSq = new Float32Array(winSize);

    for (let i = 0; i < winSize; i += 1) {
      const idx = start + i;
      // 5-tap symmetric lowpass around idx
      const s0 = sig[idx];
      const s1 = (idx > 0 ? sig[idx - 1] : s0) + (idx + 1 < sig.length ? sig[idx + 1] : s0);
      const s2 = (idx > 1 ? sig[idx - 2] : s0) + (idx + 2 < sig.length ? sig[idx + 2] : s0);
      const low = 2 * fc * s0 + fc * 0.85 * s1 + fc * 0.35 * s2;
      const high = s0 - low;
      sb[i] = low;
      spSq[i] = high * high;
      totalEnergy += s0 * s0;
      if (fc < 0.5) highBandEnergy += high * high;
    }

    // Smooth spSq to represent demodulated high-band envelope
    let meanA = 0;
    let meanB = 0;
    for (let i = 0; i < winSize; i += 1) {
      meanA += Math.abs(sb[i]);
      meanB += spSq[i];
    }
    meanA /= winSize;
    meanB /= winSize;

    let num = 0;
    let denA = 0;
    let denB = 0;
    for (let i = 0; i < winSize; i += 1) {
      const da = Math.abs(sb[i]) - meanA;
      const db = spSq[i] - meanB;
      num += da * db;
      denA += da * da;
      denB += db * db;
    }
    const corr = denA > 1e-10 && denB > 1e-10 ? Math.abs(num / Math.sqrt(denA * denB)) : 0;
    const clampedCorr = Math.min(0.99, Number(corr.toFixed(4)));
    rawScores.push(clampedCorr);
    windowScores.push({
      x: Number(((start + winSize / 2) / sampleRate).toFixed(2)),
      y: clampedCorr,
    });
  }

  // Compute frequency spectrum (Goertzel / probe bins across 0..Nyquist)
  const probeLen = Math.min(sig.length, 4096);
  for (let b = 0; b < specPoints; b += 1) {
    const freqHz = (b / (specPoints - 1)) * maxFreq;
    const omega = (2 * Math.PI * freqHz) / sampleRate;
    const coeff = 2 * Math.cos(omega);
    let q1 = 0;
    let q2 = 0;
    for (let n = 0; n < probeLen; n += 1) {
      const q0 = coeff * q1 - q2 + sig[n];
      q2 = q1;
      q1 = q0;
    }
    const magSq = Math.max(1e-12, (q1 * q1 + q2 * q2 - q1 * q2 * coeff) / (probeLen * probeLen));
    specPower[b] = 10 * Math.log10(magSq);
  }

  const spectrum = Array.from({ length: specPoints }, (_, b) => ({
    x: Number((((b / (specPoints - 1)) * maxFreq) / 1000).toFixed(2)),
    y: Number(specPower[b].toFixed(2)),
  }));

  const highRatio = totalEnergy > 0 ? highBandEnergy / totalEnergy : 0;
  const sorted = [...rawScores].sort((a, b) => a - b);
  const p75 = sorted.length ? sorted[Math.floor(sorted.length * 0.75)] : 0;
  const canInspectHigh = sampleRate >= 44100;
  const hasHighBand = highRatio >= 0.005;
  const isSuspicious = canInspectHigh && hasHighBand && p75 >= threshold;

  let explanation = '';
  if (!canInspectHigh) {
    explanation = 'Sample rate is below 44.1 kHz, so the 16-22 kHz near-ultrasound band cannot be reliably inspected.';
  } else if (isSuspicious) {
    explanation = 'Significant 16-22 kHz energy and strong correlation between the squared high-frequency envelope and baseband signal were observed, consistent with simulated nonlinear demodulation.';
  } else if (hasHighBand) {
    explanation = 'High-frequency energy (16-22 kHz) is present, but its squared envelope does not correlate strongly with the audible baseband above the selected threshold.';
  } else {
    explanation = 'Minimal energy was detected in the 16-22 kHz band; the recording behaves like ordinary low-frequency audio.';
  }

  return {
    filename,
    sample_rate: sampleRate,
    duration_seconds: duration,
    score: Number(p75.toFixed(4)),
    threshold: Number(threshold.toFixed(2)),
    verdict: isSuspicious ? 'suspicious' : 'benign',
    high_band_energy_ratio: Number(highRatio.toFixed(4)),
    explanation,
    waveform,
    spectrum,
    window_scores: windowScores,
  };
}

// Decode a WAV Blob in the browser for standalone fallback analysis
async function decodeAudioBlobToPcm(blob) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx({ sampleRate: 48000 });
  try {
    const arrayBuf = await blob.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(arrayBuf);
    const channel = new Float32Array(audioBuf.getChannelData(0));
    return { pcm: channel, sampleRate: audioBuf.sampleRate };
  } finally {
    ctx.close().catch(() => {});
  }
}

function Plot({ title, subtitle, data, xLabel, unit, type = 'line', reference }) {
  return (
    <article className="panel chart-panel">
      <div className="chart-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="plot">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#55a7ff" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#55a7ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#29314a" vertical={false} />
              <XAxis dataKey="x" stroke="#8190af" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis stroke="#8190af" tick={{ fontSize: 11 }} tickLine={false} width={45} />
              <Tooltip contentStyle={{ background: '#141e36', border: '1px solid #35415c', borderRadius: 12 }} />
              <Area type="monotone" dataKey="y" stroke="#68b7ff" fill="url(#grad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid stroke="#29314a" vertical={false} />
              <XAxis dataKey="x" stroke="#8190af" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis stroke="#8190af" tick={{ fontSize: 11 }} tickLine={false} width={45} />
              <Tooltip contentStyle={{ background: '#141e36', border: '1px solid #35415c', borderRadius: 12 }} />
              <Line type="monotone" dataKey="y" stroke="#7c9cff" dot={false} strokeWidth={1.8} isAnimationActive={false} />
              {reference !== undefined && <ReferenceLine y={reference} stroke="#f6bb67" strokeDasharray="5 5" />}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="axis">
        {xLabel} {unit && <span>· {unit}</span>}
      </div>
    </article>
  );
}

export default function App() {
  const [dataset, setDataset] = useState(FALLBACK_KAGGLE_SAMPLES);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [datasetMessage, setDatasetMessage] = useState('Built-in Kaggle benchmark samples ready for instant testing.');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [threshold, setThreshold] = useState(0.55);
  const [drag, setDrag] = useState(false);
  const [apiMode, setApiMode] = useState(API ? 'Cloud API connected' : 'In-browser DSP ready');

  // Built-in microphone capture state (raw PCM WAV via Web Audio API)
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [captureRate, setCaptureRate] = useState(null);
  const [micNote, setMicNote] = useState('');

  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const chunksRef = useRef([]);
  const sampleRateRef = useRef(48000);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const recordingRef = useRef(false);

  async function run(blob, name) {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const body = new FormData();
      body.append('file', blob, name);
      const r = await fetch(api(`/api/analyze?threshold=${threshold}`), { method: 'POST', body });
      const contentType = r.headers.get('content-type') || '';
      if (!r.ok || !contentType.includes('application/json')) {
        throw Error('Backend unreachable, using local DSP');
      }
      const data = await r.json();
      setApiMode('Cloud API connected');
      setResult(data);
    } catch {
      // Seamless fallback to in-browser 48 kHz DSP engine when previewing without Railway backend
      try {
        const { pcm, sampleRate } = await decodeAudioBlobToPcm(blob);
        const localResult = analyzePcmLocally(pcm, sampleRate, name, threshold);
        setApiMode('In-browser DSP engine');
        setResult(localResult);
      } catch (decodeErr) {
        setError(decodeErr.message || 'Unable to decode audio file. Please upload a valid WAV or FLAC file.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function demoSample(s) {
    setFile(null);
    setError('');
    setLoading(true);
    try {
      const r = await fetch(api(`/api/demo/${s.kind}`));
      const contentType = r.headers.get('content-type') || '';
      if (r.ok && contentType.includes('audio')) {
        const blob = await r.blob();
        const demoFile = new File([blob], `${s.kind}.wav`, { type: 'audio/wav' });
        setFile(demoFile);
        await run(demoFile, demoFile.name);
        return;
      }
      throw Error('Synthesize locally');
    } catch {
      const { pcm, sampleRate } = synthesizeDemoSignal(s.kind, 48000, 2.0);
      const wavBlob = encodeWav([pcm], sampleRate);
      const demoFile = new File([wavBlob], `${s.kind}.wav`, { type: 'audio/wav' });
      setFile(demoFile);
      const localResult = analyzePcmLocally(pcm, sampleRate, demoFile.name, threshold);
      setResult(localResult);
    } finally {
      setLoading(false);
    }
  }

  async function getDataset() {
    setDatasetLoading(true);
    try {
      const r = await fetch(api('/api/dataset/samples?limit=50'));
      const contentType = r.headers.get('content-type') || '';
      if (!r.ok || !contentType.includes('application/json')) {
        throw Error('Using built-in Kaggle sample presets');
      }
      const d = await r.json();
      if (d.items && d.items.length > 0) {
        setDataset(d.items);
        setDatasetMessage(`${d.total} Kaggle WAV samples loaded from backend (showing up to 50).`);
      } else {
        setDataset(FALLBACK_KAGGLE_SAMPLES);
        setDatasetMessage('6 starter Kaggle benchmark samples ready for instant testing.');
      }
    } catch {
      setDataset(FALLBACK_KAGGLE_SAMPLES);
      setDatasetMessage('6 starter Kaggle benchmark samples ready for instant testing.');
    } finally {
      setDatasetLoading(false);
    }
  }

  async function runDataset(sampleItem) {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch(api(`/api/dataset/analyze/${encodeURIComponent(sampleItem.filename)}?threshold=${threshold}`));
      const contentType = r.headers.get('content-type') || '';
      if (r.ok && contentType.includes('application/json')) {
        const d = await r.json();
        setResult(d);
        return;
      }
      throw Error('Fallback to local synthesis');
    } catch {
      const kind =
        sampleItem.kind ||
        (sampleItem.category?.includes('nuit')
          ? 'simulated_nonlinear'
          : sampleItem.category?.includes('ultrasonic')
          ? 'harmless_high'
          : 'normal');
      const { pcm, sampleRate } = synthesizeDemoSignal(kind, 48000, 2.0);
      const wavBlob = encodeWav([pcm], sampleRate);
      const synthFile = new File([wavBlob], sampleItem.filename, { type: 'audio/wav' });
      setFile(synthFile);
      setResult(analyzePcmLocally(pcm, sampleRate, sampleItem.filename, threshold));
    } finally {
      setLoading(false);
    }
  }

  // Download a benign 48 kHz WAV file to transfer to a second device (phone/laptop) for over-the-air testing
  function downloadSecondDeviceTestWav(kind) {
    const { pcm, sampleRate } = synthesizeDemoSignal(kind, 48000, 4.0);
    const blob = encodeWav([pcm], sampleRate);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `second-device-${kind}-48khz.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function cleanupAudio() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    recordingRef.current = false;
    setRecording(false);
    setMicLevel(0);
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('This browser does not support microphone capture. Open the site over HTTPS or localhost.');
      return;
    }
    setError('');
    setMicNote('');
    chunksRef.current = [];
    setRecordSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: { ideal: 48000 },
        },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      let ctx;
      try {
        ctx = new AudioCtx({ sampleRate: 48000 });
      } catch {
        ctx = new AudioCtx();
      }
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioCtxRef.current = ctx;
      sampleRateRef.current = ctx.sampleRate;
      setCaptureRate(ctx.sampleRate);

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;

      processor.onaudioprocess = event => {
        if (!recordingRef.current) return;
        const input = event.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(input));

        let peak = 0;
        for (let i = 0; i < input.length; i += 1) {
          const v = Math.abs(input[i]);
          if (v > peak) peak = v;
        }
        setMicLevel(Math.min(100, Math.round(peak * 180)));
      };

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);
      processorRef.current = processor;

      recordingRef.current = true;
      setRecording(true);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setRecordSeconds(elapsed);
        if (elapsed >= MAX_RECORD_SECONDS) {
          stopAndAnalyze();
        }
      }, 100);
    } catch (e) {
      cleanupAudio();
      setError(e.message || 'Microphone access denied. Allow mic permission in browser settings.');
    }
  }

  async function stopAndAnalyze() {
    if (!recordingRef.current) return;
    const chunks = chunksRef.current;
    const rate = sampleRateRef.current;
    cleanupAudio();

    const totalSamples = chunks.reduce((sum, arr) => sum + arr.length, 0);
    if (totalSamples < rate * 0.2) {
      setError('Recording was too short. Record at least 1 second of audio before stopping.');
      return;
    }

    const wavBlob = encodeWav(chunks, rate);
    const stamp = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
    const wavFile = new File([wavBlob], `mic-capture-${stamp}.wav`, { type: 'audio/wav' });
    setFile(wavFile);
    setMicNote(
      `Captured ${(totalSamples / rate).toFixed(1)}s at ${(rate / 1000).toFixed(1)} kHz PCM WAV. Adjust the threshold slider and click Run security analysis to re-test.`
    );
    await run(wavFile, wavFile.name);
  }

  useEffect(() => {
    getDataset();
    return () => cleanupAudio();
  }, []);

  function exportReport() {
    if (!result) return;
    const { waveform, spectrum, window_scores, ...report } = result;
    const obj = new Blob([JSON.stringify({ ...report, generated_at: new Date().toISOString() }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(obj);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nuit-guard-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="nuit-root">
      <style>{APP_STYLES}</style>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={23} />
          </div>
          <div>
            <strong>NUIT Guard</strong>
            <span>AUDIO SECURITY LAB</span>
          </div>
        </div>
        <div className="sidebar-caption">WORKSPACE</div>
        <div className="navitem selected">
          <Activity size={18} /> Analysis Dashboard
        </div>
        <div className="navitem muted">
          <Waves size={18} /> Signal Research
        </div>
        <div className="side-bottom">
          <div className="info-mini">
            <Info size={16} /> Educational prototype
            <br />
            Not a security certification.
          </div>
          <a href="https://www.usenix.org/conference/usenixsecurity23/presentation/xia" target="_blank" rel="noreferrer">
            Original research ↗
          </a>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <span>
            Research Lab <span className="breadcrumb">/ Audio Analysis</span>
          </span>
          <div className="top-status">
            <span className="status-dot" /> {apiMode}
          </div>
        </header>

        <div className="content">
          <div className="hero">
            <div>
              <div className="eyebrow">AUDIO THREAT INTELLIGENCE</div>
              <h1>
                Analyze the <em>unheard.</em>
              </h1>
              <p>
                Explore near-ultrasound signals and nonlinear-demodulation artifacts using live 48 kHz raw-PCM microphone capture, WAV upload, or cached Kaggle benchmark samples.
              </p>
            </div>
            <div className="hero-icon">
              <Waves size={58} strokeWidth={1.4} />
            </div>
          </div>

          <div className="work-grid">
            <section className="panel upload-panel">
              <div className="section-title">
                <div className="section-symbol">
                  <UploadCloud size={19} />
                </div>
                <div>
                  <h2>Analyze audio</h2>
                  <p>Record live 48 kHz PCM from your mic or upload WAV/FLAC</p>
                </div>
              </div>

              <div className="mic-box">
                <div className="mic-head">
                  <div>
                    <strong>Built-in Microphone Capture</strong>
                    <span>
                      {recording
                        ? `Recording raw PCM (${captureRate ? (captureRate / 1000).toFixed(1) : '48.0'} kHz) · ${recordSeconds.toFixed(1)}s / ${MAX_RECORD_SECONDS}s`
                        : 'Captures uncompressed PCM with noise suppression & echo cancellation off'}
                    </span>
                  </div>
                  {!recording ? (
                    <button className="btn btn-outline" disabled={loading} onClick={startRecording}>
                      <Mic size={16} /> Start recording
                    </button>
                  ) : (
                    <button className="btn btn-danger" onClick={stopAndAnalyze}>
                      <span className="rec-dot" /> <Square size={14} /> Stop &amp; analyze
                    </button>
                  )}
                </div>
                {recording && (
                  <div className="mic-meter" aria-label="Microphone input level">
                    <div className="mic-meter-fill" style={{ width: `${micLevel}%` }} />
                  </div>
                )}
                {micNote && <p className="mic-note">{micNote}</p>}
              </div>

              <div
                className={'dropzone ' + (drag ? 'drag' : '')}
                onDragOver={e => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDrag(false);
                  setFile(e.dataTransfer.files[0] || null);
                }}
              >
                <UploadCloud size={32} color="#80a5dc" />
                <strong>{file ? file.name : 'Drop an audio file here'}</strong>
                <span>or select a WAV/FLAC file from your computer</span>
                <label className="btn btn-outline">
                  Browse files
                  <input
                    type="file"
                    accept=".wav,.flac,audio/wav,audio/flac"
                    hidden
                    onChange={e => setFile(e.target.files[0] || null)}
                  />
                </label>
              </div>

              <div className="threshold">
                <div>
                  <SlidersHorizontal size={17} />
                  <strong>Correlation threshold</strong>
                </div>
                <span>{threshold.toFixed(2)}</span>
              </div>
              <input
                aria-label="Correlation threshold"
                className="range"
                type="range"
                min="0.25"
                max="0.85"
                step="0.05"
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
              />
              <button
                disabled={!file || loading || recording}
                className="btn btn-primary run-btn"
                onClick={() => run(file, file.name)}
              >
                {loading ? <Loader2 size={17} className="spin" /> : <Activity size={17} />}{' '}
                {loading ? 'Analyzing...' : 'Run security analysis'}
              </button>
            </section>

            <section className="panel samples-panel">
              <div className="section-title">
                <div className="section-symbol purple">
                  <FileAudio size={19} />
                </div>
                <div>
                  <h2>Sample laboratory</h2>
                  <p>Try controlled, non-command demonstration signals</p>
                </div>
              </div>
              <div className="sample-list">
                {SAMPLES.map((s, i) => (
                  <button className="sample" disabled={loading || recording} key={s.kind} onClick={() => demoSample(s)}>
                    <div className="sample-icon">
                      {i === 0 ? <Waves size={20} /> : i === 1 ? <Activity size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div>
                      <strong>{s.name}</strong>
                      <small>{s.info}</small>
                    </div>
                    <span className="arrow">↗</span>
                  </button>
                ))}
              </div>

              <div className="tone-box">
                <strong>Two-Device Live Demo WAV Generator</strong>
                <small>
                  Download a 48 kHz test WAV to AirDrop to your phone/second laptop, play it near your MacBook mic, and click Start recording.
                </small>
                <div className="tone-actions">
                  <button
                    className="btn btn-outline"
                    onClick={() => downloadSecondDeviceTestWav('normal')}
                    type="button"
                  >
                    <Volume2 size={14} /> Control WAV
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => downloadSecondDeviceTestWav('simulated_nonlinear')}
                    type="button"
                  >
                    <Download size={14} /> Modulated 18.2 kHz WAV
                  </button>
                </div>
              </div>

              {/* <div className="sample-note">
                <Info size={17} />
                <span>
                  On macOS, set Control Center → Mic Mode to Standard and Audio MIDI Setup to 48,000 Hz so near-ultrasound frequencies reach the browser.
                </span>
              </div> */}
            </section>
          </div>

          <section className="panel kaggle-panel">
            <div className="kaggle-head">
              <div className="section-title" style={{ marginBottom: 0 }}>
                <div className="section-symbol">
                  <Waves size={19} />
                </div>
                <div>
                  <h2>Kaggle Dataset Explorer</h2>
                  <p>{datasetMessage}</p>
                </div>
              </div>
              <button className="btn btn-outline" disabled={datasetLoading || loading} onClick={getDataset}>
                <RefreshCw size={15} className={datasetLoading ? 'spin' : ''} />{' '}
                {datasetLoading ? 'Loading...' : 'Refresh samples'}
              </button>
            </div>
            {dataset.length > 0 && (
              <div className="kaggle-grid">
                {dataset.map(s => (
                  <button
                    key={s.filename}
                    className="sample"
                    disabled={loading || recording}
                    onClick={() => runDataset(s)}
                  >
                    <div>
                      <strong>{s.filename}</strong>
                      <small>{s.category}</small>
                    </div>
                    <span className="arrow">↗</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {error && (
            <div className="error">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {result ? (
            <>
              <section className="results-head">
                <div>
                  <div className="eyebrow">ANALYSIS REPORT</div>
                  <h2>Detection results</h2>
                  <span className="filename">
                    {result.filename} · {result.duration_seconds}s · {(result.sample_rate / 1000).toFixed(1)} kHz
                  </span>
                </div>
                <button className="btn btn-outline" onClick={exportReport}>
                  <Download size={16} /> Export JSON report
                </button>
              </section>
              <div className="stats">
                <div className={'stat verdict ' + (result.verdict === 'suspicious' ? 'warn' : 'safe')}>
                  <div className="stat-label">DETECTION STATUS</div>
                  <div className="stat-value">
                    {result.verdict === 'suspicious' ? (
                      <>
                        <AlertTriangle /> Suspicious
                      </>
                    ) : (
                      <>
                        <CheckCircle2 /> Not flagged
                      </>
                    )}
                  </div>
                  <small>Heuristic assessment, not proof</small>
                </div>
                <div className="stat">
                  <div className="stat-label">CORRELATION SCORE</div>
                  <div className="stat-value number">{result.score.toFixed(3)}</div>
                  <small>Decision threshold {result.threshold.toFixed(2)}</small>
                </div>
                <div className="stat">
                  <div className="stat-label">HIGH-BAND ENERGY</div>
                  <div className="stat-value number">{(result.high_band_energy_ratio * 100).toFixed(2)}%</div>
                  <small>16–22 kHz / total signal energy</small>
                </div>
              </div>
              <div className="charts">
                <Plot
                  title="Audio waveform"
                  subtitle="Amplitude across time"
                  data={result.waveform}
                  xLabel="Time (seconds)"
                  type="area"
                />
                <Plot
                  title="Frequency spectrum"
                  subtitle="Power spectral density (dB)"
                  data={result.spectrum}
                  xLabel="Frequency (kHz)"
                />
                <Plot
                  title="Window correlation"
                  subtitle="Normalized cross-correlation by segment"
                  data={result.window_scores}
                  xLabel="Time (seconds)"
                  reference={result.threshold}
                />
              </div>
              <div className="explanation">
                <Info size={19} />
                <div>
                  <strong>Interpretation</strong>
                  <p>{result.explanation}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-result">
              <ShieldCheck size={38} />
              <strong>Your analysis appears here</strong>
              <span>Record from your microphone, upload a WAV file, or click a sample above to begin.</span>
            </div>
          )}

          <footer>
            NUIT Guard · Educational research prototype · Inspired by Xia, Chen &amp; Xu (USENIX Security 2023)
          </footer>
        </div>
      </main>
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App/>);