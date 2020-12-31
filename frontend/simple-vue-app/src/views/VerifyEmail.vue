<template>
  <v-container>
    <v-row v-if="!error && !verified"
      ><v-col>
        <h1>Verifying your Email, please wait!</h1>
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular> </v-col
    ></v-row>
    <v-row v-if="error"
      ><v-col>
        <h1>Error with your email verification!</h1>
        <p>{{ message }}</p>
      </v-col></v-row
    >
    <v-row v-if="verified"
      ><v-col>
        <h1>Thank you for verifying your Email!</h1>
      </v-col></v-row
    >
  </v-container>
</template>
<script>
  import { mapActions } from 'vuex';
  import constants from '@/lib/constants';

  export default {
    data() {
      return {
        error: false,
        message: false,
        verified: false,
      };
    },
    mounted() {
      const token = this.$route.query.verifyToken;
      this.logOut();
      fetch(constants.API_AUTH_URL + '/verifyEmail?verifyToken=' + token, {
        method: 'get',
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.error) {
            this.error = true;
            this.message = response.message;
            return false;
          }
          console.log(response.payload.user);
          this.setNewAuthParams({
            user: response.payload.user,
            token: response.token,
          });
          this.verified = true;
        })
        .catch((error) => {
          this.error = false;
          console.log(error);
        });
    },
    methods: {
      ...mapActions(['logOut', 'setNewAuthParams']),
    },
  };
</script>
