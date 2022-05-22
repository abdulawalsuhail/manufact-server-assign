const express = require('express');
const cors = require('cors');
require('dotenv').config;
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// aas_electronics
// xQDszruTIvlC3IW7

app.get('/', (req, res) => {
    res.send('Running Genius Server');
});

app.get('/hero', (req, res) =>{
    res.send('Hero meets hero ku')
})

app.listen(port, () => {
    console.log('Listening to port', port);
})