# Finanças Pessoais

App web mobile-first de organização financeira pessoal. Instalável como PWA no Android.

## Stack
- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** — Postgres (dados), Auth (login), Storage (arquivos)
- **Recharts** (gráficos) + **PapaParse** (CSV)
- **Deploy**: Vercel (CI/CD automático a cada push na `main`)

---

## 1. Configurar o banco de dados (Supabase)

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard/project/lxgbdurbfxuuvcmlwhnb)
2. Vá em **SQL Editor**
3. Cole e execute o conteúdo de `supabase/migrations/001_initial.sql`

---

## 2. Criar sua conta de usuário

1. No Dashboard → **Authentication** → **Users** → **Add user** → **Create new user**
2. Insira seu e-mail e senha
3. Copie o **UUID** do usuário criado (coluna `id`)

---

## 3. Executar o seed (orçamento padrão)

1. Abra `supabase/seed.sql`
2. Substitua `YOUR_USER_UUID` pelo UUID copiado
3. Execute no SQL Editor

---

## 4. Desabilitar cadastros públicos (CRÍTICO — app privado)

1. Dashboard → **Authentication** → **Sign In / Sign Up**  
2. Desative **"Enable sign ups"**

Agora ninguém mais pode criar conta. Só você (já cadastrado) consegue logar.

---

## 5. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) → **Add New Project** → importe este repositório
2. Adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://lxgbdurbfxuuvcmlwhnb.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua anon key
3. Deploy automático acontece a cada push na branch `main`

---

## 6. Instalar no Android (PWA)

1. Abra o app no **Chrome para Android**
2. Menu (⋮) → **"Adicionar à tela inicial"**
3. O app abre em tela cheia sem barra do navegador

> **Ícones:** Adicione `icon-192.png` e `icon-512.png` em `public/icons/`. Gere em [favicon.io](https://favicon.io).

---

## 7. Rodar localmente

```bash
npm install
# Crie .env.local com as chaves do Supabase
npm run dev
```

---

## Formatos de CSV suportados

| Tipo | Cabeçalho detectado |
|---|---|
| Fatura Nubank | `date,title,amount` |
| Extrato bancário | `Data,Valor,Identificador,Descrição` |

**Regras automáticas:**
- "Pagamento de fatura" e "Pagamento recebido" → ignorados (evita dupla contagem)
- Duplicatas → detectadas por hash, ignoradas silenciosamente
- Estornos → salvos com valor negativo (abate do total da categoria)
