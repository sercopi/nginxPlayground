<template>
  <v-container>
    <v-row v-if="loading"></v-row>
    <v-row v-if="!loading && error"
      ><v-col
        ><h1>{{ message }}</h1>
      </v-col></v-row
    >
    <v-row v-if="passwordChanged"
      ><v-col>
        <h1>your password has been changed successfully, please log in now!</h1>
        <img
          src="https://i.pinimg.com/originals/8d/bf/99/8dbf99e5d7209e7c31dc7f7dbd332114.jpg"
          alt="passwordChanged"
        /> </v-col
    ></v-row>
    <v-row v-if="!loading && !error && !passwordChanged"
      ><v-col>
        <v-form v-model="valid">
          <v-text-field
            :append-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="passRulesNewPassword"
            :type="show ? 'text' : 'password'"
            name="input-10-2"
            label="password"
            v-model="password"
            @click:append="show = !show"
            required
          ></v-text-field>
          <v-text-field
            :append-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="passRulesNewPasswordRepeat"
            :type="show ? 'text' : 'password'"
            name="input-10-2"
            label="repeat your new password"
            v-model="repeatPassword"
            @click:append="show = !show"
            required
          ></v-text-field>
        </v-form>
        <div class="d-flex justify-center">
          <v-btn @click="changePassword" :disabled="!valid" color="primary"
            >change my password</v-btn
          >
        </div>
      </v-col></v-row
    >
  </v-container>
</template>
<script>
  import constants from '@/lib/constants';
  import { mapActions } from 'vuex';
  export default {
    data() {
      return {
        loading: false,
        passwordChanged: false,
        error: false,
        message: '',
        show: false,
        valid: false,
        password: '',
        repeatPassword: '',
        passRulesNewPassword: [
          (v) => !!v || 'password is required',
          (v) =>
            (v.length >= 3 && v.length <= 12) ||
            'password must be between 3 and 12',
        ],
        passRulesNewPasswordRepeat: [
          (v) => !!v || 'password is required',
          (v) =>
            (v.length >= 3 && v.length <= 12) ||
            'password must be between 3 and 12',
          (v) => v == this.password || 'passwords must be the same',
        ],
      };
    },

    methods: {
      ...mapActions(['logOut', 'setNewAuthParams']),
      changePassword() {
        const token = this.$route.query.restorePasswordToken;
        this.logOut();
        fetch(
          constants.API_URL + '/restorePassword?restorePasswordToken=' + token,
          {
            method: 'POST',
            body: JSON.stringify({
              password: this.password,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
          .then((response) => response.json())
          .then((response) => {
            if (response.error) {
              this.error = true;
              this.message = response.message;
              return false;
            }
            this.passwordChanged = true;
          })
          .catch((error) => {
            this.error = false;
            console.log(error);
          });
      },
    },
  };
</script>
<style></style>
