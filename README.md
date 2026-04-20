# EduFlow Pro

Sistema de retenção e operação de alunos — do checkout ao portal, com detecção automática de churn.

Construído como portfólio, demonstrando integrações reais, código Node.js/Python, SQL/NoSQL e infraestrutura sem custo.

**Demo:** [ygorstefan.com](https://ygorstefan.com)

---

## Visão Geral

O fluxo completo funciona assim:

1. Aluno preenche checkout com Stripe Elements e paga
2. Stripe dispara webhook → API valida assinatura e orquestra escritas em Supabase + Firebase
3. Aluno recebe acesso ao portal via Firebase Auth
4. Script Python roda diariamente via GitHub Actions e cria tasks no ClickUp para alunos inativos há 7+ dias

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (Pages Router) + TypeScript |
| API | Next.js API Routes (Vercel Serverless) |
| Pagamentos | Stripe Elements + Webhooks |
| Banco SQL | Supabase (PostgreSQL) |
| Banco NoSQL + Auth | Firebase Firestore + Firebase Auth |
| Gestão de tasks | ClickUp REST API |
| Alertas de erro | Discord Webhooks |
| Script de retenção | Python 3.11 |
| CI/CD + cron | GitHub Actions |
| Deploy | Vercel |

---

## Estrutura do Projeto

```
eduflow/
├── pages/
│   ├── index.tsx                    # Landing + checkout
│   ├── login.tsx                    # Login via Firebase Auth
│   ├── portal.tsx                   # Portal do aluno (protegido)
│   ├── admin.tsx                    # Dashboard admin (protegido)
│   ├── aguardando.tsx               # Página de acesso pendente
│   └── api/
│       ├── create-payment-intent.ts # Cria PaymentIntent no Stripe
│       ├── webhooks/stripe.ts       # Recebe eventos do Stripe
│       └── admin/students.ts        # Listagem de alunos (admin)
├── components/
│   ├── checkout/CheckoutForm.tsx    # Formulário Stripe Elements
│   ├── portal/CourseProgress.tsx    # Progresso em tempo real (Firestore)
│   └── admin/
│       ├── StudentTable.tsx         # Tabela de alunos com status
│       └── RevenueChart.tsx         # Gráfico de faturamento mensal
├── lib/
│   ├── firebase-client.ts           # Firebase SDK (browser)
│   ├── firebase-admin.ts            # Firebase Admin SDK (servidor)
│   ├── supabase.ts                  # Supabase client (anon + admin)
│   └── stripe.ts                   # Stripe server client
├── middleware/
│   └── withAuth.ts                  # HOC para rotas protegidas
├── scripts/
│   └── churn_alert.py               # Detecta inativos → cria task ClickUp
├── tests/
│   ├── api/stripe-webhook.test.ts   # Testes do webhook handler
│   └── python/test_churn_alert.py   # Testes do script Python
├── supabase/
│   └── migrations/001_initial.sql   # Schema completo
└── .github/
    └── workflows/
        ├── ci.yml                   # Testes em todo PR
        └── churn.yml                # Cron diário do script Python
```

---

## Setup Local

### Pré-requisitos

- Node.js 20+
- Python 3.11+
- Conta Stripe (test mode)
- Projeto Firebase (Firestore + Auth habilitados)
- Projeto Supabase
- Workspace ClickUp
- Webhook Discord (opcional, para alertas de erro)

### 1. Instalar dependências

```bash
npm install
pip install -r scripts/requirements.txt
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencher `.env.local` com as credenciais reais (ver seção abaixo).

### 3. Executar a migração no Supabase

No painel do Supabase → SQL Editor, executar o conteúdo de:

```
supabase/migrations/001_initial.sql
```

Isso cria as tabelas: `students`, `enrollments`, `payments`, `churn_alerts`, `error_logs`.

### 4. Configurar Firebase Security Rules

No console do Firebase → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /courses/{courseId}/progress/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Para testar o webhook do Stripe localmente:

```bash
# Terminal 1 — servidor
npm run dev

# Terminal 2 — Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3 — simular pagamento
stripe trigger payment_intent.succeeded \
  --override "payment_intent:metadata.customer_name=João Silva" \
  --override "payment_intent:metadata.customer_email=joao@email.com" \
  --override "payment_intent:metadata.course=mentoria-eduflow"
```

---

## Variáveis de Ambiente

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase (client — browser)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase (admin — servidor)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# ClickUp
CLICKUP_API_TOKEN=...
CLICKUP_LIST_ID=...

# Discord (opcional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## Testes

```bash
# TypeScript (webhook handler)
npm test

# Python (script de churn)
python -m pytest tests/python/ -v
```

---

## Deploy

### Vercel

```bash
npx vercel --prod
```

Após o deploy, configurar todas as variáveis de ambiente no painel do Vercel (Settings → Environment Variables).

### GitHub Actions

Adicionar os seguintes secrets no repositório (Settings → Secrets → Actions):

| Secret | Descrição |
|--------|-----------|
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `FIREBASE_CLIENT_EMAIL` | Email da service account |
| `FIREBASE_PRIVATE_KEY` | Chave privada da service account |
| `CLICKUP_API_TOKEN` | Token da API do ClickUp |
| `CLICKUP_LIST_ID` | ID da lista de tasks no ClickUp |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key do Supabase |

Os workflows fazem:
- **ci.yml** — roda Jest e pytest em todo PR e push para `main`
- **churn.yml** — executa o script de churn diariamente às 9h UTC

---

## Modelo de Dados

### Supabase (PostgreSQL)

- **students** — alunos cadastrados (email, nome)
- **enrollments** — matrículas por curso com status (`active` / `suspended` / `completed`)
- **payments** — histórico financeiro vinculado ao Stripe
- **churn_alerts** — log de alertas de inatividade
- **error_logs** — erros capturados pela API

### Firebase Firestore

- **users/{uid}** — perfil em tempo real: `access_enabled`, `last_login`, `role`, `supabase_id`
- **courses/{courseId}/progress/{uid}** — progresso do aluno por curso

---

## Segurança

- Assinatura do webhook Stripe validada em toda requisição
- Chaves de API exclusivamente em variáveis de ambiente
- Firebase Security Rules: usuário acessa apenas o próprio documento
- API admin protegida por verificação de token Firebase + checagem de `role: admin` no Firestore
- `supabaseAdmin` (service role) nunca exposto ao bundle do cliente
