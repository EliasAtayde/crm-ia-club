# Comece aqui — CRM IA Club

Este é o CRM que eu indico e uso com os alunos da Mentoria. Não é teoria: é um sistema
completo de vendas pelo WhatsApp, com Kanban, automações e agente de IA — rodando no
seu próprio servidor, com os seus dados sob o seu controle.

Sem mensalidade de software. Sem funcionalidade travada. Você paga só a infraestrutura.

> Construído sobre o [DeskcommCRM](https://github.com/melgarafael/DeskcommCRM),
> projeto open source brasileiro (licença MIT). Esta versão é a curadoria IA Club:
> o caminho de instalação que eu testei, com as configurações que eu recomendo.

---

## O que você vai ter no final

- **Caixa de entrada do WhatsApp** — todos os atendimentos num lugar só, em tempo real.
- **Kanban de vendas** — seu funil visual: arrasta o card, fecha o negócio.
- **Agente de IA** — atende, qualifica e move leads sozinho. Passa pra você quando precisa.
- **Automações** — chegou lead do formulário → tag → mensagem de boas-vindas. Sem código.
- **Captação de leads** — conecta landing page, formulário ou Zapier direto no funil.

## O que você precisa (e quanto custa)

| Item | Custo | Pra quê |
|---|---|---|
| VPS (servidor virtual) | a partir de ~R$ 40/mês | Onde o CRM roda. Datacenter no Brasil |
| Conta Supabase | grátis pra começar | Banco de dados e login |
| WAHA Plus | US$ 19/mês | Conexão com o WhatsApp |
| Chave de IA (Anthropic) | por uso | O cérebro do agente de IA |

Total realista pra começar: **~R$ 150–200/mês**. Compare com o plano de qualquer
CRM fechado com IA e WhatsApp — e aqui os dados são seus.

## Antes de decidir: leia isto sobre o WhatsApp

A conexão de WhatsApp deste CRM usa uma tecnologia não-oficial (a mesma categoria
usada pela maioria das ferramentas de atendimento no Brasil). Funciona bem, mas
**existe risco real de banimento do número** se o uso fugir de um padrão humano.
O sistema já vem com proteções (ritmo de envio, janela de horário, detecção de "pare"),
e mesmo assim a regra é:

1. **Use um número dedicado ao CRM** — nunca o seu número pessoal.
2. Aqueça o número: comece devagar, aumente o volume aos poucos.
3. Responda quem te chamou. Disparo em massa frio é o caminho mais rápido pro ban.

Existe a API oficial do WhatsApp (da própria Meta), sem risco de banimento — mas ela
cobra por conversa, exige aprovação de modelos de mensagem e não está integrada a
este CRM hoje. A arquitetura do projeto já prevê essa troca no futuro. Enquanto isso:
número dedicado e uso responsável.

## Instalação

### Etapa 1 — Criar as contas (30 min, grátis)

1. **Supabase** — crie conta em [supabase.com](https://supabase.com), crie um projeto
   e guarde as 3 chaves (o guia técnico em `docs/SETUP.md` mostra onde ficam).
2. **Anthropic** — crie conta em [console.anthropic.com](https://console.anthropic.com)
   e gere uma chave de API.
3. **WAHA Plus** — assine em [waha.devlikeapro.com](https://waha.devlikeapro.com).

### Etapa 2 — Contratar a VPS e instalar (1 comando)

Contrate uma VPS com Ubuntu (4 GB de RAM, datacenter Brasil). Depois, conectada na VPS:

```bash
git clone https://github.com/IACLUBCOMUNIDADE/crm-ia-club.git crm && cd crm && bash hostgator-setup-kit/install.sh
```

O instalador pergunta o que precisa (domínio, chaves que você criou na Etapa 1),
cria o banco, sobe o CRM e te ajuda a conectar o WhatsApp escaneando um QR code.

### Etapa 3 — Configurar o seu negócio (15 min)

1. Entre no CRM, crie sua conta de administrador.
2. Monte seu funil no Kanban com o vocabulário do seu nicho.
3. Crie o agente de IA e alimente a base de conhecimento com as perguntas
   que seus clientes mais fazem.
4. Ligue as automações — elas nascem pausadas até você revisar e ativar.

## Configurações que eu recomendo (IA Club)

No arquivo `.env` da sua instalação:

```bash
# Seus erros técnicos ficam só com você (por padrão iriam pro servidor do autor do projeto)
SENTRY_DSN=off

# A marca do SEU negócio na tela, sem mexer em código
APP_NAME=Sua Empresa
APP_LOGO_URL=https://link-do-seu-logo.png
```

## Um aviso sério sobre dados (LGPD)

O CRM roda no seu servidor — isso significa que **você é o controlador** dos dados
dos seus clientes, com as responsabilidades legais disso. O lado bom: com o servidor
no Brasil, você não faz transferência internacional de dados, o que simplifica sua
conformidade. O sistema já traz exportação, anonimização e trilha de auditoria prontas.

## Precisa de ajuda?

- **Alunos da Mentoria IA Club**: traga na sessão ao vivo ou poste no Discord da comunidade.
- Documentação técnica completa: [`docs/SETUP.md`](docs/SETUP.md) (passo a passo de cada chave).
- Problemas do produto em si: [issues do projeto original](https://github.com/melgarafael/DeskcommCRM/issues).

---

## Créditos

Este repositório é uma distribuição do [DeskcommCRM](https://github.com/melgarafael/DeskcommCRM),
criado por Rafael Melga e mantido pela comunidade, sob licença MIT. O mérito da
engenharia é dele e da comunidade do projeto. A curadoria, o caminho de instalação
e as recomendações desta versão são do IA Club — Allessandra Sinisgalli.

*Não ensino teoria — construo junto com você.*
