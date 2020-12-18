const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const os = require('os');
const app = express();
const port = 3000;
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
app.use(bodyParser.json());
const url = 'mongodb://root:example@mongo:27017';
const userExists = user => {
  MongoClient.connect(url, function(err, client) {
    try {
      const userFound = client
        .db('prueba')
        .collection('users')
        .findOne({ name: user.name });
      return userFound;
    } catch (error) {
      console.error(error);
    } finally {
      client.close();
    }
  });
};
//Create User
app.post('/register', (req, res, next) => {
  //res.send(os.hostname());
  //basic mongodb connection
  //db.createUser({user:"pruebauser",pwd:"1234",roles:[{role:"readWrite",db:"prueba"}]})
  newUser = {
    name: req.body.name,
    passwd: req.body.passwd,
    created_at: new Date().toString
  };
  MongoClient.connect(url, function(err, client) {
    if (userExists(newUser)) {
      return res.send('User Already Exists!');
    }
    console.log(newUser.name);
    hash = bcrypt.hash(newUser.passwd, 10).then(hash => console.log(hash));
    console.log(hash);
    return true;
    try {
      client
        .db('prueba')
        .collection('users')
        .insertOne({ ...newUser });
      res.status(200);
      res.send('Succesfully created!');
    } catch (error) {
      res.status(error.status);
      res.send(error);
    } finally {
      client.close();
    }
  });
});
//login
app.post('/login', (req, res, next) => {
  //res.send(os.hostname());
  //basic mongodb connection
  //db.createUser({user:"pruebauser",pwd:"1234",roles:[{role:"readWrite",db:"prueba"}]})
  user = {
    name: req.body.name,
    passwd: req.body.passwd
  };
  MongoClient.connect(url, function(err, client) {
    try {
      client
        .db('prueba')
        .collection('users')
        .findOne({});
      res.status(200);
      res.send('Succesfully created!');
    } catch (error) {
      res.status(error.status);
      res.send(error);
    } finally {
      client.close();
    }
  });
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
//login
//JWT
//Manejo Errores
