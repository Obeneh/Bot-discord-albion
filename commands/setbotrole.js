const { PermissionsBitField } = require('discord.js');
const fs = require('fs');

module.exports = async function cmdSetBotRole(message, _client, config) {
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return message.reply('❌ Seuls les administrateurs peuvent configurer le bot.');

  const role = message.mentions.roles.first();
  if (!role) return message.reply('❌ Mentionne un rôle. Ex: `!setbotrole @Modérateurs`');

  // Supporte plusieurs rôles autorisés (tableau)
  if (!Array.isArray(config.authorizedRoleId)) config.authorizedRoleId = [];
  if (!config.authorizedRoleId.includes(role.id)) {
    config.authorizedRoleId.push(role.id);
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
  }

  return message.reply(`✅ Rôle **${role.name}** ajouté aux rôles autorisés.`);
};
