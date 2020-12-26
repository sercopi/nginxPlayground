const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const os = require('os');
const moment = require('moment');
const app = express();
const port = 3000;
const { MongoClient } = require('mongodb');
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
//check token
const checkToken = async (tokenFromClient) => {
  const token = tokenFromClient.split(' ');
  if (token[0] !== 'Bearer') {
    return false;
  }
  try {
    const pubKey = fs.readFileSync('./auth/jwt/public.pem');
    const decoded = await jwt.verify(token[1], pubKey);
    return decoded;
  } catch (error) {
    return false;
  }
};
const guestRoutes = ['/', '/register', '/login'];
//Authentication middleware, deals with tokens magic
const checkTokenMiddleware = async (req, res, next) => {
  //if the route doesnt require a token, it lets it through
  if (guestRoutes.includes(req.path)) return next();
  //the token is decoded.
  const tokenDecoded = await checkToken(req.headers.authorization);
  //check if the token can be uncoded AND check if final expiration date is due
  if (
    tokenDecoded !== false &&
    !moment().isAfter(tokenDecoded.finalExpirationDate)
  ) {
    //the token is refreshed and its data is passed to the next route
    console.log("refreshing token!")
    res.locals.payload = tokenDecoded.payload;
    res.locals.Auth = await generateToken(
      tokenDecoded.payload,
      tokenDecoded.finalExpirationDate
    );
    return next();
  }
  //if the token expired or is not coded correctly,
  //send back an auth error to be handled by the client
  res.send({ status: 440, error: true, message: 'Session Expired' });
};
//generate token or refresh an old one if a finalExpirationDate is passed
const generateToken = async (payload, finalExpirationDate = null) => {
  const privateKey = fs.readFileSync('./auth/jwt/private.pem');

  //if there comes a token, it is refreshed only if the finalExpiraton date is not due
  return jwt.sign(
    {
      payload: { ...payload },
      finalExpirationDate: finalExpirationDate
        ? finalExpirationDate
        : moment().add(20, 'minutes').format(),
    },
    { key: privateKey, passphrase: 'password' },
    {
      algorithm: 'RS256',
    },
    { expiresIn: 10 }
  );
};
app.all('*', checkTokenMiddleware);

//Create User
app.post('/register', async (req, res, next) => {
  console.log(req.body);
  newUser = {
    name: req.body.name,
    passwd: req.body.passwd,
    created_at: new Date().toString(),
  };
  const hash = await bcrypt.hash(newUser.passwd, 10).then((hash) => hash);
  newUser.passwd = hash;
  const userFound = await getConnection('prueba', 'users').then((connection) =>
    connection.findOne({
      name: newUser.name,
    })
  );
  if (userFound) {
    res
      .status(422)
      .send({ status: 422, error: true, message: 'User already exists!' });
    return true;
  }
  getConnection('prueba', 'users')
    .then((connection) => connection.insertOne({ ...newUser }))
    .then(() => {
      res.status(200).send(
        JSON.stringify({
          status: 200,
          error: false,
          message: 'created succesfully!',
        })
      );
    })
    .catch((error) => {
      res.status(500).send(
        JSON.stringify({
          status: 500,
          error: true,
          message: 'Error with Server',
        })
      );
    });
});
//login
app.post('/login', async (req, res, next) => {
  user = {
    name: req.body.name,
    passwd: req.body.passwd,
  };
  //obtain passwd from DB
  const userFromDB = await getConnection('prueba', 'users').then((connection) =>
    connection.findOne({ name: user.name })
  );

  if (!userFromDB) {
    return res.status(401).send(
      JSON.stringify({
        status: 401,
        error: true,
        message: 'User name invalid',
      })
    );
  }
  const passwwordsAreEqual = await bcrypt
    .compare(user.passwd, userFromDB.passwd)
    .then((result) => result);
  if (passwwordsAreEqual) {
    const token = await generateToken({ name: userFromDB.name });
    return res.status(200).send(
      JSON.stringify({
        status: 200,
        error: false,
        token: token,
        payload: { user: { name: userFromDB.name } },
      })
    );
  }
  res
    .status(401)
    .send({ status: 401, error: true, message: 'Bad Credentials' });
});
//by standard, at client the token should be stored in local storage or cookies
//we simmulate this beahviour with postman in Authorization section on the request
//so the request comes with a header that contains the jwt like it normally would
app.post('/profile', async (req, res, next) => {});
app.post('/checkAuthParams', async (req, res, next) => {
  console.log("auth params checked")
  const payload = res.locals.payload;
  const token = res.locals.token;
  return res.status(200).send(
    JSON.stringify({
      status: 200,
      error: false,
      token: token,
      payload: { ...payload },
    })
  );
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
//TODO
//JWT
//Manejo Errores
