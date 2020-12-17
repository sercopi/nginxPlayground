const express = require('express');
const os = require('os');
const app = express();
const port = 3000;
const { MongoClient } = require('mongodb');
const uri = 'mongodb://root:example@mongo:27017';
const connect = async uri => {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    const connection = await client.connect();
    return connection;
    /*  const dbList = await client
      .db()
      .admin()
      .listDatabases();
    dbList.databases.forEach(db => console.log(db.name)); */
  } catch (error) {
    console.error(error);
  } finally {
    client.close();
  }
};
const connection = connect(uri);
app.get('/', (req, res) => {
  //res.send(os.hostname());
  //basic mongodb connection
  //db.createUser({user:"pruebauser",pwd:"1234",roles:[{role:"readWrite",db:"prueba"}]})

  connection
    .then(connection => {
      const result = connection
        .db('prueba')
        .collection('prueba-collection')
        .find();
    })
    .catch(error => console.error(error));
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
//TODO
//login
//JWT
//Manejo Errores
