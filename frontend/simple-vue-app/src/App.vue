<template>
  <v-app>
    <v-app-bar color="primary" dark app prominent>
      <template v-slot:img="{ props }">
        <v-img v-bind="props" gradient="to top right, rgba(100,115,201,.7), rgba(25,32,72,.7)"></v-img>
      </template>
      <v-app-bar-nav-icon></v-app-bar-nav-icon>

      <v-toolbar-title>Simple Vue App Demonstration</v-toolbar-title>

      <template v-slot:extension>
        <v-tabs align-with-title>
          <v-tab to="/">
            <v-icon class="mr-2">mdi-home</v-icon>HOME
          </v-tab>
          <v-tab v-if="!isLogged" to="/login">
            <v-icon class="mr-2">mdi-key</v-icon>LOGIN
          </v-tab>
          <v-tab v-if="!isLogged" to="/register">
            <v-icon class="mr-2">mdi-key</v-icon>REGISTER
          </v-tab>
          <v-tab v-if="isLogged"  to="/profile">
            <v-icon class="mr-2">mdi-account</v-icon>My Profile
          </v-tab>
          <v-tab v-if="isLogged" @click.prevent="logOut">
            <v-icon class="mr-2">mdi-logout</v-icon>log out
          </v-tab>
        </v-tabs>
      </template>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-heart</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-menu left bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item v-for="n in 5" :key="n" @click="() => {}">
            <v-list-item-title>Option {{ n }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script>
import {mapGetters,mapActions} from "vuex";
export default {
  name: "App",
  data() {
    return { boolean: true };
  },
  computed: {
    ...mapGetters(["isLogged"])
  },methods:{
    ...mapActions(["logOut"])
  }
};
</script>
