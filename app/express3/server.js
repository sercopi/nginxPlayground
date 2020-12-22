const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const os = require('os');
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
    .then(client =>
      collection
        ? client.db(database).collection(collection)
        : client.db(database)
    )
    .catch(error => {
      console.error(error);
      return null;
    });
};
//check token
const checkToken=(tokenFromClient)=>{
  const token = tokenFromClient.split(' ');
  if (token[0] !== 'Bearer') {
    return false
  }
  try {
    const pubKey = fs.readFileSync('./auth/jwt/public.pem');
    const decoded = await jwt.verify(token[1], pubKey);
    return decoded
  } catch (error) {
    console.error(error)
    return false
  }
}
//Create User
app.post('/register', async (req, res, next) => {
  console.log(req.body);
  newUser = {
    name: req.body.name,
    passwd: req.body.passwd,
    created_at: new Date().toString()
  };
  const hash = await bcrypt.hash(newUser.passwd, 10).then(hash => hash);
  newUser.passwd = hash;
  const userFound = await getConnection('prueba', 'users').then(connection =>
    connection.findOne({
      name: newUser.name
    })
  );
  if (userFound) {
    res
      .status(422)
      .send({ status: 422, error: true, message: 'User already exists!' });
    return true;
  }
  getConnection('prueba', 'users')
    .then(connection => connection.insertOne({ ...newUser }))
    .then(() => {
      res
        .status(200)
        .send(
          JSON.stringify({
            status: 200,
            error: false,
            message: 'created succesfully!'
          })
        );
    })
    .catch(error => {
      res
        .status(500)
        .send(
          JSON.stringify({
            status: 500,
            error: true,
            message: 'Error with Server'
          })
        );
    });
});
//login
app.post('/login', async (req, res, next) => {
  //res.send(os.hostname());
  //basic mongodb connection
  //db.createUser({user:"pruebauser",pwd:"1234",roles:[{role:"readWrite",db:"prueba"}]})
  user = {
    name: req.body.name,
    passwd: req.body.passwd
  };
  //obtain passwd from DB
  const userFromDB = await getConnection('prueba', 'users').then(connection =>
    connection.findOne({ name: user.name })
  );

  if (!userFromDB) {
    return res.status(401).send(
      JSON.stringify({
        status: 401,
        error: true,
        message: 'User name invalid'
      })
    );
  }
  const passwwordsAreEqual = await bcrypt
    .compare(user.passwd, userFromDB.passwd)
    .then(result => result);
  if (passwwordsAreEqual) {
    const privateKey = fs.readFileSync('./auth/jwt/private.pem');
    const token = jwt.sign(
      { name: user.name },
      { key: privateKey, passphrase: 'password' },
      {
        algorithm: 'RS256'
      },
      { expiresIn: 10 }
    );
    return res.status(200).send(
      JSON.stringify({
        status: 200,
        error: false,
        token: token,
        user: userFromDB
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
app.post('/jwtCheck', async (req, res, next) => {
  const isTokenCorrect = checkToken(req.headers.authorization)
  
});


//PRUEBAS
/* const connect = async uri => {
  try {
    var mongoclient = new MongoClient(uri, {
      native_parser: true
    });

    // Open the connection to the server
    mongoclient.open(function(err, mongoclient) {
      // Get the first db and do an update document on it
      var db = mongoclient.db('prueba');
      console.log(db);
    });
  } catch (error) {
    console.error(error);
  } finally {
    client.close();
  }
};
const response = {
  id: os.hostname()
};
app.get('/', (req, res) => {
  //res.send(os.hostname());
  //basic mongodb connection
  //db.createUser({user:"pruebauser",pwd:"1234",roles:[{role:"readWrite",db:"prueba"}]})
  MongoClient.connect(url, function(err, client) {
    const cursor = client
      .db('prueba')
      .collection('prueba-collection')
      .find();
    const result = [];
    cursor.forEach(doc => result.push(doc));
    response.query = result;
    res.send(response);
    client.close();
  });
});
app.get('/:id', (req, res) => {
  MongoClient.connect(url, function(err, client) {
    const doc = client
      .db('prueba')
      .collection('prueba-collection')
      .findOne({ _id: ObjectId(req.params.id) });
    res.send(doc);
  });
});
app.put('/:id', (req, res) => {
  MongoClient.connect(url, function(err, client) {
    client
      .db('prueba')
      .collection('prueba-collection')
      .updateOne(
        { _id: ObjectId(req.params.id) },
        {
          $set: { ...req.body },
          $currentDate: { lastModified: true }
        }
      )
      .then(() => res.status(200))
      .catch(error => res.status(error.statusCode));
  });
}); */

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
//TODO
//JWT
//Manejo Errores
