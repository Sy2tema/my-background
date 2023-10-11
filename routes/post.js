const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Post, Image, User, Comment } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

try {
    fs.accessSync('uploads');
} catch (error) {
    console.log("uploads folder is not exist. create folder");
    fs.mkdirSync('uploads');
}


router.post('/', isLoggedIn, async (req, res, next) => { // POST /post
    try {
        const post = await Post.create({
            content: req.body.content,
            UserId: req.user.id,
        });

        const fullPost = await Post.findOne({
            where: { id: post.id },
            include: [{
                model: Image,
            }, {
                model: Comment,
                include: [{
                    model: User, // 댓글 작성자
                    attributes: ['id', 'nickname'],
                }]
            }, {
                model: User, // 게시글 작성자
                attributes: ['id', 'nickname'],
            }, {
                model: User, // 좋아요 누른 유저
                as: 'Likers',
                attributes: ['id'],
            }],
        })

        res.status(201).json(fullPost);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, 'uploads');
        },
        filename(req, file, done) { // sample.png
            const extend = path.extname(file.originalname); // .png
            const basename = path.basename(file.originalname, extend); // sample
            done(null, basename + new Date().getTime() + extend); // sample20231009.png
        }
    }),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// 이미지를 하나만 올리고 싶으면 single메서드를 사용하며 이미지를 사용하지 않는다면 None을 사용한다
// 추가적으로 파일 input이 두 개 있을 경우에는 Fields를 쓴다
router.post('/images', isLoggedIn, upload.array('image'), (req, res, next) => {
    console.log(req.files);
    res.json(req.files.map((value) => value.filename));
});

router.post('/:postId/comment', isLoggedIn, async (req, res, next) => { // POST /post/1/comments
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId },
        });

        if (!post) return res.status(403).send('Post does not exist.');

        const comment = await Comment.create({
            content: req.body.content,
            PostId: parseInt(req.params.postId, 10),
            UserId: req.user.id,
        });

        const fullComment = await Comment.findOne({
            where: { id: comment.id },
            include: [{
                model: User,
                attributes: ['id', 'nickname'],
            }],
        })

        res.status(201).json(fullComment);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.patch('/:postId/like', isLoggedIn, async (req, res, next) => { // PATCH /post/1/like
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId }
        });

        if (!post) return res.status(403).send('Post not exist');

        await post.addLikers(req.user.id);
        res.json({ PostId: post.id, UserId: req.user.id });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.delete('/:postId/like', isLoggedIn, async (req, res, next) => { // DELETE /post/1/like
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId }
        });

        if (!post) return res.status(403).send('Post not exist');

        await post.removeLikers(req.user.id);
        res.status(200).json({ PostId: post.id, UserId: req.user.id });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.delete('/:postId', isLoggedIn, async (req, res, next) => { // DELETE /post/1
    try {
        await Post.destroy({
            where: { 
                id: req.params.postId,
                UserId: req.user.id,
            },
        });

        res.status(200).json({ PostId: parseInt(req.params.postId) });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;