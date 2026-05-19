# Integração de Landing Page — Simonetto CRM

**Destinatário:** Agência de desenvolvimento de LPs  
**Versão:** 1.0  
**Data:** Maio de 2026

---

## Visão Geral

Cada landing page desenvolvida para uma loja Simonetto deve enviar os dados de contato do cliente diretamente para o CRM via uma chamada HTTP simples. O CRM registra o lead automaticamente, aplica a pontuação de qualificação, notifica a loja por e-mail e disponibiliza o contato no painel da loja em tempo real.

Não é necessário qualquer cadastro, chave de API adicional ou autenticação especial — o endpoint exclusivo da loja já identifica para qual franquia o lead pertence.

---

## Endpoint

```
POST https://manager.simonetto.com.br/wp-json/api/v1/lp/ee12c62b61810c8db0a2de2fd3a9bb52246d946a936fc13d
```

| Atributo       | Valor                    |
|----------------|--------------------------|
| Método         | `POST`                   |
| Content-Type   | `application/json`       |
| Autenticação   | Nenhuma (token na URL)   |
| CORS           | Liberado para qualquer origem |

> **Atenção:** Este endpoint é exclusivo desta loja. Não compartilhe com outras unidades — cada loja possui sua própria URL.

---

## Passo a Passo de Integração

### 1. Adicione o snippet no `<head>` da LP

Cole o código abaixo **antes do fechamento do `</head>`** ou antes do `</body>`. Ele expõe a função `SimonettoCRM.enviarLead()` que você usará no submit do formulário.

```html
<!-- Simonetto CRM — Integração LP -->
<script>
(function () {
  var ENDPOINT = 'https://manager.simonetto.com.br/wp-json/api/v1/lp/ee12c62b61810c8db0a2de2fd3a9bb52246d946a936fc13d';

  function getTracking() {
    var p = new URLSearchParams(window.location.search);
    return {
      utm_source:   p.get('utm_source')   || '',
      utm_medium:   p.get('utm_medium')   || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_content:  p.get('utm_content')  || '',
      utm_term:     p.get('utm_term')     || '',
      referrer:     document.referrer     || '',
      landing_page: window.location.href
    };
  }

  window.SimonettoCRM = {
    enviarLead: function (dados) {
      var payload = Object.assign({}, dados, getTracking());
      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); });
    }
  };
})();
</script>
<!-- Fim Simonetto CRM -->
```

### 2. Chame `SimonettoCRM.enviarLead()` no submit do formulário

```javascript
SimonettoCRM.enviarLead({
  nome:     'Maria Silva',
  email:    'maria@email.com',
  telefone: '11999999999'
})
.then(function(resposta) {
  if (resposta.success) {
    // Redirecionar para página de obrigado, exibir mensagem, etc.
  }
});
```

---

## Campos do Payload

### Obrigatórios

| Campo      | Tipo     | Descrição              | Exemplo               |
|------------|----------|------------------------|-----------------------|
| `nome`     | `string` | Nome completo do lead  | `"Maria Silva"`       |
| `email`    | `string` | E-mail válido          | `"maria@email.com"`   |
| `telefone` | `string` | Telefone com ou sem DDD| `"11999999999"`       |

### Opcionais (melhoram a pontuação do lead)

| Campo                       | Tipo     | Descrição                              | Exemplo                    |
|-----------------------------|----------|----------------------------------------|----------------------------|
| `cidade`                    | `string` | Cidade do cliente                      | `"São Paulo"`              |
| `estado`                    | `string` | UF (2 letras)                          | `"SP"`                     |
| `interesse`                 | `string` | Ambientes de interesse, separados por vírgula | `"cozinha, quarto"` |
| `expectativa_investimento`  | `string` | Faixa de investimento (ver tabela abaixo) | `"50-100k"`             |
| `mensagem`                  | `string` | Mensagem livre do cliente              | `"Preciso reformar..."`    |

#### Valores aceitos para `expectativa_investimento`

| Valor         | Descrição              |
|---------------|------------------------|
| `35-50k`      | Entre R$ 35k e R$ 50k  |
| `50-100k`     | Entre R$ 50k e R$ 100k |
| `100-150k`    | Entre R$ 100k e R$ 150k|
| `150-200k`    | Entre R$ 150k e R$ 200k|
| `acima-250k`  | Acima de R$ 250k       |

#### Valores aceitos para `interesse`

Qualquer combinação dos ambientes abaixo, separados por vírgula:

`cozinha` · `quarto` · `banheiro` · `sala` · `escritório` · `closet` · `lavanderia` · `varanda` · `garagem` · `home office` · `completo`

> Enviar `"completo"` indica que o cliente deseja mobiliar a casa toda — aumenta significativamente a pontuação do lead.

---

## Rastreamento Automático

O snippet captura automaticamente os campos abaixo a partir da URL da página e do navegador. **Nenhuma ação adicional é necessária** da parte da agência — basta garantir que as campanhas de mídia paga usem os parâmetros UTM corretamente nas URLs de destino.

| Campo          | Origem                          |
|----------------|---------------------------------|
| `utm_source`   | `?utm_source=` na URL           |
| `utm_medium`   | `?utm_medium=` na URL           |
| `utm_campaign` | `?utm_campaign=` na URL         |
| `utm_content`  | `?utm_content=` na URL          |
| `utm_term`     | `?utm_term=` na URL             |
| `referrer`     | `document.referrer` do navegador|
| `landing_page` | URL completa da página          |

