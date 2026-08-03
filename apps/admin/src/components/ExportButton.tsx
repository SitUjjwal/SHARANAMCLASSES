/**
 * ExportButton — triggers CSV / blob download actions.
 */
type ExportButtonProps = {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function ExportButton({
  label = 'Export CSV',
  loading = false,
  disabled = false,
  onClick,
}: ExportButtonProps) {
  return (
    <button
      type="button"
      className="btn ghost"
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? 'Exporting…' : label}
    </button>
  );
}
