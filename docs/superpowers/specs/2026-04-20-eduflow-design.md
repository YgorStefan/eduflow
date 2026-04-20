# EduFlow Pro — Design Document

**Data:** 2026-04-20
**Objetivo:** Portfólio para vaga EdTech — demonstrar maestria em integrações, código Node/Python, low-code, SQL/NoSQL e infraestrutura
**Hospedagem pública:** ygorstefan.com

---

## 1. Visão Geral

Sistema de retenção e operação de alunos que automatiza o fluxo completo: da compra ao acesso ao portal, com gestão operacional via ClickUp e alerta de churn automatizado. Todo o stack é funcional e demonstrável ao vivo.

**Abordagem escolhida:** Híbrido estratégico — serviços reais onde importa para a vaga, sem dependências frágeis de planos gratuitos de terceiros.

---

## 2. Arquitetura

O sistema é composto por quatro camadas:

### Camada de Entrada — Checkout
- **Tech:** React + Stripe.js (test mode)
- Formulário com Stripe Elements — dados de cartão nunca tocam o servidor
- Dispara `payment_intent` que gera webhook para a API

### Camada de Orquestração — API Node.js
- **Tech:** Node.js (Express) deployado como Vercel Serverless Functions
- Substitui o Make/Integromat — mostra mais domínio de código
- Recebe e valida webhooks do Stripe (verificação de assinatura)
- Orquestra escritas paralelas em Supabase e Firebase
- Cria tasks no ClickUp via REST API
- Rota principal: `POST /api/webhooks/stripe`

### Camada de Dados
- **Supabase (PostgreSQL):** histórico financeiro e matrículas
- **Firebase Firestore:** perfil em tempo real do aluno (acesso, progresso, last_login)
- O campo `supabase_id` no Firestore faz a ponte entre os dois bancos

### Camada de Interface
- **Portal do Aluno:** React + Firebase Auth — responsivo (mobile-first)
- **Dashboard Admin:** React customizado — responsivo, protegido por role `admin`
- Ambos hospedados no Vercel

### Automação de Retenção
- **Script Python** rodando via GitHub Actions (cron diário)
- Detecta alunos com `last_login > 7 dias` e `access_enabled: true`
- Cria task prioritária no ClickUp para o mentor entrar em contato
- Loga resultado na tabela `churn_alerts` no Supabase

---

## 3. Modelo de Dados

### Supabase (PostgreSQL)

```sql
-- Alunos cadastrados
students (
  id          uuid PRIMARY KEY,
  email       text NOT NULL UNIQUE,
  name        text NOT NULL,
  created_at  timestamp DEFAULT now()
)

-- Matrículas em cursos
enrollments (
  id          uuid PRIMARY KEY,
  student_id  uuid REFERENCES students(id),
  course      text NOT NULL,
  status      text NOT NULL,  -- active | suspended | completed
  enrolled_at timestamp DEFAULT now()
)

-- Histórico financeiro
payments (
  id                uuid PRIMARY KEY,
  student_id        uuid REFERENCES students(id),
  stripe_payment_id text NOT NULL UNIQUE,
  amount            numeric NOT NULL,
  status            text NOT NULL,  -- succeeded | failed | refunded
  paid_at           timestamp DEFAULT now()
)

-- Log de alertas de churn
churn_alerts (
  id          uuid PRIMARY KEY,
  student_id  uuid REFERENCES students(id),
  alerted_at  timestamp DEFAULT now(),
  clickup_task_id text
)

-- Log de erros da API
error_logs (
  id         uuid PRIMARY KEY,
  event      text,
  error      text,
  created_at timestamp DEFAULT now()
)
```

### Firebase Firestore

```
users/{uid}
  uid              string
  email            string
  name             string
  access_enabled   boolean
  last_login       timestamp
  supabase_id      string       -- ponte com PostgreSQL

courses/{courseId}/progress/{uid}
  completed_lessons  array<string>
  last_accessed      timestamp
  progress_pct       number
```

