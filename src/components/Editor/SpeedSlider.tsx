interface SpeedSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

const SpeedSlider = ({ label, value, min, max, step = 1, onChange, formatValue }: SpeedSliderProps) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 flex-shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
      />
      <span className="text-sm font-medium text-gray-900 w-10 text-right flex-shrink-0">
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
  );
};

export default SpeedSlider;
