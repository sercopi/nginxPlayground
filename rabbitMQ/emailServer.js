const rabbit = require('./rabbit');
const nodemailer = require('nodemailer');
const config = require('./config');

const transporter = nodemailer.createTransport({
  service: config.SERVICE,
  auth: {
    user: config.EMAIL,
    pass: config.PASS,
  },
});

function generateEmail({ email, subject, text }) {
  const mailOptions = {
    from: config.EMAIL,
    to: email,
    subject: subject,
    text: text,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      error ? reject(error) : resolve(info.response);
    });
  });
}

rabbit
  .getChannel()
  .then((channel) => {
    console.log('email server connected!');

    channel.consume(config.QUEUE_VERIFY_EMAIL, async (data) => {
      console.log(data);
      const emailData = JSON.parse(data.content);
      console.log('sending email');
      const text =
        config.CLIENT_ADDRESS +
        config.CLIENT_VERIFY_EMAIL_ENDPOINT +
        '?verifyToken=' +
        emailData.token;
      const responseMailServer = await generateEmail({
        email: emailData.email,
        subject: emailData.subject,
        text: text,
      });
      console.log(responseMailServer);
      //confirma que se ha enviado el correo y lo elimina de la cola

      channel.ack(data);
      console.log('Respuesta del servidor de correo: ' + responseMailServer);
    });
    channel.consume(config.QUEUE_FORGOT_PASSWORD, async (msg) => {});
  })
  .catch((err) => console.log(err));
