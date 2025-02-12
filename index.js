require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

client.commands = new Collection();
client.torture = new Map();
client.subscriptions = new Map();

const rolesFilePath = path.resolve(__dirname, './roles.json');
const birthdaysFilePath = path.resolve(__dirname, '../birthdays.json');

function loadRolesConfig() {
    if (fs.existsSync(rolesFilePath)) {
        return JSON.parse(fs.readFileSync(rolesFilePath, 'utf8'));
    }
    return {};
}

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false,
});

const modelDefiners = [
    require('./models/User'),
];

for (const modelDefiner of modelDefiners) {
    modelDefiner(sequelize);
}

sequelize.sync().then(() => {
    console.log('Database synced');
});

console.log('Available models:', sequelize.models);

client.sequelize = sequelize;
client.models = sequelize.models;

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);

/* MESSAGE XP */

client.on('messageCreate', (message) => {
    if (!message.guild || message.author.bot) return;
    const userId = message.author.id;
    const serverId = message.guild.id;
    incrementMessageCount(userId, serverId);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() || interaction.commandName !== 'rank') return;

    const userId = interaction.user.id;
    const serverId = interaction.guild.id;
    const userRank = await getUserRank(userId, serverId);
    const userStats = await getUserStats(userId, serverId);

    await interaction.reply({
        embeds: [
            {
                title: `Your Rank`,
                description: `Here are your current stats:`,
                fields: [
                    { name: 'Rank', value: `#${userRank}`, inline: true },
                    { name: 'Call Time', value: `${formatTime(userStats.callTime)}`, inline: true },
                    { name: 'Messages Sent', value: `${userStats.messageCount}`, inline: true },
                ],
                thumbnail: { url: interaction.user.displayAvatarURL() },
            },
        ],
    });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() || interaction.commandName !== 'ranktop') return;

    const serverId = interaction.guild.id;
    const topUsers = await getTopUsers(serverId, 0, 10); // Page 1

    let page = 0;
    const maxPages = Math.ceil(totalUsers / 10);

    const embed = createRankTopEmbed(topUsers, page, maxPages);

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });

    // Add navigation buttons
    await message.react('⬅️');
    await message.react('➡️');

    const filter = (reaction, user) =>
        ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === interaction.user.id;

    const collector = message.createReactionCollector({ filter, time: 60000 });

    collector.on('collect', async (reaction) => {
        if (reaction.emoji.name === '➡️' && page < maxPages - 1) page++;
        else if (reaction.emoji.name === '⬅️' && page > 0) page--;

        const newTopUsers = await getTopUsers(serverId, page * 10, 10);
        const newEmbed = createRankTopEmbed(newTopUsers, page, maxPages);

        await message.edit({ embeds: [newEmbed] });
        await reaction.users.remove(interaction.user.id);
    });
});

function createRankTopEmbed(users, page, maxPages) {
    return {
        title: `Server Top Call Times (Page ${page + 1}/${maxPages})`,
        description: users
            .map((user, index) => `**#${index + 1 + page * 10}** ${user.username} - ${formatTime(user.callTime)}`)
            .join('\n'),
    };
}

/* VOICE XP */

client.on('voiceStateUpdate', (oldState, newState) => {
    // Detect when a user starts or stops a call
    const userId = newState.member.id;
    const serverId = newState.guild.id;
    if (!oldState.channel && newState.channel) {
        // User joined a voice channel: start tracking
        startCallTracking(userId, serverId);
    } else if (oldState.channel && !newState.channel) {
        // User left a voice channel: stop tracking
        stopCallTracking(userId, serverId);
    }
});


client.on('messageReactionAdd', async (reaction, user) => {
    console.log('Reaction added:', reaction.emoji.name, 'by', user.tag);
    if (user.bot) return;

    const rolesData = loadRolesConfig();
    console.log('Roles data loaded:', rolesData);

    const messageId = reaction.message.id;
    const emoji = reaction.emoji.name;

    if (rolesData[messageId] && rolesData[messageId][emoji]) {
        const roleId = rolesData[messageId][emoji];
        const guild = reaction.message.guild;
        const member = guild.members.cache.get(user.id);
        const role = guild.roles.cache.get(roleId);

        if (role && member) {
            await member.roles.add(role);
            console.log(`Assigned role ${role.name} to ${member.user.tag} for reaction ${emoji}.`);
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    const rolesData = loadRolesConfig();
    const messageId = reaction.message.id;
    const emoji = reaction.emoji.name;

    if (rolesData[messageId] && rolesData[messageId][emoji]) {
        const roleId = rolesData[messageId][emoji];
        const guild = reaction.message.guild;
        const member = guild.members.cache.get(user.id);
        const role = guild.roles.cache.get(roleId);

        if (role && member) {
            await member.roles.remove(role);
            console.log(`Removed role ${role.name} from ${member.user.tag} for reaction ${emoji}.`);
        }
    }
});

/*CRON FOR BIRTHDAY*/

cron.schedule('0 9 * * *', () => {
    const today = new Date().toISOString().slice(0, 10);
    const birthdays = fs.existsSync(birthdaysFilePath) ? JSON.parse(fs.readFileSync(birthdaysFilePath, 'utf8')) : {};

    Object.entries(birthdays).forEach(([userId, data]) => {
        if (data.date === today) {
            const channel = client.channels.cache.get('729770439576125450');
            if (channel) {
                const customMessage = birthdays['customMessage'] || '🎉 Happy Birthday, {user}! 🎂';
                const birthdayMessage = customMessage.replace('{user}', `<@${userId}>`);
                channel.send(birthdayMessage);
            } else {
                console.error('Channel not found. Check YOUR_CHANNEL_ID.');
            }
        }
    });
});