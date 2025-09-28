// Homework Helper Chat Application
class HomeworkHelper {
    constructor() {
        // ... (constructor content is unchanged)
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

    // ... (init, setupSubjectCards, handleKeyPress, handleDateTime are unchanged)

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
    
    // NEW FUNCTION: Handle date/time questions locally to provide real-time data
    handleDateTime(message) {
        const lowerMessage = message.toLowerCase();
        
        // Simple checks for date/time questions
        if (
            lowerMessage.includes('today') ||
            lowerMessage.includes('date') ||
            lowerMessage.includes('time') ||
            lowerMessage.includes('day is it') ||
            lowerMessage.includes('current year')
        ) {
            const now = new Date();
            // Format to show day, month, date, year, and time
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: 'numeric', 
                minute: 'numeric', 
                second: 'numeric' 
            };
            
            // Get the date/time string based on the user's browser locale
            const formattedDate = now.toLocaleDateString(undefined, options);

            // Return a Markdown-formatted response (using ** for bolding)
            return `The current date and time is **${formattedDate}**.`;
        }
        return null; // Return null if it's not a date/time question
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

        // Add user message
        this.addMessage(message, 'user', false);

        // --- NEW LOGIC: Check for real-time date/time questions ---
        const localResponse = this.handleDateTime(message);
        if (localResponse) {
            // Respond immediately from the client if it's a date/time question
            this.addMessage(localResponse, 'assistant', true); 
            this.setLoading(false);
            return; // Stop here, don't call the API
        }
        // --- END NEW LOGIC ---

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

    // UPDATED: Use markdown parsing if requested AND RENDER MATHJAX
    addMessage(content, type, useMarkdown = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        if (useMarkdown) {
            // Use marked.js to convert markdown to HTML
            messageDiv.innerHTML = typeof marked !== 'undefined' ? marked.parse(content) : content;
        } else {
            // Use textContent for plain text (e.g., user messages, simple errors)
            messageDiv.textContent = content;
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // NEW: Rerender MathJax for assistant messages containing LaTeX
        // Check if MathJax is loaded before calling it
        if (type === 'assistant' && window.MathJax) {
            // Queue the typesetting process to process the new messageDiv
            window.MathJax.typesetPromise([messageDiv]).catch((err) => console.error("MathJax Error:", err));
        }

        return messageDiv;
    }

    addLoadingMessage() {
        // ... (addLoadingMessage is unchanged)
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
        // ... (removeMessage is unchanged)
        if (messageElement && messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }

    setLoading(isLoading) {
        // ... (setLoading is unchanged)
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
        // ... (scrollToBottom is unchanged)
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // Actual API call
    async getAIResponse(message) {
        // ... (getAIResponse is unchanged)
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