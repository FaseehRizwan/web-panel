const fs = require('fs');
const path = require('path');

// Load all command configuration from JSON
const allConfigPath = path.join(__dirname, 'json/all.json');
let allConfig;

try {
    allConfig = JSON.parse(fs.readFileSync(allConfigPath, 'utf8'));
} catch (error) {
    console.error('Error loading all.json:', error.message);
}

// Command handler
async function execute(sock, msg, args) {
    if (!allConfig || !allConfig.enable) {
        return; // Don't respond if the all command is disabled
    }

    try {
        const chat = await sock.groupMetadata(msg.key.remoteJid);
        if (!chat) {
            return sock.sendMessage(msg.key.remoteJid, { text: allConfig.notGroupMessage });
        }

        // Retrieve group participants
        const participants = chat.participants;
        let mentions = participants.map(participant => `@${participant.id.split('@')[0]}`).join(' ');

        // Send message mentioning all participants
        await sock.sendMessage(msg.key.remoteJid, {
            text: `${allConfig.mentionText} ${mentions}`,
            mentions: participants.map(participant => participant.id),
        });
    } catch (error) {
        console.error('Error processing all command:', error);
        if (allConfig && allConfig.errorMessage) {
            await sock.sendMessage(msg.key.remoteJid, { text: allConfig.errorMessage });
        }
    }
}

module.exports = {
    name: 'all',
    description: 'Mentions all users in the group.',
    execute
};
