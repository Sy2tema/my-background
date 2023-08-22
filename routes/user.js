const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const passport = require('passport');

const router = express.Router();

// 미들웨어 확장 방식을 이용해 req, res, next를 사용할 수 있도록 조치해준다
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (serverErr, user, clientErr) => {
        if (serverErr) {
            console.error(serverErr);
            return next(serverErr);
        }
        
        if (clientErr) {
            return res.status(401).send(clientErr.reason);
        }

        return req.login(user, async (loginErr) => {
            // passport라이브러리부분에서 에러가 발생했을 경우 처리
            if (loginErr) {
                console.error(loginErr);
                return next(loginErr);
            }

            return res.status(200).json(user);
        });
    })(req, res, next);
});

router.post('/', async (req, res, next) => { // POST /user/
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

module.exports = router;