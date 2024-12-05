const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of available commands.'),
    async execute(interaction) {
        const helpMessage = `
**Available Commands:**
- \`/clear <amount>\`: Deletes a specified number of messages.
- \`/help\`: Displays this help message.
    `;

        await interaction.reply({ content: helpMessage, ephemeral: true });
    },
};
