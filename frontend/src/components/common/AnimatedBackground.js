import React, { useMemo } from 'react';

export default function AnimatedBackground({ particles = 20 }) {
  const pts = useMemo(() => Array.from({ length: particles }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`,
    size: `${2 + Math.random() * 4}px`,
    duration: `${8 + Math.random() * 14}s`,
    delay: `${Math.random() * 10}s`,
    opacity: 0.3 + Math.random() * 0.5
  })), [particles]);

  return (
    <div className="animated-bg">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />
      <div className="particles-container">
        {pts.map(p => (
          <div key={p.id} className="particle" style={{
            left: p.left, width: p.size, height: p.size,
            animationDuration: p.duration, animationDelay: p.delay, opacity: p.opacity
          }} />
        ))}
      </div>
    </div>
  );
}