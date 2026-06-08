const { PermissionsBitField } = require('discord.js');
const config = require('../config.json');

function isAuthorized(member) {
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  if (config.authorizedRoleId) {
    const ids = Array.isArray(config.authorizedRoleId) ? config.authorizedRoleId : [config.authorizedRoleId];
    return ids.some(id => member.roles.cache.has(id));
  }
  return false;
}

module.exports = { isAuthorized };
