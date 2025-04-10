const fs = require('fs'); 
const path = require('path');

// Load welcome messages from the external JSON file
const welcomeFilePath = path.join(__dirname, 'json/welcome.json');
let welcomeMessages = [];

try {
    const rawData = fs.readFileSync(welcomeFilePath);
    welcomeMessages = JSON.parse(rawData);
    console.log("✅ Loaded welcome messages: Done");  // Log the loaded messages
} catch (error) {
    console.error("❌ Failed to load welcome messages from welcome.json:", error);
}

module.exports = {
    name: 'welcome',
    description: 'Welcomes new members to the group with a random message.',
    enabled: true, // Toggle to enable/disable the plugin dynamically
    execute: async (sock, msg, participants, groupId) => {
        if (!this.enabled) {
            return;  // If plugin is disabled, do nothing
        }

        if (participants.length === 0) {
            console.log("⚠️ No participants to welcome.");
            return;  // If no participants to welcome, do nothing
        }

        console.log(`👤 New user joined: ${participants.join(", ")} to group ${groupId}`);

        // Loop through each participant that joins the group
        for (const participant of participants) {
            try {
                const username = `@${participant.split('@')[0]}`; // Format the username

                // Check if welcome messages are loaded and have content
                if (welcomeMessages.length === 0) {
                    console.log("❌ No welcome messages loaded.");
                    return;
                }

                // Randomly choose a welcome message from the loaded JSON file
                const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)].replace('@{{user}}', username);

                // Log the randomly selected message for debugging
                console.log("📩 Selected welcome message:", randomMessage);

                // Check if the message is valid
                if (!randomMessage || randomMessage.trim().length === 0) {
                    console.log("❌ No valid welcome message found. Skipping...");
                    return;
                }

                // Ensure the message is being passed as text
                const messageData = {
                    text: randomMessage,
                    mentions: [participant]  // Ensure the participant is properly mentioned
                };

                // Send the welcome message to the group
                const result = await sock.sendMessage(groupId, messageData);

                // Confirm that the message was sent
                console.log(`✅ Sent welcome message to ${participant}: ${randomMessage}`);
                console.log(result); // Log the result for further inspection

            } catch (error) {
                console.error(`❌ Error sending welcome message to ${participant}:`, error);
            }
        }
    }
};
