<template>
  <v-app id="app">
    <div v-if="this.$store.state.getStore.loginEmployeeObject">
      <v-app-bar app color="#2c4f91" dark flat :height="30">
        <v-toolbar-title v-if="!drawer">{{
          $t("projectMypage")
        }}</v-toolbar-title>
        <v-spacer />
        <v-btn text @click="logout">{{ $t("logout") }}</v-btn>
      </v-app-bar>

      <v-navigation-drawer v-model="drawer" app :width="375">
        <v-toolbar color="#2c4f91" dark :height="30">
          <v-toolbar-title v-if="drawer">{{
            $t("projectMypage")
          }}</v-toolbar-title>
        </v-toolbar>
        <v-sheet color="grey lighten-4" class="pa-4" style="text-align: center">
          <v-avatar
            class="mb-4"
            color="grey darken-1"
            size="100"
            style="margin-top: 32px"
            ><v-icon large>person</v-icon></v-avatar
          >
          <div>
            {{ this.$store.state.getStore.loginEmployeeObject.employeeName }}
          </div>
          <div>
            {{ this.$store.state.getStore.loginEmployeeObject.departmentName }}
          </div>
          <div>
            {{ this.$store.state.getStore.loginEmployeeObject.extensionNumber }}
          </div>
        </v-sheet>

        <v-divider></v-divider>

        <v-list>
          <v-list-item>
            <v-list-item-content>
              <v-btn
                style="height: 30px; font-size: 12px"
                @click="getEditUserPassword"
                :disabled="editUserPasswordStatus"
                >{{ this.$t("changeMemberInformation") }}</v-btn
              >
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <v-container class="py-8 px-6" fluid>
          <div v-if="!editUserPasswordStatus" class="text-xs-center">
            <v-layout>
              <v-flex>
                <h2>{{ $t("buildingPageSelect") }}</h2>
                <v-card
                  flat
                  class="mx-auto justify-center"
                  style="
                    margin-top: 2%;
                    border: 1px solid #dadce0;
                    padding: 1% 2% 1% 2%;
                  "
                  ><v-row>
                    <v-col
                      v-for="buildingObj of this.$store.state.getStore
                        .allBuildings"
                      :key="buildingObj.buildingId"
                      class="d-flex child-flex"
                      cols="4"
                    >
                      <v-hover v-slot="{ hover }">
                        <v-card
                          :elevation="hover ? 12 : 2"
                          style="height: 150px"
                          @click="selectBuilding(buildingObj)"
                        >
                          <v-card-title class="justify-center">{{
                            buildingObj.buildingName
                          }}</v-card-title>
                        </v-card>
                      </v-hover>
                    </v-col>
                  </v-row></v-card
                >
              </v-flex>
            </v-layout>
          </div>

          <EditPassword v-else-if="editUserPasswordStatus" />
        </v-container>
      </v-main>
    </div>
    <ProgressDialog v-else :dialogStatus="true" />
  </v-app>
</template>

<script>
import { eventBus } from "../main";
import ProgressDialog from "@/components/ProgressDialog.vue";
import EditPassword from "@/components/EditPassword.vue";

export default {
  components: {
    ProgressDialog,
    EditPassword,
  },
  data() {
    return {
      drawer: true,
      editUserPasswordStatus: false,
    };
  },
  async created() {
    if (this.$store.state.getStore.allBuildings === null) {
      await this.getBuilding();
    }
    if (this.$store.state.getStore.loginEmployeeObject === null) {
      await this.getLoginEmployeeObject();
    }
    this.$store.commit(
      "setEmployeeName",
      this.$store.state.getStore.loginEmployeeObject.employeeName
    );

    eventBus.$on("pushEditUserPasswordStatus", (value) => {
      if (value === true) {
        this.$notice.info({
          title: this.$i18n.t("alertSuccessEditPassword"),
          styles: {
            width: "400px",
            marginLeft: "-835px",
            top: "290px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
      }
      this.editUserPasswordStatus = false;
    });
  },
  beforeDestroy() {
    eventBus.$off("pushEditUserPasswordStatus");
  },
  methods: {
    async getLoginEmployeeObject() {
      await this.$store.dispatch("getLoginEmployeeObject");
    },
    async getBuilding() {
      await this.$store.dispatch("getBuildingList");
    },
    logout() {
      let message = {
        title: this.$i18n.t("titleConfirmLogout"),
        body: this.$i18n.t("confirmLogout"),
      };
      let options = {
        html: true,
        okText: this.$i18n.t("btnConfirm"),
        cancelText: this.$i18n.t("btnCancel"),
      };
      this.$dialog
        .confirm(message, options)
        .then(() => {
          this.$store.commit("logout");
          this.$router.replace("/");
        })
        .catch(() => {
          return;
        });
    },
    selectBuilding(building) {
      this.$store.commit("buildingSelect", building);
      if (this.$store.state.userStore.authority === "manager") {
        this.$router.push("/ManagerHanzari");
      } else if (this.$store.state.userStore.authority === "viewer") {
        this.$router.push("/ViewerHanzari");
      }
    },
    getEditUserPassword() {
      this.editUserPasswordStatus = true;
    },
  },
};
</script>