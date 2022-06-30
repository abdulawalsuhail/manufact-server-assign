const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.atw05.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


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
        const reviewCollection = client.db('AAS_Electronics').collection('reviews');
        const orderCollection = client.db('AAS_Electronics').collection('orders');
        const profileCollection = client.db('AAS_Electronics').collection('profiles');
        const userCollection = client.db('AAS_Electronics').collection('users');
        const paymentCollection = client.db('AAS_Electronics').collection('payments');



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

        app.post('/create-payment-intent', verifyJWT, async(req, res) =>{
            const service = req.body;
            const price = service.price;
            const amount = price*100;
            const paymentIntent = await stripe.paymentIntents.create({
              amount : amount,
              currency: 'usd',
              payment_method_types:['card']
            });
            res.send({clientSecret: paymentIntent.client_secret})
          });

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

        app.get('/order', async (req, res) => {
            const query = {}
            const cursor = orderCollection.find(query)
            const orders = await cursor.toArray()
            res.send(orders)
        })

        app.get('/order', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const order = await orderCollection.find(query).toArray();
                return res.send(order);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }
        })
        app.get('/order/:id', verifyJWT, async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const order = await orderCollection.findOne(query)
            res.send(order)
        })

        // payment
        app.patch('/order/:id',async(req,res)=>{
            const id = req.params.id
            const payment=req.body
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set:{
                    paid:true,
                    transactionId:payment.transactionId,
                }
            };
            const result = await paymentCollection.insertOne(payment)
            const updatedOrder = await orderCollection.updateOne(filter,updateDoc)
            res.send(updatedOrder)

        })

        app.post('/order', verifyJWT, async (req, res) => {
            const newOrder = req.body;
            const result = await orderCollection.insertOne(newOrder)
            res.send(result)
        })

        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })



        // user my profile all api
        app.put('/profile/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const profile = req.body
            const filter = { email: email }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    name: profile.name,
                    email: profile.email,
                    address: profile.address,
                    education: profile.education,
                    phone: profile.phone,
                    location: profile.location,
                    city: profile.city,
                    country: profile.country,
                    social: profile.social
                }
            }
            const result = await profileCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        // user profile info get api 
        app.get('/profile', verifyJWT, async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const cursor = profileCollection.find(query)
            const profile = await cursor.toArray()
            res.send(profile)
        })



        // review post api
        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query)
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
        app.post('/review', async (req, res) => {
            const newReviews = req.body
            const result = await reviewCollection.insertOne(newReviews)
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
            res.send({admin:isAdmin})
        })



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