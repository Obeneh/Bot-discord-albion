const {
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, EmbedBuilder,
  ButtonBuilder, ButtonStyle,
  PermissionsBitField,
} = require('discord.js');
const { calcPayout } = require('../utils/payoutCalc');
const fs = require('fs');

// ─── Constantes ──────────────────────────────────────────────────────────────

const MODAL_ID        = 'payout_modal';
const BTN_MOINS       = 'payout_moins';
const BTN_CUSTOM      = 'payout_custom';
const BTN_VALIDER     = 'payout_valider';
const MODAL_CUSTOM_ID = 'payout_custom_modal';

// ─── Helpers UI ──────────────────────────────────────────────────────────────

function fmt(n) {
  return Math.round(n).toLocaleString('fr-FR') + ' 🪙';
}

/**
 * Construit la rangée de boutons d'enchère.
 * Le pct et la vm sont encodés dans le customId pour conserver l'état sans BDD.
 */
function buildEnchereRow(pct, vm, config) {

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BTN_MOINS}|${pct}|${vm}`)
      .setLabel('-1%')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(pct <= 0),

    new ButtonBuilder()
      .setCustomId(`${BTN_CUSTOM}|${pct}|${vm}`)
      .setLabel('Valeur perso (↓)')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`${BTN_VALIDER}|${pct}|${vm}`)
      .setLabel(`✅ Valider`)
      .setStyle(ButtonStyle.Primary),
  );
}

/**
 * Construit l'embed récap payout.
 */
function buildPayoutEmbed(fields, pct, config, bidder = null) {
  const { vm, rep, map, coffre } = fields;
  const p = calcPayout(vm, rep, pct);

  return new EmbedBuilder()
    .setColor(0xc8a84b)
    .setTitle('💰 Payout — Récap')
    .addFields(
      { name: 'Map',     value: map,    inline: true },
      { name: 'Coffre',  value: coffre, inline: true },
      { name: '\u200b',  value: '\u200b', inline: true },
      { name: 'VM estimée',                         value: fmt(p.vm),          inline: true },
      { name: 'Réparation',                         value: `- ${fmt(p.rep)}`,  inline: true },
      { name: `Frais guilde (${p.fraisGuildePct}%)`, value: `- ${fmt(p.fraisGuilde)}`, inline: true },
      { name: `Prix Final (-${p.remisePct}%)`,         value: bidder ? `${fmt(p.prixFinal)}\n👤 ${bidder}` : fmt(p.prixFinal), inline: true },
      { name: '✅ Net joueurs',                      value: fmt(p.netJoueurs), inline: true },
    )
    .setFooter({ text: `Enchère courante : ${pct}% — utilisez les boutons pour ajuster` });
}

// ─── Slash command : /payout ─────────────────────────────────────────────────

async function handleSlashPayout(interaction) {
  const modal = new ModalBuilder()
    .setCustomId(MODAL_ID)
    .setTitle('📦 Nouveau Payout');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('map')
        .setLabel('Map')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: Blackzone T8, Randomized...')
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('coffre')
        .setLabel('Coffre')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: HO - Secure 2 / Île de guilde - DJ AVA')
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('vm')
        .setLabel('Estimation VM (silver)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 15000000')
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reparation')
        .setLabel('Réparation (silver)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 500000')
        .setRequired(true)
    ),
  );

  await interaction.showModal(modal);
}

// ─── Slash command : /payoutconfig ───────────────────────────────────────────

async function handleSlashPayoutConfig(interaction, config) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return interaction.reply({ content: '❌ Administrateurs uniquement.', ephemeral: true });

  const role       = interaction.options.getRole('role');
  const frais      = interaction.options.getNumber('frais_guilde');
  const enchDepart = interaction.options.getNumber('enchere_depart');

  if (role)       config.payoutRoleId         = role.id;
  if (frais)      config.payoutFraisGuilde     = frais;
  if (enchDepart) config.payoutEnchereDepart   = enchDepart;

  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

  const lines = [
    role       ? `Rôle acheteur : <@&${role.id}>` : null,
    frais      ? `Frais guilde  : **${frais}%**`   : null,
    enchDepart ? `Enchère départ : **${enchDepart}%**` : null,
  ].filter(Boolean);

  return interaction.reply({
    content: lines.length ? `✅ Config mise à jour :\n${lines.join('\n')}` : 'ℹ️ Aucun changement.',
    ephemeral: true,
  });
}

// ─── Modal submit : payout_modal ─────────────────────────────────────────────

async function handleModalPayout(interaction, config) {
  const map    = interaction.fields.getTextInputValue('map').trim();
  const coffre = interaction.fields.getTextInputValue('coffre').trim();
  const vmRaw  = interaction.fields.getTextInputValue('vm').replace(/\s/g, '').replace(',', '.');
  const repRaw = interaction.fields.getTextInputValue('reparation').replace(/\s/g, '').replace(',', '.');

  const vm  = parseFloat(vmRaw);
  const rep = parseFloat(repRaw);

  if (isNaN(vm) || isNaN(rep))
    return interaction.reply({ content: '❌ VM et Réparation doivent être des nombres.', ephemeral: true });

  const enchPct = config.payoutEnchereDepart ?? 15;
  const embed   = buildPayoutEmbed({ vm, rep, map, coffre }, enchPct, config);
  const row     = buildEnchereRow(enchPct, vm, config);

  // Tag le rôle acheteur si configuré
  const roleMention = config.payoutRoleId ? `<@&${config.payoutRoleId}>` : null;

  await interaction.reply({
    content: roleMention ?? undefined,
    embeds: [embed],
    components: [row],
  });
}

// ─── Modal submit : payout_custom_modal ──────────────────────────────────────

async function handleModalCustomEnchere(interaction, config) {
  // Le pct actuel et la vm sont passés dans le customId du modal custom
  const [, , pctPrev, vmStr] = interaction.customId.split('|');
  const vm  = parseFloat(vmStr);
  const max = config.payoutEnchereDepart ?? 15;

  const rawPct = interaction.fields.getTextInputValue('custom_pct').replace(',', '.').trim();
  let pct = parseFloat(rawPct);

  const pctCurrent = parseFloat(pctPrev);
  if (isNaN(pct) || pct < 0 || pct >= pctCurrent) {
    return interaction.reply({
      content: `❌ Valeur invalide. Doit être entre **0%** et **${pctCurrent - 0.1}%** (strictement inférieur à l'enchère actuelle de ${pctCurrent}%).`,
      ephemeral: true,
    });
  }

  pct = Math.round(pct * 10) / 10; // 1 décimale max

  // Récupère les champs de l'embed original pour le reconstruire
  const original = interaction.message;
  const oldEmbed = original.embeds[0];

  // Extrait map & coffre depuis les fields de l'embed existant
  const map    = oldEmbed.fields.find(f => f.name === 'Map')?.value    ?? '—';
  const coffre = oldEmbed.fields.find(f => f.name === 'Coffre')?.value ?? '—';
  const repStr = oldEmbed.fields.find(f => f.name === 'Réparation')?.value ?? '0';
  const rep    = parseFloat(repStr.replace(/[^\d.]/g, '')) || 0;

  const embed = buildPayoutEmbed({ vm, rep, map, coffre }, pct, config, interaction.member.displayName);
  const row   = buildEnchereRow(pct, vm, config);

  await interaction.update({ embeds: [embed], components: [row] });
}

