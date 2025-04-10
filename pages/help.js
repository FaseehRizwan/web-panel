const fs = require('fs');
const path = require('path');

// Load help configuration
const helpConfigPath = path.join(__dirname, 'json/help.json');
let helpConfig;

try {
    helpConfig = JSON.parse(fs.readFileSync(helpConfigPath, 'utf8'));
} catch (error) {
    console.error('Error loading help.json:', error.message);
    helpConfig = { 
        enable: true,
        statusText: 'Help information not available'
    };
}

// Command handler
async function execute(sock, msg, args) {
    if (!helpConfig.enable) {
        return; // Don't respond if help is disabled
    }
    try {
        await sock.sendMessage(msg.key.remoteJid, { text: helpConfig.statusText });
    } catch (error) {
        console.error('Error sending help message:', error);
    }
}

module.exports = {
    name: 'help',
    description: 'Displays help information.',
    execute
};
