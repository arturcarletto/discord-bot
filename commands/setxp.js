const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setxp')
        .setDescription('Sets the XP of a member (Owner only).')
        .addUserOption(option =>
            option.setName('member').setDescription('The member to set XP for').setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount').setDescription('The amount of XP').setRequired(true)
        ),
    async execute(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: 'Only the server owner can use this command.',
                ephemeral: true,
            });
        }

        const { User } = interaction.client.models;
        const target = interaction.options.getUser('member');
        const amount = interaction.options.getInteger('amount');

        let user = await User.findOne({
            where: { userId: target.id, guildId: interaction.guild.id },
        });

        if (!user) {
            user = await User.create({
                userId: target.id,
                guildId: interaction.guild.id,
                xp: amount,
                level: 1,
            });
        } else {
            user.xp = amount;
            await user.save();
        }

        await interaction.reply(`Set XP of ${target.username} to ${amount}.`);
    },
};
