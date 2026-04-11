interface FilterChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

export function FilterChip({ label, selected = false, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-[8px] rounded-full text-[12.5px] font-medium transition-all whitespace-nowrap ${
        selected
          ? "bg-chip-selected-bg text-chip-selected-fg"
          : "bg-chip-default-bg text-chip-default-fg border border-chip-default-border"
      }`}

    >
      {label}
    </button>
  );
}
