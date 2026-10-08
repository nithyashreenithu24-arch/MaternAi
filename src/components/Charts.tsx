import React from 'react';

// ----------------------------------------------------
// 1. RISK GAUGE COMPONENT
// ----------------------------------------------------
interface RiskGaugeProps {
  score: number; // 0 - 100
  category: 'Low' | 'Medium' | 'High';
  title: string;
  subtitle?: string;
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  category,
  title,
  subtitle,
  size = 190,
}) => {
  // Semi-circle gauge (180 degrees)
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = size * 0.38;
  const strokeWidth = size * 0.085;
  const center = size / 2;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let color = '#10b981'; // Green
  let bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (category === 'Medium') {
    color = '#f59e0b'; // Amber
    bgBadge = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (category === 'High') {
    color = '#ef4444'; // Red
    bgBadge = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div className="text-center mb-1">
        <h4 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</h4>
      </div>

      <div className="relative flex items-center justify-center" style={{ width: size, height: size * 0.65 }}>
        <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`} className="overflow-visible">
          {/* Background arc */}
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Filled progress arc */}
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute top-[35%] flex flex-col items-center">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{clampedScore}%</span>
          <span className="text-[11px] font-medium text-slate-400">Probability</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bgBadge}`}>
          <span
            className="w-1.5 h-1.5 rounded-full mr-1.5"
            style={{ backgroundColor: color }}
          />
          {category} Risk
        </span>
      </div>
      {subtitle && <p className="text-[11px] text-slate-500 text-center mt-2 px-1 line-clamp-2">{subtitle}</p>}
    </div>
  );
};

