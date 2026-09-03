type Item = { tone: 'within' | 'over'; label: string }

type Props = { items: Item[] }

export function Legend({ items }: Props) {
  return (
    <div className="legend">
      {items.map(item => (
        <span key={item.label}>
          <i className={`legend__dot legend__dot--${item.tone}`} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
