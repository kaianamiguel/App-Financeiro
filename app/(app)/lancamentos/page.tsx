'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Transaction } from '@/types'
import { CATEGORIES } from '@/lib/parsers/categorize'
import { formatBRL, formatDate } from '@/lib/format'
import { Plus, Search, Trash2, Edit2, Check, X } from 'lucide-react'
import Card from '@/components/ui/Card'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function LancamentosPage() {
  const supabase = createClient()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear] = useState(now.getFullYear())
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Transaction>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newTx, setNewTx] = useState({ date: '', description: '', amount: '', category: 'Outros', source: 'conta' as const })

  const fetchTx = useCallback(async () => {
    setLoading(true)
    const start = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-01`
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
    const end = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`

    const { data } = await supabase.from('transactions').select('*').gte('date', start).lte('date', end).order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }, [selectedMonth, selectedYear])

  useEffect(() => { fetchTx() }, [fetchTx])

  const filtered = transactions.filter(t => {
    const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || t.category === filterCat
    return matchSearch && matchCat
  })

  async function handleDelete(id: string) {
    if (!confirm('Excluir lançamento?')) return
    await supabase.from('transactions').delete().eq('id', id)
    fetchTx()
  }

  async function handleSaveEdit(id: string) {
    await supabase.from('transactions').update(editData).eq('id', id)
    setEditId(null)
    fetchTx()
  }

  async function handleAdd() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !newTx.date || !newTx.description || !newTx.amount) return

    const amount = parseFloat(newTx.amount.replace(',', '.'))
    if (isNaN(amount)) return

    const hashInput = `${newTx.date}|${newTx.description.toLowerCase()}|${amount.toFixed(2)}|${newTx.source}|manual-${Date.now()}`
    const encoder = new TextEncoder()
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(hashInput))
    const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')

    await supabase.from('transactions').insert({
      user_id: user.id, date: newTx.date, description: newTx.description,
      raw_title: newTx.description, category: newTx.category,
      amount, source: newTx.source, dedup_hash: hash,
    })

    setShowAdd(false)
    setNewTx({ date: '', description: '', amount: '', category: 'Outros', source: 'conta' })
    fetchTx()
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Lançamentos</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-white" style={{background:'#4f46e5'}}>
          <Plus size={16} /> Novo
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {MONTHS.map((m, i) => (
          <button key={i} onClick={() => setSelectedMonth(i+1)} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition" style={{background: selectedMonth === i+1 ? '#4f46e5' : '#1e293b', color: selectedMonth === i+1 ? 'white' : '#94a3b8'}}>
            {m}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3" style={{background:'#1e293b'}}>
          <Search size={16} style={{color:'#64748b'}} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="flex-1 bg-transparent text-sm text-slate-200 py-2.5 focus:outline-none placeholder-slate-500" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="rounded-xl px-2 text-xs focus:outline-none" style={{background:'#1e293b', color:'#94a3b8', border:'none'}}>
          <option value="">Todas</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {showAdd && (
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-white">Novo lançamento</p>
          <input type="date" value={newTx.date} onChange={e => setNewTx(p => ({...p, date: e.target.value}))} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white" style={{background:'#334155'}} />
          <input type="text" value={newTx.description} onChange={e => setNewTx(p => ({...p, description: e.target.value}))} placeholder="Descrição" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white placeholder-slate-500" style={{background:'#334155'}} />
          <input type="text" inputMode="decimal" value={newTx.amount} onChange={e => setNewTx(p => ({...p, amount: e.target.value}))} placeholder="Valor (ex: 25,90)" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white placeholder-slate-500" style={{background:'#334155'}} />
          <select value={newTx.category} onChange={e => setNewTx(p => ({...p, category: e.target.value}))} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white" style={{background:'#334155'}}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={newTx.source} onChange={e => setNewTx(p => ({...p, source: e.target.value as 'cartao'|'conta'}))} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white" style={{background:'#334155'}}>
            <option value="conta">Conta / Débito / Dinheiro</option>
            <option value="cartao">Cartão de Crédito</option>
          </select>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 py-2 rounded-lg text-sm font-medium text-white" style={{background:'#4f46e5'}}>Salvar</button>
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{background:'#334155', color:'#94a3b8'}}>Cancelar</button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-center py-8" style={{color:'#64748b'}}>Carregando...</p>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-center py-8" style={{color:'#64748b'}}>Nenhum lançamento encontrado</p>}
          {filtered.map(t => (
            <Card key={t.id} className="!p-3">
              {editId === t.id ? (
                <div className="space-y-2">
                  <input type="text" value={editData.description || ''} onChange={e => setEditData(p => ({...p, description: e.target.value}))} className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none text-white" style={{background:'#334155'}} />
                  <div className="flex gap-2">
                    <select value={editData.category || ''} onChange={e => setEditData(p => ({...p, category: e.target.value}))} className="flex-1 rounded-lg px-2 py-1.5 text-xs focus:outline-none text-white" style={{background:'#334155'}}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={() => handleSaveEdit(t.id)} className="p-1.5" style={{color:'#34d399'}}><Check size={18} /></button>
                    <button onClick={() => setEditId(null)} className="p-1.5" style={{color:'#94a3b8'}}><X size={18} /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-white">{t.description}</p>
                    <p className="text-xs" style={{color:'#64748b'}}>{formatDate(t.date)} · {t.category} · {t.source === 'cartao' ? 'Cartão' : 'Conta'}</p>
                  </div>
                  <p className="text-sm font-medium shrink-0" style={{color: t.amount < 0 ? '#34d399' : 'white'}}>
                    {t.amount < 0 ? '-' : ''}{formatBRL(Math.abs(t.amount))}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditId(t.id); setEditData({ description: t.description, category: t.category }) }} className="p-1" style={{color:'#64748b'}}><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-1" style={{color:'#64748b'}}><Trash2 size={15} /></button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
