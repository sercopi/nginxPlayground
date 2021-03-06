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
const decodeToken = async (tokenFromClient, isAuthToken = true) => {
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
//Authentication middleware, deals with tokens magic
app.post('/checkAuthToken', async (req, res, next) => {
  //if the route doesnt require a token, it lets it through
  //the token is decoded.
  try {
    const tokenDecoded = await decodeToken(req.body.token);
    //check if the token can be uncoded AND check if final expiration date is due
    if (
      tokenDecoded !== false &&
      !moment().isAfter(tokenDecoded.finalExpirationDate)
    ) {
      //the token is refreshed and its data is passed to the next route
      console.log('refreshing token!');
      const refreshedToken = await generateToken(
        tokenDecoded.payload,
        tokenDecoded.finalExpirationDate
      );
      return res
        .status(200)
        .send({ status: 200, error: false, token: refreshedToken });
    }
    //if the token expired or is not coded correctly,
    //send back an auth error to be handled by the client
    res.send({ status: 440, error: true, message: 'Session Expired' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: 500, error: true, message: 'server error' });
  }
});
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

//Create User
app.post('/auth-api/register', async (req, res, next) => {
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
  const token = await generateToken({
    email: newUser.email,
    verification: true,
  });

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
app.post('/auth-api/login', async (req, res, next) => {
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
app.get('/auth-api/checkAuthParams', async (req, res, next) => {
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

app.get('/auth-api/verifyEmail', async (req, res, next) => {
  try {
    const tokenDecoded = await decodeToken(req.query.verifyToken, false);
    console.log(tokenDecoded);
    if (!tokenDecoded || !tokenDecoded.payload.verification) {
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
app.post('/auth-api/forgotPassword', async (req, res, next) => {
  try {
    const restorationEmail = req.body.email;
    const token = await generateToken({
      email: restorationEmail,
      password_restoration: true,
    });
    console.log(token);
    //send the email only if  the user exists and is validated!
    const userFound = await getConnection('prueba', 'users').then(
      (connection) =>
        connection.findOne({
          email: restorationEmail,
        })
    );
    if (userFound && userFound.verified) {
      rabbit.getChannel().then((channel) => {
        rabbit.dispatchForgotPasswordEmailJobToEmailQueue(channel, {
          email: restorationEmail,
          subject: 'a request to change your password has been done!',
          token: token,
        });
      });
    }

    return res.status(200).send(
      JSON.stringify({
        status: 200,
        error: false,
        message: 'an email has been sent, please check it!',
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
app.post('/auth-api/restorePassword', async (req, res, next) => {
  try {
    const newPassword = req.body.password;
    const tokenDecoded = await decodeToken(
      req.query.restorePasswordToken,
      false
    );
    console.log(tokenDecoded);
    if (!tokenDecoded || !tokenDecoded.payload.password_restoration) {
      return res.status(401).send(
        JSON.stringify({
          status: 401,
          error: true,
          message:
            'email has expired, please repeat the process to ask for a new one!',
        })
      );
    }
    const userEmail = tokenDecoded.payload.email;
    const hash = await bcrypt.hash(newPassword, 10);

    await getConnection('prueba', 'users').then((connection) =>
      connection.updateOne({ email: userEmail }, { $set: { password: hash } })
    );
    return res.status(200).send(
      JSON.stringify({
        status: 200,
        error: false,
        message: 'password restored, please log in!',
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
