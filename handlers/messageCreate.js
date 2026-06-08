const cmdOcrTag             = require('../commands/ocrtag');
const cmdAddRole            = require('../commands/addrole');
const cmdRemoveRole         = require('../commands/removerole');
const cmdSetBotRole         = require('../commands/setbotrole');
const cmdSetPrefix          = require('../commands/setprefix');
const cmdHelp               = require('../commands/help');
const { handlePrefixPayout } = require('../commands/payout');

module.exports = function registerMessageHandler(client, config) {
  const prefix = config.prefix ?? '!';

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const [cmd] = message.content.slice(prefix.length).trim().split(/\s+/);

    try {
      switch (cmd.toLowerCase()) {
        case 'ocrtag':      await cmdOcrTag(message); break;
        case 'addrole':     await cmdAddRole(message, client); break;
        case 'removerole':  await cmdRemoveRole(message); break;
        case 'setbotrole':  await cmdSetBotRole(message, client, config); break;
        case 'setprefix':   await cmdSetPrefix(message, config); break;
        case 'payout':      await handlePrefixPayout(message); break;
        case 'help':        await cmdHelp(message, prefix); break;
      }
    } catch (err) {
      console.error(`[messageCreate] ${prefix}${cmd} :`, err);
      message.reply('❌ Une erreur inattendue s\'est produite.').catch(() => {});
    }
  });
};
