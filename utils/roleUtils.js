const { roles } = require("../config");
const fs = require('fs');
const path = require('path');

// Cache for user roles
const roleCache = new Map();

// Load role mappings from role.json
function loadRoleMappings() {
    try {
        const roleData = fs.readFileSync(path.join(__dirname, '../role.json'));
        return JSON.parse(roleData);
    } catch (err) {
        console.error('Error loading role.json:', err);
        return {};
    }
}

// Get a user's role with proper lookup
function getRole(userId) {
    // Check cache first
    if (roleCache.has(userId)) {
        return roleCache.get(userId);
    }

    // Normalize userId
    const normalizedId = userId.includes('@') ? userId.split('@')[0] : userId;
    
    // Load role mappings
    const roleMappings = loadRoleMappings();
    
    // Check for user-specific role first
    if (roleMappings.users && roleMappings.users[normalizedId]) {
        const role = roleMappings.users[normalizedId];
        roleCache.set(userId, role);
        return role;
    }
    
    // Default to member role
    roleCache.set(userId, 'member');
    return 'member';
}

// Enhanced permission check with hierarchy
function hasPermission(userId, command) {
    try {
        const role = getRole(userId);
        const roleData = roles[role];
        
        // Check if role exists and has the command
        if (roleData?.allowedCommands?.includes(command)) {
            return true;
        }
        
        // Check role hierarchy (master > admin > vip > member)
        const hierarchy = ['master', 'admin', 'vip', 'member'];
        const roleIndex = hierarchy.indexOf(role);
        
        // Check higher roles in hierarchy
        for (let i = roleIndex - 1; i >= 0; i--) {
            const higherRole = hierarchy[i];
            if (roles[higherRole]?.allowedCommands?.includes(command)) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
}

module.exports = { hasPermission, getRole };
