const express = require("express");
const postRouter = require("./routes/post");
const app = express();

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

app.listen(3065, () => {
    console.log("Server start");
});