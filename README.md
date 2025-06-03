# 🧠 Psicoterapia de Bolso (PsicoBolso)

[![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

**PsicoBolso** é um aplicativo web de código aberto projetado para ser um confidente digital e uma ferramenta de apoio ao bem-estar emocional. Utilizando Inteligência Artificial (Google Gemini), o app oferece um espaço seguro para conversas terapêuticas, registro de sentimentos, e acesso a técnicas de bem-estar baseadas em psicologia.

Este projeto é uma demonstração de como a tecnologia pode ser usada para criar ferramentas acessíveis de suporte à saúde mental, sem substituir o valor insubstituível da terapia profissional.

![Captura de Tela do PsicoBolso](show.gif)

## 📜 Descrição Geral

O "Psicoterapia de Bolso" é um chatbot terapêutico que visa fornecer:
*   **Suporte Emocional:** Um espaço para desabafar e ser ouvido com empatia.
*   **Estratégias de Bem-Estar:** Sugestões práticas baseadas em técnicas como Terapia Cognitivo-Comportamental (TCC) e Mindfulness.
*   **Autoconhecimento:** Uma ferramenta para registrar e visualizar padrões de humor e sentimentos ao longo do tempo.

> **⚠️ Aviso Importante:** Este aplicativo é uma ferramenta de suporte e **não substitui** a consulta, diagnóstico ou tratamento com um psicólogo, psiquiatra ou qualquer outro profissional de saúde mental qualificado. Em caso de crise ou sofrimento intenso, procure ajuda profissional imediatamente.

## ✨ Funcionalidades Principais

O aplicativo é dividido em quatro seções principais:

### 1. 💬 Chat Terapêutico (IA)
*   **Dois Modos de Conversa:** O usuário pode escolher entre "Desabafar" (foco em escuta ativa e validação) ou "Buscar Soluções" (foco em estratégias e técnicas).
*   **Inteligência Artificial Empática:** Utiliza a API do Google Gemini para oferecer respostas contextuais, empáticas e reflexivas.
*   **Histórico de Conversas:** Salva as últimas 10 conversas no `localStorage`, permitindo que o usuário as reveja ou continue de onde parou.
*   **Privacidade:** O histórico é armazenado localmente no dispositivo do usuário.

### 2. 📓 Diário Emocional
*   **Registro de Humor:** Selecione um emoji que represente seu humor e descreva seus sentimentos e os eventos do dia.
*   **Edição e Exclusão:** Controle total sobre os registros, permitindo editar ou excluir entradas a qualquer momento.
*   **Filtros:** Visualize seus registros por mês e ano.
*   **Gráfico de Humor:** Um gráfico de barras simples mostra a contagem de cada emoção registrada no período filtrado, ajudando a identificar padrões.

### 3. 🧘 Técnicas de Bem-Estar
*   Uma biblioteca de técnicas rápidas e práticas para momentos de ansiedade, tristeza ou sobrecarga, incluindo:
    *   Respiração Diafragmática
    *   Mindfulness de 5 Sentidos
    *   Reestruturação Cognitiva
    *   Exercício de Gratidão
    *   E outras.

### 4. ℹ️ Sobre
*   Uma seção informativa que detalha o propósito do projeto, reforça a importância da terapia profissional, e explica a política de privacidade e o uso de dados.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído inteiramente com tecnologias front-end, tornando-o fácil de executar e hospedar.

*   **HTML5:** Para a estrutura semântica do conteúdo.
*   **CSS3:** Para estilização, layout (Flexbox e Grid), tema escuro e responsividade.
*   **JavaScript (ES6+):** Para toda a lógica do aplicativo, manipulação do DOM, e interações.
*   **API do Google Gemini:** O cérebro por trás do chatbot terapêutico.
*   **Chart.js:** Biblioteca para a criação dos gráficos de humor.
*   **Font Awesome:** Para os ícones utilizados na interface.
*   **Google Fonts:** Para a tipografia (Poppins e Lora).
*   **LocalStorage:** Para persistência de dados do diário e histórico de conversas no navegador do usuário.

## 🚀 Como Executar o Projeto Localmente

Para executar o PsicoBolso em sua máquina local, siga estes passos:

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/psicoterapia-de-bolso.git
    cd psicoterapia-de-bolso
    ```

2.  **Obtenha uma Chave de API do Google Gemini:**
    *   Acesse o [Google AI Studio](https://aistudio.google.com/).
    *   Clique em "Get API key" ou diretamente [aqui](https://aistudio.google.com/apikey).
    *   Clique em "Criar chave de API" para gerar sua chave.
    *   Crie um novo projeto ou use um existente.

3.  **Configure a Chave de API no Projeto:**
    *   Abra o arquivo `script.js`.
    *   Encontre a seguinte linha no topo do arquivo:
        ```javascript
        const GEMINI_API_KEY = 'SUA_CHAVE_API_GEMINI_AQUI';
        ```
    *   Substitua `'SUA_CHAVE_API_GEMINI_AQUI'` pela sua chave de API real.

4.  **Abra o `index.html`:**
    *   Simplesmente abra o arquivo `index.html` em seu navegador de preferência (Google Chrome, Firefox, etc.). Não é necessário um servidor local, mas pode ser útil usar uma extensão como o "Live Server" no VS Code.

## 🌐 Demonstração da Plataforma

Você pode explorar a plataforma sem configurar sua própria API através do [GitHub Pages](https://avrilstihler.github.io/psicoterapia-de-bolso/).  

> **Observação:** A funcionalidade de chat e conversa com a IA **não estará disponível** nesta versão de demonstração, pois requer uma chave de API configurada.


## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE.md) para mais detalhes.
