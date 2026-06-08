const { isAuthorized } = require('../utils/permissions');

// Délai entre chaque attribution de rôle pour respecter le rate limit Discord
const ROLE_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = async function cmdAddRole(message, client) {
  if (!isAuthorized(message.member))
    return message.reply('❌ Tu n\'as pas la permission d\'utiliser cette commande.');

  const role = message.mentions.roles.first();
  if (!role) return message.reply('❌ Mentionne un rôle. Ex: `!addrole @Joueurs`');

  if (!message.reference)
    return message.reply('❌ Utilise cette commande en répondant au message contenant les mentions.');

  const targetMessage = await message.channel.messages.fetch(message.reference.messageId);

  // Regex au lieu de .mentions.members — pas de plafond à 50
  const mentionRegex = /<@!?(\d+)>/g;
  const memberIds    = new Set();
  let match;
  while ((match = mentionRegex.exec(targetMessage.content)) !== null) {
    if (match[1] !== client.user.id) memberIds.add(match[1]);
  }

  if (memberIds.size === 0)
    return message.reply('❌ Aucune mention trouvée dans le message cible.');

  await message.guild.members.fetch();
  const processing = await message.reply(`⏳ Attribution en cours... (0/${memberIds.size})`);
  const success = [];
  const errors  = [];

  for (const id of memberIds) {
    const member = message.guild.members.cache.get(id);
    if (!member) { errors.push(id); continue; }
    try {
      await member.roles.add(role);
      success.push(member.displayName);
    } catch {
      errors.push(member.displayName);
    }
    // Mise à jour du compteur en temps réel + délai anti rate-limit
    await processing.edit(`⏳ Attribution en cours... (${success.length + errors.length}/${memberIds.size})`);
    await sleep(ROLE_DELAY_MS);
  }

  let reply = `✅ **${role.name}** — ${success.length}/${memberIds.size} membres ajoutés`;
  if (success.length > 0) reply += `\n${success.map(n => `\`${n}\``).join(', ')}`;
  if (errors.length > 0) reply += `\n❌ Échec (${errors.length}) : ${errors.map(n => `\`${n}\``).join(', ')}`;
  return processing.edit(reply);
};