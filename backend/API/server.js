const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const moment = require('moment');
const app = express();
const port = 3001;
const { MongoClient, ReplSet } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());
const url = 'mongodb://root:example@mongo:27017';
const getConnection = async (database, collection = null) => {
  return await MongoClient(url, { useUnifiedTopology: true })
    .connect()
    .then((client) =>
      collection
        ? client.db(database).collection(collection)
        : client.db(database)
    )
    .catch((error) => {
      console.error(error);
      return null;
    });
};
const checkTokenMiddleware = async (req, res, next) => {
  //request the auth server to check the validity of  the token
  try {
    fetch('http://nginxplayground_auth-server_1:3000/checkAuthToken', {
      method: 'POST',
      body: JSON.stringify({ token: req.headers.authorization }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.error) {
          res
            .status(401)
            .send({ status: 401, error: true, message: 'session expired' });
        }
        res.locals.token = response.token;
        next();
      });
    //auth server must return refeshed token and decodification to be passed to routes
  } catch (error) {
    console.log(error);
    res.send({ status: 500, error: true, message: 'Server Error' });
  }
};
app.all('*', checkTokenMiddleware);
app.get('/api/profile', async (req, res, next) => {
  try {
    const userInfo = await getConnection('prueba', 'users').then((connection) =>
      connection.findOne(
        { email: req.body.email },
        { projection: { password: 0, verified: 0 } }
      )
    );
    res.status(200).send({
      status: 200,
      error: false,
      token: res.locals.token,
      payload: { userInfo: { ...userInfo } },
    });
  } catch (error) {
    res.status(500).send({ status: 500, error: true, message: 'server error' });
  }
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
