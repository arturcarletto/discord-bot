const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const games = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Starts a roulette game where a random participant wins.'),
    async execute(interaction) {
        const gameId = interaction.channel.id;

        if (games.has(gameId)) {
            return interaction.reply({ content: 'A roulette game is already in progress in this channel!', ephemeral: true });
        }

        const game = {
            host: interaction.user.id,
            participants: new Set(),
            message: null,
        };

        game.participants.add(interaction.user.id);

        const joinButton = new ButtonBuilder()
            .setCustomId('roulette_join')
            .setLabel('Join')
            .setStyle(ButtonStyle.Primary);

        const startButton = new ButtonBuilder()
            .setCustomId('roulette_start')
            .setLabel('Start')
            .setStyle(ButtonStyle.Success);

        const actionRow = new ActionRowBuilder().addComponents(joinButton, startButton);

        const embed = new EmbedBuilder()
            .setTitle('🎰 Roulette Game')
            .setDescription('Click **Join** to participate in the roulette game!\nThe host can click **Start** when ready.')
            .addFields({ name: 'Participants', value: `<@${interaction.user.id}>` })
            .setColor('#0099ff');

        const message = await interaction.reply({ embeds: [embed], components: [actionRow], fetchReply: true });

        game.message = message;

        games.set(gameId, game);

        const filter = i => {
            return ['roulette_join', 'roulette_start'].includes(i.customId);
        };

        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const currentGame = games.get(gameId);

            if (!currentGame) return;

            if (i.customId === 'roulette_join') {
                if (currentGame.participants.has(i.user.id)) {
                    return i.reply({ content: 'You have already joined the game!', ephemeral: true });
                }

                currentGame.participants.add(i.user.id);

                const participantMentions = Array.from(currentGame.participants).map(id => `<@${id}>`).join('\n');
                embed.spliceFields(0, 1, { name: 'Participants', value: participantMentions });
                await currentGame.message.edit({ embeds: [embed] });

                return i.reply({ content: 'You have joined the roulette game!', ephemeral: true });
            } else if (i.customId === 'roulette_start') {
                if (i.user.id !== currentGame.host) {
                    return i.reply({ content: 'Only the game host can start the game!', ephemeral: true });
                }

                if (currentGame.participants.size < 2) {
                    return i.reply({ content: 'At least two participants are required to start the game.', ephemeral: true });
                }

                const disabledRow = new ActionRowBuilder().addComponents(
                    joinButton.setDisabled(true),
                    startButton.setDisabled(true)
                );

                await currentGame.message.edit({ components: [disabledRow] });

                await i.deferUpdate();
                await spinRoulette(interaction, currentGame);

                collector.stop();
                games.delete(gameId);
            }
        });

        collector.on('end', async () => {
            if (games.has(gameId)) {
                const disabledRow = new ActionRowBuilder().addComponents(
                    joinButton.setDisabled(true),
                    startButton.setDisabled(true)
                );
                await game.message.edit({ components: [disabledRow] });
                games.delete(gameId);
                await interaction.followUp({ content: 'The roulette game has ended due to inactivity.', ephemeral: true });
            }
        });
    },
};

async function spinRoulette(interaction, game) {
    const participantsArray = Array.from(game.participants);
    const shuffledParticipants = shuffleArray(participantsArray);

    const embed = new EmbedBuilder()
        .setTitle('🎰 Roulette Spinning...')
        .setDescription('The roulette is spinning...')
        .setColor('#ffcc00');

    const rouletteMessage = await interaction.followUp({ embeds: [embed], fetchReply: true });

    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * shuffledParticipants.length);
        const currentParticipant = shuffledParticipants[randomIndex];
        embed.setDescription(`The roulette is spinning...\n**${i % 2 === 0 ? '◻️◼️◻️' : '◼️◻️◼️'}**\nCurrently on: <@${currentParticipant}>`);
        await rouletteMessage.edit({ embeds: [embed] });
        await delay(500);
    }

    const winnerIndex = Math.floor(Math.random() * participantsArray.length);
    const winnerId = participantsArray[winnerIndex];

    embed
        .setTitle('🎉 We Have a Winner!')
        .setDescription(`Congratulations <@${winnerId}>! You have won the roulette game!`)
        .setColor('#00cc99');

    await rouletteMessage.edit({ embeds: [embed] });
}

function shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
