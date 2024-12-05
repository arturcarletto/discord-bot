const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const rolesFilePath = path.resolve(__dirname, '../roles.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-role')
        .setDescription('Configure a message for reaction roles')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('The ID of the message to track')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('The emoji to use for the reaction')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to assign when the reaction is added')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: '❌ This command can only be used in a server!',
                ephemeral: true,
            });
        }

        const botMember = await interaction.guild.members.fetch(interaction.client.user.id);

        if (!botMember.permissions.has('ManageRoles')) {
            return interaction.reply({
                content: '❌ I do not have permission to manage roles in this server!',
                ephemeral: true,
            });
        }

        const messageId = interaction.options.getString('message_id');
        const emoji = interaction.options.getString('emoji');
        const role = interaction.options.getRole('role');

        if (botMember.roles.highest.position <= role.position) {
            return interaction.reply({
                content: `❌ I cannot assign the role **${role.name}** because it is higher than my highest role!`,
                ephemeral: true,
            });
        }

        const emojiRegex = /^<:\w+:\d+>$|^\p{Emoji}+$/u;
        if (!emojiRegex.test(emoji)) {
            return interaction.reply({
                content: '❌ Please provide a valid emoji!',
                ephemeral: true,
            });
        }

        let rolesData = {};
        try {
            if (fs.existsSync(rolesFilePath)) {
                const fileContent = fs.readFileSync(rolesFilePath, 'utf8');
                rolesData = fileContent ? JSON.parse(fileContent) : {};
            } else {
                fs.writeFileSync(rolesFilePath, JSON.stringify({}), 'utf8');
            }
        } catch (error) {
            console.error('Error reading roles.json:', error);
            return interaction.reply({
                content: '❌ Failed to load roles configuration. Please check the server logs.',
                ephemeral: true,
            });
        }

        if (rolesData[messageId] && rolesData[messageId][emoji]) {
            return interaction.reply({
                content: `❌ The emoji **${emoji}** is already configured for a role in this message.`,
                ephemeral: true,
            });
        }

        if (!rolesData[messageId]) {
            rolesData[messageId] = {};
        }
        rolesData[messageId][emoji] = role.id;

        try {
            fs.writeFileSync(rolesFilePath, JSON.stringify(rolesData, null, 4));
        } catch (error) {
            console.error('Error writing to roles.json:', error);
            return interaction.reply({
                content: '❌ Failed to save roles configuration. Please check the server logs.',
                ephemeral: true,
            });
        }

        await interaction.reply({
            content: `✅ Configured message **${messageId}** with emoji **${emoji}** to assign role **${role.name}**.`,
            ephemeral: true,
        });
    },
};
