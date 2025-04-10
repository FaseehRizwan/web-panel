const fs = require('fs');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const { getRole, hasPermission } = require('./utils/roleUtils');
const { allowedGroups, prefix } = require('./config');
const chalk = require('chalk');

// Chalk colors for logging
const blue = chalk.hex('#00bfff');
const green = chalk.green;
const red = chalk.red;
const yellow = chalk.yellow;

// Path to the log file
const logFilePath = './botLogs.txt';

// Function to log messages to both console and log file
function logToFile(message) {
    const logMessage = `[${new Date().toISOString()}] ${message}\n`;
    console.log(logMessage); // Log to console
    fs.appendFileSync(logFilePath, logMessage); // Append to log file
}

// Function to load plugins dynamically
async function loadPlugins() {
    const plugins = {};
    const pluginFiles = fs.readdirSync("./pages");

    pluginFiles.forEach(file => {
        if (file.endsWith(".js")) {
            try {
                const plugin = require(`./pages/${file}`);
                plugins[plugin.name] = plugin;
                logToFile(`✅ Loaded plugin: ${plugin.name}`);
            } catch (error) {
                logToFile(`❌ Failed to load plugin ${file}: ${error}`);
            }
        }
    });

    return plugins;
}

// Safe reply function to handle message sending without errors
async function safeReply(sock, jid, message) {
    try {
        if (typeof message === 'string') {
            await sock.sendMessage(jid, { text: message });
        } else {
            await sock.sendMessage(jid, message);
        }
    } catch (error) {
        logToFile(`❌ Error sending message: ${error}`);
    }
}

// Start bot function
async function startBot() {
    logToFile("🤖 Bot is starting...");

    // Load authentication state
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({
        auth: state,
        browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
        syncFullHistory: true,
        qrTimeout: 20000 // Default QR timeout (20 sec)
    });

    sock.ev.on('creds.update', saveCreds);

    // Handle connection updates
    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            logToFile("📸 Scan the QR Code below to connect your bot:");

            // Generate and display the QR code in the terminal
            qrcode.generate(qr, { small: false }); // Use larger QR code in the terminal

            // Save the QR code as a high-resolution image file
            try {
                const qrFilePath = './qr-code.png';
                await QRCode.toFile(qrFilePath, qr, { width: 1000, margin: 4 }); // Increase width and margin
                logToFile(`✅ QR Code saved as '${qrFilePath}'. Open the file to scan it.`);
            } catch (error) {
                logToFile(`❌ Failed to save QR Code as an image: ${error}`);
            }
        }
        if (connection === 'open') {
            logToFile("✅ Bot is now connected!");
        } else if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                logToFile("🔄 Reconnecting...");
                setTimeout(startBot, 5000); // Auto-reconnect after 5 seconds
            } else {
                logToFile("❌ Logged out. Restart the bot and scan QR again.");
            }
        }
    });

    // Wait for the socket to fully initialize and get the `sock.info`
    sock.ev.on('ready', () => {
        logToFile(`Bot is ready with ID: ${sock.info.wid.user}`); // Now we can safely access sock.info
    });

    // Load all plugins dynamically
    const plugins = await loadPlugins();

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg.message) return; // Ignore empty messages

            const sender = msg.key.participant || msg.key.remoteJid;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

            // Skip if it's from the bot itself
            if (sock.info && sender === sock.info.wid.user) return;

            // Skip messages from non-allowed groups
            if (msg.key.remoteJid.endsWith('@g.us') && !allowedGroups.includes(msg.key.remoteJid)) {
                return; // Ignore message from non-allowed groups silently
            }

            // Skip direct messages from numbers not in the allowed groups
            if (!msg.key.remoteJid.endsWith('@g.us') && !allowedGroups.includes(msg.key.remoteJid)) {
                return; // Ignore direct messages from non-allowed numbers
            }

            logToFile(`📩 Message from ${sender}: ${body}`);

            // If the message does not start with the prefix, ignore it
            if (!body.startsWith(prefix)) return;

            // Extract command and arguments
            const args = body.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // Debug: Log the command and args
            logToFile(`📩 Command: ${commandName}, Arguments: ${args}`);

            // Check if the command file exists
            const commandFilePath = `./pages/${commandName}.js`;
            if (!fs.existsSync(commandFilePath)) {
                logToFile(`🚫 Command not found: ${commandName}`);
                return safeReply(sock, msg.key.remoteJid, `❌ Command not found: !${commandName}`);
            }

            // Check if the user has permission to run the command
            if (!hasPermission(sender, commandName)) {
                logToFile(`🚫 Permission denied for ${sender} to use command: ${commandName}`);
                return safeReply(sock, msg.key.remoteJid, `❌ You do not have permission to use !${commandName}`);
            }

            // Execute the command
            const command = require(commandFilePath);
            await command.execute(sock, msg, args);
        } catch (error) {
            logToFile(`❌ Error processing message: ${error}`);
        }
    });
}

// Start the bot
startBot();
