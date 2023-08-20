const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { User } = require('../models');
const bcrypt = require('bcrypt');

module.exports = () => {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
    }, async (email, password, done) => {
        try {
            const user = await User.findOne({
                where: { email }
            });
    
            if (!user) {
                // done함수는 3개의 파라미터가 있으며 서버 에러, 성공여부, 클라이언트 에러로 구성되어 있다
                return done(null, false, { reason: 'Not exist email!' });
            }
            
            const result = await bcrypt.compare(password, user.password);
    
            if (result) {
                return done(null, user);
            }
    
            return done(null, false, { reason: 'Wrong password...' });
        } catch (error) { // server error
            console.error(error);
            return done(error);
        }
    }));
};