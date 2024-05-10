const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const port = process.env.PORT || 5000


const app = express();


app.use(cors())
app.use(express.json())
app.use(cookieParser())


app.get('/', (req, res) => {
    res.send("server is running")
})


app.listen(port, ()=>{
    console.log('Server is Running Now')
})