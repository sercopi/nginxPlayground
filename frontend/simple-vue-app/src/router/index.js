import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Register from '../views/Register.vue';
import Login from '../views/Login.vue';
import Profile from '../views/Profile.vue';
import About from '../views/About.vue';
import store from '../store';
import VerifyEmail from '../views/VerifyEmail';
/* import authStore from '../store/modules/auth';
 */
Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      requiresAuth: false,
      requiresGuest: true,
    },
  },
  {
    path: '/verifyEmail',
    name: 'verifyEmail',
    component: VerifyEmail,
    meta: {
      requiresAuth: false,
      requiresGuest: true,
    },
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/about',
    name: 'about',
    component: About,
    meta: {
      requiresAuth: false,
    },
  },
];

const router = new VueRouter({
  routes,
});
// eslint-disable-next-line no-unused-vars
router.beforeEach((to, from, next) => {
  console.log('entering route');
  const isLogged = store.state.Auth.isLogged;
  if (to.matched.some((record) => record.meta.requiresGuest)) {
    return next();
  }
  if (!to.matched.some((record) => record.meta.requiresAuth) && !isLogged) {
    return next();
  }
  if (to.matched.some((record) => record.meta.requiresAuth) && isLogged) {
    return next();
  }
  next({
    path: '/login',
    query: {
      redirect: to.fullPath,
    },
  });
});
export default router;
