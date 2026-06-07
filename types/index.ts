export interface Transaction {
  id: string
  user_id: string
  date: string
  description: string
  raw_title: string
  category: string
  amount: number
  source: 'cartao' | 'conta'
  dedup_hash: string
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  monthly_limit: number
}

export interface Settings {
  user_id: string
  monthly_income: number
  savings_goal: number
}

export interface Upload {
  id: string
  user_id: string
  filename: string
  file_type: 'cartao' | 'conta'
  rows_imported: number
  rows_skipped: number
  created_at: string
}

export interface ParsedTransaction {
  date: string
  description: string
  raw_title: string
  category: string
  amount: number
  source: 'cartao' | 'conta'
  dedup_hash: string
}

export type CategoryName =
  | 'Mercado'
  | 'Restaurante/Delivery'
  | 'Pets'
  | 'Saúde/Bem-estar'
  | 'Transporte/Carro'
  | 'Telefone/Internet'
  | 'Assinaturas/Apps'
  | 'Compras/Vestuário'
  | 'Educação'
  | 'Beleza/Cuidados'
  | 'Igreja/Doações'
  | 'Transferências/Outros'
  | 'Outros'
  | 'Estorno'
  | 'Receita'
