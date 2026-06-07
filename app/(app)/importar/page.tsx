'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isContaCSV, parseContaCSV } from '@/lib/parsers/conta'
import { isCartaoCSV, parseCartaoCSV } from '@/lib/parsers/cartao'
import { ParsedTransaction } from '@/types'
import { CATEGORIES } from '@/lib/parsers/categorize'
import { formatBRL, formatDate } from '@/lib/format'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import Card from '@/components/ui/Card'

type ImportResult = { imported: number; skipped: number }

export default function ImportarPage() {
  const supabase = createClient()
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState<ParsedTransaction[]>([])
  const [filename, setFilename] = useState('')
  const [fileType, setFileType] = useState<'cartao' | 'conta' | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const processFile = useCallback(async (file: File) => {
    setError('')
    setResult(null)
    setParsing(true)
    setFilename(file.name)

    const content = await file.text()
    let parsed: ParsedTransaction[] = []
    let type: 'cartao' | 'conta' | null = null

    if (isCartaoCSV(content)) {
      type = 'cartao'
      parsed = await parseCartaoCSV(content)
    } else if (isContaCSV(content)) {
      type = 'conta'
      parsed = await parseContaCSV(content)
    } else {
      setError('Formato não reconhecido. Verifique se é fatura Nubank (date,title,amount) ou extrato bancário (Data,Valor,Identificador,Descrição).')
      setParsing(false)
      return
    }

    setFileType(type)
    setPreview(parsed)
    setParsing(false)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function updateCategory(idx: number, category: string) {
    setPreview(prev => prev.map((t, i) => i === idx ? { ...t, category } : t))
  }

  async function handleImport() {
    if (!preview.length || !fileType) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let imported = 0
    let skipped = 0

    for (const row of preview) {
      const { error } = await supabase.from('transactions').insert({ ...row, user_id: user.id })
      if (error) {
        if (error.code === '23505') skipped++
      } else {
        imported++
      }
    }

    await supabase.from('uploads').insert({ user_id: user.id, filename, file_type: fileType, rows_imported: imported, rows_skipped: skipped })

    setResult({ imported, skipped })
    setPreview([])
    setSaving(false)
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      <h1 className="text-xl font-bold text-white">Importar CSV</h1>

      {result && (
        <Card className="border border-emerald-600/40">
          <div className="flex items-center gap-2 mb-1" style={{color:'#34d399'}}>
            <CheckCircle size={18} />
            <span className="font-semibold">Importação concluída</span>
          </div>
          <p className="text-sm" style={{color:'#cbd5e1'}}>{result.imported} lançamentos importados · {result.skipped} ignorados (duplicados)</p>
          <button onClick={() => setResult(null)} className="mt-3 text-sm" style={{color:'#818cf8'}}>Importar outro arquivo</button>
        </Card>
      )}

      {!result && (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="border-2 border-dashed rounded-2xl p-8 text-center transition"
            style={{borderColor: dragging ? '#818cf8' : '#334155', background: dragging ? 'rgba(99,102,241,0.1)' : 'transparent'}}
          >
            <Upload size={36} className="mx-auto mb-3" style={{color:'#64748b'}} />
            <p className="font-medium mb-1 text-white">Solte o arquivo CSV aqui</p>
            <p className="text-sm mb-4" style={{color:'#64748b'}}>ou</p>
            <label className="cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{background:'#4f46e5'}}>
              Selecionar arquivo
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm" style={{color:'#f87171'}}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {parsing && <p className="text-center text-sm" style={{color:'#94a3b8'}}>Analisando arquivo...</p>}

          {preview.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{color:'#94a3b8'}}>{filename}</p>
                  <p className="text-xs" style={{color:'#64748b'}}>{preview.length} lançamentos · {fileType === 'cartao' ? 'Fatura Nubank' : 'Extrato bancário'}</p>
                </div>
                <button onClick={handleImport} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium text-white transition" style={{background: saving ? '#4338ca' : '#4f46e5'}}>
                  {saving ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {preview.map((t, i) => (
                  <Card key={i} className="!p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate text-white">{t.description}</p>
                        <p className="text-xs" style={{color:'#64748b'}}>{formatDate(t.date)} · {t.source === 'cartao' ? 'Cartão' : 'Conta'}</p>
                      </div>
                      <p className="text-sm font-medium shrink-0" style={{color: t.amount < 0 ? '#34d399' : 'white'}}>
                        {t.amount < 0 ? '-' : ''}{formatBRL(Math.abs(t.amount))}
                      </p>
                    </div>
                    <select value={t.category} onChange={e => updateCategory(i, e.target.value)} className="w-full text-xs rounded-lg px-2 py-1.5 mt-2 focus:outline-none" style={{background:'#334155', color:'#e2e8f0', border:'1px solid #475569'}}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
