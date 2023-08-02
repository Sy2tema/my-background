module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        // id가 기본적으로 들어있다.
        email: {},
        nickname: {},
        password: {},
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci', // 한글 저장이 가능해진다.
    });
    User.associate = (db) => {};

    return User;
}