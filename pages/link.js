const fs = require('fs');
const path = require('path');
const { safeReply } = require('../utils/replyHelper');

// Load group links from the external JSON file
const linksFilePath = path.join(__dirname, '/json/link.json');
let groupLinks = {};

try {
    const rawData = fs.readFileSync(linksFilePath);
    groupLinks = JSON.parse(rawData);
} catch (error) {
    console.error("❌ Failed to load group links from link.json:", error);
}

function generateGroupList() {
    return Object.keys(groupLinks)
        .map(group => `- *${group}*`)
        .join('\n');
}

module.exports = {
    name: 'link',
    description: 'Get the invite link for a specified group',
    enabled: true, // Make it toggle-able from panel

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        if (args.length === 0) {
            return safeReply(sock, jid, `📢 Available groups:\n${generateGroupList()}\n\n📝 Type \`!link [GroupName]\` to get the link.`);
        }

        const groupName = args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase();

        if (groupLinks[groupName]) {
            return safeReply(sock, jid, `🔗 Link for *${groupName}*:\n${groupLinks[groupName]}`);
        } else {
            return safeReply(sock, jid, `❌ Group not found. Please check the name.\n\n📢 Available groups:\n${generateGroupList()}`);
        }
    }
};
