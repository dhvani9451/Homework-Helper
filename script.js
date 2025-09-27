// Homework Helper Chat Application
class HomeworkHelper {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatForm = document.getElementById('chatForm');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        
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
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Add loading message
        const loadingId = this.addLoadingMessage();
        
        try {
            // Simulate API call (replace with actual API endpoint)
            const response = await this.getAIResponse(message);
            
            // Remove loading message
            this.removeMessage(loadingId);
            
            // Add AI response
            this.addMessage(response, 'assistant');
        } catch (error) {
            // Remove loading message
            this.removeMessage(loadingId);
            
            // Add error message
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
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
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        
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
    
    // Simulate AI response - replace with actual API call
    async getAIResponse(message) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Simple response logic (replace with actual AI API)
        const responses = this.generateResponse(message);
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    generateResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Math responses
        if (lowerMessage.includes('math') || lowerMessage.includes('algebra') || lowerMessage.includes('equation')) {
            return [
                "I'd be happy to help with your math problem! Can you share the specific equation or problem you're working on?",
                "Math can be tricky, but let's break it down step by step. What specific topic are you struggling with?",
                "Great! I love helping with math. Whether it's algebra, geometry, or calculus, I'm here to guide you through it."
            ];
        }
        
        // Science responses
        if (lowerMessage.includes('science') || lowerMessage.includes('chemistry') || lowerMessage.includes('physics') || lowerMessage.includes('biology')) {
            return [
                "Science is fascinating! What specific concept or experiment are you working on?",
                "I'm here to help explain any science concepts. What subject area are you focusing on?",
                "Let's explore this scientific concept together. Can you tell me more about what you're studying?"
            ];
        }
        
        // History responses
        if (lowerMessage.includes('history') || lowerMessage.includes('historical')) {
            return [
                "History helps us understand our world! What time period or historical event are you studying?",
                "I'd be glad to help with your history assignment. What specific topic or era interests you?",
                "Historical context is so important. What aspect of history are you exploring?"
            ];
        }
        
        // Literature responses
        if (lowerMessage.includes('literature') || lowerMessage.includes('book') || lowerMessage.includes('reading') || lowerMessage.includes('essay')) {
            return [
                "Literature analysis can be really rewarding! What book or text are you working with?",
                "I love discussing literature. Are you working on character analysis, themes, or something else?",
                "Great choice focusing on literature! What specific aspect of the text are you analyzing?"
            ];
        }
        
        // General helpful responses
        return [
            "I'm here to help you learn! Can you tell me more about what you're working on?",
            "That's a great question! Let me help you break this down. Can you provide more details?",
            "I'd love to assist with your homework. What subject or topic would you like to explore?",
            "Learning is a journey, and I'm here to support you. What specific area do you need help with?",
            "Thanks for reaching out! I'm ready to help you understand this topic better. What's your question about?"
        ];
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
