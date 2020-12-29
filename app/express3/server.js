const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const os = require('os');
const rabbit = require('./rabbitMQ/rabbit');
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
const checkToken = async (tokenFromClient, isAuthToken = true) => {
  let tokenArrayParts = tokenFromClient.split(' ');
  let token = tokenFromClient;
  if (isAuthToken) {
    if (tokenArrayParts[0] !== 'Bearer') {
      return false;
    }
    token = tokenArrayParts[1];
  }
  try {
    const pubKey = fs.readFileSync('./auth/jwt/public.pem');
    const decoded = await jwt.verify(token, pubKey);
    return decoded;
  } catch (error) {
    console.log(error);
    return false;
  }
};
const guestRoutes = [
  '/',
  '/register',
  '/login',
  '/verifyEmail',
  '/forgotPassword',
];
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
    console.log('refreshing token!');
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
    email: req.body.email,
    password: req.body.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    created_at: new Date().toString(),
  };
  const hash = await bcrypt.hash(newUser.password, 10).then((hash) => hash);
  newUser.password = hash;
  const userFound = await getConnection('prueba', 'users').then((connection) =>
    connection.findOne({
      email: newUser.email,
    })
  );
  if (userFound) {
    return res
      .status(422)
      .send({ status: 422, error: true, message: 'User already exists!' });
  }
  await getConnection('prueba', 'users')
    .then((connection) => connection.insertOne({ ...newUser, verified: false }))
    .catch((error) => {
      console.log(error);
      res.status(500).send(
        JSON.stringify({
          status: 500,
          error: true,
          message: 'Error with Server',
        })
      );
    });
  const token = await generateToken({ email: newUser.email });
  console.log('token generated: ');
  console.log(token);
  rabbit.getChannel().then((channel) => {
    rabbit.dispatchVerifyEmailJobToEmailQueue(channel, {
      email: newUser.email,
      subject: 'please, verify your email!',
      token: token,
    });
  });
  res
    .status(200)
    .send(
      JSON.stringify({
        status: 200,
        error: false,
        message: 'created succesfully!',
      })
    )
    .catch((error) => {
      console.log(error);
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
    email: req.body.email,
    password: req.body.password,
  };
  //obtain password from DB
  const userFromDB = await getConnection('prueba', 'users').then((connection) =>
    connection.findOne({ email: user.email })
  );

  if (!userFromDB || !userFromDB.verified) {
    return res.status(401).send(
      JSON.stringify({
        status: 401,
        error: true,
        message: 'User email invalid',
      })
    );
  }
  const passwwordsAreEqual = await bcrypt
    .compare(user.password, userFromDB.password)
    .then((result) => result);
  if (passwwordsAreEqual) {
    const token = await generateToken({ email: userFromDB.email });
    return res.status(200).send(
      JSON.stringify({
        status: 200,
        error: false,
        token: token,
        payload: { user: { email: userFromDB.email } },
      })
    );
  }
  res
    .status(401)
    .send({ status: 401, error: true, message: 'Bad Credentials' });
});
app.post('/profile', async (req, res, next) => {});
app.get('/checkAuthParams', async (req, res, next) => {
  console.log('auth params checked');
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

app.get('/verifyEmail', async (req, res, next) => {
  try {
    const tokenDecoded = await checkToken(req.query.verifyToken, false);
    console.log(tokenDecoded);
    if (!tokenDecoded) {
      return res.status(401).send(
        JSON.stringify({
          status: 401,
          error: true,
          message: 'email has expired, register again, please!',
        })
      );
    }
    await getConnection('prueba', 'users').then((connection) =>
      connection.updateOne(
        { email: tokenDecoded.payload.email },
        { $set: { verified: true } }
      )
    );
    const token = await generateToken({ email: tokenDecoded.payload.email });
    return res.status(200).send(
      JSON.stringify({
        status: 200,
        error: false,
        token: token,
        payload: { user: { email: tokenDecoded.payload.email } },
      })
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(
      JSON.stringify({
        status: 500,
        error: true,
        message: 'Error with Server',
      })
    );
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
//TODO
//JWT
//Manejo Errores
