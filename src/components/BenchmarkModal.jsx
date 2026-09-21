import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gauge, 
  Zap, 
  Play, 
  RotateCcw, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Download,
  History,
  Layers,
  Sparkles,
  BarChart2,
  LineChart
} from 'lucide-react';
import { 
  runMultiScaleBenchmark, 
  compareBenchmarkRuns, 
  getBenchmarkHistory, 
  saveBenchmarkToHistory 
} from '../services/benchmarkEngine';

export function BenchmarkModal({ 
  isOpen, 
  onClose, 
  code = '', 
  originalCode = '',
  fixedCode = '', 
  language = 'javascript',
  onHighlightLine
}) {
  const [scalePreset, setScalePreset] = useState('standard'); // 'standard' | 'extreme'
  const [compareMode, setCompareMode] = useState(fixedCode ? 'compare' : 'current'); // 'current' | 'compare'
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('curve'); // 'curve' | 'table' | 'history'

  const targetCode = code || originalCode;

  const [currentRun, setCurrentRun] = useState(null);
  const [baselineRun, setBaselineRun] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(getBenchmarkHistory());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const scales = scalePreset === 'extreme' ? [50, 500, 2500, 10000] : [10, 100, 1000, 5000];

  const handleRunBenchmark = async () => {
    setIsRunning(true);

    try {
      // 1. Benchmark target code
      const targetResult = await runMultiScaleBenchmark(targetCode, language, { scales, iterationsPerScale: 80 });
      setCurrentRun(targetResult);

      // 2. If in compare mode, benchmark the baseline / fixed code too
      if (compareMode === 'compare' && fixedCode) {
        const baseResult = await runMultiScaleBenchmark(fixedCode, language, { scales, iterationsPerScale: 80 });
        setBaselineRun(baseResult);
      }

      // Save run to history
      const updatedHistory = saveBenchmarkToHistory(targetResult, `Benchmark (${language.toUpperCase()} - ${scales[scales.length - 1]}N)`);
      setHistory(updatedHistory);
    } catch (err) {
      console.error('Benchmark error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const comparison = compareMode === 'compare' && baselineRun && currentRun 
    ? compareBenchmarkRuns(baselineRun, currentRun) 
    : null;

  const handleExportReport = () => {
    if (!currentRun) return;
    const report = {
      benchmarkTimestamp: currentRun.timestamp,
      language,
      empiricalComplexity: currentRun.curveFit,
      summary: currentRun.summary,
      scales: currentRun.scales,
      comparison
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark_${language}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // SVG Chart Dimensions
  const chartW = 540;
  const chartH = 180;
  const padL = 50;
  const padR = 25;
  const padT = 20;
  const padB = 30;

  // Max values for plotting
  const maxN = scales[scales.length - 1];
  const maxMs = currentRun?.scales ? Math.max(...currentRun.scales.map(s => s.avgMs), 0.01) : 1;

  // Generate SVG path for empirical points
  const points = currentRun?.scales?.map(s => {
    const x = padL + ((s.n / maxN) * (chartW - padL - padR));
    const y = padB + ((1 - (s.avgMs / maxMs)) * (chartH - padT - padB));
    return { x, y, ...s };
  }) || [];

  const pathD = points.length > 0 
    ? points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') 
    : '';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '780px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '14px' }}>
          <div className="modal-title">
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(16, 185, 129, 0.2))',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Gauge size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Smart Automated Regression & Benchmark Profiler
                </span>
                <span className="severity-tag low" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                  {language}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Multi-scale empirical microbenchmarking, Big-O empirical curve matching, and regression detection.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Controls Bar */}
          <div style={{ 
            background: 'var(--bg-card-subtle)', 
            border: '1px solid var(--border-default)', 
            borderRadius: 'var(--radius-md)', 
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {/* Scale Preset */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Scales (N):</span>
                <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-default)' }}>
                  <button 
                    className={`filter-pill ${scalePreset === 'standard' ? 'active' : ''}`}
                    onClick={() => setScalePreset('standard')}
                    style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '4px' }}
                  >
                    10 → 5,000
                  </button>
                  <button 
                    className={`filter-pill ${scalePreset === 'extreme' ? 'active' : ''}`}
                    onClick={() => setScalePreset('extreme')}
                    style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '4px' }}
                  >
                    50 → 10,000
                  </button>
                </div>
              </div>

              {/* Mode Selector */}
              {fixedCode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Target:</span>
                  <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-default)' }}>
                    <button 
                      className={`filter-pill ${compareMode === 'current' ? 'active' : ''}`}
                      onClick={() => setCompareMode('current')}
                      style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '4px' }}
                    >
                      Active Code
                    </button>
                    <button 
                      className={`filter-pill ${compareMode === 'compare' ? 'active' : ''}`}
                      onClick={() => setCompareMode('compare')}
                      style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '4px' }}
                    >
                      Compare vs Baseline
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Run Button */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                id="btn-run-smart-benchmark"
                className="btn btn-primary"
                onClick={handleRunBenchmark}
                disabled={isRunning}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  borderColor: '#38bdf8',
                  color: '#ffffff',
                  fontWeight: 600,
                  boxShadow: '0 2px 10px rgba(6, 182, 212, 0.35)',
                  padding: '7px 18px'
                }}
              >
                {isRunning ? (
                  <>
                    <Zap size={14} className="spin" />
                    <span>Profiling {scales.length} Scales...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Run Smart Benchmark</span>
                  </>
                )}
              </button>

              {currentRun && (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportReport}
                  title="Export Benchmark Results as JSON"
                  style={{ padding: '7px 12px' }}
                >
                  <Download size={14} />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>

          {/* Regression / Improvement Status Banner */}
          {comparison && (
            <div style={{
              background: comparison.isImprovement 
                ? 'rgba(16, 185, 129, 0.1)' 
                : (comparison.isRegression ? 'rgba(244, 63, 94, 0.1)' : 'rgba(56, 189, 248, 0.08)'),
              border: `1px solid ${comparison.isImprovement ? 'rgba(16, 185, 129, 0.4)' : (comparison.isRegression ? 'rgba(244, 63, 94, 0.4)' : 'rgba(56, 189, 248, 0.3)')}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {comparison.isImprovement ? (
                  <TrendingUp size={20} color="#10b981" />
                ) : comparison.isRegression ? (
                  <TrendingDown size={20} color="#f43f5e" />
                ) : (
                  <CheckCircle2 size={20} color="#38bdf8" />
                )}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: comparison.isImprovement ? '#34d399' : (comparison.isRegression ? '#fb7185' : '#38bdf8') }}>
                    {comparison.isImprovement 
                      ? `⚡ Optimized: ${comparison.speedup}x Faster Execution` 
                      : (comparison.isRegression 
                        ? `⚠️ Performance Regression: ${comparison.latencyDeltaPercent}% Slower` 
                        : 'Identical Runtime Latency')}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Baseline: {comparison.baseAvgMs}ms ({comparison.baseOps.toLocaleString()} ops/sec) → Active: {comparison.targetAvgMs}ms ({comparison.targetOps.toLocaleString()} ops/sec)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span className={`severity-tag ${comparison.isImprovement ? 'low' : (comparison.isRegression ? 'critical' : 'medium')}`}>
                  {comparison.isImprovement ? 'Speedup Achieved' : (comparison.isRegression ? 'Regression Detected' : 'Parity')}
                </span>
              </div>
            </div>
          )}

          {/* Subview Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
            <button
              className={`filter-pill ${activeTab === 'curve' ? 'active' : ''}`}
              onClick={() => setActiveTab('curve')}
            >
              <LineChart size={13} style={{ display: 'inline', marginRight: '5px' }} />
              <span>Empirical Big-O Curve</span>
            </button>
            <button
              className={`filter-pill ${activeTab === 'table' ? 'active' : ''}`}
              onClick={() => setActiveTab('table')}
            >
              <BarChart2 size={13} style={{ display: 'inline', marginRight: '5px' }} />
              <span>Multi-N Scale Matrix</span>
            </button>
            <button
              className={`filter-pill ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={13} style={{ display: 'inline', marginRight: '5px' }} />
              <span>Run History ({history.length})</span>
            </button>
          </div>

          {/* Benchmark Results */}
          {currentRun ? (
            activeTab === 'curve' ? (
              /* Empirical Curve Visualization */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Curve Classification Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#38bdf8" />
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      Empirical Curve Fit:
                    </span>
                    <strong style={{ fontSize: '13px', color: '#38bdf8' }}>
                      {currentRun.curveFit?.label || 'O(N)'}
                    </strong>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Confidence: <span style={{ color: '#34d399' }}>{currentRun.curveFit?.confidencePercent}%</span> (R² = {currentRun.curveFit?.allFits?.[0]?.r2 || 0.98})
                  </span>
                </div>

                {/* SVG Chart */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <span>Latency (ms) vs Input Size (N)</span>
                    <span style={{ color: '#38bdf8' }}>● Empirical Execution</span>
                  </div>

                  <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: '180px', overflow: 'visible' }}>
                    {/* Grid Lines */}
                    {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                      const y = padB + (1 - frac) * (chartH - padT - padB);
                      return (
                        <g key={idx}>
                          <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                          <text x={padL - 8} y={y + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end">
                            {(maxMs * frac).toFixed(2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* X Axis */}
                    <line x1={padL} y1={chartH - padT} x2={chartW - padR} y2={chartH - padT} stroke="rgba(255,255,255,0.15)" />
                    {scales.map((s, idx) => {
                      const x = padL + ((s / maxN) * (chartW - padL - padR));
                      return (
                        <g key={idx}>
                          <line x1={x} y1={chartH - padT} x2={x} y2={chartH - padT + 4} stroke="rgba(255,255,255,0.2)" />
                          <text x={x} y={chartH - padT + 14} fill="var(--text-muted)" fontSize="9" textAnchor="middle">
                            {s >= 1000 ? `${s / 1000}k` : s}
                          </text>
                        </g>
                      );
                    })}

                    {/* Connecting Area under curve */}
                    {points.length > 0 && (
                      <path
                        d={`${pathD} L ${points[points.length - 1].x} ${chartH - padT} L ${points[0].x} ${chartH - padT} Z`}
                        fill="url(#benchmarkGradient)"
                        opacity="0.2"
                      />
                    )}

                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Empirical Line */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Data Points */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
                        <title>{`N = ${p.n}: ${p.avgMs}ms (${p.opsPerSec.toLocaleString()} ops/sec)`}</title>
                      </g>
                    ))}
                  </svg>
                </div>

                {/* Key Performance Metrics 4-Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div className="test-stat-item" style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                    <span className="test-stat-label">Median Latency</span>
                    <span className="test-stat-number" style={{ fontSize: '18px', color: '#38bdf8' }}>
                      {currentRun.summary?.p50Ms} ms
                    </span>
                  </div>

                  <div className="test-stat-item" style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                    <span className="test-stat-label">95th Percentile (P95)</span>
                    <span className="test-stat-number" style={{ fontSize: '18px', color: 'var(--accent-amber)' }}>
                      {currentRun.summary?.p95Ms} ms
                    </span>
                  </div>

                  <div className="test-stat-item" style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                    <span className="test-stat-label">Throughput</span>
                    <span className="test-stat-number" style={{ fontSize: '18px', color: 'var(--accent-emerald)' }}>
                      {currentRun.summary?.overallOpsPerSec?.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ops/s</span>
                    </span>
                  </div>

                  <div className="test-stat-item" style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                    <span className="test-stat-label">Memory Allocation</span>
                    <span className="test-stat-number" style={{ fontSize: '18px', color: '#c084fc' }}>
                      ~{currentRun.summary?.estimatedMemoryDeltaKb} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>KB</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : activeTab === 'table' ? (
              /* Multi-N Scale Matrix Table */
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <table className="variable-watch-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Input Size (N)</th>
                      <th>Samples</th>
                      <th>Avg Latency</th>
                      <th>Min / Max</th>
                      <th>Throughput</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRun.scales?.map((s, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: '#38bdf8' }}>N = {s.n.toLocaleString()}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{s.iterations} runs</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.avgMs} ms ({s.avgMicros} µs)</td>
                        <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{s.minMs}ms / {s.maxMs}ms</td>
                        <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{s.opsPerSec.toLocaleString()} ops/s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* History Tab */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                    No previous benchmark runs stored yet. Run your first benchmark above!
                  </div>
                ) : (
                  history.map((h) => (
                    <div 
                      key={h.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {h.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {h.timestamp} • P50: {h.data?.summary?.p50Ms}ms • {h.data?.summary?.overallOpsPerSec?.toLocaleString()} ops/sec
                        </div>
                      </div>

                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setCurrentRun(h.data);
                          setActiveTab('curve');
                        }}
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                      >
                        Load Snapshot
                      </button>
                    </div>
                  ))
                )}
              </div>
            )
          ) : (
            /* Empty state before running */
            <div style={{ 
              padding: '40px 20px', 
              textAlign: 'center', 
              background: 'var(--bg-card)', 
              border: '1px dashed var(--border-default)', 
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Gauge size={38} color="var(--accent-cyan)" style={{ opacity: 0.7 }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                  Ready to Benchmark & Profile Complexity
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', maxWidth: '420px' }}>
                  Click <strong>Run Smart Benchmark</strong> to execute high-precision microbenchmarks across multiple input sizes ($N = 10 \to 5000$).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-default)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            High-resolution timer harness powered by <code>performance.now()</code>
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
