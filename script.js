document.addEventListener('DOMContentLoaded', () => {
    const GEMINI_API_KEY = 'SUA_CHAVE_API_GEMINI_AQUI';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    const preChatSection = document.getElementById('preChatSection');
    const initialFeelingEl = document.getElementById('initialFeeling');
    const conversationGoalEl = document.getElementById('conversationGoal');
    const startChatBtn = document.getElementById('startChatBtn');
    const chatModeInfoEl = document.getElementById('chatModeInfo');
    const previousChatsListEl = document.getElementById('previousChatsList');
    const clearAllChatsBtn = document.getElementById('clearAllChatsBtn');

    const chatSection = document.getElementById('chatSection');
    const chatHistoryEl = document.getElementById('chatHistory');
    const userInputEl = document.getElementById('userInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const backToPreChatBtn = document.getElementById('backToPreChatBtn');
    
    let conversationHistory = [];
    let currentChatMode = '';
    let allSavedChats = JSON.parse(localStorage.getItem('allPsicoBolsoChats_v3')) || []; // Nova chave para teste limpo
    let isViewingChatHistoryMode = false; 
    let currentChatSessionId = null; // ID para a sessão de chat ATUAL (nova ou carregada)

    // --- Diário Emocional (variáveis como antes) ---
    const moodEmojisContainer = document.getElementById('moodEmojis');
    const selectedMoodEl = document.getElementById('selectedMood');
    const diaryTextEl = document.getElementById('diaryText');
    const saveDiaryEntryBtn = document.getElementById('saveDiaryEntryBtn');
    const diaryLogEntriesEl = document.getElementById('diaryLogEntries');
    const filterMonthEl = document.getElementById('filterMonth');
    const filterYearEl = document.getElementById('filterYear');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const moodBarChartCanvas = document.getElementById('moodBarChart');
    const statsPeriodEl = document.getElementById('statsPeriod');
    let moodBarChart;
    let diaryEntries = JSON.parse(localStorage.getItem('diaryEntriesPB_dark_v2')) || [];
    const editingEntryIdEl = document.getElementById('editingEntryId');
    const diaryFormTitleEl = document.getElementById('diaryFormTitle');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    let currentEditingDiaryEntryId = null;
    const moodOptions = [ /* ... (sem alterações) ... */ 
        { mood: 'feliz', emoji: '😊', color: '#FFD700' },
        { mood: 'contente', emoji: '🙂', color: '#90EE90' },
        { mood: 'neutro', emoji: '😐', color: '#B0BEC5' },
        { mood: 'ansioso', emoji: '😟', color: '#82B1FF' },
        { mood: 'triste', emoji: '😢', color: '#78909C' },
        { mood: 'irritado', emoji: '😠', color: '#FF7043' },
        { mood: 'cansado', emoji: '😩', color: '#CFD8DC' }
    ];

    function populateMoodEmojis() { /* ... (sem alterações) ... */ 
        moodEmojisContainer.innerHTML = '';
        moodOptions.forEach(opt => {
            const button = document.createElement('button');
            button.setAttribute('type', 'button');
            button.dataset.mood = opt.mood;
            button.title = opt.mood.charAt(0).toUpperCase() + opt.mood.slice(1);
            button.textContent = opt.emoji;
            button.addEventListener('click', () => {
                moodEmojisContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                selectedMoodEl.value = opt.mood;
            });
            moodEmojisContainer.appendChild(button);
        });
    }

    function setActiveSection(sectionId) {
        // A lógica de salvar o chat será tratada mais explicitamente nos pontos de saída do chat.
        // Aqui, apenas gerenciamos a flag isViewingChatHistoryMode se estivermos saindo do chat.
        if (chatSection.classList.contains('active') && sectionId !== 'chatSection') {
            // Se estava visualizando e saiu do chat, reseta.
            // Se era uma conversa ativa, o saveCurrentChat já terá sido chamado pelo botão de voltar.
            isViewingChatHistoryMode = false;
            currentChatSessionId = null;
        }

        contentSections.forEach(section => section.classList.remove('active'));
        const targetSectionEl = document.getElementById(sectionId);
        if (targetSectionEl) {
            targetSectionEl.classList.add('active');
        }

        navItems.forEach(item => item.classList.remove('active'));
        const activeNavItem = Array.from(navItems).find(item => {
            const target = item.dataset.section;
            return ((target === 'preChatSection' || target === 'chatSection') && (sectionId === 'chatSection' || sectionId === 'preChatSection')) || target === sectionId;
        });
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        if (sectionId === 'diarySection') { /* ... (sem alterações) ... */ 
            exitDiaryEditMode(); 
            populateDiaryFilters();
            renderDiaryEntries(getFilteredDiaryEntries()); 
            renderMoodBarChart(getFilteredDiaryEntries()); 
        } else if (sectionId === 'preChatSection') { /* ... (sem alterações) ... */ 
            renderPreviousChatsList();
            initialFeelingEl.value = '';
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const clickedSectionId = item.dataset.section;
            // Se estiver na seção de chat e clicar em OUTRA aba (não preChat/chat), salvar a conversa atual.
            if (chatSection.classList.contains('active') && 
                clickedSectionId !== 'chatSection' && 
                clickedSectionId !== 'preChatSection' && 
                !isViewingChatHistoryMode) {
                saveCurrentChat();
            }
            setActiveSection(clickedSectionId);
        });
    });

    backToPreChatBtn.addEventListener('click', () => {
        // Salva a conversa ATIVA. Se estiver visualizando, não salva duplicado.
        // Se interagiu com uma visualizada, isViewingChatHistoryMode será false e currentChatSessionId estará setado.
        if (!isViewingChatHistoryMode || (isViewingChatHistoryMode && currentChatSessionId)) { // Salva se for nova ou se uma visualizada foi interagida
             if(!isViewingChatHistoryMode || (isViewingChatHistoryMode && conversationHistory.length > (allSavedChats.find(c=>c.id === currentChatSessionId)?.history.length || 0) )){
                saveCurrentChat();
             }
        }
        setActiveSection('preChatSection');
    });

    startChatBtn.addEventListener('click', () => {
        isViewingChatHistoryMode = false; 
        currentChatSessionId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); // Gera um ID para a NOVA sessão
        
        const feeling = initialFeelingEl.value.trim();
        currentChatMode = conversationGoalEl.value;

        if (!feeling) { /* ... (sem alterações) ... */ 
            alert("Por favor, descreva como você está se sentindo.");
            initialFeelingEl.focus();
            return;
        }

        chatHistoryEl.innerHTML = '';
        conversationHistory = [];

        let initialUserMessage = `Olá. Estou me sentindo ${feeling}. `;
        if (currentChatMode === 'desabafar') { /* ... (sem alterações) ... */ 
            initialUserMessage += "Gostaria de desabafar um pouco sobre isso.";
            chatModeInfoEl.textContent = "Desabafo e Escuta Ativa";
        } else { /* ... (sem alterações) ... */ 
            initialUserMessage += "Gostaria de explorar algumas estratégias ou soluções relacionadas a isso.";
            chatModeInfoEl.textContent = "Busca por Estratégias";
        }
        
        setActiveSection('chatSection');
        addMessageToChat(initialUserMessage, "user");
        conversationHistory.push({ role: "user", parts: [{ text: initialUserMessage }] });

        if (GEMINI_API_KEY !== 'SUA_CHAVE_API_GEMINI_AQUI') { /* ... (sem alterações) ... */ 
            getGeminiResponse(currentChatMode);
        } else { /* ... (sem alterações) ... */ 
             setTimeout(() => {
                addMessageToChat("Modo de demonstração: API Key não configurada. O chat não está funcional, mas você pode ver o fluxo.", "bot");
                conversationHistory.push({ role: "model", parts: [{ text: "Modo de demonstração ativado." }] });
            }, 100);
        }
    });

    function saveCurrentChat() {
        if (isViewingChatHistoryMode && !currentChatSessionId) { // Se está visualizando um histórico e NENHUMA interação ocorreu
            console.log("Não salvando: Apenas visualizando histórico sem interação.");
            return;
        }
        
        // Uma conversa significativa tem pelo menos a msg inicial do usuário e uma resposta do bot (ou a msg de demonstração)
        // Para a API, o conversationHistory que passamos pode ser curto inicialmente.
        // O que guardamos no `allSavedChats` é o `conversationHistory` da API.
        let meaningfulInteractionLength = 2; // user_msg_pre_chat + bot_response
        if (conversationHistory.length < meaningfulInteractionLength) {
            console.log("Não salvando: conversa muito curta para ser salva.");
            return;
        }

        const now = new Date();
        const chatIndex = allSavedChats.findIndex(chat => chat.id === currentChatSessionId);

        if (chatIndex > -1) { // Atualiza chat existente (se currentChatSessionId foi de um carregado e houve interação)
            // Só atualiza se o conteúdo realmente mudou para evitar re-saves idênticos
            if (JSON.stringify(allSavedChats[chatIndex].history) !== JSON.stringify(conversationHistory)) {
                allSavedChats[chatIndex].history = [...conversationHistory];
                allSavedChats[chatIndex].date = now.toISOString();
                allSavedChats[chatIndex].mode = currentChatMode; // Garante que o modo está atualizado
                console.log("Chat ATUALIZADO:", currentChatSessionId);
            } else {
                console.log("Não salvando: sem mudanças no chat atualizado.", currentChatSessionId);
                return; // Sai se não houve mudança
            }
        } else { // Cria um novo chat (se currentChatSessionId era de uma nova sessão)
            const newChat = {
                id: currentChatSessionId || ('chat_' + now.getTime() + '_' + Math.random().toString(16).slice(2)), // Usa o ID da sessão ou gera novo
                date: now.toISOString(),
                mode: currentChatMode,
                history: [...conversationHistory]
            };
            allSavedChats.unshift(newChat); // Adiciona no início
            console.log("Chat SALVO COMO NOVO:", newChat.id);
        }

        // Limitar o número de chats salvos
        if (allSavedChats.length > 10) {
            allSavedChats = allSavedChats.slice(0, 10);
        }
        localStorage.setItem('allPsicoBolsoChats_v3', JSON.stringify(allSavedChats));
        // Não precisa chamar renderPreviousChatsList() aqui, pois será chamado ao ir para preChatSection.
    }

    function renderPreviousChatsList() { /* ... (sem alterações) ... */ 
        previousChatsListEl.innerHTML = '';
        if (allSavedChats.length === 0) {
            previousChatsListEl.innerHTML = '<p>Nenhuma conversa anterior salva.</p>';
            if(clearAllChatsBtn) clearAllChatsBtn.style.display = 'none';
            return;
        }
        if(clearAllChatsBtn) clearAllChatsBtn.style.display = 'inline-block';

        allSavedChats.forEach(chat => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('previous-chat-item');
            itemDiv.dataset.chatId = chat.id;

            const dateSpan = document.createElement('span');
            dateSpan.classList.add('chat-date');
            dateSpan.textContent = new Date(chat.date).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            const previewSpan = document.createElement('span');
            previewSpan.classList.add('chat-preview');
            
            let firstUserMessageContent = 'Início da conversa...';
            const userMessages = chat.history.filter(msg => msg.role === 'user');
            if (userMessages.length > 0) {
                firstUserMessageContent = userMessages[0].parts[0].text;
            }
            previewSpan.textContent = firstUserMessageContent.substring(0, 70) + (firstUserMessageContent.length > 70 ? '...' : '');

            itemDiv.appendChild(dateSpan);
            itemDiv.appendChild(previewSpan);
            itemDiv.addEventListener('click', () => loadChatFromHistory(chat.id));
            previousChatsListEl.appendChild(itemDiv);
        });
    }

    function loadChatFromHistory(chatId) {
        const chatToLoad = allSavedChats.find(chat => chat.id === chatId);
        if (!chatToLoad) return;

        isViewingChatHistoryMode = true;
        currentChatSessionId = chatId; // Define o ID da sessão atual como o do chat carregado
        currentChatMode = chatToLoad.mode;
        conversationHistory = JSON.parse(JSON.stringify(chatToLoad.history));
        
        chatHistoryEl.innerHTML = '';
        
        let systemMessageCount = 0; 
        conversationHistory.forEach(message => {
            if ( (message.parts[0].text.includes("Você é o") || message.parts[0].text.includes("Entendido. Estou pronto")) && systemMessageCount < 2) {
                systemMessageCount++;
                return;
            }
            addMessageToChat(message.parts[0].text, message.role);
        });
        
        chatModeInfoEl.textContent = (currentChatMode === 'desabafar' ? "Desabafo e Escuta Ativa" : "Busca por Estratégias") + " (Revisando Histórico)";
        
        // Muda para a seção de chat, mas precisamos re-setar as flags após a chamada,
        // pois setActiveSection as reseta por padrão.
        const previousViewingMode = isViewingChatHistoryMode;
        const previousSessionId = currentChatSessionId;
        setActiveSection('chatSection');
        isViewingChatHistoryMode = previousViewingMode;
        currentChatSessionId = previousSessionId;
    }

    clearAllChatsBtn.addEventListener('click', () => { /* ... (sem alterações) ... */ 
        if (confirm("Tem certeza que deseja apagar TODO o histórico de conversas? Esta ação não pode ser desfeita.")) {
            allSavedChats = [];
            localStorage.removeItem('allPsicoBolsoChats_v3');
            renderPreviousChatsList();
        }
    });

    function addMessageToChat(text, sender, isTyping = false) { /* ... (sem alterações) ... */ 
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', sender);
        if (isTyping) messageDiv.classList.add('typing-indicator');
        const senderNameEl = document.createElement('div');
        senderNameEl.classList.add('sender');
        senderNameEl.textContent = sender === 'user' ? 'Você' : 'PsicoBolso';
        const messageTextEl = document.createElement('p');
        messageTextEl.textContent = text;
        messageDiv.appendChild(senderNameEl);
        messageDiv.appendChild(messageTextEl);
        chatHistoryEl.appendChild(messageDiv);
        if(chatHistoryEl.scrollHeight > 0) chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    }

    async function getGeminiResponse(chatMode) { /* ... (sem alterações na lógica interna, apenas na chamada e no isViewingChatHistoryMode) ... */ 
        if (isViewingChatHistoryMode) {
            console.log("Visualizando histórico, não chamando API.");
            return;
        }
        addMessageToChat("Digitando...", "bot", true);
        let systemPrompt = `Você é o "Psicoterapeuta de Bolso", um chatbot terapêutico amigável e empático. Seu objetivo é oferecer suporte emocional, escuta ativa, validação e pequenas sugestões baseadas em técnicas de psicologia como TCC e Mindfulness. Responda de forma concisa e útil. Lembre-se sempre que você NÃO substitui um terapeuta profissional. Se a conversa indicar uma crise séria (risco de suicídio, automutilação), reforce a importância de buscar ajuda profissional IMEDIATAMENTE e sugira ligar para serviços como o CVV (188 no Brasil). Mantenha o foco no bem-estar do usuário. Evite listas longas, prefira parágrafos curtos.`;
        if (chatMode === 'desabafar') {
            systemPrompt += " O usuário escolheu a opção 'desabafar'. Seu foco principal deve ser a escuta ativa, validação emocional, empatia e fazer perguntas que ajudem o usuário a se aprofundar em seus sentimentos. Ofereça conforto e compreensão. Evite dar soluções diretas ou muitas sugestões de técnicas, a menos que o usuário peça explicitamente ou pareça muito angustiado e uma técnica de calming possa ajudar (ex: respiração).";
        } else { 
            systemPrompt += ` O usuário escolheu a opção 'buscar soluções/estratégias'. 
            1. Comece validando o sentimento do usuário e mostrando que você entendeu a situação.
            2. Faça perguntas exploratórias para entender melhor o contexto do problema, se necessário.
            3. Ajude o usuário a identificar pensamentos ou crenças disfuncionais relacionadas ao problema (TCC leve). Por exemplo: "Percebo que você mencionou X. Às vezes, quando nos sentimos assim, podemos ter pensamentos como Y. Isso acontece com você?".
            4. Explore com o usuário se ele já tentou algo para lidar com a situação e o que funcionou ou não.
            5. Sugira de 1 a 2 estratégias PRÁTICAS e ACIONÁVEIS que o usuário pode tentar. Apresente-as como opções, não como ordens.
               Exemplos de estratégias:
               - "Para lidar com [problema específico], algumas pessoas acham útil [técnica de mindfulness específica, como observação da respiração ou body scan]. Gostaria de saber mais sobre isso?"
               - "Se você está se sentindo sobrecarregado com [tarefa], dividir em passos menores pode ajudar. Poderíamos pensar juntos em como fazer isso?"
               - "Quando temos pensamentos negativos como '[exemplo de pensamento]', uma técnica da TCC é tentar encontrar uma perspectiva alternativa ou mais equilibrada. Que outra forma você poderia ver essa situação?"
               - "Para ansiedade social, praticar pequenas interações em ambientes seguros ou usar técnicas de relaxamento antes de um evento social pode ser uma abordagem."
               - "Se o problema é procrastinação, a técnica Pomodoro ou definir metas SMART (Específicas, Mensuráveis, Alcançáveis, Relevantes, Temporais) podem ser úteis."
            6. Incentive a auto-eficácia: "Lembre-se que você tem recursos internos. Qual pequeno passo você se sentiria capaz de dar hoje em direção a essa mudança?"
            7. Evite sobrecarregar com muitas sugestões. É melhor focar em uma ou duas e explorá-las bem.
            Não dê conselhos médicos ou diagnósticos. Mantenha-se no escopo de um chatbot de suporte emocional e psicoeducação leve.`;
        }
        const payload = { contents: [], generationConfig: { maxOutputTokens: 1024 }, safetySettings: [ { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, ] };
        const hasSystemPrompt = conversationHistory.some(msg => msg.parts[0].text.startsWith("Você é o"));
        let historyForAPI = [...conversationHistory];

        if (!hasSystemPrompt && historyForAPI.length > 0) {
             payload.contents.push({ role: "user", parts: [{ text: systemPrompt }] });
             payload.contents.push({ role: "model", parts: [{ text: "Entendido. Estou pronto para conversar no modo selecionado e seguindo suas instruções." }] });
        }
        payload.contents.push(...historyForAPI); // Adiciona o histórico atual, que já contém a última msg do usuário
        try {
            const response = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), });
            const typingIndicator = chatHistoryEl.querySelector('.typing-indicator');
            if (typingIndicator) typingIndicator.remove();
            if (!response.ok) { const errorData = await response.json(); console.error('Erro da API Gemini:', errorData); addMessageToChat(`Desculpe, ocorreu um erro ao conectar com a IA: ${errorData.error?.message || response.statusText}`, "bot"); return; }
            const data = await response.json();
            if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) { const botResponse = data.candidates[0].content.parts[0].text; addMessageToChat(botResponse, "bot"); conversationHistory.push({ role: "model", parts: [{ text: botResponse }] });
            } else if (data.promptFeedback && data.promptFeedback.blockReason) { addMessageToChat("Minha resposta foi bloqueada por questões de segurança. Poderia reformular sua pergunta ou falar sobre outro assunto?", "bot");
            } else { console.error('Resposta inesperada da API Gemini:', data); addMessageToChat("Desculpe, não consegui processar sua solicitação no momento.", "bot"); }
        } catch (error) { console.error('Erro ao chamar a API Gemini:', error); const typingIndicator = chatHistoryEl.querySelector('.typing-indicator'); if (typingIndicator) typingIndicator.remove(); addMessageToChat("Desculpe, estou com problemas para me conectar. Tente novamente mais tarde.", "bot"); }
    }

    sendMessageBtn.addEventListener('click', () => {
        const message = userInputEl.value.trim();
        if (message) {
            if (isViewingChatHistoryMode) { // Se estava visualizando e manda msg, não está mais só visualizando
                isViewingChatHistoryMode = false; 
                // currentChatSessionId já deve estar setado pelo loadChatFromHistory
                // O saveCurrentChat vai ATUALIZAR este chat se o usuário sair.
            }
            chatModeInfoEl.textContent = (currentChatMode === 'desabafar' ? "Desabafo e Escuta Ativa" : "Busca por Estratégias"); 
            
            addMessageToChat(message, "user");
            conversationHistory.push({ role: "user", parts: [{ text: message }] });

            if (GEMINI_API_KEY !== 'SUA_CHAVE_API_GEMINI_AQUI') {
                getGeminiResponse(currentChatMode);
            } else { 
                addMessageToChat("Modo de demonstração: API Key não configurada.", "bot");
                conversationHistory.push({ role: "model", parts: [{ text: "Modo de demonstração ativado." }] });
            }
            userInputEl.value = '';
        }
    });
    userInputEl.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessageBtn.click());
    
    // --- Lógica do Diário Emocional --- (sem alterações na funcionalidade principal aqui, apenas nos nomes das chaves de LS)
    function saveDiaryEntry() { /* ... (sem alterações) ... */ 
        const mood = selectedMoodEl.value;
        const text = diaryTextEl.value.trim();
        if (!mood) { alert('Por favor, selecione um emoji para seu humor.'); return; }
        if (!text) { alert('Por favor, descreva como você se sente.'); return; }
        if (currentEditingDiaryEntryId) {
            const entryIndex = diaryEntries.findIndex(entry => entry.id === currentEditingDiaryEntryId);
            if (entryIndex > -1) {
                diaryEntries[entryIndex].mood = mood;
                diaryEntries[entryIndex].text = text;
                alert('Registro atualizado com sucesso!');
            } else { alert("Erro ao atualizar. Tente novamente."); }
        } else {
            const entryDate = new Date().toISOString();
            const newEntryId = 'diary_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); 
            diaryEntries.push({ id: newEntryId, mood, text, date: entryDate });
            alert('Registro salvo com sucesso!');
        }
        localStorage.setItem('diaryEntriesPB_dark_v2', JSON.stringify(diaryEntries));
        renderDiaryEntries(getFilteredDiaryEntries()); 
        renderMoodBarChart(getFilteredDiaryEntries()); 
        exitDiaryEditMode();
    }
    saveDiaryEntryBtn.addEventListener('click', saveDiaryEntry);

    function renderDiaryEntries(entriesToRender) { /* ... (sem alterações) ... */ 
        diaryLogEntriesEl.innerHTML = '';
        if (entriesToRender.length === 0) {
            diaryLogEntriesEl.innerHTML = '<p class="no-entries">Nenhum registro encontrado para este período. Que tal adicionar um?</p>';
            return;
        }
        entriesToRender.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('diary-log-entry');
            if (!entry.id) { entry.id = 'diary_' + new Date(entry.date).getTime() + '_' + Math.random().toString(36).substr(2, 5); }
            const moodData = moodOptions.find(m => m.mood === entry.mood);
            const entryDateObj = new Date(entry.date);
            const formattedDate = entryDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            const formattedTime = entryDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const textContentDiv = document.createElement('div');
            textContentDiv.classList.add('text-content');
            textContentDiv.innerHTML = entry.text.replace(/\n/g, '<br>');
            entryDiv.innerHTML = ` <div class="entry-header"> <span class="mood">${moodData ? moodData.emoji : entry.mood}</span> <div class="entry-meta"> <span class="date">${formattedDate} às ${formattedTime}</span> <div class="entry-actions"> <button class="action-btn edit-btn" data-id="${entry.id}" title="Editar Registro"><i class="fas fa-edit"></i></button> <button class="action-btn delete-btn" data-id="${entry.id}" title="Excluir Registro"><i class="fas fa-trash-alt"></i></button> </div> </div> </div> `;
            entryDiv.appendChild(textContentDiv);
            if (moodData) { entryDiv.style.borderLeftColor = moodData.color; }
            entryDiv.querySelector('.edit-btn').addEventListener('click', (e) => { e.stopPropagation(); prepareDiaryEdit(entry.id); });
            entryDiv.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteDiaryEntry(entry.id); });
            diaryLogEntriesEl.appendChild(entryDiv);
        });
    }

    function prepareDiaryEdit(entryId) { /* ... (sem alterações) ... */ 
        const entryToEdit = diaryEntries.find(entry => entry.id === entryId);
        if (!entryToEdit) { console.error("Entrada não encontrada para edição:", entryId); return; }
        currentEditingDiaryEntryId = entryId;
        if(editingEntryIdEl) editingEntryIdEl.value = entryId; 
        selectedMoodEl.value = entryToEdit.mood;
        moodEmojisContainer.querySelectorAll('button').forEach(btn => { btn.classList.remove('selected'); if (btn.dataset.mood === entryToEdit.mood) { btn.classList.add('selected'); } });
        diaryTextEl.value = entryToEdit.text;
        if(diaryFormTitleEl) diaryFormTitleEl.textContent = "Editando Registro";
        saveDiaryEntryBtn.innerHTML = '<i class="fas fa-check"></i> Atualizar Registro';
        if(cancelEditBtn) cancelEditBtn.style.display = 'inline-block';
        diaryTextEl.focus();
        const diaryEntryFormEl = document.querySelector('.diary-entry-form');
        if(diaryEntryFormEl) diaryEntryFormEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function deleteDiaryEntry(entryId) { /* ... (sem alterações) ... */ 
        if (confirm("Tem certeza que deseja excluir este registro do diário?")) {
            diaryEntries = diaryEntries.filter(entry => entry.id !== entryId);
            localStorage.setItem('diaryEntriesPB_dark_v2', JSON.stringify(diaryEntries));
            const currentlyFilteredEntries = getFilteredDiaryEntries();
            renderDiaryEntries(currentlyFilteredEntries); 
            renderMoodBarChart(currentlyFilteredEntries); 
            if (currentEditingDiaryEntryId === entryId) { exitDiaryEditMode(); }
            populateDiaryFilters(); 
        }
    }

    function exitDiaryEditMode() { /* ... (sem alterações) ... */ 
        currentEditingDiaryEntryId = null;
        if(editingEntryIdEl) editingEntryIdEl.value = "";
        if(diaryFormTitleEl) diaryFormTitleEl.textContent = "Novo Registro";
        saveDiaryEntryBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Registro';
        if(cancelEditBtn) cancelEditBtn.style.display = 'none';
        selectedMoodEl.value = "";
        moodEmojisContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
        diaryTextEl.value = "";
    }
    if(cancelEditBtn) cancelEditBtn.addEventListener('click', exitDiaryEditMode);

    function getFilteredDiaryEntries() { /* ... (sem alterações) ... */ 
        const selectedMonth = filterMonthEl.value;
        const selectedYear = filterYearEl.value;
        let filtered = diaryEntries;
        if (selectedYear !== "") { filtered = filtered.filter(e => new Date(e.date).getFullYear() === parseInt(selectedYear)); }
        if (selectedMonth !== "") { filtered = filtered.filter(e => new Date(e.date).getMonth() === parseInt(selectedMonth)); }
        return filtered;
    }

    function populateDiaryFilters() { /* ... (sem alterações) ... */ 
        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const availableYears = [...new Set(diaryEntries.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a);
        const currentMonthFilter = filterMonthEl.value;
        const currentYearFilter = filterYearEl.value;
        filterMonthEl.innerHTML = '<option value="">Todos os Meses</option>';
        months.forEach((month, index) => { filterMonthEl.innerHTML += `<option value="${index}">${month}</option>`; });
        filterYearEl.innerHTML = '<option value="">Todos os Anos</option>';
        availableYears.forEach(year => { filterYearEl.innerHTML += `<option value="${year}">${year}</option>`; });
        filterMonthEl.value = currentMonthFilter;
        filterYearEl.value = currentYearFilter;
    }

    applyFilterBtn.addEventListener('click', () => { /* ... (sem alterações) ... */ 
        exitDiaryEditMode();
        const filtered = getFilteredDiaryEntries();
        renderDiaryEntries(filtered);
        const selectedMonth = filterMonthEl.value;
        const selectedYear = filterYearEl.value;
        const monthText = selectedMonth !== "" ? filterMonthEl.options[filterMonthEl.selectedIndex].text : "Todos os Meses";
        const yearText = selectedYear !== "" ? selectedYear : "Todos os Anos";
        let periodLabel = "Todos os Registros";
        if (selectedMonth !== "" && selectedYear !== "") { periodLabel = `${monthText} de ${yearText}`;
        } else if (selectedMonth !== "") { periodLabel = `${monthText} (Todos os Anos)`;
        } else if (selectedYear !== "") { periodLabel = `Ano de ${yearText}`; }
        renderMoodBarChart(filtered, periodLabel);
    });

    resetFilterBtn.addEventListener('click', () => { /* ... (sem alterações) ... */ 
        exitDiaryEditMode(); 
        filterMonthEl.value = "";
        filterYearEl.value = "";
        renderDiaryEntries(diaryEntries);
        renderMoodBarChart(diaryEntries, "Todos os Registros");
    });
    
    function renderMoodBarChart(entriesForChart, periodLabel = "Todos os Registros") { /* ... (sem alterações) ... */ 
        if (moodBarChart) { moodBarChart.destroy(); }
        if (!statsPeriodEl || !moodBarChartCanvas) return; 
        statsPeriodEl.textContent = periodLabel;
        const moodCounts = {};
        moodOptions.forEach(opt => moodCounts[opt.mood] = 0);
        entriesForChart.forEach(entry => { if (moodCounts.hasOwnProperty(entry.mood)) { moodCounts[entry.mood]++; } });
        const labels = moodOptions.map(opt => opt.emoji + " " + (opt.mood.charAt(0).toUpperCase() + opt.mood.slice(1)));
        const data = moodOptions.map(opt => moodCounts[opt.mood]);
        const backgroundColors = moodOptions.map(opt => opt.color);
        const borderColors = backgroundColors.map(color => chroma(color).darken(0.8).hex());
        if (entriesForChart.length === 0) { moodBarChartCanvas.style.display = 'none'; return; }
        moodBarChartCanvas.style.display = 'block';
        moodBarChart = new Chart(moodBarChartCanvas, { type: 'bar', data: { labels: labels, datasets: [{ label: `Contagem de Emoções`, data: data, backgroundColor: backgroundColors, borderColor: borderColors, borderWidth: 1 }] },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, title: { display: true, text: 'Número de Registros', color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary-color').trim() }, ticks: { stepSize: 1, color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary-color').trim() }, grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() } }, y: { ticks: { font: { size: 11 }, color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() }, grid: { display: false } } },
                plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(44, 62, 80, 0.85)', titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim(), bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim(), borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim(), borderWidth: 1, callbacks: { label: function(context) { return ` ${context.parsed.x} registro(s)`; } } } } } });
    }

    // --- Inicialização ---
    populateMoodEmojis();
    setActiveSection('preChatSection');
    renderPreviousChatsList();
    diaryEntries.forEach(entry => { if (!entry.id) { entry.id = 'diary_' + new Date(entry.date).getTime() + '_' + Math.random().toString(36).substr(2, 5); } });
    localStorage.setItem('diaryEntriesPB_dark_v2', JSON.stringify(diaryEntries));
    populateDiaryFilters();
    renderDiaryEntries(getFilteredDiaryEntries());
    renderMoodBarChart(getFilteredDiaryEntries(), "Todos os Registros");
    if (GEMINI_API_KEY === 'SUA_CHAVE_API_GEMINI_AQUI') { console.warn("AVISO: A chave da API do Gemini não está configurada."); }
});