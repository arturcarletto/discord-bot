const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

const birthdaysFilePath = path.resolve(__dirname, '../birthdays.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthdays')
        .setDescription('Lists all member birthdays'),
    async execute(interaction) {
        let birthdays = {};
        if (fs.existsSync(birthdaysFilePath)) {
            birthdays = JSON.parse(fs.readFileSync(birthdaysFilePath, 'utf8'));
        }

        const birthdayList = Object.entries(birthdays)
            .map(([userId, data]) => `<@${userId}>: ${data.date}`)
            .join('\n') || 'No birthdays added yet.';

        await interaction.reply(`🎂 **Birthday List:**\n${birthdayList}`);
    },
};
