# Simonetto CRM — Contexto para Claude

## Stack

- **Frontend**: Next.js 16 (React 19), TypeScript, Tailwind, Shadcn/ui
- **Backend**: WordPress (`manager.simonetto.com.br`) com tema customizado `simonetto-tema/`
- **Auth**: JWT via plugin WP (`auth_token` cookie) — `lib/auth.ts` centraliza tudo
- **Deploy frontend**: `noxus.simonetto.com.br` (Vercel ou similar)
- **Deploy backend**: FTP/SFTP para o servidor WordPress (LiteSpeed + OPcache)

Não há WordPress local — o `.env` aponta para produção. Mudanças em PHP precisam ser enviadas via FTP.

---

## Estrutura de Diretórios

```
app/
  (dashboard)/          # Páginas autenticadas
    crm/                # Kanban, comportamento, etc.
    metas/              # Metas comerciais
  api/                  # Rotas Next.js (proxies para WP REST API)
components/
  leads/                # lead-dialog.tsx, kanban-columns.tsx, notas-lead.tsx, etc.
  lojas/                # configurações por loja
  ui/                   # Shadcn
lib/
  auth.ts               # getSession(), requireAuth(), isGerente(), isSupervisor(), podeAtribuirLeads()
  leads-service.ts      # funções de fetch da API de leads
  server-leads-service.ts # versões server-side (usam token via cookie)
  types.ts              # tipos TypeScript centralizados
simonetto-tema/
  inc/api/
    endpoints/          # leads.php, lojas.php, metas.php — register_rest_route('api/v1', ...)
    handlers/           # lead-handler.php, nota-handler.php, meta-comercial-handler.php, etc.
  inc/acf/fields.php    # ACF campos registrados via PHP (acf_add_local_field_group)
  functions.php         # constantes, helpers de perfil, JWT filter, acf/save_post hook
  cpt/                  # Custom Post Types (perfil_acesso, lojas, etc.)
```

---

## Auth — Padrões

### Frontend (Next.js)
```ts
// Em Server Components / page.tsx:
const user = await requireAuth()     // redireciona se não logado
const user = await requireGerente()  // redireciona se não for gerente+

// Funções de verificação de nível:
isGerente(user)        // true para: admin, supervisor, industria, master, gerente
isSupervisor(user)     // true para: admin, supervisor, industria, master
podeAtribuirLeads(user) // true se perfil_acesso.pode_atribuir_leads ou admin/gerente
isAdmin(user)

// Em API Routes (app/api/):
const session = await getSession()
// session.token  → Bearer token para Authorization header nas chamadas ao WP
// session.user   → objeto User com id, loja_ids, perfil_acesso, is_gerente, etc.
```

### Backend (WordPress)
Permission callbacks nos endpoints:
- `mytheme_api_is_authenticated` — qualquer usuário logado
- `mytheme_api_is_gerente()` — verifica `perfil_acesso.nivel_atribuicao` in `CRM_NIVEIS_GERENTE` OU `is_gerente` legado
- `mytheme_api_is_administrator` — WP administrator

---

## Sistema de Perfis de Acesso

**CPT**: `perfil_acesso` — gerenciado no WP Admin com ACF.

### Hierarquia de níveis
```
master / supervisor / industria   → CRM_NIVEIS_SUPERVISOR
gerente                           → CRM_NIVEIS_GERENTE (inclui os acima)
atendente
```

### Campos do perfil (post_meta via ACF)
| campo | descrição |
|---|---|
| `nivel_atribuicao` | `atendente` \| `gerente` \| `supervisor` \| `industria` \| `master` |
| `ver_leads_nao_atribuidos` | vê todos os leads da loja (não só os seus) |
| `pode_atribuir_leads` | pode mudar responsável de um lead |
| `acesso_multiplas_lojas` | pode ter múltiplas lojas vinculadas |
| `escopo_lojas` | `proprias` (só lojas vinculadas) \| `todas` (visão global) |

### Meta keys do usuário
| meta key | descrição |
|---|---|
| `loja_ids` | array de IDs de lojas — setado pela API do CRM |
| `loja_id` | ACF post_object (multiple) — setado via WP Admin |
| `perfil_acesso_id` | ID do post `perfil_acesso` vinculado |
| `is_gerente` | legado — preferir `perfil_acesso` |

**Importante**: `loja_ids` e `loja_id` podem divergir. A função `crm_get_user_loja_ids_acessiveis()` usa fallback: `loja_ids` meta → `loja_id` meta → `get_field`. O hook `acf/save_post` sincroniza automaticamente `loja_id → loja_ids` quando o perfil é salvo no WP Admin.

### Helpers PHP principais (`functions.php`)
```php
crm_get_perfil_acesso(int $user_id): ?array
crm_user_is_supervisor(int $user_id = 0): bool
crm_user_has_escopo_global(int $user_id = 0): bool
crm_get_user_loja_ids_acessiveis(int $user_id = 0): ?array  // null=sem restrição
crm_stats_responsavel_filter(): int  // 0=vê tudo, user_id=filtrar por responsável
```

