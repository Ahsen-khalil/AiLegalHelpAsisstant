document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const newChatBtn = document.getElementById('newChatBtn');
    const conversationList = document.getElementById('conversationList');

    let currentConversationId = null;
    let typingIndicator = null; // Keep track of the typing indicator

    function loadConversations() {
        fetch('/get_conversations')
            .then(response => response.json())
            .then(data => {
                conversationList.innerHTML = '';
                if (data.conversations.length === 0) {
                    conversationList.innerHTML = '<li>No previous chats found</li>';
                    return;
                }

                data.conversations.forEach(conv => {
                    const li = document.createElement('li');
                    const name = conv.name || generateChatName(conv);
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = '❌';
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent triggering the conversation load
                        deleteConversation(conv.conversation_id, li);
                    });

                    li.textContent = name;
                    li.dataset.id = conv.conversation_id;
                    li.className = 'conversation-item';
                    li.addEventListener('click', () => loadConversation(conv.conversation_id));

                    li.appendChild(deleteBtn);
                    conversationList.appendChild(li);
                });

                if (!currentConversationId && data.conversations.length > 0) {
                    loadConversation(data.conversations[0].conversation_id);
                }

                updateActiveConversation();
            })
            .catch(error => {
                console.error('Error fetching conversations:', error);
                conversationList.innerHTML = '<li>Error loading conversations</li>';
            });
    }

    function generateChatName(conversation) {
        if (conversation.messages && conversation.messages.length > 0) {
            const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
            if (firstUserMessage) {
                return firstUserMessage.content.substring(0, 20) + (firstUserMessage.content.length > 20 ? '...' : '');
            }
        }
        return `Chat ${conversation.conversation_id.substr(0, 8)}`;
    }

    function loadConversation(conversationId) {
        currentConversationId = conversationId;
        chatMessages.innerHTML = '<p>Loading...</p>';
        fetch('/get_conversations')
            .then(response => response.json())
            .then(data => {
                const conversation = data.conversations.find(conv => conv.conversation_id === conversationId);
                if (conversation) {
                    chatMessages.innerHTML = '';
                    conversation.messages.forEach(message => {
                        addMessage(message.role === 'user' ? 'user' : 'bot', message.content);
                    });
                } else {
                    chatMessages.innerHTML = '<p>Conversation not found</p>';
                }

                updateActiveConversation();
            })
            .catch(error => {
                console.error('Error loading conversation:', error);
                chatMessages.innerHTML = '<p>Error loading conversation</p>';
            });
    }

    function deleteConversation(conversationId, listItem) {
        console.log('Delete button clicked for conversationId:', conversationId);
    
        // Create the modal
        const modal = document.createElement('div');
        modal.classList.add('confirmation-modal');
        modal.innerHTML = `
            <div class="modal-content">
                <p>Are you sure you want to delete this conversation?</p>
                <div class="modal-buttons">
                    <button id="confirmDelete" class="confirm-btn">Delete</button>
                    <button id="cancelDelete" class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    
        // Add event listeners to modal buttons
        document.getElementById('confirmDelete').addEventListener('click', () => {
            console.log('Confirm delete clicked.');
    
            // Make the DELETE request
            fetch('/delete_conversation', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ conversation_id: conversationId }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete conversation');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Server response:', data);
    
                    if (data.message) {
                        // Remove the list item and reset the UI
                        listItem.remove();
                        if (currentConversationId === conversationId) {
                            currentConversationId = null;
                            chatMessages.innerHTML = '<p>Select a conversation to start chatting</p>';
                        }
                    } else {
                        console.error('Error from server:', data.error || 'Unknown error');
                    }
                    modal.remove(); // Remove modal after operation
                })
                .catch(error => {
                    console.error('Error during deletion:', error);
                    modal.remove(); // Always remove modal
                });
        });
    
        document.getElementById('cancelDelete').addEventListener('click', () => {
            console.log('Cancel delete clicked.');
            modal.remove(); // Close modal without action
        });
    }
    
    

    function updateActiveConversation() {
        const items = conversationList.getElementsByTagName('li');
        for (let item of items) {
            item.classList.remove('active');
            if (item.dataset.id === currentConversationId) {
                item.classList.add('active');
            }
        }
    }

    newChatBtn.addEventListener('click', () => {
        fetch('/create_conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        })
            .then(response => response.json())
            .then(data => {
                currentConversationId = data.conversation_id;
                chatMessages.innerHTML = '';
                loadConversations();
            })
            .catch(error => {
                console.error('Error creating new chat:', error);
            });
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (message) {
            addMessage('user', message);
            userInput.value = '';

            // Add a typing indicator
            typingIndicator = addTypingIndicator();

            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        conversation_id: currentConversationId
                    }),
                });

                if (response.ok) {
                    const data = await response.json();

                    // Remove typing indicator
                    if (typingIndicator) {
                        typingIndicator.remove();
                        typingIndicator = null;
                    }

                    // Add bot response
                    addMessage('bot', data.response);
                    currentConversationId = data.conversation_id;

                    loadConversations();
                } else {
                    throw new Error('Failed to get response from server');
                }
            } catch (error) {
                console.error('Error:', error);

                // Remove typing indicator and add an error message
                if (typingIndicator) {
                    typingIndicator.remove();
                    typingIndicator = null;
                }
                addMessage('bot', 'Sorry, I encountered an error. Please try again.');
            }
        }
    });

    function addMessage(sender, content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
    
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
        const textElement = document.createElement('div');
        textElement.classList.add('message-text');
        textElement.textContent = content;
    
        messageElement.appendChild(avatar);
        messageElement.appendChild(textElement);
    
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    
        // Trigger text-to-speech for bot responses
        if (sender === 'bot') {
            textToSpeech(content);
        }
    
        return messageElement;
    }
    
    function textToSpeech(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US'; // Adjust the language if needed
            utterance.rate = 1; // Adjust the rate (0.1 to 10)
            utterance.pitch = 1; // Adjust the pitch (0 to 2)
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Text-to-Speech is not supported in this browser.');
        }
    }

    function addTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.classList.add('typing-indicator');
        typingElement.innerHTML = `
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        `;

        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        return typingElement;
    }

    // Voice to text functionality
    const voiceInputBtn = document.getElementById('voiceInputBtn');

    if (voiceInputBtn && 'webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        voiceInputBtn.addEventListener('click', () => {
            recognition.start();
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
        };
    } else if (voiceInputBtn) {
        voiceInputBtn.disabled = true;
        voiceInputBtn.title = 'Voice input is not supported in this browser.';
    }

    loadConversations();
});
