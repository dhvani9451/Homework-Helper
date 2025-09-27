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
    this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
    this.messageInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
    this.messageInput.focus();
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

    this.messageInput.value = '';
    this.setLoading(true);
    this.hideWelcomeMessage();

    this.addMessage(message, 'user');

    const loadingId = this.addLoadingMessage();
    try {
      const responseHtml = await this.getAIResponse(message);
      this.removeMessage(loadingId);
      // Insert sanitized HTML returned by the server
      this.addMessage(responseHtml, 'assistant', true);
    } catch (error) {
      this.removeMessage(loadingId);
      this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
      console.error('Error:', error);
    } finally {
      this.setLoading(false);
    }
  }

  hideWelcomeMessage() {
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) welcomeMessage.style.display = 'none';
  }

  // If isHtml=true, content is already sanitized server-side
  addMessage(content, type, isHtml = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    if (type === 'assistant' && isHtml) {
      messageDiv.innerHTML = content;
    } else {
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
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    `;
    this.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
    return messageDiv;
  }

  removeMessage(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  setLoading(isLoading) {
    this.sendButton.disabled = isLoading;
  }

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  async getAIResponse(question) {
    const resp = await fetch('/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    // Server returns already-sanitized HTML
    return data.answer_html || 'No response.';
  }
}

window.addEventListener('DOMContentLoaded', () => new HomeworkHelper());
