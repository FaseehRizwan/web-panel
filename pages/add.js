module.exports = {
    name: 'add',
    description: 'Adds a new member to the group.',
    enabled: true,
    execute: async (sock, msg, args) => {
        try {
            // Ensure that the message is from a group
            const groupId = msg.key.remoteJid;
            if (!groupId.endsWith('@g.us')) {
                return await sock.sendMessage(msg.key.remoteJid, { text: '❌ This command can only be used in groups.' });
            }

            // Validate the participant argument
            if (!args || args.length === 0) {
                return await sock.sendMessage(groupId, { text: '❌ Please provide a valid phone number to add.' });
            }

            // Sanitize the participant argument to remove the '+' symbol
            const participant = args[0].replace(/^\+/, ''); // Remove '+' if it exists at the start
            const participantId = participant.includes('@') ? participant : `${participant}@s.whatsapp.net`;

            console.log(`🔍 Debug: groupId = ${groupId}, participantId = ${participantId}`);

            // Check if the participant is already in the group
            const groupMetadata = await sock.groupMetadata(groupId);
            const isAlreadyMember = groupMetadata.participants.some(p => p.id === participantId);

            if (isAlreadyMember) {
                return await sock.sendMessage(groupId, { text: `❌ The user ${participantId} is already a member of the group.` });
            }

            // Add the participant to the group
            console.log(`🚀 Adding participant: ${participantId} to group: ${groupId}`);
            await sock.groupParticipantsUpdate(groupId, [participantId], 'add');
            console.log(`✅ Successfully added ${participantId} to the group!`);

            // Remove the confirmation message
            // await sock.sendMessage(groupId, { text: `✅ Successfully added ${participantId} to the group!` });

        } catch (error) {
            console.error("❌ Error adding participant:", error);

            // Handle specific errors
            let errorMessage = '❌ Failed to add the participant.';
            if (error.message.includes('not-authorized')) {
                errorMessage = '❌ You do not have permission to add participants to this group.';
            } else if (error.message.includes('invalid-jid')) {
                errorMessage = '❌ The provided phone number is invalid.';
            } else if (error.message.includes('403')) {
                errorMessage = '❌ The bot is not an admin in this group.';
            }

            await sock.sendMessage(msg.key.remoteJid, { text: `${errorMessage} Error: ${error.message}` });
        }
    }
};