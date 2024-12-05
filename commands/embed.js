const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create a customizable embed message.')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the embed'))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Choose a color for the embed')
                .addChoices(
                    { name: 'Red', value: '#FF0000' },
                    { name: 'Blue', value: '#0000FF' },
                    { name: 'Green', value: '#00FF00' },
                    { name: 'Yellow', value: '#FFFF00' },
                    { name: 'Purple', value: '#800080' },
                    { name: 'Orange', value: '#FFA500' }
                ))
        .addStringOption(option =>
            option.setName('thumbnail')
                .setDescription('URL of the thumbnail image'))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('URL of the main image'))
        .addStringOption(option =>
            option.setName('author')
                .setDescription('The author name'))
        .addStringOption(option =>
            option.setName('author_icon')
                .setDescription('URL of the author icon'))
        .addStringOption(option =>
            option.setName('author_url')
                .setDescription('URL for the author link'))
        .addStringOption(option =>
            option.setName('footer')
                .setDescription('Footer text'))
        .addStringOption(option =>
            option.setName('footer_icon')
                .setDescription('URL of the footer icon'))
        .addBooleanOption(option =>
            option.setName('timestamp')
                .setDescription('Include a timestamp')),
    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');

        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color') || '#00FF00'; // Default to green
        const thumbnail = interaction.options.getString('thumbnail');
        const image = interaction.options.getString('image');
        const author = interaction.options.getString('author');
        const authorIcon = interaction.options.getString('author_icon');
        const authorUrl = interaction.options.getString('author_url');
        const footer = interaction.options.getString('footer');
        const footerIcon = interaction.options.getString('footer_icon');
        const timestamp = interaction.options.getBoolean('timestamp');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description || null)
            .setColor(color);

        if (thumbnail) embed.setThumbnail(thumbnail);
        if (image) embed.setImage(image);
        if (author) embed.setAuthor({ name: author, iconURL: authorIcon || null, url: authorUrl || null });
        if (footer) embed.setFooter({ text: footer, iconURL: footerIcon || null });
        if (timestamp) embed.setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: false });
    },
};