---

## 4. Fluxo de Dados

### Fluxo Principal — Compra → Acesso

1. **Checkout:** Aluno preenche formulário Stripe Elements → `payment_intent.succeeded`
2. **Webhook:** Stripe envia evento para `POST /api/webhooks/stripe` — assinatura verificada
3. **Orquestração:** API grava em Supabase (student + enrollment + payment) e Firebase (doc com `access_enabled: true`) em paralelo
4. **ClickUp:** API cria task "Boas-vindas: [nome]" no espaço de Mentoria com deadline de 24h
5. **Login:** Aluno acessa o portal via Firebase Auth — Firestore confirma acesso liberado, `last_login` atualizado

### Fluxo Secundário — Retenção (cron diário)

1. GitHub Actions executa script Python diariamente
2. Script consulta Firebase: `last_login < now - 7 dias` AND `access_enabled = true`
3. Para cada aluno inativo: cria task prioritária no ClickUp e grava em `churn_alerts`

---

## 5. Tratamento de Erros

### API (Node.js)

| Cenário | Comportamento |
|---|---|
| Webhook com assinatura inválida | HTTP 400, ignora |
| Falha ao gravar no Supabase | Rollback + alerta Discord + HTTP 500 |
| Falha ao gravar no Firebase | Retry 3x → alerta Discord → log erro |
| ClickUp API indisponível | Não bloqueia fluxo principal — log no Supabase, alerta Discord |
| Pagamento recusado | Evento `payment_failed` — acesso não liberado |

### Frontend

| Cenário | Comportamento |
|---|---|
| Erro no submit do checkout | Toast de erro, formulário mantido |
| Login com email inválido | Mensagem "email não encontrado" |
| `access_enabled = false` | Redirect para "aguardando confirmação" |
| API offline no dashboard | Skeleton + "serviço indisponível" |
| Script Python com erro | GitHub Actions falha + alerta por email |

---

## 6. Testes

- **Jest (Node.js):** webhook handler — verifica assinatura, parsing do payload, escritas no Supabase/Firebase
- **pytest (Python):** script de churn — detecção de inativos com datas mockadas
- **Stripe CLI:** simula webhooks localmente para teste E2E do fluxo de compra
- **Responsividade:** breakpoints testados em 375px (mobile), 768px (tablet), 1280px (desktop)

---

## 7. Segurança

- Stripe webhook secret validado em toda requisição recebida
- Todas as API keys em variáveis de ambiente (nunca no código)
- Firebase Security Rules: usuário só lê/escreve o próprio documento
- Dashboard admin protegido por Firebase Auth com custom claim `role: admin`

---

## 8. Infraestrutura e Deploy

| Serviço | Plataforma | Tier |
|---|---|---|
| Frontend (React) | Vercel | Free |
| API (Node.js) | Vercel Serverless Functions | Free |
| Banco SQL | Supabase | Free |
| Banco NoSQL + Auth | Firebase | Spark (Free) |
| Gestão de tasks | ClickUp | Free |
| CI/CD + cron Python | GitHub Actions | Free |
| Pagamentos | Stripe | Test mode |
| Alertas de erro | Discord Webhook | Free |

Deploy completo sem custo — demonstrável ao vivo via ygorstefan.com.

---

## 9. Correspondência com Requisitos da Vaga

| Requisito | Como demonstrado |
|---|---|
| Maestria em Integrações | Webhooks Stripe → API própria → ClickUp REST |
| Código Node/Python | API Express + script Python de churn |
| Low-Code / Automação | Substituído por código próprio (mais impactante no portfólio) |
| Dados SQL/NoSQL | Supabase (PostgreSQL) + Firebase Firestore |
| Infraestrutura | Vercel Serverless + GitHub Actions + env vars |
| Eficiência Operacional | Alerta de churn automatizado end-to-end |
