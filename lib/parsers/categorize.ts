export const CATEGORIES = [
  'Mercado',
  'Restaurante/Delivery',
  'Pets',
  'Saúde/Bem-estar',
  'Transporte/Carro',
  'Telefone/Internet',
  'Assinaturas/Apps',
  'Compras/Vestuário',
  'Educação',
  'Beleza/Cuidados',
  'Igreja/Doações',
  'Transferências/Outros',
  'Outros',
] as const

export type Category = typeof CATEGORIES[number]

export const CATEGORY_RULES: Record<string, string[]> = {
  'Mercado': [
    'supermerc', 'atacad', 'angeloni', 'moniari', 'm m rosso', 'rosso supermerc',
    'fruteira', 'mercado', 'hiper barato', 'mix marias', 'varela da rosa',
    'padaria', 'acougue', 'hortifruti', 'fort atac', 'agroshop', 'bomboniere',
  ],
  'Restaurante/Delivery': [
    'ifood', 'cantinho grill', 'madero', 'kalzone', 'restaurante', 'lanchonete',
    'burg', 'pizza', 'padoca', 'sorveter', 'espeto', 'churrasc', 'subway',
    'mc donald', 'outback', 'giraffas', 'cafe', 'grill', 'lika',
  ],
  'Pets': ['pet bask', 'petshop', 'pet shop', 'petz', 'cobasi'],
  'Saúde/Bem-estar': [
    'farmac', 'farmrcia', 'famrcia', 'drogaria', 'amorsaude', 'amor saude',
    'clinica', 'hospital', 'laborator', 'odonto', 'dentist', 'psicolog',
    'medic', 'nu seguro', 'seguro vida', 'wellhub', 'gympass', 'academia', 'hypefull',
  ],
  'Transporte/Carro': [
    'posto', 'petrobras', 'ipiranga', 'shell', 'combustivel', 'uber', '99app',
    '99 ', 'cabify', 'estaciona', 'pedagio', 'escapamento', 'feltrim',
    'mecanic', 'oficina', 'pneu',
  ],
  'Telefone/Internet': [
    'telefonica', 'vivo', 'claro', 'tim', 'sul online', 'internet', 'telecom', 'oi fixo',
  ],
  'Assinaturas/Apps': [
    'cartaodetodo', 'netflix', 'spotify', 'disney', 'prime video', 'hbo',
    'youtube', 'assinatura', 'playstation', 'xbox', 'apple.com', 'icloud',
    'bytedance', 'tiktok', 'claude', 'google one', 'dl*google', 'google', 'microsoft',
  ],
  'Compras/Vestuário': [
    'havan', 'renner', 'magazine', 'magalu', 'shopee', 'amazon', 'mercadolivre',
    'aliexpress', 'shein', 'riachuelo', 'lojas', 'confeccoes', 'we pink',
    'centauro', 'inoveshop', 'shpstecnolog', 'brasilmart', 'rinascente',
    'criativa aviamentos', 'livraria', 'papelaria', 'studio z', 'casa arco iris',
    'loja das gurias', 'duluda textil', 'torra',
  ],
  'Educação': [
    'instituto de musica', 'joe cabral', 'faculdade', 'curso', 'escola de',
    'universidade', 'colegio', 'mensalidade',
  ],
  'Beleza/Cuidados': [
    'sobrancelha', 'salao', 'cabelele', 'cabeleire', 'manicure', 'barbearia', 'estetica', 'spa',
  ],
  'Igreja/Doações': ['paroquia', 'igreja', 'dizimo', 'sagrada', 'doacao'],
  'Transferências/Outros': ['pix', 'boleto'],
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function categorize(text: string): string {
  const n = normalize(text)

  if (n.includes('estorno')) return 'Compras/Vestuário'

  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    for (const kw of keywords) {
      if (n.includes(normalize(kw))) return category
    }
  }

  return 'Outros'
}

export function cleanDescription(raw: string, source: 'cartao' | 'conta'): string {
  if (source === 'conta') {
    const pixMatch = raw.match(/pix[^-]*-\s*([^-]+)/i)
    if (pixMatch) return `Pix: ${pixMatch[1].trim()}`

    const debitoMatch = raw.match(/debito\s*-\s*(.+)/i)
    if (debitoMatch) return debitoMatch[1].trim()

    const boletoMatch = raw.match(/boleto[^-]*-\s*(.+)/i)
    if (boletoMatch) return `Boleto: ${boletoMatch[1].trim()}`
  }
  return raw.trim()
}
