const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment } = require('discord.js');
const fs = require('fs');
const { runPythonDownloader } = require('../utils/python_downloader');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('downloader')
        .setDescription('Download media with progress updates.')
        .addStringOption(opt =>
            opt.setName('url')
                .setDescription('URL to download')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const url = interaction.options.getString('url');

            // Start python script & show progress in ephemeral message
            const filePath = await runPythonDownloader(url, interaction);

            // Once the promise resolves, the file is done:
            const user = interaction.user;
            const dmChannel = await user.createDM();

            await dmChannel.send({
                content: 'Here is your downloaded file!',
                files: [filePath]
            });

            // Cleanup
            fs.unlinkSync(filePath);

            // Final ephemeral update
            await interaction.editReply('Download complete! Check your DMs.');
        } catch (error) {
            console.error('[Downloader Error]', error);
            await interaction.editReply(`Failed to download: ${error.message}`);
        }
    }
};
