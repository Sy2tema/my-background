module.exports = (sequelize, DataTypes) => {
    const Post = sequelize.define('Post', {
        content: {
            tupe: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci', // 한글에 더해 이모티콘 저장이 가능해진다.
    });
    Post.associate = (db) => {
        db.Post.belongsTo(db.User);
        db.Post.belongsToMany(db.HashTag);
        db.Post.hasMany(db.Comment);
        db.Post.hasMany(db.Image);
        db.Post.belongsToMany(db.User, { through: 'Like', as: 'Liker' });
        db.Post.belongsTo(db.Post, { as: 'Retweet' });
    };

    return Post;
}