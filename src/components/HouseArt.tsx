/** Decorative house illustration for the House Pulse card (pure SVG, no image files). */
export default function HouseArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden>
      <ellipse cx="100" cy="132" rx="95" ry="8" fill="#cfeedd" />
      {/* clouds */}
      <g fill="#ffffff" opacity="0.9">
        <ellipse cx="150" cy="18" rx="16" ry="7" />
        <ellipse cx="162" cy="14" rx="10" ry="7" />
        <ellipse cx="40" cy="26" rx="12" ry="5" />
      </g>
      {/* trees */}
      <rect x="22" y="92" width="4" height="36" rx="2" fill="#8a6a4f" />
      <ellipse cx="24" cy="82" rx="17" ry="24" fill="#7fcf8f" />
      <ellipse cx="20" cy="76" rx="8" ry="12" fill="#9be0a8" />
      <rect x="174" y="100" width="4" height="28" rx="2" fill="#8a6a4f" />
      <ellipse cx="176" cy="92" rx="13" ry="19" fill="#6fc583" />
      {/* house body */}
      <rect x="52" y="64" width="96" height="64" rx="3" fill="#f6e7cf" />
      <path d="M44 68 L100 26 L156 68" fill="none" stroke="#2f4a4a" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M52 66 L100 30 L148 66 Z" fill="#f3dcbc" />
      <rect x="126" y="34" width="10" height="20" fill="#2f4a4a" />
      {/* attic window */}
      <rect x="92" y="44" width="16" height="14" rx="1.5" fill="#bfe7ef" stroke="#4b8d96" strokeWidth="2" />
      <path d="M100 44v14M92 51h16" stroke="#4b8d96" strokeWidth="1.5" />
      {/* windows */}
      <rect x="62" y="80" width="22" height="20" rx="1.5" fill="#bfe7ef" stroke="#4b8d96" strokeWidth="2" />
      <path d="M73 80v20M62 90h22" stroke="#4b8d96" strokeWidth="1.5" />
      <rect x="116" y="80" width="22" height="20" rx="1.5" fill="#bfe7ef" stroke="#4b8d96" strokeWidth="2" />
      <path d="M127 80v20M116 90h22" stroke="#4b8d96" strokeWidth="1.5" />
      {/* door */}
      <rect x="90" y="88" width="20" height="40" rx="2" fill="#2f5d5a" />
      <circle cx="106" cy="109" r="1.6" fill="#f6e7cf" />
      <rect x="86" y="126" width="28" height="3" rx="1.5" fill="#d9c3a3" />
      {/* fence */}
      <g fill="#ffffff" stroke="#d8e4dc" strokeWidth="1">
        {[146, 154, 162, 170, 178, 186].map((x) => (
          <path key={x} d={`M${x} 128 V114 l3 -4 l3 4 V128 Z`} />
        ))}
      </g>
      {/* bushes */}
      <ellipse cx="58" cy="127" rx="12" ry="7" fill="#7fcf8f" />
      <ellipse cx="140" cy="127" rx="10" ry="6" fill="#7fcf8f" />
    </svg>
  );
}