---

## Tabelas WordPress Customizadas

| tabela | descrição |
|---|---|
| `wp_leads` | leads principais |
| `wp_leads_actions` | histórico/audit do lead — `lead_id, tipo_contato, usuario_id, observacao, criado_em` |
| `wp_leads_notas` | notas manuais internas — `lead_id, usuario_id, usuario_nome, conteudo, criado_em` |
| `wp_metas_comerciais` | metas comerciais por loja |
| `wp_pos_vendas` | pós-venda |
| `wp_lead_venda_realizada` | dados de fechamento ao mover para "venda_realizada" |
| `wp_lead_tracking` | tracking de origem/UTM/device do lead |

### Audit Log (`wp_leads_actions`)
Eventos automáticos são inseridos nessa tabela (não em notas) quando:
- Responsável do lead é alterado → `tipo_contato = 'Alteração de Responsável'`
- Loja do lead é alterada (update_loja) → `tipo_contato = 'Alteração de Loja'`
- Lead é transferido entre lojas (transfer_loja) → `tipo_contato = 'Transferência de Loja'`

Visível na aba **Histórico** do `lead-dialog.tsx` via `GET /api/v1/leads/{id}/actions`.

---

## Endpoints WordPress (padrão)

Base: `manager.simonetto.com.br/wp-json/api/v1/`

Principais:
- `GET/PATCH /leads/{id}` — buscar/atualizar lead (status, loja_id, responsavel_id, dados)
- `POST /leads/{id}/transferir` — transferir para outra loja (apenas supervisores)
- `GET /leads/{id}/actions` — histórico/audit do lead
- `GET/POST /leads/{id}/notas` — notas manuais
- `GET /lojas/{id}/usuarios` — usuários da loja (filtra supervisores da lista)
- `GET/POST /metas` — metas comerciais
- `GET /metas/dashboard` — dashboard de metas com resultados calculados
- `GET /leads-tracking-horario?loja_ids=&responsavel_id=` — distribuição por hora
- `GET /leads-tracking-device?loja_ids=&responsavel_id=` — distribuição por device

---

## Padrões de Permissão por Funcionalidade

| funcionalidade | quem pode |
|---|---|
| Ver leads da loja | gerente+ (ver_leads_nao_atribuidos=true) ou atendente (só os seus) |
| Atribuir responsável | gerente+ (pode_atribuir_leads=true) |
| Transferir entre lojas | supervisor+ |
| Criar/editar metas | gerente+ (isGerente() = true) |
| Aba Comportamento | gerente+; supervisores veem suas lojas; gerentes veem só leads atribuídos a eles |
| Configurações de loja | gerente+ |

---

## Filtros de Escopo no Frontend

**Página Comportamento** (`app/(dashboard)/crm/comportamento/page.tsx`):
```ts
const sup = isSupervisor(user)
const lojaIds = user.loja_ids.length > 0 ? user.loja_ids : undefined  // todos filtram por lojas
const responsavelId = !sup ? user.id : undefined  // não-supervisores filtram pelos próprios leads
```

**Stats/Dashboard**: PHP usa `crm_stats_responsavel_filter()` e `crm_get_user_loja_ids_acessiveis()`.

---

## JWT — O que está no token

O payload JWT tem apenas `data.user.id`. Os campos extras (`loja_ids`, `perfil_acesso`, etc.) estão apenas no **body da resposta** de login — salvos na sessão Next.js via `auth_token` cookie.

O filtro `add_loja_role_userid_to_jwt` em `functions.php` inclui os campos no response body do login.

---

## Arquivos Críticos Frequentemente Editados

- `simonetto-tema/inc/api/endpoints/leads.php` — todos os endpoints de leads
- `simonetto-tema/inc/api/handlers/lead-handler.php` — lógica de negócio de leads
- `simonetto-tema/functions.php` — helpers globais, JWT filter, hooks ACF
- `simonetto-tema/inc/acf/fields.php` — campos ACF registrados via PHP
- `lib/auth.ts` — funções de autenticação e autorização do frontend
- `components/leads/lead-dialog.tsx` — modal principal do lead (muito grande, ~1700 linhas)
- `components/leads/kanban-columns.tsx` — kanban com drag-and-drop

---

## Dicas Operacionais

- **OPcache**: após subir PHP, pode ser necessário limpar o OPcache no LiteSpeed (WP Admin → LiteSpeed Cache → Ferramentas → Limpar OPcache)
- **Sem WP local**: sempre testar contra `manager.simonetto.com.br`
- **Dois caminhos de configuração de loja no usuário**: WP Admin (ACF → `loja_id`) e CRM Admin (API → `loja_ids`); o hook `acf/save_post` sincroniza o primeiro para o segundo