// ----------------------------------------------------
// 2. TREND LINE CHART COMPONENT (SVG)
// ----------------------------------------------------
interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface TrendLineChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  unit: string;
  primaryLabel: string;
  secondaryLabel?: string;
  targetMax?: number;
  targetMin?: number;
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
  summaryStats?: { label: string; value: string | number; badge?: string; badgeColor?: string }[];
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  title,
  subtitle,
  unit,
  primaryLabel,
  secondaryLabel,
  targetMax,
  targetMin,
  primaryColor = '#4f46e5',
  secondaryColor = '#f43f5e',
  height = 190,
  summaryStats,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
        No longitudinal records logged yet
      </div>
    );
  }

  const padding = { top: 24, right: 32, bottom: 36, left: 45 };
  const width = 500; // SVG viewBox width

  const allValues = data.flatMap((d) => [d.value, d.secondaryValue].filter((v): v is number => v !== undefined));
  if (targetMax) allValues.push(targetMax);
  if (targetMin) allValues.push(targetMin);

  const minVal = Math.max(0, Math.floor(Math.min(...allValues) * 0.82));
  const maxVal = Math.ceil(Math.max(...allValues) * 1.15);
  const range = maxVal - minVal || 1;

  const getX = (index: number) => {
    if (data.length === 1) return (width - padding.left - padding.right) / 2 + padding.left;
    return padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
  };

  const getY = (val: number) => {
    return height - padding.bottom - ((val - minVal) / range) * (height - padding.top - padding.bottom);
  };

  // Primary Line path
  const primaryPoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const primaryAreaPath = `M ${getX(0)},${height - padding.bottom} L ${data
    .map((d, i) => `${getX(i)},${getY(d.value)}`)
    .join(' L ')} L ${getX(data.length - 1)},${height - padding.bottom} Z`;

  // Secondary Line path
  const hasSecondary = data.some((d) => d.secondaryValue !== undefined);
  const secondaryPoints = hasSecondary
    ? data.map((d, i) => `${getX(i)},${getY(d.secondaryValue || 0)}`).join(' ')
    : '';

  const latestPoint = data[data.length - 1];
  const isLatestNormal = targetMax ? latestPoint.value <= targetMax : true;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
      <div>
        {/* Header with Title, Subtitle and Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-900 uppercase">
              {title}
            </h4>
            {subtitle && (
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
              <span>{primaryLabel}</span>
            </div>
            {hasSecondary && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: secondaryColor }} />
                <span>{secondaryLabel}</span>
              </div>
            )}
            {targetMax && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50/60 border border-amber-200/60 text-amber-800">
                <span className="w-3 border-b-2 border-dashed border-amber-500 inline-block" />
                <span>Target ≤ {targetMax} {unit}</span>
              </div>
            )}
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[340px]">
            <defs>
              <linearGradient id={`grad-primary-${title.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={primaryColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.5, 1].map((pct, i) => {
              const y = height - padding.bottom - pct * (height - padding.top - padding.bottom);
              const val = Math.round(minVal + pct * range);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1.2"
                  />
                  <text x={padding.left - 8} y={y + 3.5} textAnchor="end" className="text-[10px] font-mono fill-slate-400">
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Target limit dotted line */}
            {targetMax && targetMax >= minVal && targetMax <= maxVal && (
              <g>
                <line
                  x1={padding.left}
                  y1={getY(targetMax)}
                  x2={width - padding.right}
                  y2={getY(targetMax)}
                  stroke="#f59e0b"
                  strokeWidth="1.8"
                  strokeDasharray="4 3"
                />
                <text
                  x={width - padding.right}
                  y={getY(targetMax) - 5}
                  textAnchor="end"
                  className="text-[9px] font-mono font-bold fill-amber-600"
                >
                  LIMIT {targetMax} {unit}
                </text>
              </g>
            )}

            {/* Area fill */}
            <path d={primaryAreaPath} fill={`url(#grad-primary-${title.replace(/\s+/g, '-')})`} />

            {/* Secondary Line */}
            {hasSecondary && (
              <polyline
                fill="none"
                stroke={secondaryColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={secondaryPoints}
              />
            )}

            {/* Primary Line */}
            <polyline
              fill="none"
              stroke={primaryColor}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={primaryPoints}
            />

            {/* Data Points */}
            {data.map((d, i) => (
              <g key={i}>
                <circle
                  cx={getX(i)}
                  cy={getY(d.value)}
                  r="4.5"
                  fill="#ffffff"
                  stroke={primaryColor}
                  strokeWidth="2.8"
                />
                {hasSecondary && d.secondaryValue !== undefined && (
                  <circle
                    cx={getX(i)}
                    cy={getY(d.secondaryValue)}
                    r="4.5"
                    fill="#ffffff"
                    stroke={secondaryColor}
                    strokeWidth="2.8"
                  />
                )}
                <text
                  x={getX(i)}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="text-[10px] font-semibold fill-slate-500 font-mono"
                >
                  {d.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Card Footer / Stats Strip matching reference image */}
      <div className="pt-4 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        {summaryStats ? (
          summaryStats.map((stat, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-400">{stat.label}:</span>
              <span className="font-bold text-slate-800">{stat.value}</span>
              {stat.badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${stat.badgeColor || 'bg-emerald-50 text-emerald-700'}`}>
                  {stat.badge}
                </span>
              )}
            </div>
          ))
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">Latest:</span>
              <span className="font-extrabold text-slate-900">
                {latestPoint.value} {unit}
                {hasSecondary && latestPoint.secondaryValue !== undefined && ` / ${latestPoint.secondaryValue} ${unit}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isLatestNormal
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLatestNormal ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isLatestNormal ? 'Controlled Range' : 'Attention Required'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. MACRO NUTRIENT DONUT CHART
// ----------------------------------------------------
interface MacroDonutProps {
  carbs: { pct: number; grams: number };
  protein: { pct: number; grams: number };
  fat: { pct: number; grams: number };
  calories: number;
}

export const MacroDonutChart: React.FC<MacroDonutProps> = ({ carbs, protein, fat, calories }) => {
  const size = 150;
  const center = size / 2;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  // Arc lengths
  const cLen = (carbs.pct / 100) * circumference;
  const pLen = (protein.pct / 100) * circumference;
  const fLen = (fat.pct / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
      <div className="relative w-[150px] h-[150px] shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
          {/* Base */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="18" />
          {/* Carbs */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="18"
            strokeDasharray={`${cLen} ${circumference}`}
            strokeDashoffset="0"
          />
          {/* Protein */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="18"
            strokeDasharray={`${pLen} ${circumference}`}
            strokeDashoffset={`-${cLen}`}
          />
          {/* Fat */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="18"
            strokeDasharray={`${fLen} ${circumference}`}
            strokeDashoffset={`-${cLen + pLen}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold text-slate-900 leading-tight">{calories}</span>
          <span className="text-[10px] uppercase font-semibold text-slate-400">kcal/day</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 w-full text-xs">
        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 border border-blue-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="font-semibold text-slate-700">Complex Carbs</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-blue-700">{carbs.pct}%</span>
            <span className="text-slate-500 ml-1">({carbs.grams}g)</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">Proteins</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-emerald-700">{protein.pct}%</span>
            <span className="text-slate-500 ml-1">({protein.grams}g)</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="font-semibold text-slate-700">Healthy Fats</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-amber-700">{fat.pct}%</span>
            <span className="text-slate-500 ml-1">({fat.grams}g)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. FEATURE CONTRIBUTION BAR
// ----------------------------------------------------
interface FactorItem {
  feature: string;
  impact: 'risk_increasing' | 'protective' | 'neutral';
  contribution: number;
  patientValue: string | number;
  explanation: string;
}

export const FeatureContributionList: React.FC<{ factors: FactorItem[]; title?: string }> = ({
  factors,
  title = 'Top Influencing Health Factors (AI Explainability)',
}) => {
  return (
    <div className="space-y-3">
      {title && <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h4>}
      <div className="space-y-2.5">
        {factors.map((f, i) => {
          const isRisk = f.impact === 'risk_increasing';
          return (
            <div
              key={i}
              className={`p-3 rounded-xl border text-xs transition-all ${
                isRisk
                  ? 'bg-rose-50/50 border-rose-200/70 hover:bg-rose-50'
                  : 'bg-emerald-50/50 border-emerald-200/70 hover:bg-emerald-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${isRisk ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  />
                  {f.feature}
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                  {f.patientValue}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{f.explanation}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
