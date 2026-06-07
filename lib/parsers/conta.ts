import Papa from 'papaparse'
import { categorize, cleanDescription } from './categorize'
import { generateHash, normalizeForHash } from '../dedup'
import { ParsedTransaction } from '@/types'

interface ContaRow {
  Data: string
  Valor: string
  Identificador: string
  'Descrição': string
}

function detectInstallment(title: string): { current: number; total: number; base: string } | null {
  const match = title.match(/^(.*?)\s+(\d+)\/(\d+)\s*$/i)
  if (!match) return null
  const current = parseInt(match[2], 10)
  const total = parseInt(match[3], 10)
  if (current < 1 || total < 2 || current > total) return null
  return { current, total, base: match[1].trim() }
}

function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1 + months, 1)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const day = Math.min(d, lastDay)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export async function parseContaCSV(content: string): Promise<ParsedTransaction[]> {
  const result = Papa.parse<ContaRow>(content, {
    header: true,
    skipEmptyLines: true,
  })

  const transactions: ParsedTransaction[] = []

  for (const row of result.data) {
    const desc = row['Descrição'] || ''
    const valorStr = row['Valor'] || '0'
    const valor = parseFloat(valorStr.replace(',', '.'))

    if (isNaN(valor)) continue
    if (valor >= 0) continue
    if (desc.toLowerCase().includes('pagamento de fatura')) continue

    const amount = Math.abs(valor)
    const [day, month, year] = row['Data'].split('/')
    const date = `${year}-${month}-${day}`

    const rawTitle = desc
    const installment = detectInstallment(rawTitle)

    if (installment) {
      const { current, total, base } = installment
      const firstInstallmentDate = addMonths(date, -(current - 1))
      const firstMonth = firstInstallmentDate.slice(0, 7)
      const normalizedBase = normalizeForHash(base)

      for (let i = 0; i < total; i++) {
        const installDate = addMonths(date, -(current - 1) + i)
        const installNum = i + 1
        const isFuture = i > current - 1
        const description = `${cleanDescription(base, 'conta')} ${installNum}/${total}`
        const rawT = `${base} ${installNum}/${total}`

        const hashInput = `installment|${firstMonth}|${normalizedBase}|${installNum}|${total}|${amount.toFixed(2)}|conta`
        const dedup_hash = await generateHash(hashInput)

        transactions.push({
          date: installDate,
          description,
          raw_title: rawT,
          category: categorize(base),
          amount,
          source: 'conta',
          dedup_hash,
          isFutureInstallment: isFuture,
        })
      }
    } else {
      const description = cleanDescription(rawTitle, 'conta')
      const category = categorize(rawTitle)
      const hashInput = `${date}|${normalizeForHash(rawTitle)}|${amount.toFixed(2)}|conta`
      const dedup_hash = await generateHash(hashInput)
      transactions.push({ date, description, raw_title: rawTitle, category, amount, source: 'conta', dedup_hash })
    }
  }

  return transactions
}

export function isContaCSV(content: string): boolean {
  const firstLine = content.split('\n')[0] || ''
  return firstLine.includes('Data') && firstLine.includes('Valor') && firstLine.includes('Identificador')
}
