// Subtle film-grain overlay applied globally. Fixed and pointer-events-none
// per the performance guardrails — never attached to scrolling content.
// The grain is a small SVG fractalNoise tiled and held at 3% opacity, which
// adds the "fine paper" texture that distinguishes premium editorial sites
// from flat dashboards. Cost: ~1KB inline, 0 layout impact, GPU-rastered once.

export function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-multiply"
      style={{
        backgroundImage:
          // 160x160 SVG with a fractalNoise filter, base64-encoded so it never
          // requires a separate network request.
          `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
      }}
    />
  );
}
