# PrecificaPro

![PrecificaPro](<img width="1168" height="859" alt="image" src="https://github.com/user-attachments/assets/e8495cd2-fceb-4a37-91ac-4cf4f857c48f" />)


## Sistema de Geração de Listas de Preços Personalizadas

PrecificaPro é uma aplicação web moderna para empresas que precisam gerenciar produtos e criar listas de preços personalizadas para compartilhar com clientes. Desenvolvida com tecnologias modernas, a plataforma oferece uma interface intuitiva e recursos poderosos para gestão de catálogos de produtos.

## Funcionalidades Principais

### 1. Gestão de Empresas
- Cadastro de informações da empresa
- Upload de logotipo
- Gerenciamento de dados de contato

### 2. Gestão de Produtos
- Cadastro completo de produtos com descrições, tipos e valores
- Categorização por tipo (Pote, Blister, Frasco)
- Informações de fabricante (União Flora, Force Sens)
- Upload de fotos dos produtos
- Especificação de porções/quantidades

### 3. Listas de Preços
- Criação de múltiplas listas de preços personalizadas
- Aplicação de descontos por porcentagem ou valor fixo
- Ajuste individual de preços por produto
- Compartilhamento de listas via links públicos
- Interface de visualização otimizada para clientes

### 4. Exportação e Impressão
- Impressão direta das listas de preços
- Visualização otimizada para impressão

## Tecnologias Utilizadas

### Frontend
- React 19
- TypeScript
- TailwindCSS para estilização
- React Router para navegação
- Lucide React para ícones

### Backend
- Cloudflare Workers (serverless)
- Hono.js para API REST
- D1 (SQLite) para banco de dados
- Zod para validação de dados

### Autenticação
- Integração com Google OAuth via Mocha Users Service

### Ferramentas de Desenvolvimento
- Vite para desenvolvimento e build
- ESLint para linting
- TypeScript para tipagem estática
- Wrangler para deploy no Cloudflare Workers

## Estrutura do Projeto

```
├── migrations/           # Migrações do banco de dados D1
├── src/
│   ├── react-app/        # Aplicação frontend React
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── hooks/        # Hooks personalizados
│   │   ├── pages/        # Páginas da aplicação
│   │   └── main.tsx      # Ponto de entrada do React
│   ├── shared/           # Código compartilhado entre frontend e backend
│   │   └── types.ts      # Tipos e schemas de validação
│   └── worker/           # Backend Cloudflare Worker
│       └── index.ts      # API e rotas do backend
```

## Instalação e Execução

### Pré-requisitos
- Node.js (versão recomendada: 18+)
- npm ou yarn
- Conta Cloudflare (para deploy)

### Configuração do Ambiente de Desenvolvimento

1. Clone o repositório
   ```bash
   git clone https://github.com/78douglas/precificapro.git
   cd precificapro
   ```

2. Instale as dependências
   ```bash
   npm install
   ```

3. Execute o ambiente de desenvolvimento
   ```bash
   npm run dev
   ```

4. Acesse a aplicação em `http://localhost:5173`

### Deploy

1. Faça o build da aplicação
   ```bash
   npm run build
   ```

2. Deploy para Cloudflare Workers
   ```bash
   npm run check
   wrangler deploy
   ```

## Banco de Dados

O PrecificaPro utiliza o Cloudflare D1 (SQLite) como banco de dados. A estrutura inclui as seguintes tabelas:

- `companies`: Informações das empresas cadastradas
- `products`: Catálogo de produtos
- `price_lists`: Listas de preços criadas
- `price_list_items`: Itens individuais de cada lista de preços

## Licença

Este projeto é propriedade de PrecificaPro. Todos os direitos reservados.

## Contato

Para mais informações, entre em contato através do email: 78douglas@gmail.com

---

Desenvolvido por [Douglas](https://github.com/78douglas)
