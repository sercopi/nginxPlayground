const amqp = require('amqplib/callback_api');
const config = require('./config');

module.exports = {
  getChannel: getChannel,
  dispatchVerifyEmailJobToEmailQueue: dispatchVerifyEmailJobToEmailQueue,
  dispatchForgotPasswordEmailJobToEmailQueue: dispatchForgotPasswordEmailJobToEmailQueue,
};

async function getChannel() {
  const server = await createConnection('amqp://rabbitmq:rabbitmq@rabbitmq');
  const channel = await createChannel(server);

  // crear las colas al arrancar porque si no va a petar cuando empiecen a escuchar por estas colas
  channel.assertQueue(config.QUEUE_VERIFY_EMAIL, {
    durable: true,
  });

  channel.assertQueue(config.QUEUE_FORGOT_PASSWORD, {
    durable: true,
  });

  return channel;
}

function createConnection(connectionString) {
  return new Promise((resolve, reject) => {
    amqp.connect(connectionString, function (error, connection) {
      return error?reject(error):resolve(connection);
    });
  });
}

function createChannel(connection) {
  return new Promise((resolve, reject) => {
    connection.createChannel(function (error, channel) {
      return error?reject(error):resolve(channel);
    });
  });
}

function dispatchVerifyEmailJobToEmailQueue(channel,data) {
  return channel.sendToQueue(config.QUEUE_VERIFY_EMAIL,Buffer.from(JSON.stringify(data)));
}
function dispatchForgotPasswordEmailJobToEmailQueue(channel,data){
  return channel.sendToQueue(config.QUEUE_FORGOT_PASSWORD,Buffer.from(JSON.stringify(data)));
}
