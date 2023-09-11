const express = require('express');
const bcrypt = require('bcrypt');
const { User, Post } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const passport = require('passport');

const router = express.Router();

router.get('/', async (req, res, next) => { // GET /user
    try {
        if (req.user) { // 로그인 쿠키가 존재할 경우 로그인 상태를 유지한다
            const fullUserInfoWithoutPwd = await User.findOne({
                where: { id: req.user.id },
                attributes: {
                    exclude: ['password'],
                },
                include: [{
                    model: Post,
                    attributes: ['id'],
                }, {
                    model: User,
                    as: 'Followings',
                    attributes: ['id'],
                }, {
                    model: User,
                    as: 'Followers',
                    attributes: ['id'],
                }]
            });
    
            res.status(200).json(fullUserInfoWithoutPwd);
        } else {
            res.status(200).json(null);
        }
        
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// 미들웨어 확장 방식을 이용해 req, res, next를 사용할 수 있도록 조치해준다
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (serverErr, user, clientErr) => {
        if (serverErr) {
            console.error(serverErr);
            return next(serverErr);
        }
        
        if (clientErr) {
            return res.status(401).send(clientErr.message);
        }

        return req.login(user, async (loginErr) => {
            // passport라이브러리부분에서 에러가 발생했을 경우 처리
            if (loginErr) {
                console.error(loginErr);
                return next(loginErr);
            }

            const fullUserInfoWithoutPwd = await User.findOne ({
                where: { id: user.id },
                attributes: {
                    exclude: ['password'],
                },
                include: [{
                    model: Post,
                    attributes: ['id'],
                }, {
                    model: User,
                    as: 'Followings',
                    attributes: ['id'],
                }, {
                    model: User,
                    as: 'Followers',
                    attributes: ['id'],
                }]
            });

            return res.status(200).json(fullUserInfoWithoutPwd);
        });
    })(req, res, next);
});

router.post('/', isNotLoggedIn, async (req, res, next) => { // POST /user/
    try {
        const existUser = await User.findOne({
            where: {
                email: req.body.email,
            }
        });
        
        if (existUser) {
            return res.status(403).send('Already exist user');
        }

        const cryptedPassword = await  bcrypt.hash(req.body.password, 11);
        await User.create({
            email: req.body.email,
            nickname: req.body.nickname,
            password: cryptedPassword,
        });
        res.status(201).send('Data saved');
    } catch (error) {
        console.error(error);
        next(error); // next를 이용해 모든 에러들을 한 번에 처리할 수 있다
    }
});

router.post('/logout', isLoggedIn, (req, res, next) => {
    req.logout(err => {
        if (err) {
            return next(err);
        } else {
            req.session.destroy();
            res.send('Logout success');
        }
    });
});

router.patch ('/nickname', isLoggedIn, async (req, res, next) => { // PATCH /user/nickname
    try {
        await User.update({
            nickname: req.body.nickname,
        }, {
            where: { id: req.user.id },
        });

        res.status(200).json({ nickname: req.body.nickname });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;