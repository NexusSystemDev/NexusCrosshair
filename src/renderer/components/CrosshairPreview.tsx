import type { CrosshairSettings } from '../types';

type Props = {
  settings: CrosshairSettings;
  compact?: boolean;
  zoom?: number;
};

export function CrosshairPreview({ settings, compact = false, zoom = 1 }: Props) {
  const rawSize = compact ? 120 : Math.max(180, settings.size * 3);
  const size = Math.ceil(rawSize / 2) * 2;
  const renderedSize = Math.ceil((size * zoom) / 2) * 2;
  const center = size / 2;
  const line = settings.length;
  const gap = settings.gap;
  const stroke = settings.thickness;
  const radius = settings.circleRadius;
  const color = settings.color;
  const outline = settings.outline ? settings.outlineColor : 'transparent';
  const outlineWidth = settings.outline ? stroke + settings.outlineStrength : stroke;

  const lineStyle = {
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    opacity: settings.opacity
  };

  const outlineStyle = {
    stroke: outline,
    strokeWidth: outlineWidth,
    strokeLinecap: 'round' as const,
    opacity: settings.opacity
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, key: string) => (
    <g key={key}>
      {settings.shadow && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000000" strokeWidth={stroke + settings.shadowStrength} strokeLinecap="square" opacity={0.28} />}
      {settings.glow && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={stroke + settings.glowStrength} strokeLinecap="square" opacity={0.16} />}
      {settings.outline && <line x1={x1} y1={y1} x2={x2} y2={y2} style={outlineStyle} />}
      <line x1={x1} y1={y1} x2={x2} y2={y2} style={lineStyle} />
    </g>
  );

  const dot = (
    <g>
      {settings.shadow && <circle cx={center} cy={center} r={settings.dotSize + settings.shadowStrength} fill="#000000" opacity={0.28} />}
      {settings.glow && <circle cx={center} cy={center} r={settings.dotSize + settings.glowStrength} fill={color} opacity={0.16} />}
      {settings.outline && <circle cx={center} cy={center} r={settings.dotSize + settings.outlineStrength} fill={outline} opacity={settings.opacity} />}
      <circle cx={center} cy={center} r={settings.dotSize} fill={color} opacity={settings.opacity} />
    </g>
  );

  const circle = (
    <g>
      {settings.shadow && <circle cx={center} cy={center} r={radius} fill="none" stroke="#000000" strokeWidth={stroke + settings.shadowStrength} opacity={0.28} />}
      {settings.glow && <circle cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={stroke + settings.glowStrength} opacity={0.16} />}
      {settings.outline && (
        <circle cx={center} cy={center} r={radius} fill="none" style={outlineStyle} />
      )}
      <circle cx={center} cy={center} r={radius} fill="none" style={lineStyle} />
    </g>
  );

  const parts = {
    dot: [dot],
    cross: [
      drawLine(center - gap - line, center, center - gap, center, 'left'),
      drawLine(center + gap, center, center + gap + line, center, 'right'),
      drawLine(center, center - gap - line, center, center - gap, 'top'),
      drawLine(center, center + gap, center, center + gap + line, 'bottom')
    ],
    circle: [circle],
    'circle-dot': [circle, dot],
    plus: [
      drawLine(center - line, center, center + line, center, 'h'),
      drawLine(center, center - line, center, center + line, 'v')
    ],
    'x-shape': [
      drawLine(center - line, center - line, center - gap, center - gap, 'x1'),
      drawLine(center + gap, center + gap, center + line, center + line, 'x2'),
      drawLine(center + gap, center - gap, center + line, center - line, 'x3'),
      drawLine(center - line, center + line, center - gap, center + gap, 'x4')
    ],
    't-shape': [
      drawLine(center - gap - line, center, center - gap, center, 'l'),
      drawLine(center + gap, center, center + gap + line, center, 'r'),
      drawLine(center, center + gap, center, center + gap + line, 'b')
    ],
    sniper: [
      circle,
      drawLine(center - radius - line, center, center - radius - gap, center, 'sl'),
      drawLine(center + radius + gap, center, center + radius + line, center, 'sr'),
      drawLine(center, center - radius - line, center, center - radius - gap, 'st'),
      drawLine(center, center + radius + gap, center, center + radius + line, 'sb')
    ],
    tactical: [
      drawLine(center - gap - line, center, center - gap, center, 'tl'),
      drawLine(center + gap, center, center + gap + line, center, 'tr'),
      drawLine(center, center - gap - line, center, center - gap, 'tt'),
      drawLine(center - radius, center + radius, center + radius, center + radius, 'base'),
      drawLine(center - radius, center + radius, center - radius + 8, center + radius - 8, 'base-l'),
      drawLine(center + radius, center + radius, center + radius - 8, center + radius - 8, 'base-r'),
      dot
    ],
    custom: [
      circle,
      dot,
      drawLine(center - gap - line, center - 8, center - gap, center - 8, 'cl1'),
      drawLine(center + gap, center + 8, center + gap + line, center + 8, 'cr1'),
      drawLine(center - 8, center + gap, center - 8, center + gap + line, 'cb1'),
      drawLine(center + 8, center - gap - line, center + 8, center - gap, 'ct1')
    ]
  } satisfies Record<CrosshairSettings['type'], React.ReactNode[]>;

  return (
    <svg
      width={renderedSize}
      height={renderedSize}
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
      style={{ transform: `rotate(${settings.rotation}deg)`, color }}
      aria-hidden="true"
    >
      {parts[settings.type]}
    </svg>
  );
}
