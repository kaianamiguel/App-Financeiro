'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMonthLabel, toISODate } from '@/lib/format'
import { Transaction, Budget, Settings } from '@/types'
import SavingsCard from '@/components/dashboard/SavingsCard'
import SpendingCard from '@/components/dashboard/SpendingCard'
import CategoryBars from '@/components/dashboard/CategoryBars'
import DonutChart from '@/components/dashboard/DonutChart'
import HistoryChart from '@/components/dashboard/HistoryChart'
import Card from '@/components/ui/Card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const supabase = createClient()
  const [weeklyMode, setWeeklyMode] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [settings, setSettings] = useState<Settings>({ user_id: '', monthly_income: 7000, savings_goal: 4500 })
  const [history, setHistory] = useState<{ month: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth() + 1

  const fetchData = useCallback(async () => {
    setLoading(true)
    const start = toISODate(new Date(year, month - 1, 1))
    const end = toISODate(new Date(year, month, 0))

    const [txRes, budgetRes, settingsRes, histRes] = await Promise.all([
      supabase.from('transactions').select('*').gte('date', start).lte('date', end).gt('amount', 0).order('date', { ascending: false }),
      supabase.from('budgets').select('*'),
      supabase.from('settings').select('*').single(),
      supabase.from('transactions').select('date, amount').gt('amount', 0),
    ])

    if (txRes.data) setTransactions(txRes.data)
    if (budgetRes.data) setBudgets(budgetRes.data)
    if (settingsRes.data) setSettings(settingsRes.data)

    if (histRes.data) {
      const byMonth: Record<string, number> = {}
      histRes.data.forEach((t: { date: string; amount: number }) => {
        const key = t.date.slice(0, 7)
        byMonth[key] = (byMonth[key] || 0) + t.amount
      })
      const sorted = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([k, v]) => ({ month: k.slice(5) + '/' + k.slice(2, 4), total: v }))
      setHistory(sorted)
    }

    setLoading(false)
  }, [year, month])

  useEffect(() => { fetchData() }, [fetchData])

  const getWeekRange = () => {
    const now = new Date()
    const day = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - day)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start: toISODate(start), end: toISODate(end) }
  }

  const displayedTx = weeklyMode
    ? (() => { const { start, end } = getWeekRange(); return transactions.filter(t => t.date >= start && t.date <= end) })()
    : transactions

  const categorySpending: Record<string, number> = {}
  displayedTx.forEach(t => { categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount })

  const totalSpent = Object.values(categorySpending).reduce((a, b) => a + b, 0)
  const totalLimit = budgets.reduce((a, b) => a + b.monthly_limit, 0)

  const categoryData = budgets.map(b => ({
    category: b.category,
    spent: categorySpending[b.category] || 0,
    limit: b.monthly_limit,
  }))

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-2" style={{color:'#94a3b8'}}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold capitalize text-white">{getMonthLabel(year, month)}</h1>
        <button onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2" style={{color:'#94a3b8'}}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex rounded-xl p-1 gap-1" style={{background:'#1e293b'}}>
        <button onClick={() => setWeeklyMode(false)} className="flex-1 py-2 rounded-lg text-sm font-medium transition" style={{background: !weeklyMode ? '#4f46e5' : 'transparent', color: !weeklyMode ? 'white' : '#64748b'}}>
          Mensal
        </button>
        <button onClick={() => setWeeklyMode(true)} className="flex-1 py-2 rounded-lg text-sm font-medium transition" style={{background: weeklyMode ? '#4f46e5' : 'transparent', color: weeklyMode ? 'white' : '#64748b'}}>
          Semanal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12" style={{color:'#64748b'}}>Carregando...</div>
      ) : (
        <>
          <SavingsCard totalSpent={totalSpent} monthlyIncome={settings.monthly_income} savingsGoal={settings.savings_goal} />
          <SpendingCard totalSpent={totalSpent} monthlyLimit={weeklyMode ? Math.round(totalLimit / 4.33) : totalLimit} />

          <Card>
            <h2 className="text-sm font-semibold mb-3" style={{color:'#cbd5e1'}}>
              Gastos por categoria {weeklyMode ? '(semana atual)' : '(mês)'}
            </h2>
            <CategoryBars data={categoryData} weeklyMode={weeklyMode} />
          </Card>

          <Card>
            <h2 className="text-sm font-semibold mb-2" style={{color:'#cbd5e1'}}>Distribuição</h2>
            <DonutChart data={categoryData} />
          </Card>

          <Card>
            <h2 className="text-sm font-semibold mb-2" style={{color:'#cbd5e1'}}>Histórico mensal</h2>
            <HistoryChart data={history} />
          </Card>
        </>
      )}
    </div>
  )
}
