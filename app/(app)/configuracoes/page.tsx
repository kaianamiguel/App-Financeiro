'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Budget, Settings } from '@/types'
import { CATEGORIES } from '@/lib/parsers/categorize'
import { formatBRL } from '@/lib/format'
import { Save, LogOut, Plus, Trash2 } from 'lucide-react'
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
  const [newCatName, setNewCatName] = useState('')
  const [newCatLimit, setNewCatLimit] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  useEffect(() => {
    async function load() {
      const [sRes, bRes] = await Promise.all([
        supabase.from('settings').select('*').single(),
        supabase.from('budgets').select('*').order('category'),
      ])
      if (sRes.data) setSettings(sRes.data)
      if (bRes.data) {
        // merge: all default categories + any custom ones from DB
        const fromDB: Budget[] = bRes.data
        const defaultCats = CATEGORIES.map(cat => {
          const found = fromDB.find(b => b.category === cat)
          return found || { id: '', user_id: '', category: cat, monthly_limit: 0 }
        })
        const customCats = fromDB.filter(b => !(CATEGORIES as readonly string[]).includes(b.category))
        setBudgets([...defaultCats, ...customCats])
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

  function addCategory() {
    const name = newCatName.trim()
    if (!name) return
    if (budgets.some(b => b.category.toLowerCase() === name.toLowerCase())) return
    setBudgets(prev => [...prev, { id: '', user_id: '', category: name, monthly_limit: Number(newCatLimit) || 0 }])
    setNewCatName('')
    setNewCatLimit('')
    setAddingCat(false)
  }

  async function removeCategory(category: string) {
    if (!confirm(`Excluir categoria "${category}"? Os lançamentos existentes não serão alterados.`)) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('budgets').delete().eq('user_id', user.id).eq('category', category)
    setBudgets(prev => prev.filter(b => b.category !== category))
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

  const isDefault = (cat: string) => (CATEGORIES as readonly string[]).includes(cat)

  if (loading) return <div className="text-center py-12" style={{color:'#64748b'}}>Carregando...</div>

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Configurações</h1>
        <button onClick={handleLogout} className="flex items-center gap-1 text-sm transition" style={{color:'#94a3b8'}}>
          <LogOut size={16} /> Sair
        </button>
      </div>

      <Card>
        <h2 className="text-sm font-semibold mb-3" style={{color:'#cbd5e1'}}>Renda e meta</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs block mb-1" style={{color:'#94a3b8'}}>Renda mensal (R$)</label>
            <input type="number" value={settings.monthly_income} onChange={e => setSettings(p => ({...p, monthly_income: Number(e.target.value)}))} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white" style={{background:'#334155'}} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{color:'#94a3b8'}}>Meta de economia mensal (R$)</label>
            <input type="number" value={settings.savings_goal} onChange={e => setSettings(p => ({...p, savings_goal: Number(e.target.value)}))} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white" style={{background:'#334155'}} />
          </div>
          <p className="text-xs" style={{color:'#64748b'}}>Disponível para gastos: {formatBRL(maxLimit)}</p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{color:'#cbd5e1'}}>Categorias e limites</h2>
          <button onClick={() => setAddingCat(true)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-white" style={{background:'#4f46e5'}}>
            <Plus size={13} /> Nova
          </button>
        </div>

        {addingCat && (
          <div className="mb-4 p-3 rounded-xl space-y-2" style={{background:'#0f172a'}}>
            <p className="text-xs font-medium" style={{color:'#94a3b8'}}>Nova categoria</p>
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Nome da categoria"
              maxLength={40}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white placeholder-slate-500"
              style={{background:'#334155'}}
            />
            <input
              type="number"
              value={newCatLimit}
              onChange={e => setNewCatLimit(e.target.value)}
              placeholder="Limite mensal (R$)"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white placeholder-slate-500"
              style={{background:'#334155'}}
            />
            <div className="flex gap-2">
              <button onClick={addCategory} className="flex-1 py-2 rounded-lg text-sm font-medium text-white" style={{background:'#4f46e5'}}>Adicionar</button>
              <button onClick={() => { setAddingCat(false); setNewCatName(''); setNewCatLimit('') }} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{background:'#334155', color:'#94a3b8'}}>Cancelar</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {budgets.map(b => (
            <div key={b.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs" style={{color:'#94a3b8'}}>{b.category}</label>
                  {!isDefault(b.category) && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{background:'#312e81', color:'#a5b4fc'}}>custom</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{color:'#64748b'}}>Sem.: {formatBRL(Math.round(b.monthly_limit / 4.33))}</span>
                  <button onClick={() => removeCategory(b.category)} className="p-0.5" style={{color:'#64748b'}}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <input type="number" value={b.monthly_limit} onChange={e => updateBudget(b.category, e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white" style={{background:'#334155'}} />
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-xl text-sm" style={{background: over ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: over ? '#f87171' : '#34d399'}}>
          Total: {formatBRL(totalLimit)} / disponível: {formatBRL(maxLimit)}
          {over && <p className="text-xs mt-1">⚠️ Soma ultrapassa o disponível para gastos!</p>}
        </div>
      </Card>

      <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition" style={{background: saving ? '#4338ca' : '#4f46e5'}}>
        <Save size={18} />
        {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </div>
  )
}
