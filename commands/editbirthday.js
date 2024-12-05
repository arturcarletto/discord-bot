const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

const birthdaysFilePath = path.resolve(__dirname, '../birthdays.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editbirthday')
        .setDescription('Edits a member\'s birthday')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The member whose birthday you want to edit')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('date')
                .setDescription('The new birthday in YYYY-MM-DD format')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const date = interaction.options.getString('date');

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return interaction.reply({ content: '❌ Invalid date format! Use YYYY-MM-DD.', ephemeral: true });
        }

        let birthdays = {};
        if (fs.existsSync(birthdaysFilePath)) {
            birthdays = JSON.parse(fs.readFileSync(birthdaysFilePath, 'utf8'));
        }

        if (!birthdays[user.id]) {
            return interaction.reply({ content: '❌ No birthday found for this user.', ephemeral: true });
        }

        birthdays[user.id].date = date;
        fs.writeFileSync(birthdaysFilePath, JSON.stringify(birthdays, null, 4));

        await interaction.reply(`✅ Updated birthday for <@${user.id}> to **${date}**.`);
    },
};
