//IMPORTANTE! Inicializar las variables
const state = {
  user: null,
  token: null,
  isLogged: false,
  authError: null,
};
const getters = {
  user: (state) => state.user,
  token: (state) => state.token,
  isLogged: (state) => state.isLogged,
};
const actions = {
  setNewAuthParams: ({ commit }, { user, token }) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    commit('setAuthParams', { user: user, token: token });
  },
  logOut:({commit})=>{
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    commit("setAuthParams",{user:null,token:null});
    commit("setIsLogged",false)
  }
};
const mutations = {
  setAuthParams: (state, { user, token }) => {
    state.user = user;
    state.token = token;
    state.isLogged = true;
  },
  setIsLogged: (state, isLogged) => (state.isLogged = isLogged),
};
export default {
  state,
  getters,
  actions,
  mutations,
};
