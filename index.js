const express = require('express');
const cors = require('cors');
require('dotenv').config;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// aas_electronics
// xQDszruTIvlC3IW7




const uri = "mongodb+srv://aas_electronics:xQDszruTIvlC3IW7@cluster0.atw05.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri)

app.get('/', (req, res) => {
    res.send('Running Genius Server');
});

app.get('/hero', (req, res) =>{
    res.send('Hero meets hero ku')
})

app.listen(port, () => {
    console.log(`AAS Electronics App listening on port ${port}`)
})