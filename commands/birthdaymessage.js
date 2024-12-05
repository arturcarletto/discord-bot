const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

const birthdaysFilePath = path.resolve(__dirname, '../birthdays.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthdaymessage')
        .setDescription('Sets the custom birthday message')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The custom birthday message with {user} placeholder')
                .setRequired(true)),
    async execute(interaction) {
        const message = interaction.options.getString('message');

        let birthdays = {};
        if (fs.existsSync(birthdaysFilePath)) {
            birthdays = JSON.parse(fs.readFileSync(birthdaysFilePath, 'utf8'));
        }

        birthdays['customMessage'] = message;
        fs.writeFileSync(birthdaysFilePath, JSON.stringify(birthdays, null, 4));

        await interaction.reply(`✅ Set the custom birthday message to:\n> ${message}`);
    },
};
