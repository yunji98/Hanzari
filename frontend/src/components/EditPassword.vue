<template>
  <v-layout row wrap class="text-xs-center">
    <v-flex>
      <v-card flat style="margin-left: 550px; width: 800px; height: 400px">
        <v-card-title primary-title>
          <h4>{{ this.$t("textEditPassword") }}</h4>
        </v-card-title>
        <v-form>
          <v-row>
            <v-text-field
              prepend-icon="lock"
              name="Password"
              :label="$t('textFieldLabelPreviousPw')"
              type="password"
              v-model="oldPassword"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              prepend-icon="lock"
              name="Password"
              :label="$t('textFieldLabelChangePw')"
              type="password"
              v-model="newPassword"
              style="top: 100px"
            ></v-text-field
          ></v-row>
          <v-row>
            <v-text-field
              prepend-icon="lock"
              name="Password"
              :label="$t('textFieldLabelChangePwCompare')"
              type="password"
              v-model="newPasswordCompare"
            ></v-text-field>
          </v-row>
          <v-card-actions>
            <v-row>
              <v-col class="text-right">
                <v-btn @click="changeBackPage">{{
                  this.$t("btnCancel")
                }}</v-btn>
                <v-btn @click="editUserPassword" dark color="#2c4f91">{{
                  this.$t("btnOK")
                }}</v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import axios from "axios";
import { refreshToken } from "@/refreshToken.js";
import { eventBus } from "../main";

const HOST = "http://172.30.6.192:8080";

export default {
  data() {
    return {
      oldPassword: null,
      newPassword: null,
      newPasswordCompare: null,
    };
  },
  methods: {
    changeBackPage() {
      eventBus.$emit("pushEditUserPasswordStatus", false);
    },
    async editUserPassword() {
      let changeUserData = {};
      let errorStatus = null;

      // 현재 비밀번호에 아무것도 입력하지 않고 확인을 누를시
      if (this.oldPassword === null) {
        this.$notice.info({
          title: this.$i18n.t("alertNoInputOldPassword"),
          styles: {
            width: "300px",
            marginLeft: "-750px",
            top: "610px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      } // 현재 비밀번호와 새 비밀번호가 같을 시
      else if (this.oldPassword === this.newPassword) {
        this.$notice.info({
          title: this.$i18n.t("alertSamePreviousPassword"),
          styles: {
            width: "300px",
            marginLeft: "-750px",
            top: "610px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      } // 새 비밀번호에 아무것도 입력하지 않고 확인을 누를시
      else if (this.newPassword === null) {
        this.$notice.info({
          title: this.$i18n.t("alertNoInputNewPassword"),
          styles: {
            width: "300px",
            marginLeft: "-750px",
            top: "610px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      }

      changeUserData.employeeId = this.$store.state.userStore.employeeId;
      changeUserData.oldPw = this.oldPassword;
      changeUserData.newPw = this.newPassword;

      try {
        this.$axios
          .post(HOST + "/v1/signup", JSON.stringify(changeUserData), {
            headers: {
              "Content-Type": `application/json`,
            },
          })
          .catch((error) => {
            errorStatus = error.response.status;
          })
          .then((res) => {
            if (errorStatus === 500) {
              this.$notice.info({
                title: this.$i18n.t("errorChangePassword"),
                styles: {
                  width: "300px",
                  marginLeft: "-750px",
                  top: "610px",
                  backgroundColor: "#2a88bd",
                },
                duration: 5,
              });
              this.oldPassword = null;
              this.newPassword = null;
              this.newPasswordCompare = null;
            }
            if (res) {
              if (res.status === 200) {
                eventBus.$emit("pushEditUserPasswordStatus", true);
              }
            }
          });
        if (errorStatus === 401) {
          await refreshToken();
          response = await axios.get(
            HOST + "/api/employee/" + this.$store.state.userStore.employeeId,
            {
              headers: { "X-AUTH-TOKEN": this.$store.state.userStore.token },
            }
          );
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>