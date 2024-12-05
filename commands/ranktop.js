const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranktop')
        .setDescription('Displays the leaderboard of top-ranked members.'),
    async execute(interaction) {
        const { User } = interaction.client.models;

        const topUsers = await User.findAll({
            where: { guildId: interaction.guild.id },
            order: [['xp', 'DESC']],
            limit: 10,
        });

        if (topUsers.length === 0) {
            return interaction.reply('No one has gained any XP yet.');
        }

        const leaderboard = topUsers
            .map(
                (user, index) =>
                    `**${index + 1}.** <@${user.userId}> - Level ${user.level} (${user.xp} XP)`
            )
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🏆 Leaderboard')
            .setDescription(leaderboard)
            .setColor('#f1c40f');

        await interaction.reply({ embeds: [embed] });
    },
};
