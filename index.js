const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors());
app.use(express.json());


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

    // 1 useMenu.jsx data load
    app.get('/menu', async(req, res) => {
        const result = await menuCollection.find().toArray();
        res.send(result)
    })

    // 2 Testimonial.jsx data load
    app.get('/reviews', async(req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result)
    })

    // 3 add item in cart
    // FoodCard.jsx hit here & create new cart collection
    app.post('/carts', async(req, res) => {
      const item = req.body;
      // console.log(item);
      const result = await cartCollection.insertOne(item);
      res.send(result)
    })

    // 4 to view cart items in server
    // http://localhost:5000/carts
    // app.get('/carts', async(req, res) => {
    //   const result = await cartCollection.find().toArray();
    //   res.send(result);
    // })

    // 5 to view cart items Navbar.jsx
    app.get('/carts', async(req, res) => {
      const email = req.query.email;
      // console.log(email)
      if(!email){ 
        res.send([])
      }
      const query = {email: email};
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    })

    // 6 delete [MyCart.jsx]
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await cartCollection.deleteOne(query);
      res.send(result)
    })

   

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

