const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

const birthdaysFilePath = path.resolve(__dirname, '../birthdays.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removebirthday')
        .setDescription('Removes a member\'s birthday')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The member whose birthday you want to remove')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');

        let birthdays = {};
        if (fs.existsSync(birthdaysFilePath)) {
            birthdays = JSON.parse(fs.readFileSync(birthdaysFilePath, 'utf8'));
        }

        if (!birthdays[user.id]) {
            return interaction.reply({ content: '❌ No birthday found for this user.', ephemeral: true });
        }

        delete birthdays[user.id];
        fs.writeFileSync(birthdaysFilePath, JSON.stringify(birthdays, null, 4));

        await interaction.reply(`✅ Removed birthday for <@${user.id}>.`);
    },
};
