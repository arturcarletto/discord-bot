const { SlashCommandBuilder } = require('discord.js');

// Temporary storage for ongoing tortures (this should ideally use a database)
const ongoingTortures = [
    { user: 'User1', tortureType: 'Looping Music', startTime: '2024-12-05 12:00:00' },
    { user: 'User2', tortureType: 'Annoying Pings', startTime: '2024-12-05 12:30:00' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewtortures')
        .setDescription('View all ongoing tortures.'),
    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');

        if (ongoingTortures.length === 0) {
            return interaction.reply({ content: 'No tortures are currently in progress.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('Ongoing Tortures')
            .setColor('#FF0000')
            .setDescription('Here is a list of currently active tortures:');

        ongoingTortures.forEach((torture, index) => {
            embed.addFields({
                name: `Torture #${index + 1}`,
                value: `**User**: ${torture.user}\n**Type**: ${torture.tortureType}\n**Started**: ${torture.startTime}`
            });
        });

        await interaction.reply({ embeds: [embed], ephemeral: false });
    },
};