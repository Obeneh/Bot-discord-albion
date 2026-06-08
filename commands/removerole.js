const { isAuthorized } = require('../utils/permissions');

module.exports = async function cmdRemoveRole(message) {
  if (!isAuthorized(message.member))
    return message.reply('❌ Tu n\'as pas la permission d\'utiliser cette commande.');

  const role = message.mentions.roles.first();
  if (!role) return message.reply('❌ Mentionne un rôle. Ex: `!removerole @Joueurs`');

  await message.guild.members.fetch();
  const membersWithRole = message.guild.members.cache.filter(m => m.roles.cache.has(role.id));

  if (membersWithRole.size === 0)
    return message.reply(`ℹ️ Aucun membre ne possède le rôle **${role.name}**.`);

  const processing = await message.reply('⏳ ...');
  const success = [];
  const errors  = [];

  for (const [, member] of membersWithRole) {
    try {
      await member.roles.remove(role);
      success.push(member.displayName);
    } catch {
      errors.push(member.displayName);
    }
  }

  let reply = `✅ **${role.name}** retiré à ${success.length} membre(s).`;
  if (errors.length > 0) reply += `\n❌ ${errors.map(n => `\`${n}\``).join(', ')}`;
  return processing.edit(reply);
};
