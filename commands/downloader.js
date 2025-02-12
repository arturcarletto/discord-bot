const { SlashCommandBuilder } = require('discord.js');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('downloader')
        .setDescription('Download media from YouTube, Instagram, or TikTok.')
        .addStringOption(option =>
            option
                .setName('platform')
                .setDescription('Which platform (youtube, instagram, tiktok)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('URL of the media to download')
                .setRequired(true)
        ),
    async execute(interaction) {
        // 1. Defer reply so user knows the bot is working
        await interaction.deferReply({ ephemeral: true });

        // 2. Grab the slash command options
        const platform = interaction.options.getString('platform');
        const url = interaction.options.getString('url');

        try {
            // 3. SpawnSpawn the Python process
            const pyProcess = spawn('python', [
                path.join(__dirname, '..', 'utils/downloader', 'main.py'),
                '--platform',
                platform,
                '--url',
                url
            ]);

            // Collect output data (the downloaded file path, presumably)
            let outputData = '';
            pyProcess.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            // Collect error data
            let errorData = '';
            pyProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });
            pyProcess.stderr.on('data', (data) => {
                console.error(`[PYTHON ERROR]: ${data}`);
            });

            pyProcess.stdout.on('data', (data) => {
                console.log(`[PYTHON OUTPUT]: ${data}`);
            });

            // 4. Handle process exit
            pyProcess.on('close', async (code) => {
                if (code === 0) {
                    // "outputData" should contain the local file path
                    const filePath = outputData.trim();

                    // 5. Send the file in the user’s DM
                    try {
                        const userDM = await interaction.user.createDM();
                        await userDM.send({
                            content: `Here is your downloaded file from ${platform}:`,
                            files: [filePath]
                        });

                        // Let the user know we’ve DMed them
                        await interaction.editReply(`I have sent you a DM with your file!`);

                        // 6. (Optional) Delete the local file to save space
                        fs.unlink(filePath, (err) => {
                            if (err) console.error('Error deleting file:', err);
                        });
                    } catch (dmError) {
                        console.error(dmError);
                        await interaction.editReply(`Failed to send the file via DM. Check my permissions or your privacy settings.`);
                    }
                } else {
                    // The Python script exited with an error
                    console.error(errorData);
                    await interaction.editReply(`Failed to download media. Error: ${errorData || 'unknown error'}`);
                }
            });
        } catch (err) {
            console.error(err);
            await interaction.editReply(`Something went wrong trying to run the downloader.`);
        }
    },
};
