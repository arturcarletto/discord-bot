const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Displays your rank or the rank of a specified member.')
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription('The member to view')
                .setRequired(false)
        ),
    async execute(interaction) {
        const User = interaction.client.models.User;

        if (!User) {
            console.error('User model is not defined.');
            return interaction.reply({
                content: 'An error occurred while accessing the database.',
                ephemeral: true,
            });
        }

        const targetUser = interaction.options.getUser('member') || interaction.user;

        let user;
        try {
            user = await User.findOne({
                where: { userId: targetUser.id, guildId: interaction.guild.id },
            });
        } catch (error) {
            console.error('Database error:', error);
            return interaction.reply({
                content: 'An error occurred while accessing the database.',
                ephemeral: true,
            });
        }

        if (!user) {
            return interaction.reply({
                content: 'User has no rank yet.',
                ephemeral: true,
            });
        }


const xpNeeded = calculateXPNeeded(user.level + 1);

        const embed = new EmbedBuilder()
            .setTitle(`${targetUser.username}'s Rank`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setColor('#3498db')
            .addFields(
                { name: 'Level', value: `${user.level}`, inline: true },
                { name: 'XP', value: `${user.xp} / ${xpNeeded}`, inline: true },
                { name: 'Voice Chat Time', value: `${formatTime(user.voiceTime)}`, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    },
};

function calculateXPNeeded(level) {
    return 5 * (level ** 2) + 50 * level + 100;
}

function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
}
