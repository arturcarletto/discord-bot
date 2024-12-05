const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of available commands.'),
    async execute(interaction) {
        const helpMessage = `
**Available Commands:**
- \`/clear <amount>\`: Deletes a specified number of messages.
- \`/irritatingnoise <@mention>\`: Tortures a member by switching them between two voice channels every second.
- \`/stopirritatingnoise <@mention>\`: Stops the irritating noise for a member.
- \`/music <link or search>\`: Plays music from YouTube based on a link or search query.
- \`/stopmusic\`: Stops the music and leaves the voice channel.
- \`/roulette\`: Starts a roulette game where a random participant wins.
- \`/radmin\`: Displays the Radmin server name and password.
    `;

        await interaction.reply({ content: helpMessage, ephemeral: true });
    },
};
