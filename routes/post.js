const express = require('express');
const { Post } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

router.post('/', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.create({
            content: req.body.content,
            UserId: req.user.id,
        });

        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/:postId/comment', isLoggedIn, async (req, res, next) => { // POST /post/1/comments
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId },
        });

        if (!post) return res.status(403).send('Post does not exist.');

        const comment = await Comment.create({
            content: req.body.content,
            PostId: req.params.postId,
            UserId: req.user.id,
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.delete('/', isLoggedIn, (req, res) => {
    res.json({id: 1});
});

module.exports = router;