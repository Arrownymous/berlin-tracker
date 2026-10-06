/**
 * App-icoon: de Fernsehturm uit het woordmerk, licht op racegroen, met rood baken.
 * Gedeeld door icon.tsx en apple-icon.tsx. Geen clipPath: ImageResponse (satori) ondersteunt alleen eenvoudige SVG.
 */
export function AppMark({ size }: { size: number }) {
  const green = "#24533B";
  const light = "#F4F2EC";
  // Steviger variant van TowerMark (viewBox 60×200), zodat hij ook op 48 px nog leesbaar is.
  const h = size * 0.8;
  const w = h * 0.3;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", background: green }}>
      <svg width={w} height={h} viewBox="0 0 60 200" style={{ marginBottom: size * 0.06 }}>
        <rect x="28" y="10" width="4" height="38" fill={light} />
        <rect x="26.5" y="44" width="7" height="28" fill={light} />
        <circle cx="30" cy="90" r="21" fill={light} />
        <rect x="10.5" y="83" width="39" height="7" fill={green} opacity="0.55" />
        <rect x="23" y="109" width="14" height="6" fill={light} />
        <polygon points="25,114 35,114 40,200 20,200" fill={light} />
        <circle cx="30" cy="7" r="5.5" fill="#E5483A" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: size * 0.06, height: Math.max(1, size * 0.008), background: light, opacity: 0.35 }} />
    </div>
  );
}
