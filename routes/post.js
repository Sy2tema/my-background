const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Post, Image, User, Comment, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

try {
    fs.accessSync('uploads');
} catch (error) {
    console.log("uploads folder is not exist. create folder");
    fs.mkdirSync('uploads');
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, 'uploads');
        },
        filename(req, file, done) { // sample.png
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const extend = path.extname(file.originalname); // .png
            const basename = path.basename(file.originalname, extend); // sample
            done(null, basename + '_' + new Date().getTime() + extend); // sample20231009.png
        }
    }),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

router.post('/', isLoggedIn, upload.none(), async (req, res, next) => { // POST /post
    try {
        const hashtags = req.body.content.match(/#[^\s#]+/g);
        // Tag tAg와 같이 대소문자가 분리되어있을 때 별도의 태그로 인식하는 문제 개선
        const normalizedHashtags = hashtags?.map(tag => tag.slice(1).toLowerCase()) || [];
        const uniqueHashtags = Array.from(new Set(normalizedHashtags));

        const post = await Post.create({
            content: req.body.content,
            UserId: req.user.id,
        });

        if (uniqueHashtags.length) {
            // 같은 해시태그 정보가 있으면 무시하고 없으면 저장한다
            const result = await Promise.all(uniqueHashtags.map((tag) => 
                Hashtag.findOrCreate({
                    where: { name: tag },
                })
            )); // [[#node, true], [#javascript, true]]

            await post.addHashtags(result.map((value) => value[0]));
        }

        if (req.body.imagePaths) {
            if (Array.isArray(req.body.imagePaths)) { // 사진이 여러개일 경우 배열로 데이터가 들어오기 때문에 각각 나누어서 DB에 저장한다
                const images = await Promise.all(req.body.imagePaths.map((image) => Image.create({ src: image })));
                await post.addImages(images);
            } else {
                const image = await Image.create({ src: req.body.imagePaths });
                await post.addImages(image);
            }
        }

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

router.post('/:postId/retweet', isLoggedIn, async (req, res, next) => { // POST /post/1/retweet
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId },
            include: [{
                model: Post,
                as: 'Retweet',
            }],
        });

        if (!post) return res.status(403).send('Post does not exist.');

        // Prevent retweet my post again, retweet someone else's retweet of my post
        if (req.user.id === post.UserId || (post.Retweet && post.Retweet.UserId === req.user.id)) {
            return res.status(403).send('Cannot retweet my post');
        }

        const retweetTargetId = post.RetweetId || post.id;
        const exPost = await Post.findOne({
            where: {
                UserId: req.user.id,
                RetweetId: retweetTargetId,
            },
        });

        if (exPost) res.status(403).send('Already retweet post');

        const retweet = await Post.create({
            UserId: req.user.id,
            RetweetId: retweetTargetId,
            content: 'retweet',
        });

        // Performance can be improved by separating the Comment model into a separate router
        const retweetWithPrevPost = await Post.findOne({
            where: { id: retweet.id },
            include: [{
                model: Post,
                as: 'Retweet',
                include: [{
                    model: User,
                    attributes: ['id', 'nickname'],
                }, {
                    model: Image,
                }]
            }, {
                model: User,
                attributes: ['id', 'nickname'],
            },{
                model: Image,
            }, {
                model: Comment,
                include: [{
                    model: User,
                    attributes: ['id', 'nickname'],
                }]
            }]
        })

        res.status(201).json(retweetWithPrevPost);
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