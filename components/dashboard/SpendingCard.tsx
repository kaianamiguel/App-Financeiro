import { formatBRL } from '@/lib/format'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'

interface SpendingCardProps {
  totalSpent: number
  monthlyLimit: number
}

export default function SpendingCard({ totalSpent, monthlyLimit }: SpendingCardProps) {
  const remaining = monthlyLimit - totalSpent
  const pct = monthlyLimit > 0 ? (totalSpent / monthlyLimit) * 100 : 0

  return (
    <Card>
      <p className="text-sm mb-1" style={{color:'#94a3b8'}}>Total gasto no mês</p>
      <p className="text-3xl font-bold mb-1 text-white">{formatBRL(totalSpent)}</p>
      <p className="text-xs mb-3" style={{color:'#64748b'}}>
        Limite: {formatBRL(monthlyLimit)} · {remaining >= 0 ? `${formatBRL(remaining)} disponível` : `${formatBRL(Math.abs(remaining))} acima do limite`}
      </p>
      <ProgressBar value={totalSpent} max={monthlyLimit} />
    </Card>
  )
}
