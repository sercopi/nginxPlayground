<template>
  <v-container>
    <v-row>
      <v-col class="d-flex justify-center">
        <v-sheet
          id="background"
          color="white"
          elevation="7"
          height="1500"
          width="1500"
          class="text-center pt-5"
        >
          <h1>
            <v-icon class="mr-2" aria-hidden="false" large color="black">mdi-paw</v-icon>simple vue app example
            <v-icon class="ml-2" aria-hidden="false" large color="black">mdi-paw</v-icon>
          </h1>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
// @ is an alias to /src

export default {
  data() {
    return {};
  },
  methods: {}
};
</script>
<style lang="css">
#background {
  background-image: url("https://desenio.es/bilder/artiklar/zoom/11774_2.jpg");
  background-size: cover;
}
</style>