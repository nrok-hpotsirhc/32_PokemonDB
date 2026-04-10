interface PriceSparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export function PriceSparkline({ data, width = 200, height = 40 }: PriceSparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const effectiveHeight = height - padding * 2;
  const effectiveWidth = width - padding * 2;
  const stepX = effectiveWidth / (data.length - 1);

  const points = data.map((val, i) => {
    const x = padding + i * stepX;
    const y = padding + effectiveHeight - ((val - min) / range) * effectiveHeight;
    return `${x},${y}`;
  });

  const isUp = data[data.length - 1]! >= data[0]!;
  const color = isUp ? '#16a34a' : '#dc2626';

  // Area fill
  const areaPoints = [
    `${padding},${height - padding}`,
    ...points,
    `${padding + (data.length - 1) * stepX},${height - padding}`,
  ].join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="inline-block"
    >
      <polygon
        points={areaPoints}
        fill={color}
        fillOpacity={0.1}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current price dot */}
      <circle
        cx={padding + (data.length - 1) * stepX}
        cy={padding + effectiveHeight - ((data[data.length - 1]! - min) / range) * effectiveHeight}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}
