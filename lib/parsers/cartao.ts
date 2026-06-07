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
    const description = cleanDescription(rawTitle, 'cartao')
    const category = categorize(rawTitle)

    const hashInput = `${date}|${normalizeForHash(rawTitle)}|${Math.abs(amount).toFixed(2)}|cartao`
    const dedup_hash = await generateHash(hashInput)

    transactions.push({ date, description, raw_title: rawTitle, category, amount, source: 'cartao', dedup_hash })
  }

  return transactions
}

export function isCartaoCSV(content: string): boolean {
  const firstLine = content.split('\n')[0] || ''
  return firstLine.includes('date') && firstLine.includes('title') && firstLine.includes('amount')
}
