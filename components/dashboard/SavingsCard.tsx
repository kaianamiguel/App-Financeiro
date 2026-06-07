import { formatBRL } from '@/lib/format'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'

interface SavingsCardProps {
  totalSpent: number
  monthlyIncome: number
  savingsGoal: number
}

export default function SavingsCard({ totalSpent, monthlyIncome, savingsGoal }: SavingsCardProps) {
  const saved = monthlyIncome - totalSpent
  const pct = savingsGoal > 0 ? (saved / savingsGoal) * 100 : 0

  return (
    <Card>
      <p className="text-sm mb-1" style={{color:'#94a3b8'}}>Economia do mês</p>
      <p className="text-3xl font-bold mb-1" style={{color: saved >= 0 ? '#34d399' : '#f87171'}}>
        {formatBRL(saved)}
      </p>
      <p className="text-xs mb-3" style={{color:'#64748b'}}>
        Meta: {formatBRL(savingsGoal)} · {Math.max(0, pct).toFixed(0)}% atingida
      </p>
      <ProgressBar value={Math.max(saved, 0)} max={savingsGoal} color={pct >= 100 ? 'green' : pct >= 85 ? 'yellow' : 'indigo'} />
    </Card>
  )
}
