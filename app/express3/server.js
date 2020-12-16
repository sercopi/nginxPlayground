const express = require('express');
const os = require('os');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  //res.send(os.hostname());
  //basic mongodb connection
  const MongoClient = require('mongodb').MongoClient;
  const url = 'mongodb://root:example@localhost:27017/prueba';
  const response = [];
  MongoClient.connect(url, function(err, db) {
    console.log(db);
    const cursor = db.collection('prueba-collection').find();

    cursor.each(function(err, doc) {
      response.push(doc);
    });
    res.send(response);
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
//TODO
//login
//JWT
//Manejo Errores
