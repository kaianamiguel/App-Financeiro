interface CardProps {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{background:'#1e293b'}}>
      {children}
    </div>
  )
}
