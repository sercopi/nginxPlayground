<template>
  <v-form v-model="valid">
    <v-container v-if="loading">
      <v-row>
        <v-col class="d-flex justify-center">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-if="!loading && verifying">
      <v-row
        ><v-col>
          <h1>please, verify your email!</h1>
          <p>
            An verification URL has been sent to your email, please check it to
            log in!
          </p>
          <img
            src="https://previews.123rf.com/images/sauvignon/sauvignon1506/sauvignon150600377/41120385-cat-with-magnifying-glass-and-searching.jpg"
            alt="verify"
          /> </v-col
      ></v-row>
    </v-container>
    <v-container v-if="!loading && !verifying">
      <v-row v-if="error">
        <v-col>
          <v-alert border="left" color="red" dismissible type="error">{{
            message
          }}</v-alert>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="firstName"
            :rules="nameRules"
            :counter="10"
            label="First name"
            required
          ></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="lastName"
            :rules="nameRules"
            :counter="10"
            label="Last name"
            required
          ></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="email"
            :rules="emailRules"
            label="E-mail"
            required
          ></v-text-field>
        </v-col>
        <v-col>
          <v-text-field
            :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="passRules"
            :type="show1 ? 'text' : 'password'"
            name="input-10-2"
            label="password"
            v-model="password"
            @click:append="show1 = !show1"
            required
          ></v-text-field>
        </v-col>
        <v-col>
          <v-text-field
            :append-icon="show2 ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="verifyPassRules"
            :type="show2 ? 'text' : 'password'"
            name="input-10-2"
            label="verify password"
            v-model="verifypass"
            @click:append="show2 = !show2"
            required
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="d-flex justify-center">
          <v-btn @click="register" color="primary" :disabled="!valid"
            >register</v-btn
          >
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>
<script>
  import constants from '@/lib/constants';
  export default {
    data() {
      return {
        verifying: false,
        loading: false,
        message: '',
        error: false,
        show1: false,
        show2: false,
        response: null,
        valid: false,
        firstName: '',
        lastName: '',
        password: '',
        verifypass: '',
        email: '',
        nameRules: [
          (v) => !!v || 'Name is required',
          (v) =>
            (v.length <= 10 && v.length >= 3) ||
            'Name must be between 3 and 10 chars',
        ],
        emailRules: [
          (v) => !!v || 'E-mail is required',
          (v) => /.+@.+/.test(v) || 'E-mail must be valid',
        ],

        passRules: [
          (v) => !!v || 'password is required',
          (v) =>
            (v.length >= 3 && v.length <= 12) ||
            'password must be between 3 and 12',
        ],
        verifyPassRules: [
          (v) => !!v || 'password is required',
          (v) =>
            (v.length >= 3 && v.length <= 12) ||
            'password must be between 3 and 12',
          () =>
            this.password === this.verifypass ||
            'password and verify password are different',
        ],
      };
    },
    methods: {
      register() {
        this.loading = true;
        fetch(constants.API_AUTH_URL + '/register', {
          method: 'post',
          body: JSON.stringify({
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            password: this.password,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json())
          .then((response) => {
            this.loading = false;
            if (response.error) {
              this.error = true;
              this.message = response.message;
              return false;
            }
            this.verifying = true;
          })
          .catch((error) => {
            this.error = false;
            console.log(error);
          });
      },
      userAlreadyExists() {
        this.email = '';
        this.error = 'User Already Exists!';
      },
    },
  };
</script>
