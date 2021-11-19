const express = require('express')
const app = express()
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');

const port = process.env.PORT || 5000;
// doctors-portal-84d44-firebase-adminsdk-srpnm-518e8d3d1c.json



const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
app.use(cors());
app.use(express.json());
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0sln2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0sln2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri);
async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();
}
async function run() {
    try {
        await client.connect();
        // const database = client.db('doctors_portalss');
        const database = client.db('Sarkar_car');
        const bookingCollection = database.collection('booking');
        const usersCollection = database.collection('users');

        const carsCollection = database.collection('cars');
        const orderCollection = database.collection('orders');
        // const usersCollection = database.collection("users");
        // app.get('/booking', async (req, res) => {
        //     const email = req.query.email;
        //     const date = new Date(req.query.date).toLocaleDateString();

        //     const query = { email: email, date: date }

        //     const cursor = bookingCollection.find(query);
        //     const booking = await cursor.toArray();
        //     res.json(booking);
        // })

        app.get('/booking', async (req, res) => {
            // const email = req.query.email;
            // const date = new Date(req.query.date).toLocaleDateString();
            // const query = { email: email, date: date }

            //     const query = { email: email, date: date }
            const cursor = bookingCollection.find({});
            const booking = await cursor.toArray();
            res.json(booking);
        })

        app.post('/booking', async (req, res) => {
            const appointment = req.body;
            const result = await bookingCollection.insertOne(appointment);
            console.log(appointment);
            res.json(result)

            // console.log(result);
            // res.json(result)
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        })
        // app.put('/users/admin', async (req, res) => {
        //     const user = req.body;
        //     const filter = { email: user.email };
        //     const updateDoc = { $set: { role: 'admin' } };
        //     const result = await usersCollection.updateOne(filter, updateDoc);
        //     res.json(result);
        // })

        //GET cars API

        app.get('/cars', async (req, res) => {
            const cursor = carsCollection.find({});
            const cars = await cursor.toArray();
            res.send(cars);
        });




        //Use POST 
        app.post('/cars/bykeys', async (req, res) => {
            const keys = req.body;
            const query = { key: { $in: keys } }
            const cars = await carsCollection.find(query).toArray();

            res.json(cars);
        });

        //Add orders API
        app.post('/orders', async (req, res) => {
            const order = req.body;
            // console.log('order', order);
            const result = await orderCollection.insertOne(order);
            res.json(result);
        })



        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        }
        );

        app.get('/users/:id', async (req, res) => {
            const id = req.params.id
                ;
            const query = { _id: ObjectId(id) };

            const user = await usersCollection.findOne(query);
            // console.log('load user with id:', id);
            res.send(user);
        });

        // POST API

        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const result = await usersCollection.insertOne(newUser)
            console.log('hitting the post', req.body);
            console.log('added user', result);
            res.json(result);
        });


        //UPDATE API
        app.put('/users/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    address: updatedUser.address,
                    name: updatedUser.name,
                    email: updatedUser.email
                },

            };
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            console.log('updating user', req)
            res.json(result);
        })

        //DELETE API

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);

            console.log('deleting user with id', result);
            res.json(result);
        })





    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})