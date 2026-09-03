type Props = {
  label: string
  placeholder?: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

export function SearchField({ label, placeholder, value, disabled, onChange }: Props) {
  return (
    <label className="search-field">
      <span className="sr-only">{label}</span>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  )
}
