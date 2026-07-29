# Implante este CRM com o Claude Code

Você não precisa ser técnico. Abra o **Claude Code** na pasta onde clonou este
repositório, cole o prompt abaixo inteiro e deixe a IA trabalhar. Ela vai pedir
uma ou outra confirmação — leia e responda. Em ~30–60 min você terá o CRM
rodando no seu computador para testar com seus dados.

> Produção de verdade (WhatsApp 24/7) roda numa VPS — roteiro em
> [COMECE-AQUI.md](COMECE-AQUI.md). Este prompt é o test-drive local.

---

## O prompt (copie tudo daqui para baixo)

```
Você vai implantar o DeskcommCRM (este repositório) LOCALMENTE nesta máquina
para eu testar com meus dados reais. Trabalhe de forma autônoma e me avise
quando precisar de algo que só eu posso fazer. Siga este roteiro, que já foi
validado — ele evita as armadilhas conhecidas:

1. FERRAMENTAS: garanta node 22+, pnpm, supabase CLI e um runtime Docker.
   - macOS sem Docker Desktop: use colima (brew install colima docker) e
     `colima start --cpu 4 --memory 6`.
   - Windows: use WSL2 + Docker.
   - Confira espaço em disco antes (mínimo 15 GB livres).

2. BANCO: suba o Supabase local (`supabase start` na raiz do repo).
   ATENÇÃO — NÃO use as migrations de supabase/migrations (quebram em banco
   novo). O caminho certo é o do instalador oficial:
   a) crie as extensões: vector, citext e pg_trgm no schema public;
   b) aplique `supabase/baseline.sql` com ON_ERROR_STOP=1 via psql no
      container do Postgres local.
   Sucesso = ~94 tabelas no schema public.

3. CONFIGURAÇÃO: crie .env.local com:
   - chaves do supabase local (URL, anon, service_role, DB_URL do `supabase status`)
   - segredos gerados localmente (INTERNAL_SECRET e as 4 chaves de criptografia
     do .env.example, via openssl rand)
   - SENTRY_DSN=off  (privacidade: sem telemetria)
   - AGENT_DISPATCH_CONSUMER=native e EVENT_LOG_WORKER_ENABLED=false
   - APP_NAME com o nome do MEU negócio (pergunte para mim)

4. USUÁRIO: crie meu login admin com scripts/create-test-user.ts usando o MEU
   email (pergunte). A senha me entregue no final. O 2FA eu configuro no
   primeiro acesso com meu app autenticador.

5. SUBA O APP: `pnpm dev` e confirme /api/v1/health com supabase ok.

6. WHATSAPP (opcional agora, recomendado): suba o WAHA grátis em Docker.
   - Mac Apple Silicon: imagem devlikeapro/waha:arm; Intel/VPS: devlikeapro/waha.
   - Use o motor GOWS (WHATSAPP_DEFAULT_ENGINE=GOWS) — em jul/2026 o NOWEB
     está rejeitado pela Meta e o WEBJS tem bug de renovação de QR.
   - WAHA_API_KEY em texto puro (na versão grátis o hash SHA512 não vale).
   - Webhook: http://host.docker.internal:3000/api/v1/webhooks/waha
   - Me mostre a tela Conexões para eu escanear o QR (o código vence em ~1 min;
     se vencer, gere outro).
   - AVISO que você deve me dar: conexão não-oficial tem risco de banimento;
     ideal usar número dedicado, nunca disparar em massa.

7. MOTOR DE AUTOMAÇÕES: rode em background um loop que chama a cada 60s a
   rota /api/v1/cron/event-log-drain com Authorization: Bearer INTERNAL_SECRET
   — sem isso, automações e agente não executam.

8. MEU FUNIL: pergunte meu nicho e crie um pipeline com estágios e vocabulário
   do meu negócio + uma fonte de captação (webhook) apontando pra ele. Me
   entregue a URL de captação e teste com um POST de exemplo.

9. AGENTE DE IA: edite o agente padrão com um system_prompt sobre o MEU
   negócio (pergunte: o que vendo, para quem, tom de voz, o que o agente NUNCA
   pode fazer). Regras mínimas: não inventar preço, transferir para humano em
   cobrança/reclamação, respeitar quem pede para parar. A chave da Anthropic
   EU colo na tela Agentes IA → Credenciais (nunca peça para eu te enviar).

10. ENTREGA FINAL: me passe um resumo com — endereço do CRM, meu login, o que
    está ligado, o que falta (chaves que só eu colo), e como ligar/desligar
    tudo. Crie scripts de ligar/desligar para eu não depender de terminal.
```

---

## Depois do test-drive

- Guia de produção (VPS, domínio, WhatsApp 24/7): [COMECE-AQUI.md](COMECE-AQUI.md)
- Dúvidas do produto: [docs/SETUP.md](docs/SETUP.md) e issues do projeto original
