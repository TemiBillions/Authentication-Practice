const express = require('express');
const app = express();
const morgan = require('morgan');
const connectDB = require('./src/config/db');
require('dotenv').config();
const port = process.env.PORT || 3000;


const userRoutes = require('./src/routes/user.routes');

app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.send('You are welcome to my authentication app!');
});

connectDB();

app.use('/api/users', userRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});