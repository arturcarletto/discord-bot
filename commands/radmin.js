const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('radmin')
        .setDescription('Displays the Radmin server name and password.'),
    async execute(interaction) {

        const serverName = process.env.RADMIN_SERVER_NAME;
        const password = process.env.RADMIN_PASSWORD;

        const embed = new EmbedBuilder()
            .setTitle('🔑 Radmin Server Details')
            .setColor('#3498db')
            .addFields(
                { name: 'Server Name', value: `\`${serverName}\``, inline: true },
                { name: 'Password', value: `\`${password}\``, inline: true }
            )
            .setFooter({ text: 'Use these details to connect via Radmin.' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
