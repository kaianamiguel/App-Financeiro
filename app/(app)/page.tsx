'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMonthLabel, toISODate, formatBRL } from '@/lib/format'
import { Transaction, Budget, Settings } from '@/types'
import SavingsCard from '@/components/dashboard/SavingsCard'
import SpendingCard from '@/components/dashboard/SpendingCard'
import CategoryBars from '@/components/dashboard/CategoryBars'
import DonutChart from '@/components/dashboard/DonutChart'
import HistoryChart from '@/components/dashboard/HistoryChart'
import Card from '@/components/ui/Card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function getWeekBounds(anchor: Date) {
  const day = anchor.getDay()
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: toISODate(start), end: toISODate(end) }
}

function weekLabel(anchor: Date) {
  const { start, end } = getWeekBounds(anchor)
  const fmt = (s: string) => s.split('-').reverse().join('/')
  return `${fmt(start)} – ${fmt(end)}`
}

export default function DashboardPage() {
  const supabase = createClient()
  const [weeklyMode, setWeeklyMode] = useState(false)
  const [weekAnchor, setWeekAnchor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [settings, setSettings] = useState<Settings>({ user_id: '', monthly_income: 7000, savings_goal: 4500 })
  const [history, setHistory] = useState<{ month: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth() + 1

  // When weekly mode: fetch the whole month the weekAnchor belongs to
  const fetchYear = weeklyMode ? weekAnchor.getFullYear() : year
  const fetchMonth = weeklyMode ? weekAnchor.getMonth() + 1 : month

  const fetchData = useCallback(async () => {
    setLoading(true)
    const start = toISODate(new Date(fetchYear, fetchMonth - 1, 1))
    const end = toISODate(new Date(fetchYear, fetchMonth, 0))

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
  }, [fetchYear, fetchMonth])

  useEffect(() => { fetchData() }, [fetchData])

  function prevWeek() {
    setWeekAnchor(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n })
  }
  function nextWeek() {
    setWeekAnchor(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n })
  }

  const { start: wStart, end: wEnd } = getWeekBounds(weekAnchor)
  const displayedTx = weeklyMode
    ? transactions.filter(t => t.date >= wStart && t.date <= wEnd)
    : transactions

  const categorySpending: Record<string, number> = {}
  displayedTx.forEach(t => { categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount })

  const totalSpent = Object.values(categorySpending).reduce((a, b) => a + b, 0)
  const totalLimit = budgets.reduce((a, b) => a + b.monthly_limit, 0)

  // Monthly total spent (always full month, used for daily budget regardless of view mode)
  const monthlyTotalSpent = transactions.reduce((sum, t) => sum + t.amount, 0)

  const weeklyIncome = Math.round(settings.monthly_income / 4.33)
  const weeklySavingsGoal = Math.round(settings.savings_goal / 4.33)
  const weeklyTotalLimit = Math.round(totalLimit / 4.33)

  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysRemaining = daysInMonth - today.getDate() + 1

  const dailyBudget = totalLimit > 0
    ? Math.max(0, (totalLimit - monthlyTotalSpent) / daysRemaining)
    : null

  const categoryData = budgets.map(b => ({
    category: b.category,
    spent: categorySpending[b.category] || 0,
    limit: b.monthly_limit,
  }))

  return (
    <div className="px-4 pt-6 space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-xl p-1 gap-1" style={{background:'#1e293b'}}>
        <button onClick={() => setWeeklyMode(false)} className="flex-1 py-2 rounded-lg text-sm font-medium transition" style={{background: !weeklyMode ? '#4f46e5' : 'transparent', color: !weeklyMode ? 'white' : '#64748b'}}>
          Mensal
        </button>
        <button onClick={() => { setWeeklyMode(true); setWeekAnchor(new Date()) }} className="flex-1 py-2 rounded-lg text-sm font-medium transition" style={{background: weeklyMode ? '#4f46e5' : 'transparent', color: weeklyMode ? 'white' : '#64748b'}}>
          Semanal
        </button>
      </div>

      {/* Period navigator */}
      <div className="flex items-center justify-between">
        <button onClick={weeklyMode ? prevWeek : () => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-2" style={{color:'#94a3b8'}}>
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          {weeklyMode ? (
            <p className="text-sm font-semibold text-white">{weekLabel(weekAnchor)}</p>
          ) : (
            <h1 className="text-lg font-semibold capitalize text-white">{getMonthLabel(year, month)}</h1>
          )}
        </div>
        <button onClick={weeklyMode ? nextWeek : () => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2" style={{color:'#94a3b8'}}>
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12" style={{color:'#64748b'}}>Carregando...</div>
      ) : (
        <>
          <SavingsCard
            totalSpent={totalSpent}
            monthlyIncome={weeklyMode ? weeklyIncome : settings.monthly_income}
            savingsGoal={weeklyMode ? weeklySavingsGoal : settings.savings_goal}
          />
          <SpendingCard
            totalSpent={totalSpent}
            monthlyLimit={weeklyMode ? weeklyTotalLimit : totalLimit}
            dailyBudget={dailyBudget}
            daysRemaining={daysRemaining}
          />

          <Card>
            <h2 className="text-sm font-semibold mb-3" style={{color:'#cbd5e1'}}>
              Gastos por categoria {weeklyMode ? '(semana)' : '(mês)'}
            </h2>
            <CategoryBars data={categoryData} weeklyMode={weeklyMode} />
          </Card>

          <Card>
            <h2 className="text-sm font-semibold mb-2" style={{color:'#cbd5e1'}}>Distribuição</h2>
            <DonutChart data={categoryData} />
          </Card>

          {!weeklyMode && (
            <Card>
              <h2 className="text-sm font-semibold mb-2" style={{color:'#cbd5e1'}}>Histórico mensal</h2>
              <HistoryChart data={history} />
            </Card>
          )}
        </>
      )}
    </div>
  )
}
