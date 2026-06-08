module.exports = async function cmdHelp(message, prefix = '!') {
  const p = prefix;
  const embed = {
    color: 0xc8a84b,
    title: '⚔️ Albion Quartermaster',
    fields: [
      { name: `\`${p}ocrtag\``,           value: 'Réponds à un screenshot → extrait et mentionne les pseudos.' },
      { name: `\`${p}addrole @role\``,    value: `Réponds au message \`${p}ocrtag\` → attribue le rôle à tous les membres mentionnés.` },
      { name: `\`${p}removerole @role\``, value: 'Retire le rôle de **tous** les membres qui le possèdent.' },
      { name: `\`${p}setbotrole @role\``, value: '*(Admin)* Ajoute un rôle autorisé à utiliser le bot.' },
      { name: `\`${p}setprefix <prefix>\``, value: '*(Admin)* Change le préfixe des commandes.' },
      { name: `\`${p}payout\` ou \`/payout\``, value: 'Ouvre le formulaire de payout (calcul VM, frais, enchères).' },
      { name: '`/payoutconfig`',          value: '*(Admin)* Configure les paramètres du payout.' },
    ],
    footer: { text: `Préfixe actuel : ${p} • Les administrateurs peuvent toujours utiliser le bot.` },
  };
  return message.reply({ embeds: [embed] });
};
