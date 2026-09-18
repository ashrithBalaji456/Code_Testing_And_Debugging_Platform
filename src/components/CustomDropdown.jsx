import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export function CustomDropdown({
  label,
  icon: Icon,
  value,
  options = [],
  onChange,
  title,
  id,
  minWidth = 180,
  maxWidth = 360
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: minWidth });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuW = Math.max(rect.width, minWidth);
      let left = rect.left;
      
      // Ensure menu doesn't overflow the right edge of viewport
      if (left + menuW > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - menuW - 12);
      }

      setCoords({
        top: rect.bottom + 6,
        left: left,
        width: menuW
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleWindowEvents = (e) => {
      // Close dropdown if user scrolls the navbar or changes window size
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleWindowEvents, true);
    window.addEventListener('resize', handleWindowEvents);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleWindowEvents, true);
      window.removeEventListener('resize', handleWindowEvents);
    };
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        id={id}
        className={`custom-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={title || selectedOption?.label || label}
      >
        {Icon && <Icon size={14} className="dropdown-leading-icon" />}
        {label && <span className="dropdown-label">{label}</span>}
        <span className="dropdown-selected-text" style={{ maxWidth: maxWidth ? `${maxWidth}px` : 'none' }}>
          {selectedOption?.label || value}
        </span>
        <ChevronDown size={13} className={`dropdown-chevron ${isOpen ? 'rotated' : ''}`} />
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="custom-dropdown-menu"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              minWidth: `${coords.width}px`,
              maxWidth: `${Math.max(coords.width, maxWidth + 40)}px`
            }}
            role="listbox"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onChange && onChange(opt.value);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  title={opt.label}
                >
                  <div className="item-content-left">
                    {opt.dotColor && (
                      <span 
                        className="item-color-dot" 
                        style={{ background: opt.dotColor }}
                      />
                    )}
                    {opt.badge && (
                      <span 
                        className="item-badge-pill" 
                        style={{ 
                          color: opt.badgeColor || 'var(--accent-cyan)',
                          borderColor: opt.badgeColor ? `${opt.badgeColor}40` : 'rgba(6, 182, 212, 0.3)',
                          backgroundColor: opt.badgeColor ? `${opt.badgeColor}15` : 'rgba(6, 182, 212, 0.1)'
                        }}
                      >
                        {opt.badge}
                      </span>
                    )}
                    <span className="item-label-text">{opt.label}</span>
                  </div>

                  {isSelected && (
                    <Check size={14} className="item-check-icon" />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
