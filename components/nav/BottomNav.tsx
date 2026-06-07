'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Upload, List, Settings } from 'lucide-react'

const links = [
  { href: '/', icon: BarChart3, label: 'Dashboard' },
  { href: '/importar', icon: Upload, label: 'Importar' },
  { href: '/lancamentos', icon: List, label: 'Lançamentos' },
  { href: '/configuracoes', icon: Settings, label: 'Config.' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{background:'#1e293b', borderTop:'1px solid #334155'}}>
      <div className="flex max-w-2xl mx-auto">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition"
              style={{color: active ? '#818cf8' : '#64748b'}}
            >
              <Icon size={22} />
              <span className="text-xs">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
