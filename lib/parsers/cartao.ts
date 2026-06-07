import Papa from 'papaparse'
import { categorize, cleanDescription } from './categorize'
import { generateHash, normalizeForHash } from '../dedup'
import { ParsedTransaction } from '@/types'

interface CartaoRow {
  date: string
  title: string
  amount: string
}

function parseCartaoAmount(str: string): number {
  const cleaned = str.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned)
}

// Detect "X/N" installment pattern, returns { current, total, base } or null
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

export async function parseCartaoCSV(content: string): Promise<ParsedTransaction[]> {
  const result = Papa.parse<CartaoRow>(content, {
    header: true,
    skipEmptyLines: true,
  })

  const transactions: ParsedTransaction[] = []

  for (const row of result.data) {
    const title = row['title'] || ''
    const titleLower = title.toLowerCase()

    if (titleLower.includes('pagamento recebido')) continue

    const rawAmount = parseCartaoAmount(row['amount'] || '0')
    if (isNaN(rawAmount)) continue

    const isEstorno = titleLower.includes('estorno')
    const amount = isEstorno ? -Math.abs(rawAmount) : Math.abs(rawAmount)

    const date = row['date']
    const rawTitle = title

    const installment = detectInstallment(rawTitle)

    if (installment && !isEstorno) {
      const { current, total, base } = installment
      // Calculate first installment month
      const firstInstallmentDate = addMonths(date, -(current - 1))
      const firstMonth = firstInstallmentDate.slice(0, 7)
      const normalizedBase = normalizeForHash(base)

      for (let i = 0; i < total; i++) {
        const installDate = addMonths(date, -(current - 1) + i)
        const installNum = i + 1
        const isFuture = i > current - 1
        const description = `${cleanDescription(base, 'cartao')} ${installNum}/${total}`
        const rawT = `${base} ${installNum}/${total}`

        const hashInput = `installment|${firstMonth}|${normalizedBase}|${installNum}|${total}|${amount.toFixed(2)}|cartao`
        const dedup_hash = await generateHash(hashInput)

        transactions.push({
          date: installDate,
          description,
          raw_title: rawT,
          category: categorize(base),
          amount,
          source: 'cartao',
          dedup_hash,
          isFutureInstallment: isFuture,
        })
      }
    } else {
      const description = cleanDescription(rawTitle, 'cartao')
      const category = categorize(rawTitle)
      const hashInput = `${date}|${normalizeForHash(rawTitle)}|${Math.abs(amount).toFixed(2)}|cartao`
      const dedup_hash = await generateHash(hashInput)
      transactions.push({ date, description, raw_title: rawTitle, category, amount, source: 'cartao', dedup_hash })
    }
  }

  return transactions
}

export function isCartaoCSV(content: string): boolean {
  const firstLine = content.split('\n')[0] || ''
  return firstLine.includes('date') && firstLine.includes('title') && firstLine.includes('amount')
}
