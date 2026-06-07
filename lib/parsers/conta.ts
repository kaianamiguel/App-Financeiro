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
    const description = cleanDescription(rawTitle, 'conta')
    const category = categorize(rawTitle)

    const hashInput = `${date}|${normalizeForHash(rawTitle)}|${amount.toFixed(2)}|conta`
    const dedup_hash = await generateHash(hashInput)

    transactions.push({ date, description, raw_title: rawTitle, category, amount, source: 'conta', dedup_hash })
  }

  return transactions
}

export function isContaCSV(content: string): boolean {
  const firstLine = content.split('\n')[0] || ''
  return firstLine.includes('Data') && firstLine.includes('Valor') && firstLine.includes('Identificador')
}
