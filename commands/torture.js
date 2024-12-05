const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('torture')
        .setDescription('Tortures a member by switching them between two voice channels every second.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to torture')
                .setRequired(true)
        ),
    async execute(interaction) {
        const targetMember = interaction.options.getMember('target');
        const authorMember = interaction.member;

        if (!authorMember.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return interaction.reply({ content: 'You do not have permission to move members.', ephemeral: true });
        }

        if (!authorMember.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return interaction.reply({ content: 'I do not have permission to move members.', ephemeral: true });
        }

        if (!targetMember.voice.channel) {
            return interaction.reply({ content: 'The target member is not in a voice channel.', ephemeral: true });
        }

        const channel1Id = '1314051372210978867';
        const channel2Id = '1314051403500752957';

        const channel1 = interaction.guild.channels.cache.get(channel1Id);
        const channel2 = interaction.guild.channels.cache.get(channel2Id);

        if (!channel1 || !channel2) {
            return interaction.reply({ content: 'Voice channels not found.', ephemeral: true });
        }

        let currentChannel = channel1;
        const interval = setInterval(() => {
            currentChannel = currentChannel.id === channel1.id ? channel2 : channel1;
            targetMember.voice.setChannel(currentChannel).catch(error => {
                console.error(error);
                clearInterval(interval);
            });
        }, 1000);

        interaction.client.torture.set(targetMember.id, interval);

        await interaction.reply({ content: `Started irritating noise on ${targetMember.user.tag}.`, ephemeral: true });
    },
};
