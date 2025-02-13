const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const activeDownloads = new Set();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('download')
        .setDescription('Download a media file from YouTube, TikTok, Instagram, or Twitter')

        .addStringOption(option =>
            option
                .setName('platform')
                .setDescription('Choose the platform.')
                .setRequired(true)
                .addChoices(
                    { name: 'YouTube', value: 'youtube' },
                    // { name: 'TikTok', value: 'tiktok' },
                    // { name: 'Instagram', value: 'instagram' },
                    // { name: 'Twitter', value: 'twitter' }
                )
        )

        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('The URL of the media you want to download.')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Select the file type to download.')
                .setRequired(false)
                .addChoices(
                    { name: 'MP4 (Video)', value: 'mp4' },
                    { name: 'MP3 (Audio)', value: 'mp3' }
                )
        ),

    async execute(interaction) {
        const platform = interaction.options.getString('platform');
        const url = interaction.options.getString('url');
        const type = interaction.options.getString('type') || 'mp4';

        if (activeDownloads.has(interaction.user.id)) {
            return interaction.reply({
                content: 'You already have a download in progress. Please wait until it finishes.',
                ephemeral: true
            });
        }
        activeDownloads.add(interaction.user.id);

        await interaction.reply({
            content: `Starting your **${type.toUpperCase()}** download from **${platform}**...`,
            ephemeral: true
        });

        try {
            const timestamp = Date.now();
            const extension = type === 'mp3' ? 'mp3' : 'mp4';
            const fileName = `download_${interaction.user.id}_${timestamp}.${extension}`;
            const outputPath = path.join(__dirname, fileName);

            let ytdlpOptions;
            if (type === 'mp3') {
                ytdlpOptions = {
                    output: outputPath,
                    extractAudio: true,
                    audioFormat: 'mp3'
                };
            } else {
                ytdlpOptions = {
                    output: outputPath,
                    format: 'mp4/bestaudio/best'
                };
            }

            await youtubedl(url, ytdlpOptions);

            const userDM = await interaction.user.createDM();
            await userDM.send({
                content: `Here is your requested **${type.toUpperCase()}** file from **${platform}**.`,
                files: [outputPath]
            });

            const logEmbed = new EmbedBuilder()
                .setTitle('Download Completed')
                .setDescription(
                    `**Requested by**: <@${interaction.user.id}>\n` +
                    `**Platform**: ${platform}\n` +
                    `**Type**: ${type}\n` +
                    `**URL**: ${url}`
                )
                .setColor('Green')
                .setTimestamp();

            await interaction.followUp({ embeds: [logEmbed] });

            fs.unlink(outputPath, (err) => {
                if (err) console.error(`Error deleting file: ${err.message}`);
            });

        } catch (error) {
            console.error('Download error:', error);
            await interaction.followUp({
                content: `There was an error while downloading: ${error.message}`,
                ephemeral: true
            });
        } finally {
            activeDownloads.delete(interaction.user.id);
        }
    }
};
