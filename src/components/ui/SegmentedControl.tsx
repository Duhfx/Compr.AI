interface SegmentedControlProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

export const SegmentedControl = ({ options, selected, onChange }: SegmentedControlProps) => {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-ios p-1 mb-4">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`
            flex-1 py-2 px-4 rounded-ios text-[15px] font-medium
            transition-all duration-200
            ${selected === option
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
            }
          `}
        >
          {option}
        </button>
      ))}
    </div>
  );
};
