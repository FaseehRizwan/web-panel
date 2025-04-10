const { safeReply } = require('../utils/replyHelper');

module.exports = {
    name: "kick",
    description: "Kick a user from the group",
    enabled: true, // Dynamically toggle this via plugin manager later

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        // Must be used in a group
        if (!jid.endsWith("@g.us")) {
            return safeReply(sock, jid, "❌ This command can only be used in groups.");
        }

        // Ensure a user is mentioned
        if (args.length === 0) {
            return safeReply(sock, jid, "⚠️ Please mention a user to kick.\nExample: !kick @user");
        }

        // Extract the mentioned number and format it
        const userToKick = args[0].replace("@", "") + "@s.whatsapp.net";

        try {
            await sock.groupParticipantsUpdate(jid, [userToKick], "remove");
            return safeReply(sock, jid, `👢 ${args[0]} has been kicked from the group.`);
        } catch (err) {
            console.error("❌ Kick Error:", err);
            return safeReply(sock, jid, "❌ Failed to kick the user. Make sure the bot is an admin.");
        }
    }
};
