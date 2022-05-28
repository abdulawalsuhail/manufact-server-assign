const express = require('express');
const cors = require('cors');
require('dotenv').config;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// aas_electronics
// xQDszruTIvlC3IW7





const uri = `mongodb+srv://aas_electronics:xQDszruTIvlC3IW7@cluster0.atw05.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// console.log(uri)

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        // console.log(err)
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        await client.connect();
        const productCollection = client.db('AAS_Electronics').collection('Products')
        const bookingCollection = client.db('AAS_Electronics').collection('bookings')
        const reviewCollection = client.db('AAS_Electronics').collection('reviews');
        const orderCollection = client.db('AAS_Electronics').collection('orders');
        const userCollection = client.db('AAS_Electronics').collection('users');



        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
        }

        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query)
            // .project({ name: 1 });
            const products = await cursor.toArray();
            res.send(products);
        })
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            // console.log(product);
            res.send(product);
        });

        // add a new item product
        app.post('/product', async (req, res) => {
            const newProduct = req.body
            const tokenInfo = req.headers.authorization
            const result = await productCollection.insertOne(newProduct)
            res.send(result)
        })

        // delete api
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query)
            res.send(result)
        })

        // order api






        // review post api
        app.get('/review',async(req,res)=>{
            const query = {};
            const cursor = reviewCollection.find(query)
            // .project({ name: 1 });
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
        app.post('/review',async (req,res)=>{
            const newReviews =req.body
            const result= await reviewCollection.insertOne(newReviews)
            res.send(result)
        })




        // user info all api
        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();

            res.send(users);
        });

        
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ result, token })
        })

        app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        app.get('/admin/:email', async (req, res) => {
                const email = req.params.email;
                const user = await userCollection.findOne({ email: email });
                const isAdmin = user.role === 'admin';
                res.send(user)
            })






        // app.get('/booking', verifyJWT, async (req, res) => {
        //     const patient = req.query.customer;
        //     // console.log('jot token', authHeader)
        //     const decodedEmail = req.decoded.email;
        //     if (patient === decodedEmail) {
        //         const query = { patient: customer };
        //         const bookings = await bookingCollection.find(query).toArray();
        //         return res.send(bookings);
        //     }
        //     else {
        //         return res.status(403).send({ message: 'forbidden access' });
        //     }
        // })

        // app.get('/booking/:id', verifyJWT, async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const booking = await bookingCollection.findOne(query);
        //     res.send(booking);
        // })

        // app.post('/booking', async (req, res) => {
        //     const booking = req.body;
        //     const query = { product: booking.product, customer: booking.customer }
        //     const exists = await bookingCollection.findOne(query);
        //     if (exists) {
        //         return res.send({ success: false, booking: exists })
        //     }
        //     const result = await bookingCollection.insertOne(booking);
        //     return res.send({ success: true, result });
        // })

        // app.patch('/product/:id', verifyJWT, async (req, res) => {
        //     const id = req.params.id;
        //     const payment = req.body;
        //     const filter = { _id: ObjectId(id) };
        //     const updatedDoc = {
        //         $set: {
        //             paid: true,
        //             transactionId: payment.transactionId
        //         }
        //     }

        //     const result = await paymentCollection.insertOne(payment);
        //     const updatedBooking = await bookingCollection.updateOne(filter, updatedDoc);
        //     res.send(updatedBooking);
        // })







    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running Genius Server');
});

app.get('/hero', (req, res) => {
    res.send('Hero meets hero ku')
})

app.listen(port, () => {
    console.log(`AAS Electronics App listening on port ${port}`)
})