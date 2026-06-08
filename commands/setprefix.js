const { PermissionsBitField } = require('discord.js');
const fs = require('fs');

module.exports = async function cmdSetPrefix(message, config) {
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return message.reply('❌ Seuls les administrateurs peuvent changer le préfixe.');

  const newPrefix = message.content.split(/\s+/)[1];
  if (!newPrefix || newPrefix.length > 3)
    return message.reply('❌ Fournis un préfixe valide (1-3 caractères). Ex: `!setprefix ?`');

  config.prefix = newPrefix;
  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

  return message.reply(`✅ Préfixe changé en \`${newPrefix}\`. Redémarre le bot pour appliquer.`);
};
