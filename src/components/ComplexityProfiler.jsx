import React from 'react';
import { Gauge, Zap, Database, AlertCircle, TrendingUp } from 'lucide-react';

export function ComplexityProfiler({ complexity, onHighlightLine, onOpenBenchmark }) {
  if (!complexity) return null;

  const { time = 'O(1)', space = 'O(1)', explanation = '', hotspots = [] } = complexity;

  const getComplexityColor = (comp) => {
    if (comp.includes('2^N') || comp.includes('N!') || comp.includes('N^3')) return '#f43f5e'; // Rose
    if (comp.includes('N^2')) return '#f59e0b'; // Amber
    if (comp.includes('N log N')) return '#38bdf8'; // Sky
    if (comp.includes('O(N)')) return '#06b6d4'; // Cyan
    return '#10b981'; // Emerald
  };

  return (
    <div className="complexity-card">
      <div className="complexity-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gauge size={16} color="var(--accent-primary-light)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Algorithmic Complexity & Hotspots
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="complexity-pill" style={{ borderColor: getComplexityColor(time) }}>
            <Zap size={11} color={getComplexityColor(time)} />
            <span>Time: <strong>{time}</strong></span>
          </div>

          <div className="complexity-pill" style={{ borderColor: getComplexityColor(space) }}>
            <Database size={11} color={getComplexityColor(space)} />
            <span>Space: <strong>{space}</strong></span>
          </div>

          {onOpenBenchmark && (
            <button
              id="btn-open-benchmark-profiler"
              className="btn btn-secondary btn-sm"
              onClick={onOpenBenchmark}
              title="Launch Smart Automated Regression & Benchmark Profiler"
              style={{
                fontSize: '11px',
                padding: '3px 9px',
                color: '#38bdf8',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                background: 'rgba(56, 189, 248, 0.08)',
                gap: '5px'
              }}
            >
              <Zap size={12} fill="currentColor" />
              <span>Benchmark N</span>
            </button>
          )}
        </div>
      </div>

      <p className="complexity-explanation">{explanation}</p>

      {hotspots.length > 0 && (
        <div className="hotspots-row">
          <AlertCircle size={12} color="var(--accent-amber)" />
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Computational Hotspot lines:</span>
          {hotspots.map((lineNum) => (
            <button
              key={lineNum}
              className="hotspot-badge"
              onClick={() => onHighlightLine && onHighlightLine(lineNum)}
              title={`Jump to line ${lineNum}`}
            >
              Line {lineNum}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