// ─── Boutons enchère ─────────────────────────────────────────────────────────

async function handleButtonEnchere(interaction, config) {
  const parts   = interaction.customId.split('|');
  const action  = parts[0]; // ex: "payout_moins"
  let   pct     = parseFloat(parts[1]);
  const vm      = parseFloat(parts[2]);
  const oldEmbed = interaction.message.embeds[0];
  const map      = oldEmbed.fields.find(f => f.name === 'Map')?.value    ?? '—';
  const coffre   = oldEmbed.fields.find(f => f.name === 'Coffre')?.value ?? '—';
  const repStr   = oldEmbed.fields.find(f => f.name === 'Réparation')?.value ?? '0';
  const rep      = parseFloat(repStr.replace(/[^\d.]/g, '')) || 0;

  if (action === BTN_MOINS) {
    pct = Math.max(0, pct - 1);
    const embed = buildPayoutEmbed({ vm, rep, map, coffre }, pct, config, interaction.member.displayName);
    return interaction.update({ embeds: [embed], components: [buildEnchereRow(pct, vm, config)] });
  }

  if (action === BTN_CUSTOM) {
    // Ouvre un modal pour saisir une valeur personnalisée
    const modal = new ModalBuilder()
      .setCustomId(`${MODAL_CUSTOM_ID}|x|${pct}|${vm}`)
      .setTitle('Enchère personnalisée');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('custom_pct')
          .setLabel(`% souhaité (0 → ${pct - 1}, strictement inférieur)`)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(`Ex: 10`)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  if (action === BTN_VALIDER) {
    const { isAuthorized } = require('../utils/permissions');
    if (!isAuthorized(interaction.member))
      return interaction.reply({ content: '❌ Tu n\'as pas la permission de finaliser le payout.', ephemeral: true });

    // Récupère le bidder depuis le field Prix Final de l'embed courant
    const prixField = oldEmbed.fields.find(f => f.name.startsWith('Prix Final'));
    const bidderMatch = prixField?.value?.match(/👤 (.+)$/m);
    const bidder = bidderMatch ? bidderMatch[1] : null;

    const embed = buildPayoutEmbed({ vm, rep, map, coffre }, pct, config, bidder);
    embed.setFooter({ text: bidder
      ? `✅ Payout finalisé — ${bidder} remporte à -${pct}% — validé par ${interaction.member.displayName}`
      : `✅ Payout finalisé à -${pct}% — validé par ${interaction.member.displayName}`
    });
    embed.setColor(0x57f287);
    return interaction.update({ embeds: [embed], components: [] });
  }
}

// ─── Commande !payout (prefix) ───────────────────────────────────────────────
// Les modals nécessitent une interaction — on poste un bouton qui l'ouvre

async function handlePrefixPayout(message) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    
      .setCustomId('payout_open_modal')
      .setLabel('📦 Ouvrir le formulaire de payout')
      .setStyle(ButtonStyle.Primary)
  );
  await message.reply({ content: '👇 Clique pour remplir le formulaire.', components: [row] });
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  MODAL_ID,
  MODAL_CUSTOM_ID,
  BTN_MOINS, BTN_CUSTOM, BTN_VALIDER,
  handleSlashPayout,
  handleSlashPayoutConfig,
  handleModalPayout,
  handleModalCustomEnchere,
  handleButtonEnchere,
  handlePrefixPayout,
};