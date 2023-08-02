module.exports = (sequelize, DataTypes) => {
    const Image = sequelize.define('Image', {
        src: {},
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });
    Image.associate = (db) => {};

    return Image;
}