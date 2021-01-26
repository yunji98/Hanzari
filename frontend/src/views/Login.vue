<template>
  <v-app id="app">
    <v-app-bar app color="#2c4f91" dark flat :height="30">
      <v-toolbar-title>{{ $t("projectLogin") }}</v-toolbar-title>
    </v-app-bar>
    <v-main>
      <v-container style="position: relative; top: 20%" class="text-xs-center">
        <v-layout row wrap class="text-xs-center">
          <v-flex>
            <v-card flat class="mx-auto" max-width="800">
              <v-row style="margin-top: 60px">
                <v-col>
                  <div>
                    <img src="@/assets/hancomLogo.png" />
                  </div>
                </v-col>
                <v-col>
                  <v-form style="width: 400px; height: 300px">
                    <div class="mx-3">
                      <v-icon color="black" size="30px">person</v-icon>
                      {{ $t("employeeId") }}
                      <div class="mx-1">
                        <v-text-field
                          :placeholder="$t('employeeIdExample')"
                          v-model="employeeId"
                          required
                        ></v-text-field>
                      </div>
                    </div>
                    <div class="mx-3">
                      <v-icon color="black" size="30px">lock</v-icon>
                      {{ $t("password") }}
                      <div class="mx-1">
                        <v-text-field
                          :placeholder="$t('password')"
                          type="password"
                          v-model="password"
                          required
                        ></v-text-field>
                      </div>
                    </div>
                    <v-card-text v-if="errorLoginStatus" style="color: red">{{
                      $t("alertErrorLogin")
                    }}</v-card-text>
                    <v-card-actions>
                      <v-btn
                        color="#2c4f91"
                        dark
                        large
                        block
                        @click="loginSubmit"
                        >{{ $t("login") }}</v-btn
                      >
                    </v-card-actions>
                  </v-form>
                </v-col>
              </v-row>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
const HOST = "http://172.30.6.192:8080";

export default {
  data() {
    return {
      employeeId: null,

      password: null,
      errorLoginStatus: false,
    };
  },
  methods: {
    loginSubmit() {
      if (this.employeeId === null && this.password === null) {
        return;
      }
      let errorStatus = null;
      let saveData = {};
      saveData.employeeId = this.employeeId;
      saveData.employeePw = this.password;

      try {
        this.$axios
          .post(HOST + "/v1/signin", JSON.stringify(saveData), {
            headers: {
              "Content-Type": `application/json`,
            },
          })
          .catch((error) => {
            errorStatus = error.response.status;
          })
          .then((res) => {
            //로그인 실패시
            if (errorStatus === 500) {
              this.errorLoginStatus = true;
              this.employeeId = null;
              this.password = null;
              return;
            }
            //로그인 성공시
            if (res) {
              if (res.status === 200) {
                console.log(res.data.access_token);
                this.$store.commit("login", res.data);
                this.$store.commit("setEmployeeId", this.employeeId);

                if (this.$store.state.userStore.token != "") {
                  if (
                    this.$store.state.userStore.authority === "admin" ||
                    this.$store.state.userStore.authority === "viewer" ||
                    this.$store.state.userStore.authority === "manager"
                  ) {
                    this.$router.push("/myPage");
                  } else if (
                    this.$store.state.userStore.authority === "super"
                  ) {
                    this.$router.push("/SuperHanzari");
                  }
                }
              }
            }
          });
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>
