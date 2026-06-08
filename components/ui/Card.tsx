interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

export default function Card({ children, className = '', onClick, style }: CardProps) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{background:'#1e293b', ...style}} onClick={onClick}>
      {children}
    </div>
  )
}
