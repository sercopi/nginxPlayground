<template>
  <v-form v-model="valid">
    <v-container v-if="loading">
      <v-row>
        <v-col class="d-flex justify-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-if="!loading">
      <v-row v-if="error">
        <v-col>
          <v-alert border="left" color="red" dismissible type="error">{{message}}</v-alert>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-text-field v-model="email" :rules="emailRules" :counter="10" label="Username" required></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-text-field
            :append-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="passRules"
            :type="show ? 'text' : 'password'"
            label="password"
            v-model="password"
            @click:append="show = !show"
            required
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="d-flex justify-center">
          <v-btn @click="login" color="primary" :disabled="!valid" class="mr-3">login</v-btn>
          <a @click.prevent="forgot_password" color="primary" :disabled="!valid">forgot password</a>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>
<script>
import constants from "@/lib/constants";
import {mapActions} from "vuex";
export default {
  data() {
    return {
      message: "",
      error: null,
      email: "",
      password: "",
      valid: false,
      show: false,
      loading: false,
      emailRules: [
        v => !!v || "E-mail is required",
        v => /.+@.+/.test(v) || "E-mail must be valid"
      ],
      passRules: [
        v => !!v || "password is required",
        v =>
          (v.length >= 3 && v.length <= 12) ||
          "password must be between 3 and 12"
      ]
    };
  },
  methods: {
    ...mapActions(["setNewAuthParams"]),
    forgot_password() {},
    login() {
      this.loading = true;
      fetch(constants.API_URL + "/login", {
        method: "post",
        body: JSON.stringify({
          name: this.email,
          passwd: this.password
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(response => {
          if (response.error) {
            this.error = true;
            this.message = response.message;
            this.loading = false;
            return false;
          }
          this.setNewAuthParams({user:response.payload.user,token:response.token});
          this.$router.push({ name: "profile" });
        })
        .catch(error => {
          this.loading = false;
          console.log(error);
        });
    }
  }
};
</script>