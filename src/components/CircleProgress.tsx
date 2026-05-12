"use client";

interface CircleProgressProps {
  count: number;
  total: number;
  color: string;
  lightColor: string;
  size?: number;
}

export default function CircleProgress({
  count,
  total,
  color,
  lightColor,
  size = 160,
}: CircleProgressProps) {
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const completed = total > 0 ? total - count : 0;
  const progress = total > 0 ? completed / total : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={lightColor}
          strokeWidth={12}
          opacity={0.35}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={lightColor}
          strokeWidth={12}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {/* White center */}
      <div
        className="absolute flex flex-col items-center justify-center rounded-full bg-white shadow-lg"
        style={{ width: size - 28, height: size - 28 }}
      >
        <span className="text-4xl font-light text-gray-600 leading-none">{count}</span>
        <span className="text-xs text-gray-400 mt-1">to go</span>
      </div>
    </div>
  );
}
