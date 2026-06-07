'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Budget, Settings } from '@/types'
import { CATEGORIES } from '@/lib/parsers/categorize'
import { formatBRL } from '@/lib/format'
import { Save, LogOut } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useRouter } from 'next/navigation'

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [settings, setSettings] = useState<Settings>({ user_id: '', monthly_income: 7000, savings_goal: 4500 })
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [sRes, bRes] = await Promise.all([
        supabase.from('settings').select('*').single(),
        supabase.from('budgets').select('*'),
      ])
      if (sRes.data) setSettings(sRes.data)
      if (bRes.data) {
        const withDefaults = CATEGORIES.map(cat => {
          const found = bRes.data.find(b => b.category === cat)
          return found || { id: '', user_id: '', category: cat, monthly_limit: 0 }
        })
        setBudgets(withDefaults)
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalLimit = budgets.reduce((a, b) => a + (Number(b.monthly_limit) || 0), 0)
  const maxLimit = settings.monthly_income - settings.savings_goal
  const over = totalLimit > maxLimit

  function updateBudget(category: string, value: string) {
    setBudgets(prev => prev.map(b => b.category === category ? { ...b, monthly_limit: Number(value) || 0 } : b))
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('settings').upsert({ ...settings, user_id: user.id })

    for (const b of budgets) {
      await supabase.from('budgets').upsert(
        { user_id: user.id, category: b.category, monthly_limit: b.monthly_limit },
        { onConflict: 'user_id,category' }
      )
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="text-center py-12 text-slate-500">Carregando...</div>

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Configurações</h1>
        <button onClick={handleLogout} className="flex items-center gap-1 text-slate-400 hover:text-red-400 text-sm transition">
          <LogOut size={16} /> Sair
        </button>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Renda e meta</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Renda mensal (R$)</label>
            <input
              type="number"
              value={settings.monthly_income}
              onChange={e => setSettings(p => ({...p, monthly_income: Number(e.target.value)}))}
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Meta de economia mensal (R$)</label>
            <input
              type="number"
              value={settings.savings_goal}
              onChange={e => setSettings(p => ({...p, savings_goal: Number(e.target.value)}))}
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <p className="text-xs text-slate-500">Limite total disponível para gastos: {formatBRL(maxLimit)}</p>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Limites por categoria</h2>
        <div className="space-y-3">
          {budgets.map(b => (
            <div key={b.category}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400">{b.category}</label>
                <span className="text-xs text-slate-500">Semanal: {formatBRL(Math.round(b.monthly_limit / 4.33))}</span>
              </div>
              <input
                type="number"
                value={b.monthly_limit}
                onChange={e => updateBudget(b.category, e.target.value)}
                className="w-full bg-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className={`mt-4 p-3 rounded-xl text-sm ${over ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
          Total dos limites: {formatBRL(totalLimit)} / disponível: {formatBRL(maxLimit)}
          {over && <p className="text-xs mt-1">⚠️ Soma dos limites ultrapassa o disponível para gastos!</p>}
        </div>
      </Card>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white py-3 rounded-xl font-semibold transition"
      >
        <Save size={18} />
        {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </div>
  )
}
