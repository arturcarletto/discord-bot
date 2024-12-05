const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stopmusic')
        .setDescription('Stops the music and leaves the voice channel.'),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const connection = getVoiceConnection(guildId);

        if (!connection) {
            return interaction.reply({ content: 'I am not connected to a voice channel.', ephemeral: true });
        }

        const player = interaction.client.subscriptions.get(guildId);
        if (player) {
            player.stop();
            interaction.client.subscriptions.delete(guildId);
        }

        connection.destroy();

        await interaction.reply({ content: 'Music stopped and left the voice channel.' });
    },
};
