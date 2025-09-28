// Homework Helper Chat Application
class HomeworkHelper {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatForm = document.getElementById('chatForm');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');

        // Check if marked.js is loaded
        if (typeof marked === 'undefined') {
            console.error("Marked.js is not loaded! Markdown rendering will not work.");
        }

        this.init();
    }

    init() {
        // Bind event listeners
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.messageInput.addEventListener('keypress', (e) => this.handleKeyPress(e));

        // Focus input on load
        this.messageInput.focus();

        // Add subject card click handlers
        this.setupSubjectCards();
    }

    setupSubjectCards() {
        const subjectCards = document.querySelectorAll('.subject-card');
        subjectCards.forEach(card => {
            card.addEventListener('click', () => {
                const subject = card.querySelector('span:last-child').textContent;
                this.messageInput.value = `Help me with ${subject}`;
                this.messageInput.focus();
            });
        });
    }

    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSubmit(e);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const message = this.messageInput.value.trim();
        if (!message) return;

        // Clear input and disable form
        this.messageInput.value = '';
        this.setLoading(true);

        // Hide welcome message if it exists
        this.hideWelcomeMessage();

        // Add user message (user messages don't need markdown rendering)
        this.addMessage(message, 'user', false);

        // Add loading message
        const loadingId = this.addLoadingMessage();

        try {
            // Actual API call
            const response = await this.getAIResponse(message);

            // Remove loading message
            this.removeMessage(loadingId);

            // Add AI response (use markdown rendering)
            this.addMessage(response, 'assistant', true);
        } catch (error) {
            // Remove loading message
            this.removeMessage(loadingId);

            // Add error message
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant', false);
            console.error('Error:', error);
        } finally {
            this.setLoading(false);
        }
    }

    hideWelcomeMessage() {
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
    }

    // UPDATED: Added useMarkdown flag and switched to innerHTML
    addMessage(content, type, useMarkdown = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        if (useMarkdown) {
            // Use marked.js to convert markdown to HTML
            messageDiv.innerHTML = marked.parse(content);
        } else {
            // Use textContent for plain text (e.g., user messages, simple errors)
            messageDiv.textContent = content;
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        return messageDiv;
    }

    addLoadingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message loading';
        messageDiv.innerHTML = `
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        return messageDiv;
    }

    removeMessage(messageElement) {
        if (messageElement && messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }

    setLoading(isLoading) {
        this.sendButton.disabled = isLoading;
        this.messageInput.disabled = isLoading;

        if (isLoading) {
            this.sendButton.style.opacity = '0.5';
        } else {
            this.sendButton.style.opacity = '1';
            this.messageInput.focus();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // Actual API call
    async getAIResponse(message) {
        try {
            // NOTE: Keep the Render API endpoint for your setup
            const response = await fetch('https://homework-helper-zmha.onrender.com/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: message }) // Send the message as JSON
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.answer) {
                return data.answer;  // Return the answer from the API
            } else if (data.error) {
                return `Error from AI: ${data.error}`; // Return the error message
            } else {
                return "Sorry, I couldn't get a response from the AI.";
            }
        } catch (error) {
            console.error('Error fetching AI response:', error);
            return "Sorry, I encountered an error. Please try again."; // Generic error message
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomeworkHelper();
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to clear input
    if (e.key === 'Escape') {
        const input = document.getElementById('messageInput');
        input.value = '';
        input.focus();
    }
});

// Smooth scrolling behavior
document.documentElement.style.scrollBehavior = 'smooth';