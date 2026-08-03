/**
 * FilterBar — search + optional select filters + trailing actions.
 */
import type { ReactNode } from 'react';

type FilterOption = {
  value: string;
  label: string;
};

type FilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusValue?: string;
  statusOptions?: FilterOption[];
  onStatusChange?: (value: string) => void;
  actions?: ReactNode;
};

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  statusValue,
  statusOptions,
  onStatusChange,
  actions,
}: FilterBarProps) {
  return (
    <div className="toolbar filter-bar">
      <input
        type="search"
        className="toolbar-search"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search"
      />
      {statusOptions && onStatusChange ? (
        <select
          value={statusValue ?? 'all'}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter status"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : null}
      {actions}
    </div>
  );
}
