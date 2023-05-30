const express = require('express');
const app = express()
const cors = require('cors');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Bistro Boss Restaurant Server is Running...')
})

app.listen(port, () => {
    console.log(`Server is Running on port: ${port}`)
})

