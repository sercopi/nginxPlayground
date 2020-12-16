const mysql = require('mysql');

class oConnection {
  constructor(host, user, database, password) {
    this.password = password;
    this.host = host;
    this.user = user;
    this.database = database;
    this.connection;
  }
  openConnection() {
    this.connection = mysql.createConnection({
      host: this.host,
      user: this.user,
      password: this.password,
      database: this.database,
    });
    this.connection.connect();
  }
  closeConnection() {
    this.connection.end();
  }

  doQueryAsync(query, values = []) {
    return new Promise((resolve, reject) =>
      this.connection.query(query, values, (err, rows) => {
        err ? reject(err) : resolve(rows);
      })
    );
  }
  doQuery(query, values = []) {
    return this.connection.query(query, values, (err, rows) => {
      err ? console.log(err) : rows;
    });
  }

  getConnection() {
    return this.connection;
  }
}
module.exports = oConnection;
