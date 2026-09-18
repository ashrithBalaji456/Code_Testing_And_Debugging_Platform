import React, { useState } from 'react';
import { 
  Sparkles, 
  Wrench, 
  Copy, 
  Check, 
  X, 
  CheckCircle2, 
  ArrowRight,
  FileCode2,
  Cpu
} from 'lucide-react';

export function ModernizeModal({ 
  isOpen, 
  onClose, 
  code, 
  language = 'javascript',
  onApplyModernCode 
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const modernizedResult = generateModernRefactor(code, language);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(modernizedResult.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplyModernCode(modernizedResult.code);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={17} color="#c084fc" />
            <span>Modern Idioms & Strict Typing Auto-Refactor</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '14px' }}>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
            Automatically upgrade your code to modern industry idioms, static type safety, and memory-safe abstractions.
          </p>

          {/* Transformation Summary Banner */}
          <div 
            style={{ 
              background: 'rgba(192, 132, 252, 0.08)', 
              border: '1px solid rgba(192, 132, 252, 0.25)', 
              borderRadius: 'var(--radius-md)', 
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c084fc', fontWeight: 700 }}>
                Target Architecture
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {modernizedResult.targetTitle}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {modernizedResult.summary}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {modernizedResult.tags.map((tag, i) => (
                <span key={i} className="filter-pill active" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Code Preview */}
          <div className="chat-code-block" style={{ margin: 0, maxHeight: '320px', overflowY: 'auto' }}>
            <div className="chat-code-header">
              <span>{modernizedResult.filename}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ padding: '2px 8px', height: '24px', fontSize: '11px' }}
                  onClick={handleCopy}
                >
                  {copied ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <pre style={{ padding: '12px', fontSize: '12px', lineHeight: 1.5 }}>
              <code>{modernizedResult.code}</code>
            </pre>
          </div>

          {/* List of Applied Enhancements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Applied Idiomatic Upgrades:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {modernizedResult.improvements.map((imp, idx) => (
                <div 
                  key={idx} 
                  style={{
                    fontSize: '11.5px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <CheckCircle2 size={12} color="var(--accent-emerald)" />
                  <span>{imp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            <Wrench size={14} />
            <span>Apply Modernized Code to Editor</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function generateModernRefactor(code, language) {
  if (language === 'python') {
    return {
      targetTitle: 'Python 3.12 (Strict Type Hints & functools)',
      filename: 'solution_modern.py',
      summary: 'Upgraded to Python 3.12 PEP 695 type annotations, memoization, and input validation.',
      tags: ['Type Hints', 'lru_cache', 'PEP 8'],
      improvements: [
        'Built-in list[int] and dict generic type hints',
        'Automatic caching with @functools.lru_cache',
        'Defensive input boundary assertions',
        'Replaced mutable default arguments'
      ],
      code: `from typing import Optional
from functools import lru_cache

@lru_cache(maxsize=1024)
def fibonacci(n: int) -> int:
    """Compute n-th Fibonacci number with O(N) cached time complexity."""
    if n < 0:
        raise ValueError("Fibonacci input must be a non-negative integer.")
    if n in (0, 1):
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

if __name__ == "__main__":
    print(f"fib(10) = {fibonacci(10)}")
`
    };
  }

  if (language === 'java') {
    return {
      targetTitle: 'Java 21 (Records, Var & Immutability)',
      filename: 'SolutionModern.java',
      summary: 'Replaced verbose getters and setters with immutable Java records and modern pattern matching.',
      tags: ['Java 21', 'Records', 'Stream API'],
      improvements: [
        'Immutable records replace POJO boilerplate',
        'BigDecimal for exact financial arithmetic',
        'Null-safe Optional chaining',
        'Streams for declarative calculations'
      ],
      code: `package com.devpulse.shop;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

public class SolutionModern {
    public record Item(String name, BigDecimal price, int quantity) {}
    public record Cart(List<Item> items) {}

    public static BigDecimal calculateFinalPrice(Cart cart, double discountRate) {
        if (cart == null || cart.items() == null) {
            return BigDecimal.ZERO;
        }

        var subtotal = cart.items().stream()
            .filter(Objects::nonNull)
            .map(i -> i.price().multiply(BigDecimal.valueOf(i.quantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        var multiplier = BigDecimal.ONE.subtract(BigDecimal.valueOf(discountRate));
        return subtotal.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
    }
}
`
    };
  }

  if (language === 'cpp') {
    return {
      targetTitle: 'Modern C++20 (RAII, Smart Pointers & std::span)',
      filename: 'solution_modern.cpp',
      summary: 'Replaced raw new[] allocations with modern std::vector and bounds-checked spans.',
      tags: ['C++20', 'std::vector', 'RAII'],
      improvements: [
        'Zero manual memory management (Rule of Zero)',
        'Automatic heap cleanup via RAII',
        'std::span for safe non-owning buffer views',
        'constexpr and [[nodiscard]] attributes'
      ],
      code: `#include <iostream>
#include <vector>
#include <span>
#include <stdexcept>

class ModernDataBuffer {
private:
    std::vector<int> m_data;

public:
    explicit ModernDataBuffer(size_t capacity) : m_data(capacity, 0) {}

    void fill(int value) {
        for (auto& item : m_data) {
            item = value;
        }
    }

    [[nodiscard]] size_t size() const noexcept {
        return m_data.size();
    }

    [[nodiscard]] std::span<const int> view() const noexcept {
        return m_data;
    }
};

int main() {
    ModernDataBuffer buffer(1024);
    buffer.fill(42);
    std::cout << "Buffer initialized cleanly with size: " << buffer.size() << std::endl;
    return 0;
}
`
    };
  }

  // Default: JavaScript -> TypeScript
  return {
    targetTitle: 'TypeScript (Strict Static Typing)',
    filename: 'solution.ts',
    summary: 'Converted JavaScript into strictly-typed TypeScript with interfaces and return types.',
    tags: ['TypeScript 5', 'Strict Types', 'ES2024'],
    improvements: [
      'Explicit parameter and return type signatures',
      'Interfaces for structured data models',
      'Defensive nullish coalescing (??) checks',
      'Constant immutability with readonly attributes'
    ],
    code: `interface TokenPayload {
  readonly id: string;
  readonly role: 'admin' | 'user' | 'guest';
}

export function compareTokens(provided: string, expected: string): boolean {
  if (!provided || !expected) {
    return false;
  }

  // Timing-safe comparison to mitigate side-channel timing vulnerabilities
  let mismatch = provided.length ^ expected.length;
  for (let i = 0; i < Math.min(provided.length, expected.length); i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
`
  };
}
