# 🥗 Diet Tracker

Aplicação web *mobile-first* para registrar hábitos diários — dieta, atividade física, sono, estudo e refeições livres — e acompanhar a evolução por meio de relatórios e gráficos. Os dados são sincronizados com o **Firebase Realtime Database**, o que permite compartilhá-los com um(a) nutricionista, e podem ser exportados em CSV.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como executar](#como-executar)
- [Configuração do Firebase](#configuração-do-firebase)
- [Modelo de dados](#modelo-de-dados)
- [Regras de cálculo dos relatórios](#regras-de-cálculo-dos-relatórios)
- [Exportação CSV](#exportação-csv)
- [Deploy](#deploy)
- [Melhorias sugeridas](#melhorias-sugeridas)

## Funcionalidades

A interface tem três abas:

### ➕ Registrar

Formulário do registro diário:

| Campo | Opções |
|---|---|
| 📅 Data | Seletor de data (padrão: hoje) |
| 🥗 Dieta | Seguiu / não seguiu |
| 🏋️ Atividade física | Caminhada ou Musculação · 30 min, 45 min ou 1 h |
| 😴 Sono | `< 6h`, `6-8h` ou `> 8h` |
| 📚 Estudo | Sim/não · `< 2h`, `2-4h` ou `> 4h` |
| 🍔 Refeição livre | Sim/não · descrição livre do que foi comido |

Existe **um registro por data**: salvar em uma data que já tem registro substitui os valores anteriores.

### 📋 Histórico

Lista todos os registros, do mais recente para o mais antigo, com etiquetas coloridas por categoria. Cada registro pode ser excluído (há confirmação).

### 📊 Relatório

- **Período:** 7, 14, 30 ou 60 dias, ou todo o histórico.
- **Indicadores:** % de dias na dieta, com exercício, com sono adequado e com estudo; média de minutos de exercício; média de horas de estudo; refeições livres por semana; semanas dentro do limite.
- **Distribuições:** quantidade de dias em cada faixa de sono e de estudo.
- **Gráficos de barras** (com rolagem horizontal): sono por dia e minutos de exercício por dia.
- **Aderência às metas:** barras de progresso de dieta, sono ≥ 6h, exercício e estudo.
- **Refeições livres por semana:** últimas 6 semanas, com destaque quando o limite de 2 por semana é ultrapassado.
- **Exportação CSV**, com prévia dos 5 últimos registros.

### 🔄 Sincronização

Os dados são lidos do Firebase quando o app abre e também pelo botão 🔄. Toda gravação também é copiada para o `localStorage` do navegador. Se o Firebase estiver inacessível, o app usa essa cópia local e mostra o aviso "⚠️ Salvo localmente".

## Tecnologias

| Camada | Ferramenta |
|---|---|
| UI | [React 18](https://react.dev/) |
| Build / dev server | [Vite 4](https://vitejs.dev/) + `@vitejs/plugin-react` |
| Estilo | [Tailwind CSS 3](https://tailwindcss.com/) + PostCSS + Autoprefixer |
| Gráficos | [Recharts 2](https://recharts.org/) |
| Persistência | [Firebase Realtime Database](https://firebase.google.com/docs/database) (API REST via `fetch`) + `localStorage` |

Não há SDK do Firebase nem backend próprio: o app se comunica diretamente com o endpoint REST do banco.

## Estrutura do projeto

```
diet-tracker/
├── index.html           # HTML de entrada (meta tags para uso mobile / tela inicial do iOS)
├── package.json         # Dependências e scripts
├── vite.config.js       # Configuração do Vite (plugin React)
├── tailwind.config.js   # Arquivos analisados pelo Tailwind
├── postcss.config.js    # Plugins PostCSS (Tailwind + Autoprefixer)
└── src/
    ├── main.jsx         # Ponto de entrada do React
    ├── App.jsx          # Aplicação inteira: Firebase, estado, cálculos e as 3 telas
    └── index.css        # Diretivas do Tailwind e estilos globais (tema escuro)
```

## Como executar

**Pré-requisitos:** Node.js 18 ou superior e npm.

```bash
# instalar as dependências
npm install

# servidor de desenvolvimento (http://localhost:5173)
npm run dev

# build de produção (gera a pasta dist/)
npm run build

# servir o build localmente para conferência
npm run preview
```

Para abrir no celular durante o desenvolvimento, use `npm run dev -- --host` e acesse o IP da máquina pela rede local.

## Configuração do Firebase

A configuração fica em constantes no início de `src/App.jsx`:

```js
const FIREBASE_DATABASE_URL = "https://<seu-projeto>-default-rtdb.firebaseio.com";
const USER_ID = "<seu-id>";
```

Para usar o seu próprio banco:

1. Crie um projeto no [console do Firebase](https://console.firebase.google.com/) e ative o **Realtime Database**.
2. Copie a URL do banco para `FIREBASE_DATABASE_URL`.
3. Defina um `USER_ID`. Quem usar o mesmo ID (por exemplo, o(a) nutricionista) verá os mesmos dados.

Os registros ficam em `/users/{USER_ID}/entries/{id}`.

> ⚠️ **Atenção à segurança:** as requisições são feitas **sem autenticação**. Para o app funcionar, as regras do banco precisam permitir leitura e escrita públicas nesse caminho. Isso significa que qualquer pessoa que descubra a URL e o `USER_ID` pode ler, alterar ou apagar os dados. Veja [Melhorias sugeridas](#melhorias-sugeridas).

## Modelo de dados

Exemplo de registro:

```json
{
  "id": "2026-01-10-1736557200000",
  "date": "2026-01-10",
  "diet": true,
  "exercise": "Musculação",
  "exerciseMinutes": 60,
  "sleepCategory": "6-8h",
  "sleepOk": true,
  "cheatMeal": true,
  "cheatMealDesc": "Pizza",
  "studied": true,
  "studyHours": "2-4h",
  "updatedAt": "2026-01-10T22:00:00.000Z"
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | `{data}-{timestamp}`; é também a chave no Firebase |
| `date` | string | Data no formato `AAAA-MM-DD` |
| `diet` | boolean | Seguiu a dieta |
| `exercise` | string \| null | `Caminhada`, `Musculação` ou `null` |
| `exerciseMinutes` | number | `0`, `30`, `45` ou `60` |
| `sleepCategory` | string | `<6h`, `6-8h`, `>8h` ou vazio |
| `sleepOk` | boolean | `true` se o sono foi `6-8h` ou `>8h` |
| `cheatMeal` | boolean | Teve refeição livre |
| `cheatMealDesc` | string \| null | Descrição da refeição livre |
| `studied` | boolean | Estudou no dia |
| `studyHours` | string \| null | `<2h`, `2-4h` ou `>4h` |
| `updatedAt` | string | Data e hora (ISO 8601) da última gravação |

## Regras de cálculo dos relatórios

- **Dia com exercício:** `exerciseMinutes > 0`.
- **Média de exercício:** considera apenas os dias com exercício.
- **Sono adequado:** faixa `6-8h` ou `>8h`.
- **Média de estudo:** faixas convertidas em horas aproximadas (`<2h` → 1, `2-4h` → 3, `>4h` → 5), considerando só os dias com estudo.
- **Semanas:** começam no domingo. Uma semana fica "OK" quando tem **no máximo 2** refeições livres. Só entram na conta as semanas que têm algum registro.

## Exportação CSV

O botão **📥 Exportar CSV** baixa os registros do período selecionado no arquivo `dieta_{USER_ID}_{AAAA-MM-DD}.csv`, com as colunas:

`Data, Dieta, Exercício, Minutos, Sono, Estudou, Horas Estudo, Cheat Meal, Descrição`

O arquivo é gerado em UTF-8 com BOM, para que os acentos apareçam corretamente no Excel.

## Deploy

`npm run build` gera um site estático em `dist/`, que pode ser publicado em qualquer hospedagem estática (Firebase Hosting, Vercel, Netlify, GitHub Pages etc.). Se o app for servido em um subcaminho (por exemplo, `usuario.github.io/diet-tracker/`), configure a opção [`base`](https://vitejs.dev/config/shared-options.html#base) no `vite.config.js`.

## Melhorias sugeridas

Pontos identificados na análise do código, em ordem de prioridade.

### 🔴 Segurança e integridade dos dados

- [ ] **Banco sem autenticação.** Adotar o Firebase Authentication (login com Google ou anônimo) e restringir as regras para que cada usuário acesse só `users/$uid`. Para o(a) nutricionista, conceder acesso somente de leitura.
- [ ] **Cada gravação sobrescreve a coleção inteira.** `firebaseDB.save` envia todos os registros com `PUT` em `/entries`. Se o carregamento inicial falhar e o app usar uma cópia local desatualizada, ou se dois dispositivos estiverem abertos ao mesmo tempo, a próxima gravação apaga da nuvem o que não estava em memória. A solução é gravar e excluir registro por registro (`PUT`/`DELETE` em `/entries/{id}.json`), usando a data como chave.
- [ ] **Configuração fixa no código.** Mover a URL e o ID para variáveis de ambiente (`VITE_FIREBASE_DATABASE_URL`, `VITE_USER_ID`) em um `.env` fora do Git. Isso facilita trocar de banco, mas não protege os valores, que continuam visíveis no bundle; a proteção real vem das regras do banco.

### 🟠 Bugs

- [ ] **Data padrão em UTC.** `new Date().toISOString()` usa UTC, então depois das 21h no horário de Brasília o formulário já mostra o dia seguinte. O mesmo acontece no nome do arquivo CSV. Usar a data local resolve.
- [ ] **Sono não informado aparece como "> 8h"** no gráfico "Sono por Dia": qualquer valor diferente de `<6h` e `6-8h` vira 9.
- [ ] **Desmarcar o tipo de exercício não zera a duração.** O registro é salvo com minutos mas sem tipo e é contado como dia de exercício.
- [ ] **O CSV não escapa aspas.** Uma descrição com `"` quebra as colunas do arquivo.
- [ ] **O filtro "7d" mostra 8 dias** (hoje e os 7 anteriores); o mesmo vale para os outros períodos.
- [ ] **Salvar em uma data já registrada substitui os dados sem aviso**, e o formulário não carrega o registro existente para edição.
- [ ] **A exclusão não informa falha de sincronização** (o resultado de `save` é ignorado em `deleteEntry`).
- [ ] **Favicon inexistente:** o `index.html` aponta para `/vite.svg`, mas não há pasta `public/`.

### 🟡 Qualidade de código

- [ ] Dividir o `App.jsx` (~800 linhas) em componentes (`EntryForm`, `History`, `Report`, `StatCard`, `DailyBarChart`), em um hook (`useEntries`) e em utilitários (`stats.js`, `csv.js`, `firebase.js`).
- [ ] Centralizar constantes e regras de negócio (limite de 2 refeições livres, opções de exercício, sono e estudo) em um único módulo.
- [ ] Remover a configuração duplicada dos dois gráficos (eixos, tooltip, formatação de datas).
- [ ] Adicionar testes com [Vitest](https://vitest.dev/) para os cálculos de estatísticas, o agrupamento semanal e a geração do CSV.
- [ ] Configurar ESLint e Prettier; avaliar a migração para TypeScript.

### 🔵 Infraestrutura

- [ ] Criar um `.gitignore` (`node_modules/`, `dist/`, `.env`).
- [ ] Versionar o `package-lock.json` para ter instalações reproduzíveis.
- [ ] Adicionar `"type": "module"` ao `package.json`, que elimina o aviso do Node ao carregar `postcss.config.js` e `tailwind.config.js`.
- [ ] Atualizar as dependências, que estão com versões *major* defasadas (Vite 4 → 8, React 18 → 19, Recharts 2 → 3, Tailwind 3 → 4). O `npm audit` aponta 9 vulnerabilidades (3 moderadas e 6 altas), todas em ferramentas de desenvolvimento (Vite e dependências do Tailwind). Elas não entram no bundle final.
- [ ] Reduzir o bundle de produção (~540 kB, ~155 kB com gzip, a maior parte do Recharts) carregando a tela de relatório sob demanda (`React.lazy`).
- [ ] Criar um pipeline de CI (GitHub Actions) com build, lint e testes a cada push.

### 🟢 Experiência de uso e acessibilidade

- [ ] Remover `maximum-scale=1.0, user-scalable=no` do `index.html`, que impede o zoom.
- [ ] Trocar as `<div onClick>` dos interruptores por `<button role="switch" aria-checked>` e adicionar `aria-label` aos botões que só têm ícone (🔄, 🗑️ e as abas no celular).
- [ ] Transformar o app em PWA (manifest e service worker, por exemplo com `vite-plugin-pwa`), para instalá-lo na tela inicial e usá-lo offline.
- [ ] Criar uma visão somente leitura para o(a) nutricionista e permitir configurar as metas (limite de refeições livres, sono mínimo etc.).

## Licença

Ainda não definida.
