const express = require('express');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors());
app.use(express.json());

// verify tokenize user middleware
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unatthorized access' })
  }
  // [0]    [1]
  // bearer token
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unatthorized access Err:' })
    }
    req.decoded = decoded;
    next();
  })
}


// Connect Mongo
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vgnfmcl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const menuCollection = client.db('bistroDB').collection('menu')
    const reviewsCollection = client.db('bistroDB').collection('reviews')
    const cartCollection = client.db('bistroDB').collection('carts')
    const usersCollection = client.db('bistroDB').collection('users')

    // 1-JWT: Json Web Token
    // create token
    // request receive fron AuthProvider.jsx 
    app.post('/jwt', (req, res) => {
      const user = req.body;
      // create unique token for each user & every login, register, sociallogin
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '10h' })
      res.send({ token })
    })

    // warning: use verifyJWT before using verifyAdmin
    // middleware
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message from verrfyAdmin' });
      }
      next();
    }

    // 8 get user info in server. 
    // http://localhost:5000/users
    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // 7 users related api. store user info to DB
    // from Register.jsx & SocialLogin.jsx
    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log(user)
      // social login check user existent
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      console.log('already exist user:', existingUser)
      if (existingUser) {
        return res.send({ message: 'user already exist' })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    // check admin user or not
    // request from useAdmin.jsx
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      console.log('check admin:', email);
      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);

    })

    // update user field
    // AllUsers.jsx
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateUser = {
        $set: { role: 'admin' }
      }
      const result = await usersCollection.updateOne(filter, updateUser)
      res.send(result)
    })

    // delete user field
    // AllUsers.jsx
    app.delete('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(filter)
      res.send(result)

    })

    // 1 useMenu.jsx data load
    // http://localhost:5000/menu
    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result)
    })

    // 2 Testimonial.jsx data load
    // http://localhost:5000/reviews
    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result)
    })

    // 3 add item in cart
    // FoodCard.jsx hit here & create new cart collection
    app.post('/carts', async (req, res) => {
      const item = req.body;
      // console.log(item);
      const result = await cartCollection.insertOne(item);
      res.send(result)
    })

    // 4 to view cart items in server
    // http://localhost:5000/carts
    // activate it --------------- err: http://localhost:5000/carts?email=undefined
    // app.get('/carts', async (req, res) => {
    //   const result = await cartCollection.find().toArray();
    //   res.send(result);
    // })

    // 5 to view cart items Navbar.jsx
    // after verifyJWT useCart.jsx request come here
    app.get('/carts', verifyJWT, async (req, res) => {
      const email = req.query.email;
      console.log(email)
      if (!email) {
        res.send([])
      }
      // jwt verify: with your token can not acess others data
      // request come from useCart.jsx
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(401).send({ error: true, message: 'forbidden access! can not access other users data' })
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    })

    // 6 delete [MyCart.jsx]
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result)
    })

    // ping to test DB connection
    await client.db("admin").command({ ping: 1 });
    console.log("Bistro Boss Restaurant Server is successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Bistro Boss Restaurant Server is Running...')
})

app.listen(port, () => {
  console.log(`Bistro Boss Restaurant Server is Running on port: ${port}`)
})

