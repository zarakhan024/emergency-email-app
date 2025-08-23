class EmergencyEmailApp {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.serverStatus = 'online';
        this.userDomain = localStorage.getItem('userDomain') || null;
        this.monitoringInterval = null;
        
        this.init();
    }
    
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('register')) return 'register';
        if (path.includes('dashboard')) return 'dashboard';
        if (path.includes('emergency-mail')) return 'emergency-mail';
        return 'home';
    }
    
    init() {
        this.requestNotificationPermission();
        
        switch (this.currentPage) {
            case 'register':
                this.initRegisterPage();
                break;
            case 'dashboard':
                this.initDashboardPage();
                break;
            case 'emergency-mail':
                this.initEmergencyMailPage();
                break;
            default:
                this.initHomePage();
        }
    }
    
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
    
    showNotification(title, message, type = 'info') {
        if ('Notification' in window && Notification.permission === 'granted') {
            const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
            new Notification(`${icon} ${title}`, {
                body: message,
                icon: '/favicon.ico'
            });
        }
    }
    
    showStatusMessage(message, type = 'success') {
        const statusEl = document.getElementById('registration-status') || 
                        document.createElement('div');
        
        statusEl.className = `status-message status-${type}`;
        statusEl.textContent = message;
        statusEl.style.display = 'block';
        
        if (!document.getElementById('registration-status')) {
            document.body.appendChild(statusEl);
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
    
    // Home Page
    initHomePage() {
        // Add any homepage-specific functionality
        console.log('Emergency Email Demo - Home Page');
    }
    
    // Register Page
    initRegisterPage() {
        const form = document.getElementById('registerForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleRegistration(e));
        }
    }
    
    async handleRegistration(e) {
        e.preventDefault();
        
        const formData = {
            company: document.getElementById('company').value,
            email: document.getElementById('email').value,
            domain: document.getElementById('domain').value
        };
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('userDomain', formData.domain);
                this.showStatusMessage('Domain registered successfully! Redirecting to dashboard...', 'success');
                this.showNotification('Registration Successful', `Domain ${formData.domain} has been registered`);
                
                // Simulate verification process
                setTimeout(() => {
                    window.location.href = `dashboard.html?domain=${formData.domain}`;
                }, 2000);
            } else {
                this.showStatusMessage(result.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showStatusMessage('Network error. Please try again.', 'error');
        }
    }
    
    // Dashboard Page
    initDashboardPage() {
        this.loadDashboardData();
        this.startServerMonitoring();
        this.bindDashboardEvents();
    }
    
    bindDashboardEvents() {
        const simulateOutageBtn = document.getElementById('simulate-outage');
        const restoreServerBtn = document.getElementById('restore-server');
        
        if (simulateOutageBtn) {
            simulateOutageBtn.addEventListener('click', () => this.simulateOutage());
        }
        
        if (restoreServerBtn) {
            restoreServerBtn.addEventListener('click', () => this.restoreServer());
        }
    }
    
    async loadDashboardData() {
        const urlParams = new URLSearchParams(window.location.search);
        const domain = urlParams.get('domain') || this.userDomain;
        
        if (!domain) {
            window.location.href = 'register.html';
            return;
        }
        
        try {
            const response = await fetch(`/api/dashboard/${domain}`);
            const data = await response.json();
            
            this.updateDashboardDisplay(data);
            document.getElementById('domain-info').textContent = `Monitoring: ${domain}`;
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }
    
    updateDashboardDisplay(data) {
        const emergencyCountEl = document.getElementById('emergency-count');
        if (emergencyCountEl) {
            emergencyCountEl.textContent = data.emergencyEmails || 0;
        }
    }
    
    startServerMonitoring() {
        this.checkServerStatus(); // Initial check
        this.monitoringInterval = setInterval(() => {
            this.checkServerStatus();
        }, 5000); // Check every 5 seconds
    }
    
    async checkServerStatus() {
        try {
            const response = await fetch('/api/server-status');
            const data = await response.json();
            
            // Check if status changed
            if (data.status !== this.serverStatus) {
                this.handleStatusChange(data.status);
            }
            
            this.updateStatusDisplay(data);
            this.serverStatus = data.status;
            
            this.updateActivityLog(data);
        } catch (error) {
            console.error('Failed to check server status:', error);
        }
    }
    
    handleStatusChange(newStatus) {
        if (newStatus === 'offline') {
            this.activateEmergencyMode();
            this.showNotification(
                'Server Outage Detected!', 
                'Your primary email server is down. Emergency mode activated.',
                'error'
            );
        } else if (this.serverStatus === 'offline' && newStatus === 'online') {
            this.deactivateEmergencyMode();
            this.showNotification(
                'Server Restored', 
                'Your primary email server is back online.',
                'success'
            );
        }
    }
    
    updateStatusDisplay(data) {
        const statusEl = document.getElementById('server-status');
        const statusTextEl = document.getElementById('status-text');
        const lastCheckEl = document.getElementById('last-check');
        const uptimeEl = document.getElementById('uptime-percentage');
        
        if (statusEl) {
            statusEl.className = `status-dot status-${data.status}`;
            statusEl.textContent = data.status.toUpperCase();
        }
        
        if (statusTextEl) {
            const statusMessages = {
                online: 'All systems operational',
                offline: '⚠️ Server is down',
                maintenance: '🔧 Under maintenance'
            };
            statusTextEl.textContent = statusMessages[data.status] || 'Unknown status';
        }
        
        if (lastCheckEl) {
            lastCheckEl.textContent = new Date(data.lastCheck).toLocaleTimeString();
        }
        
        if (uptimeEl) {
            uptimeEl.textContent = `${data.uptime.toFixed(1)}%`;
        }
    }
    
    activateEmergencyMode() {
        const emergencyBanner = document.getElementById('emergency-banner');
        const emergencyLink = document.getElementById('emergency-link');
        
        if (emergencyBanner) {
            emergencyBanner.style.display = 'block';
        }
        
        if (emergencyLink) {
            emergencyLink.style.display = 'inline';
        }
        
        document.body.classList.add('emergency-mode');
    }
    
    deactivateEmergencyMode() {
        const emergencyBanner = document.getElementById('emergency-banner');
        const emergencyLink = document.getElementById('emergency-link');
        
        if (emergencyBanner) {
            emergencyBanner.style.display = 'none';
        }
        
        if (emergencyLink) {
            emergencyLink.style.display = 'none';
        }
        
        document.body.classList.remove('emergency-mode');
    }
    
    updateActivityLog(data) {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        const activity = document.createElement('div');
        activity.className = 'activity-item';
        activity.innerHTML = `
            <div>
                <strong>Server Status Check</strong><br>
                Status: <span class="status-${data.status}">${data.status.toUpperCase()}</span>
            </div>
            <div class="activity-time">${new Date().toLocaleTimeString()}</div>
        `;
        
        activityList.prepend(activity);
        
        // Keep only last 10 items
        const items = activityList.children;
        if (items.length > 10) {
            activityList.removeChild(items[items.length - 1]);
        }
    }
    
    async simulateOutage() {
        // This is just for demo purposes
        this.handleStatusChange('offline');
        this.updateStatusDisplay({
            status: 'offline',
            lastCheck: Date.now(),
            uptime: 98.5
        });
    }
    
    async restoreServer() {
        // This is just for demo purposes
        this.handleStatusChange('online');
        this.updateStatusDisplay({
            status: 'online',
            lastCheck: Date.now(),
            uptime: 99.2
        });
    }
    
    // Emergency Mail Page
    initEmergencyMailPage() {
        this.loadEmergencyEmails();
        this.bindEmergencyMailEvents();
        
        // Simulate receiving emails
        this.simulateIncomingEmails();
    }
    
    bindEmergencyMailEvents() {
        const composeBtn = document.getElementById('compose-btn');
        const composeForm = document.getElementById('compose-form');
        const cancelBtn = document.getElementById('cancel-compose');
        const refreshBtn = document.getElementById('refresh-btn');
        
        if (composeBtn) {
            composeBtn.addEventListener('click', () => this.showCompose());
        }
        
        if (composeForm) {
            composeForm.addEventListener('submit', (e) => this.handleSendEmail(e));
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCompose());
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadEmergencyEmails());
        }
    }
    
    showCompose() {
        document.getElementById('compose-area').style.display = 'block';
        document.getElementById('email-list').style.display = 'none';
    }
    
    hideCompose() {
        document.getElementById('compose-area').style.display = 'none';
        document.getElementById('email-list').style.display = 'block';
        document.getElementById('compose-form').reset();
    }
    
    async handleSendEmail(e) {
        e.preventDefault();
        
        const emailData = {
            from: `admin@${this.userDomain || 'demo.com'}`,
            to: document.getElementById('compose-to').value,
            subject: document.getElementById('compose-subject').value,
            body: document.getElementById('compose-body').value,
            domain: this.userDomain || 'demo.com'
        };
        
        try {
            const response = await fetch('/api/emergency-email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Email Sent', 'Emergency email sent successfully', 'success');
                this.hideCompose();
                this.loadEmergencyEmails();
            } else {
                this.showNotification('Send Failed', 'Failed to send email', 'error');
            }
        } catch (error) {
            console.error('Failed to send email:', error);
            this.showNotification('Send Failed', 'Network error while sending email', 'error');
        }
    }
    
    async loadEmergencyEmails() {
        const domain = this.userDomain || 'demo.com';
        
        try {
            const response = await fetch(`/api/emergency-emails/${domain}`);
            const emails = await response.json();
            
            this.displayEmails(emails);
            this.updateInboxCount(emails.length);
        } catch (error) {
            console.error('Failed to load emails:', error);
        }
    }
    
    displayEmails(emails) {
        const container = document.getElementById('emails-container');
        if (!container) return;
        
        if (emails.length === 0) {
            container.innerHTML = '<p class="no-emails">No emergency emails yet. Emails sent during server outage will appear here.</p>';
            return;
        }
        
        container.innerHTML = emails.map(email => `
            <div class="email-item ${email.isRead ? '' : 'unread'}">
                <div class="email-header">
                    <span class="email-from">${email.from}</span>
                    <span class="email-time">${new Date(email.timestamp).toLocaleString()}</span>
                </div>
                <div class="email-subject">${email.subject}</div>
                <div class="email-preview">${email.body.substring(0, 100)}${email.body.length > 100 ? '...' : ''}</div>
            </div>
        `).join('');
    }
    
    updateInboxCount(count) {
        const inboxCountEl = document.getElementById('inbox-count');
        if (inboxCountEl) {
            inboxCountEl.textContent = `(${count})`;
        }
    }
    
    simulateIncomingEmails() {
        // Simulate receiving emergency emails every 30-60 seconds
        setInterval(async () => {
            if (Math.random() > 0.7) { // 30% chance
                await this.simulateReceiveEmail();
            }
        }, 30000);
    }
    
    async simulateReceiveEmail() {
        const sampleEmails = [
            {
                from: 'client@example.com',
                subject: 'Urgent: Project Deadline',
                body: 'Hi, I need an update on the project status. The deadline is approaching and I haven\'t heard back from you.'
            },
            {
                from: 'supplier@vendor.com',
                subject: 'Payment Reminder',
                body: 'This is a friendly reminder that your payment is due. Please process at your earliest convenience.'
            },
            {
                from: 'team@company.com',
                subject: 'Server Issues',
                body: 'We\'re experiencing some technical difficulties. Please use the backup system until further notice.'
            }
        ];
        
        const randomEmail = sampleEmails[Math.floor(Math.random() * sampleEmails.length)];
        
        try {
            await fetch('/api/emergency-email/receive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...randomEmail,
                    to: `admin@${this.userDomain || 'demo.com'}`
                })
            });
            
            this.showNotification('New Email', `From: ${randomEmail.from}`, 'info');
            this.loadEmergencyEmails();
        } catch (error) {
            console.error('Failed to simulate email receive:', error);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.emergencyEmailApp = new EmergencyEmailApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.emergencyEmailApp && window.emergencyEmailApp.monitoringInterval) {
        clearInterval(window.emergencyEmailApp.monitoringInterval);
    }
});