---

## Resposta da API

### Sucesso — `HTTP 201`

```json
{
  "success": true,
  "lead_id": 482,
  "mensagem": "Lead recebido com sucesso."
}
```

### Erro de validação — `HTTP 400`

```json
{
  "success": false,
  "mensagem": "Nome, email e telefone são obrigatórios."
}
```

### Token inválido — `HTTP 401`

```json
{
  "success": false,
  "mensagem": "Token de integração inválido."
}
```

---

## Exemplos de Implementação

### Formulário HTML + Vanilla JS

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">

  <!-- 1. Snippet do CRM -->
  <script>
  (function () {
    var ENDPOINT = 'https://manager.simonetto.com.br/wp-json/api/v1/lp/ee12c62b61810c8db0a2de2fd3a9bb52246d946a936fc13d';
    function getTracking() {
      var p = new URLSearchParams(window.location.search);
      return {
        utm_source: p.get('utm_source') || '', utm_medium: p.get('utm_medium') || '',
        utm_campaign: p.get('utm_campaign') || '', utm_content: p.get('utm_content') || '',
        utm_term: p.get('utm_term') || '', referrer: document.referrer || '',
        landing_page: window.location.href
      };
    }
    window.SimonettoCRM = {
      enviarLead: function (d) {
        return fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({}, d, getTracking()))
        }).then(function (r) { return r.json(); });
      }
    };
  })();
  </script>
</head>
<body>

  <form id="form-contato">
    <input  type="text"  name="nome"     placeholder="Seu nome completo" required />
    <input  type="email" name="email"    placeholder="Seu e-mail"        required />
    <input  type="tel"   name="telefone" placeholder="Seu telefone"      required />
    <input  type="text"  name="cidade"   placeholder="Sua cidade" />
    <select name="interesse">
      <option value="">Qual ambiente você quer reformar?</option>
      <option value="cozinha">Cozinha</option>
      <option value="quarto">Quarto</option>
      <option value="completo">Casa completa</option>
    </select>
    <select name="expectativa_investimento">
      <option value="">Faixa de investimento</option>
      <option value="35-50k">Até R$ 50 mil</option>
      <option value="50-100k">R$ 50k – R$ 100k</option>
      <option value="100-150k">R$ 100k – R$ 150k</option>
      <option value="acima-250k">Acima de R$ 250k</option>
    </select>
    <textarea name="mensagem" placeholder="Conte mais sobre seu projeto..."></textarea>
    <button type="submit">Solicitar orçamento</button>
    <p id="feedback" style="display:none"></p>
  </form>

  <!-- 2. Handler do submit -->
  <script>
    document.getElementById('form-contato').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var btn = f.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Enviando...';

      SimonettoCRM.enviarLead({
        nome:                    f.nome.value,
        email:                   f.email.value,
        telefone:                f.telefone.value,
        cidade:                  f.cidade.value,
        interesse:               f.interesse.value,
        expectativa_investimento: f.expectativa_investimento.value,
        mensagem:                f.mensagem.value
      })
      .then(function (res) {
        var msg = document.getElementById('feedback');
        msg.style.display = 'block';
        if (res.success) {
          f.reset();
          btn.textContent = 'Enviado!';
          msg.textContent = 'Obrigado! Nossa equipe entrará em contato em breve.';
        } else {
          btn.disabled = false;
          btn.textContent = 'Solicitar orçamento';
          msg.textContent = 'Erro ao enviar. Verifique os campos e tente novamente.';
        }
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = 'Solicitar orçamento';
      });
    });
  </script>

</body>
</html>
```

---

### Apenas fetch (sem o snippet — uso avançado)

Caso prefira fazer a chamada diretamente sem o snippet:

```javascript
fetch('https://manager.simonetto.com.br/wp-json/api/v1/lp/ee12c62b61810c8db0a2de2fd3a9bb52246d946a936fc13d', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome:                    'Maria Silva',
    email:                   'maria@email.com',
    telefone:                '11999999999',
    cidade:                  'São Paulo',
    estado:                  'SP',
    interesse:               'cozinha, quarto',
    expectativa_investimento: '50-100k',
    mensagem:                'Quero reformar a cozinha e o quarto do casal.',
    // Tracking (preencha manualmente se não usar o snippet)
    utm_source:   'google',
    utm_medium:   'cpc',
    utm_campaign: 'moveis-planejados-sp',
    landing_page: window.location.href,
    referrer:     document.referrer
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## Perguntas Frequentes

**O formulário pode estar em qualquer domínio?**  
Sim. A API aceita requisições de qualquer origem (CORS liberado).

**Preciso de SSL/HTTPS na LP?**  
Não é obrigatório para a integração funcionar, mas é fortemente recomendado para não bloquear chamadas `fetch` em navegadores modernos.

**O que acontece após o envio?**  
O lead é criado no CRM, recebe uma pontuação automática (0–100) e a loja é notificada por e-mail imediatamente.

**Posso testar com dados fictícios?**  
Sim. Use e-mails como `teste@agencia.com` — os leads aparecem no painel e podem ser excluídos pelo administrador.

**O endpoint muda?**  
Não, a menos que o administrador da loja solicite explicitamente a regeneração do token. Se isso acontecer, a agência receberá o novo endpoint para atualizar nas LPs.

---

*Dúvidas técnicas? Entre em contato com o time responsável pelo CRM.*
