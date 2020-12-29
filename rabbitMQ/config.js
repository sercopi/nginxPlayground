const config = {
  SERVICE: 'gmail',
  EMAIL: 'vpssergiocorderopino@gmail.com',
  PASS: 'sergiio667',
  QUEUE_VERIFY_EMAIL: 'verify-email',
  QUEUE_FORGOT_PASSWORD: 'forgot-password',
  CLIENT_ADDRESS: 'http://localhost:8080/#',
  CLIENT_VERIFY_EMAIL_ENDPOINT: '/verifyEmail',
};
module.exports = Object.freeze({ ...config });
