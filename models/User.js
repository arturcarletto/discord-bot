const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('User', {
        userId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        xp: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        level: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false,
        },
        lastMessageTimestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        voiceTime: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        lastVoiceTimestamp: {
            type: DataTypes.DATE,
            defaultValue: null,
        },
    });
};
