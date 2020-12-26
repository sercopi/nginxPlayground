import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import constants from './lib/constants';

Vue.config.productionTip = false;

const checkAuthParamsWithBackend = async (token) => {
  return fetch(constants.API_URL + '/checkAuthParams', {
    method: 'post',
    body: JSON.stringify({}),
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());
};
const initApp = async () => {
  console.log('initializing app');
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (token && user) {
    await checkAuthParamsWithBackend(token)
      .then((response) => {
        if (response.error) {
          console.log("token missmatch")
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          return true;
        }
        console.log("refresing token from client")
        localStorage.setItem('user', user);
        localStorage.setItem('token', token);
        store.state.Auth.isLogged = true;
        store.state.Auth.user = JSON.parse(user);
        store.state.Auth.token = token;
      })
      .catch((error) => {
        console.error(error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      });
  }
  new Vue({
    router,
    store,
    vuetify,
    render: (h) => h(App),
  }).$mount('#app');
};
initApp();
