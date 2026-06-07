'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Asset } from '@/types'
import { formatBRL } from '@/lib/format'
import { Plus, Trash2, Save } from 'lucide-react'
import Card from '@/components/ui/Card'

const ASSET_TYPES = ['Conta corrente', 'Poupança', 'Investimento', 'Imóvel', 'Veículo', 'Outro']

export default function PatrimonioPage() {
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newAsset, setNewAsset] = useState({ name: '', type: 'Poupança', value: '' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('assets').select('*').order('type').order('name')
      if (data) setAssets(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleAdd() {
    const name = newAsset.name.trim()
    if (!name || !newAsset.value) return
    const value = parseFloat(newAsset.value.replace(',', '.'))
    if (isNaN(value)) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('assets').insert({
      user_id: user.id, name, type: newAsset.type, value, updated_at: new Date().toISOString()
    }).select().single()
    if (data) setAssets(prev => [...prev, data])
    setNewAsset({ name: '', type: 'Poupança', value: '' })
    setShowAdd(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir patrimônio?')) return
    await supabase.from('assets').delete().eq('id', id)
    setAssets(prev => prev.filter(a => a.id !== id))
  }

  async function handleSaveValue(asset: Asset) {
    const value = parseFloat(editValue.replace(',', '.'))
    if (isNaN(value)) return
    await supabase.from('assets').update({ value, updated_at: new Date().toISOString() }).eq('id', asset.id)
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, value } : a))
    setEditId(null)
  }

  const total = assets.reduce((sum, a) => sum + a.value, 0)

  const byType: Record<string, Asset[]> = {}
  assets.forEach(a => {
    if (!byType[a.type]) byType[a.type] = []
    byType[a.type].push(a)
  })

  if (loading) return <div className="text-center py-12" style={{color:'#64748b'}}>Carregando...</div>

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Patrimônio</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-white" style={{background:'#4f46e5'}}>
          <Plus size={16} /> Novo
        </button>
      </div>

      {/* Total */}
      <Card>
        <p className="text-xs mb-1" style={{color:'#94a3b8'}}>Patrimônio total</p>
        <p className="text-3xl font-bold text-white">{formatBRL(total)}</p>
        {assets.length > 0 && (
          <p className="text-xs mt-1" style={{color:'#64748b'}}>{assets.length} item{assets.length !== 1 ? 's' : ''}</p>
        )}
      </Card>

      {/* Add form */}
      {showAdd && (
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-white">Novo item</p>
          <input
            type="text"
            value={newAsset.name}
            onChange={e => setNewAsset(p => ({...p, name: e.target.value}))}
            placeholder="Nome (ex: Tesouro Direto, CDB Itaú)"
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white placeholder-slate-500"
            style={{background:'#334155'}}
          />
          <select
            value={newAsset.type}
            onChange={e => setNewAsset(p => ({...p, type: e.target.value}))}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white"
            style={{background:'#334155'}}
          >
            {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="text"
            inputMode="decimal"
            value={newAsset.value}
            onChange={e => setNewAsset(p => ({...p, value: e.target.value}))}
            placeholder="Valor atual (ex: 15000,00)"
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white placeholder-slate-500"
            style={{background:'#334155'}}
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-medium text-white" style={{background:'#4f46e5'}}>Salvar</button>
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{background:'#334155', color:'#94a3b8'}}>Cancelar</button>
          </div>
        </Card>
      )}

      {/* Assets by type */}
      {Object.entries(byType).map(([type, items]) => (
        <Card key={type}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{color:'#cbd5e1'}}>{type}</h2>
            <span className="text-sm font-medium text-white">{formatBRL(items.reduce((s, a) => s + a.value, 0))}</span>
          </div>
          <div className="space-y-2">
            {items.map(asset => (
              <div key={asset.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{asset.name}</p>
                  {editId === asset.id ? (
                    <div className="flex gap-1 mt-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="flex-1 rounded px-2 py-1 text-sm focus:outline-none text-white"
                        style={{background:'#334155'}}
                        autoFocus
                      />
                      <button onClick={() => handleSaveValue(asset)} className="p-1" style={{color:'#34d399'}}><Save size={15} /></button>
                      <button onClick={() => setEditId(null)} className="p-1" style={{color:'#94a3b8'}}>✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditId(asset.id); setEditValue(String(asset.value)) }}
                      className="text-sm font-medium mt-0.5"
                      style={{color:'#94a3b8'}}
                    >
                      {formatBRL(asset.value)}
                    </button>
                  )}
                </div>
                <button onClick={() => handleDelete(asset.id)} className="p-1 shrink-0" style={{color:'#64748b'}}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {assets.length === 0 && !showAdd && (
        <p className="text-center py-8" style={{color:'#64748b'}}>Nenhum patrimônio cadastrado</p>
      )}
    </div>
  )
}
