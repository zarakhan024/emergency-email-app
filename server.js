const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize data files
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize JSON files
const initFile = (filename, defaultData) => {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
};

initFile('users.json', []);
initFile('emails.json', []);
initFile('server-status.json', {
    status: 'online',
    lastCheck: Date.now(),
    uptime: 99.5,
    outages: []
});

// Simulate server status changes
let currentServerStatus = 'online';
let statusChangeTimer;

const changeServerStatus = () => {
    // Random chance of status change every 15-30 seconds
    const statuses = ['online', 'offline', 'maintenance'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Higher chance of staying online (realistic)
    if (Math.random() > 0.3) {
        currentServerStatus = 'online';
    } else {
        currentServerStatus = randomStatus;
    }

    // Update status file
    const statusData = {
        status: currentServerStatus,
        lastCheck: Date.now(),
        uptime: Math.random() * (99.9 - 95) + 95, // 95-99.9%
        outages: []
    };
    
    fs.writeFileSync('./data/server-status.json', JSON.stringify(statusData, null, 2));
    
    // Schedule next change
    statusChangeTimer = setTimeout(changeServerStatus, Math.random() * 20000 + 15000);
};

// Start status simulation
changeServerStatus();

// Helper functions
const readJsonFile = (filename) => {
    try {
        const data = fs.readFileSync(path.join(dataDir, filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
};

const writeJsonFile = (filename, data) => {
    fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2));
};

// API Routes

// Get server status
app.get('/api/server-status', (req, res) => {
    const status = readJsonFile('server-status.json');
    res.json(status);
});

// Register user domain
app.post('/api/register', (req, res) => {
    const { email, domain, company } = req.body;
    
    if (!email || !domain) {
        return res.status(400).json({ error: 'Email and domain are required' });
    }
    
    const users = readJsonFile('users.json') || [];
    
    // Check if domain already exists
    const existingUser = users.find(user => user.domain === domain);
    if (existingUser) {
        return res.status(409).json({ error: 'Domain already registered' });
    }
    
    const newUser = {
        id: Date.now(),
        email,
        domain,
        company: company || '',
        registeredAt: new Date().toISOString(),
        isVerified: true, // Fake verification for demo
        status: 'active'
    };
    
    users.push(newUser);
    writeJsonFile('users.json', users);
    
    res.json({ 
        success: true, 
        message: 'Domain registered successfully!',
        user: newUser
    });
});

// Get user by domain
app.get('/api/user/:domain', (req, res) => {
    const { domain } = req.params;
    const users = readJsonFile('users.json') || [];
    const user = users.find(u => u.domain === domain);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
});

// Send emergency email
app.post('/api/emergency-email/send', (req, res) => {
    const { from, to, subject, body, domain } = req.body;
    
    const emails = readJsonFile('emails.json') || [];
    
    const newEmail = {
        id: Date.now(),
        from,
        to,
        subject,
        body,
        domain,
        timestamp: new Date().toISOString(),
        status: 'sent',
        isEmergency: true
    };
    
    emails.push(newEmail);
    writeJsonFile('emails.json', emails);
    
    res.json({ 
        success: true, 
        message: 'Emergency email sent!',
        email: newEmail
    });
});

// Get emergency emails for domain
app.get('/api/emergency-emails/:domain', (req, res) => {
    const { domain } = req.params;
    const emails = readJsonFile('emails.json') || [];
    
    const domainEmails = emails.filter(email => 
        email.domain === domain || email.to.includes(`@${domain}`)
    );
    
    res.json(domainEmails);
});

// Simulate receiving email
app.post('/api/emergency-email/receive', (req, res) => {
    const { to, from, subject, body } = req.body;
    
    // Extract domain from email
    const domain = to.split('@')[1];
    
    const emails = readJsonFile('emails.json') || [];
    
    const newEmail = {
        id: Date.now(),
        from,
        to,
        subject,
        body,
        domain,
        timestamp: new Date().toISOString(),
        status: 'received',
        isEmergency: true,
        isRead: false
    };
    
    emails.push(newEmail);
    writeJsonFile('emails.json', emails);
    
    res.json({ 
        success: true, 
        message: 'Email received!',
        email: newEmail
    });
});

// Get dashboard stats
app.get('/api/dashboard/:domain', (req, res) => {
    const { domain } = req.params;
    const emails = readJsonFile('emails.json') || [];
    const users = readJsonFile('users.json') || [];
    
    const user = users.find(u => u.domain === domain);
    const userEmails = emails.filter(e => e.domain === domain);
    
    const stats = {
        totalEmails: userEmails.length,
        emergencyEmails: userEmails.filter(e => e.isEmergency).length,
        uptime: 99.2,
        lastOutage: '2 days ago',
        user: user
    };
    
    res.json(stats);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Emergency Email Demo Server running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    if (statusChangeTimer) clearTimeout(statusChangeTimer);
    process.exit(0);
});
