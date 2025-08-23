"# emergency-email-app" 

PROJECT STRUCTURE

emergency-email-app/
├── package.json
├── server.js
├── data/
│   ├── users.json
│   ├── emails.json
│   └── server-status.json
├── public/
│   ├── index.html
│   ├── register.html
│   ├── dashboard.html
│   ├── emergency-mail.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
└── README.md

# Emergency Email Continuity App

A demo application that provides emergency email backup services during server outages.

## Features

- **Real-time Server Monitoring**: Continuous monitoring of primary email server status
- **Emergency Email Interface**: Webmail-like interface for critical communications during outages
- **Automatic Failover**: Seamless switching to backup email service
- **Interactive Dashboard**: Real-time status updates and statistics
- **Fake Email Simulation**: Demonstrates email functionality without real email infrastructure

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: JSON file storage
- **Real-time Features**: Polling-based status updates

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. Open your browser to `http://localhost:3000`

## Usage

1. **Register a Domain**: Use the registration form to add your domain
2. **Monitor Status**: View your server status on the dashboard
3. **Emergency Mode**: When server goes down, access emergency email interface
4. **Send/Receive**: Use the emergency interface to handle critical emails

## Demo Features

- Simulated server outages and recoveries
- Real-time notifications
- Interactive email interface
- Activity logging


## Author

[Zara khan] 
