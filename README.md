# Rotina PM RR

Site de acompanhamento de estudos para o concurso da PM RR. Uso pessoal.

- Sem build: arquivos estáticos (HTML, CSS e JavaScript).
- Os dados ficam no navegador (localStorage) **e** na nuvem (Supabase), com login por e-mail e senha.
- Funciona offline; as alterações feitas sem internet são enviadas quando a conexão volta.
- Pode ser instalado no celular.

## 1. Configurar o Supabase

1. Em https://supabase.com crie um projeto (plano Free).
2. Abra **SQL Editor > New query**, cole o conteúdo de `supabase.sql` e clique em **Run**. Isso cria a tabela `tracker` com RLS: cada usuário só enxerga a própria linha.
3. Em **Project Settings > API** copie a **Project URL** e a **anon public key** e cole em `config.js`. A anon key é pública por desenho; a proteção é a RLS.
4. (Opcional) Em **Authentication > Providers > Email**, desligue **Confirm email** se não quiser confirmar por e-mail. Depois de criar sua conta, desligue **Allow new users to sign up** em **Authentication > Sign In / Providers** para ninguém mais criar conta.
5. Em **Authentication > URL Configuration**, ponha o endereço da Vercel em **Site URL** (usado nos e-mails de confirmação).

## 2. Publicar na Vercel

Pelo GitHub: suba esta pasta num repositório, importe em https://vercel.com (Add New > Project), deixe **Framework Preset = Other**, sem Build Command, e clique em **Deploy**.

Ou pela linha de comando, dentro da pasta (precisa de Node.js):

    npx vercel
    npx vercel --prod

## 3. Primeiro uso

Abra o site, vá em **Dados**, clique em **Criar conta** e depois **Entrar**. Se você já tinha dados neste navegador, eles sobem para a nuvem. Em outro aparelho, é só entrar com a mesma conta.

## Como a sincronização funciona

- Cada alteração é salva localmente na hora e enviada ao Supabase após ~1,5 s.
- Ao entrar ou voltar para a aba, o app compara o carimbo `updatedAt` local com o da nuvem; vale o mais novo (a cópia inteira, não campo a campo). Evite editar em dois aparelhos ao mesmo tempo sem internet.
- **Apagar todos os dados** também apaga na nuvem.
- O backup em arquivo JSON (aba Dados) continua disponível.

## Rotina

A aba **Rotina** é um checklist diário de hábitos (acordar antes das 5:10, AEJ, família, trabalho às 8:10, treino às 16h, cardio, estudos às 18h e cama às 22:30). Marque os que fez em cada dia; a sequência conta os dias com todos os hábitos feitos. A lista fica em `ROTINA` no `app.js` e as marcas sincronizam com a conta junto do resto dos dados.

## Pomodoro

O botão **Iniciar** de cada bloco abre a tela do Pomodoro: foco, pausa curta e pausa longa depois de alguns focos. Só o tempo de foco entra em "cronometrados" do bloco; as pausas não contam. Ao fim de cada fase o app avisa (som e vibração) e espera você tocar em Iniciar para a próxima. **Voltar ao app** minimiza a tela sem parar o cronômetro (a pílula no topo mostra o tempo e reabre a tela). Em **Ajustes** ficam as durações, os focos até a pausa longa, o som e a vibração; a última configuração fica salva na conta e vale em todos os aparelhos. A vibração só funciona no Android.

## Como o site conta a sequência

Um dia entra na sequência quando você cumpre pelo menos 75% das horas planejadas. Folga não quebra a sequência nem soma. Para mudar, edite `STREAK_MIN` no início do `app.js`.

## Como mudar a rotina

O plano semanal está em `PLAN` no `app.js`; os tópicos de Matemática em `MATH`. A data de início pode ser mudada em **Dados**.

## Ao publicar mudanças

Se a versão antiga aparecer, aumente o número em `CACHE` no `sw.js` (por exemplo `pmrr-tracker-v3`).
