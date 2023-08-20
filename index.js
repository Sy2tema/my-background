const express = require("express");
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require("passport");
const dotenv = require('dotenv');

const postRouter = require("./routes/post");
const userRouter = require("./routes/user");
const db = require('./models');
const passportConfig = require('./passport');
const app = express();

dotenv.config();
db.sequelize.sync()
    .then(() => {
        console.log('DB connect success!');
    })
    .catch(console.error);
passportConfig();

app.use(cors({
    origin: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: process.env.COOKIE_SECRET,
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.send("Hello express");
});

app.get('/api', (req, res) => {
    res.send('Hello api');
});

app.get('/posts', (req, res) => {
    res.json([
        {id: 1, content: 'hello'},
        {id: 2, content: 'hello2'},
        {id: 3, content: 'hello3'},
    ])
});

app.use('/post', postRouter);
app.use('/user', userRouter);

app.listen(3065, () => {
    console.log("Server start");
});