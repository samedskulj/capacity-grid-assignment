import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: ReactNode
  children?: ReactNode
}

export function Toolbar({ title, subtitle, children }: Props) {
  return (
    <div className="toolbar">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="toolbar__controls">{children}</div>}
    </div>
  )
}
