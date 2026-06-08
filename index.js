const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

require('./handlers/messageCreate')(client, config);
require('./handlers/interactionCreate')(client, config);

async function deployCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('payout')
      .setDescription('Ouvrir le formulaire de payout'),

    new SlashCommandBuilder()
      .setName('payoutconfig')
      .setDescription('Configurer les paramètres du payout (admin)')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addRoleOption(o =>
        o.setName('role')
         .setDescription('Rôle à mentionner pour le rachat (ex: @Acheteurs)')
         .setRequired(false)
      )
      .addNumberOption(o =>
        o.setName('frais_guilde')
         .setDescription('% de frais guilde prélevés sur la VM (défaut : 5)')
         .setMinValue(0).setMaxValue(100)
         .setRequired(false)
      )
      .addNumberOption(o =>
        o.setName('enchere_depart')
         .setDescription('% de rachat guilde au départ des enchères (défaut : 15)')
         .setMinValue(0).setMaxValue(100)
         .setRequired(false)
      ),
  ].map(c => c.toJSON());

  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    console.log('📡 Slash commands déployées.');
  } catch (err) {
    console.error('❌ Erreur déploiement slash commands :', err);
  }
}

client.once('clientReady', async () => {
  console.log(`⚔️  Albion Quartermaster en ligne — ${client.user.tag}`);
  client.user.setActivity('gérer la guilde | !help', { type: 4 });
  await deployCommands();
});

client.login(config.token);
