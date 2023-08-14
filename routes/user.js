const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');

const router = express.Router();

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