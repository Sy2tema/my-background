module.exports = (sequelize, DataTypes) => {
    const Hashtag = sequelize.define('Hashtag', {
        name: {},
    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci', // 한글에 더해 이모티콘 저장이 가능해진다.
    });
    Hashtag.associate = (db) => {};

    return Hashtag;
}