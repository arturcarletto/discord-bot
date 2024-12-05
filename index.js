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

const cooldowns = new Map();

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const { User } = client.models;
    const userId = message.author.id;
    const guildId = message.guild.id;

    const cooldownKey = `${userId}-${guildId}`;
    if (cooldowns.has(cooldownKey)) return;

    cooldowns.set(cooldownKey, true);
    setTimeout(() => cooldowns.delete(cooldownKey), 60000); // 60 seconds

    let user = await User.findOne({ where: { userId, guildId } });

    if (!user) {
        user = await User.create({ userId, guildId });
    }

    const xpGain = Math.floor(Math.random() * 10) + 15;
    user.xp += xpGain;

    const xpNeeded = calculateXPNeeded(user.level + 1);
    if (user.xp >= xpNeeded) {
        user.level += 1;
        announceLevelUp(message.member, user.level, client);
    }

    await user.save();
});

function calculateXPNeeded(level) {
    return 5 * (level ** 2) + 50 * level + 100;
}

const { EmbedBuilder } = require('discord.js');

async function announceLevelUp(member, level, client) {
    const rankChannelId = '1277105343205212170';
    const rankChannel = member.guild.channels.cache.get(rankChannelId);

    if (!rankChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('🎉 Level Up!')
        .setDescription(`${member} has reached **Level ${level}**!`)
        .setColor('#2ecc71');

    await rankChannel.send({ embeds: [embed] });

    const levelRoles = {
        5: 'Beginner',
        10: 'Intermediate',
        15: 'Advanced',
    };

    if (levelRoles[level]) {
        const roleName = levelRoles[level];
        let role = member.guild.roles.cache.find((r) => r.name === roleName);

        if (!role) {
            role = await member.guild.roles.create({
                name: roleName,
                color: 'Random',
            });
        }

        await member.roles.add(role);
    }
}

/* VOICE XP */

client.on('voiceStateUpdate', async (oldState, newState) => {
    const { User } = client.models;
    const member = newState.member || oldState.member;
    const userId = member.user.id;
    const guildId = member.guild.id;

    let user = await User.findOne({ where: { userId, guildId } });

    if (!user) {
        user = await User.create({ userId, guildId });
    }

    if (!oldState.channelId && newState.channelId) {
        user.lastVoiceTimestamp = new Date();
        await user.save();
    }

    if (oldState.channelId && !newState.channelId) {
        if (user.lastVoiceTimestamp) {
            const now = new Date();
            const timeSpent = Math.floor((now - user.lastVoiceTimestamp) / 1000);
            user.voiceTime += timeSpent;

            const xpGain = Math.floor(timeSpent / 60) * 10;
            user.xp += xpGain;

            const xpNeeded = calculateXPNeeded(user.level + 1);
            if (user.xp >= xpNeeded) {
                user.level += 1;
                announceLevelUp(member, user.level, client);
            }

            user.lastVoiceTimestamp = null;
            await user.save();
        }
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

cron.schedule('0 9 * * *', () => { // Every day at 9:00 AM
    const today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
    const birthdays = fs.existsSync(birthdaysFilePath) ? JSON.parse(fs.readFileSync(birthdaysFilePath, 'utf8')) : {};

    // Iterate over birthdays and check for matches
    Object.entries(birthdays).forEach(([userId, data]) => {
        if (data.date === today) {
            const channel = client.channels.cache.get('YOUR_CHANNEL_ID'); // Replace with your Discord channel ID
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