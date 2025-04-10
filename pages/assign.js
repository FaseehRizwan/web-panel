const fs = require('fs');
const path = require('path');

// Path to roles.json file
const rolesFilePath = path.join(__dirname, '../role.json');

// Command handler for the !assign command
async function execute(client, msg, args) {
    if (args.length < 2) {
        return client.sendMessage(msg.from, 'Please provide both a user and a role. Example: !assign @user role');
    }

    const userNumber = args[0].replace('@', '').trim() + '@s.whatsapp.net';  // Format the user number correctly
    const roleName = args[1].toLowerCase().trim();  // Get the role name and make it lowercase

    // Load roles from roles.json
    let roles;
    try {
        roles = JSON.parse(fs.readFileSync(rolesFilePath, 'utf8'));
    } catch (error) {
        console.error('Error loading roles.json:', error.message);
        return client.sendMessage(msg.from, 'There was an error reading the role data.');
    }

    // Check if the role exists
    if (!roleName) {
        return client.sendMessage(msg.from, 'Please provide a valid role.');
    }

    // Check if the user exists in roles.json
    if (!roles[userNumber]) {
        return client.sendMessage(msg.from, 'User not found in the role list.');
    }

    // Assign the new role to the user
    roles[userNumber] = roleName;

    // Save the updated roles back to roles.json
    try {
        fs.writeFileSync(rolesFilePath, JSON.stringify(roles, null, 2));
        return client.sendMessage(msg.from, `Successfully assigned the role "${roleName}" to ${userNumber}.`);
    } catch (error) {
        console.error('Error saving roles.json:', error.message);
        return client.sendMessage(msg.from, 'There was an error saving the role data.');
    }
}

// Export the execute function
module.exports = {
    name: 'assign',
    execute: execute,
};
