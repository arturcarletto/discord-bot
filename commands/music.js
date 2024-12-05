const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, getVoiceConnection } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { getInfo } = require('ytdl-core');
const Youtube = require('youtube-search-api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('Plays music from YouTube based on a link or search query.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('YouTube link or search keywords')
                .setRequired(true)
        ),
    async execute(interaction) {
        const query = interaction.options.getString('query');
        const member = interaction.member;

        if (!member.voice.channel) {
            return interaction.reply({ content: 'You need to join a voice channel first!', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            let url = query;
            let isUrl = ytdl.validateURL(query);

            if (!isUrl) {
                const searchResults = await Youtube.GetListByKeyword(query, false, 1);
                if (searchResults.items.length === 0) {
                    return interaction.editReply({ content: 'No results found on YouTube.' });
                }
                url = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
            }

            if (!ytdl.validateURL(url)) {
                return interaction.editReply({ content: 'The provided URL is not a valid YouTube video.' });
            }

            const videoInfo = await getInfo(url);
            const title = videoInfo.videoDetails.title;

            const voiceChannel = member.voice.channel;
            let connection = getVoiceConnection(voiceChannel.guild.id);

            if (!connection) {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });
            }

            const stream = ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25 });

            const resource = createAudioResource(stream);
            let player = interaction.client.subscriptions.get(voiceChannel.guild.id);

            if (!player) {
                player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Play,
                    },
                });

                player.on('error', error => {
                    console.error('Audio Player Error:', error.message);
                });

                connection.subscribe(player);
                interaction.client.subscriptions.set(voiceChannel.guild.id, player);
            }

            player.play(resource);

            await interaction.editReply({ content: `Now playing: **${title}**` });
        } catch (error) {
            console.error('Error in /music command:', error);

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: 'An error occurred while processing your request.' });
            } else {
                await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
            }
        }
    },
};
