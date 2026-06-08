const {
  MODAL_ID, MODAL_CUSTOM_ID,
  BTN_MOINS, BTN_CUSTOM, BTN_VALIDER,
  handleSlashPayout,
  handleSlashPayoutConfig,
  handleModalPayout,
  handleModalCustomEnchere,
  handleButtonEnchere,
} = require('../commands/payout');

module.exports = function registerInteractionHandler(client, config) {
  client.on('interactionCreate', async (interaction) => {
    try {

      // ── Slash commands ────────────────────────────────────────────────────
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'payout')
          return await handleSlashPayout(interaction);

        if (interaction.commandName === 'payoutconfig')
          return await handleSlashPayoutConfig(interaction, config);
      }

      // ── Modal submits ─────────────────────────────────────────────────────
      if (interaction.isModalSubmit()) {
        if (interaction.customId === MODAL_ID)
          return await handleModalPayout(interaction, config);

        if (interaction.customId.startsWith(MODAL_CUSTOM_ID))
          return await handleModalCustomEnchere(interaction, config);
      }

      // ── Boutons ───────────────────────────────────────────────────────────
      if (interaction.isButton()) {
        // Bouton "Ouvrir le formulaire" depuis !payout
        if (interaction.customId === 'payout_open_modal') {
          const { isAuthorized } = require('../utils/permissions');
          if (!isAuthorized(interaction.member))
            return interaction.reply({ content: '❌ Tu n\'as pas la permission de créer un payout.', ephemeral: true });
          return await handleSlashPayout(interaction);
        }

        const base = interaction.customId.split('|')[0];
        if ([BTN_MOINS, BTN_CUSTOM, BTN_VALIDER].includes(base))
          return await handleButtonEnchere(interaction, config);
      }

    } catch (err) {
      console.error('[interactionCreate]', err);
      const errMsg = { content: '❌ Une erreur s\'est produite.', ephemeral: true };
      if (interaction.replied || interaction.deferred)
        interaction.followUp(errMsg).catch(() => {});
      else
        interaction.reply(errMsg).catch(() => {});
    }
  });
};