const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stoptorture')
        .setDescription('Stops the irritating noise for a member.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to stop torturing')
                .setRequired(true)
        ),
    async execute(interaction) {
        const targetMember = interaction.options.getMember('target');
        const authorMember = interaction.member;

        if (!authorMember.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return interaction.reply({ content: 'You do not have permission to move members.', ephemeral: true });
        }

        const interval = interaction.client.torture.get(targetMember.id);

        if (!interval) {
            return interaction.reply({ content: 'This member is not being irritated.', ephemeral: true });
        }

        clearInterval(interval);
        interaction.client.torture.delete(targetMember.id);

        await interaction.reply({ content: `Stopped irritating noise on ${targetMember.user.tag}.`, ephemeral: true });
    },
};
