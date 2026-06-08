const { isAuthorized }                        = require('../utils/permissions');
const { downloadImage, runOCR, findMember, findMemberFuzzy } = require('../utils/ocr');

module.exports = async function cmdOcrTag(message) {
  if (!isAuthorized(message.member))
    return message.reply('❌ Tu n\'as pas la permission d\'utiliser cette commande.');

  const targetMessage = message.reference
    ? await message.channel.messages.fetch(message.reference.messageId)
    : message;

  const imageAttachment = targetMessage.attachments.find(a => a.contentType?.startsWith('image/'));
  if (!imageAttachment)
    return message.reply('❌ Aucune image trouvée. Réponds à un message contenant un screenshot Albion.');

  const processing = await message.reply('🔍 Analyse OCR en cours...');

  try {
    const buffer = await downloadImage(imageAttachment.url);
    const names  = await runOCR(buffer);

    if (names.length === 0)
      return processing.edit('⚠️ Aucun pseudo détecté. Essaie `!ocrdebug` pour diagnostiquer.');

    await message.guild.members.fetch();
    const found    = [];
    const notFound = [];

    for (const name of names) {
      const member = findMember(message.guild, name) || findMemberFuzzy(message.guild, name);
      if (member && !found.includes(member)) found.push(member);
      else if (!member) notFound.push(name);
    }

    let reply = found.map(m => m.toString()).join(' ');
    if (notFound.length > 0)
      reply += `\n⚠️ Non trouvés (${notFound.length}) : ${notFound.map(n => `\`${n}\``).join(', ')}`;

    return processing.edit(reply || '⚠️ Aucun membre trouvé.');
  } catch (err) {
    console.error('[ocrtag]', err);
    return processing.edit('❌ Erreur lors de l\'analyse OCR.');
  }
};
