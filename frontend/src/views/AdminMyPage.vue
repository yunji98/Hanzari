<template>
  <v-app id="app">
    <v-app-bar app color="#2c4f91" dark flat :height="30">
      <v-toolbar-title>{{ $t("projectMypage") }}</v-toolbar-title>
      <v-spacer />
      <v-btn text @click="logout">{{ $t("logout") }}</v-btn>
    </v-app-bar>

    <v-main>
      <v-container
        class="text-xs-center"
        v-if="this.$store.state.getStore.loginEmployeeObject"
      >
        <v-layout row wrap class="text-xs-center">
          <v-flex>
            <v-card flat class="mx-auto" height="200">
              <v-card-title class="justify-center">
                <v-avatar size="60" style="margin-right: 15px">
                  <v-icon large>person</v-icon>
                </v-avatar>
                <h1>
                  {{
                    this.$store.state.getStore.loginEmployeeObject.employeeName
                  }}
                </h1>
              </v-card-title>

              <v-card-title class="justify-center">
                <h3>
                  {{
                    this.$store.state.getStore.loginEmployeeObject
                      .departmentName
                  }}
                  {{
                    this.$store.state.getStore.loginEmployeeObject
                      .extensionNumber
                  }}
                </h3>
              </v-card-title>
            </v-card>
          </v-flex>
        </v-layout>

        <div
          v-if="
            !authorizeStatus &&
            !editUserPasswordStatus &&
            !buildingSettingStatus
          "
          class="text-xs-center"
        >
          <v-layout>
            <v-flex>
              <v-card flat class="mx-auto">
                <v-card-title class="justify-center">
                  <v-spacer />
                  <div style="text-align: right; margin-top: 50px">
                    <v-btn
                      @click="getEditUserPassword"
                      style="height: 30px; font-size: 12px"
                      >{{ this.$t("changeMemberInformation") }}</v-btn
                    >
                    <v-btn
                      color="#2c4f91"
                      style="height: 30px; color: white; font-size: 12px"
                      @click="getAuthorize"
                      >{{ this.$t("grantAuthority") }}</v-btn
                    >
                  </div>
                </v-card-title>
                <v-divider />
              </v-card>
            </v-flex>
          </v-layout>
          <v-layout>
            <v-flex>
              <v-row>
                <v-col
                  v-for="buildingObj of this.buildingViewList"
                  :key="buildingObj.buildingId"
                  class="d-flex child-flex"
                  cols="4"
                >
                  <v-hover v-slot="{ hover }">
                    <v-card
                      :elevation="hover ? 12 : 2"
                      v-if="buildingObj.buildingId === 0"
                      style="height: 300px"
                      @click="getBuildingSetting"
                    >
                      <v-card-title class="justify-center">{{
                        buildingObj.buildingName
                      }}</v-card-title>
                      <v-btn
                        small
                        disabled
                        text
                        class="justify-center"
                        :style="{
                          left: '50%',
                          transform: 'translateX(-50%)',
                          top: '25%',
                        }"
                        ><v-icon x-large dark>add_circle</v-icon></v-btn
                      >
                    </v-card>

                    <v-card
                      :elevation="hover ? 12 : 2"
                      v-else
                      style="height: 300px"
                      @click="selectBuilding(buildingObj)"
                    >
                      <v-card-title class="justify-center"
                        >{{ buildingObj.buildingName }} </v-card-title
                      ><v-col class="text-right">
                        <v-icon medium>stairs</v-icon>
                        <span>{{ buildingObj.floorCnt }}</span>
                        <v-menu bottom offset-y
                          ><template v-slot:activator="{ on, attrs }">
                            <v-btn text v-bind="attrs" v-on="on"
                              ><v-icon>more_vert</v-icon></v-btn
                            >
                          </template>
                          <v-list>
                            <v-list-item
                              v-for="(item, index) in buildingContextItems"
                              :key="index"
                              @click.stop="
                                clickBuildingContextMenu(
                                  item.index,
                                  buildingObj
                                )
                              "
                            >
                              <v-list-item-title>{{
                                item.title
                              }}</v-list-item-title>
                            </v-list-item>
                          </v-list></v-menu
                        ></v-col
                      >
                      <v-divider />
                    </v-card>
                  </v-hover>
                </v-col>
              </v-row>
            </v-flex>
          </v-layout>
        </div>

        <AuthorizeEmployee v-else-if="authorizeStatus" />
        <EditPassword v-else-if="editUserPasswordStatus" />
        <BuildingSetting v-else-if="buildingSettingStatus" />
      </v-container>
      <ProgressDialog
        :dialogStatus="true"
        v-else-if="!this.$store.state.getStore.loginEmployeeObject"
      />
    </v-main>
  </v-app>
</template>

<script>
import axios from "axios";
import { eventBus } from "../main";
import ProgressDialog from "@/components/ProgressDialog.vue";
import EditPassword from "@/components/EditPassword.vue";
import AuthorizeEmployee from "@/components/AuthorizeEmployee.vue";
import BuildingSetting from "@/components/BuildingSetting.vue";
import { refreshToken } from "../refreshToken.js";

const HOST = "http://172.30.6.192:8080";

export default {
  components: {
    ProgressDialog,
    EditPassword,
    BuildingSetting,
    AuthorizeEmployee,
  },
  data() {
    return {
      authorizeStatus: false,
      editUserPasswordStatus: false,
      buildingSettingStatus: false,
      buildingViewList: [],
      buildingContextItems: [
        { title: this.$i18n.t("contextMenuDeleteBuilding"), index: 0 },
        { title: this.$i18n.t("contextMenuEditBuildingName"), index: 1 },
      ],
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

    let firstCard = {};
    firstCard.buildingId = 0;
    firstCard.buildingName = this.$i18n.t("createNewBuilding");
    this.buildingViewList.push(firstCard);

    this.$store.state.getStore.allBuildings.forEach((building) => {
      this.buildingViewList.push(building);
    });

    eventBus.$on("pushAuthorizeStatus", (value) => {
      if (value === true) {
        this.$notice.warning({
          title: this.$i18n.t("alertSuccessChangeAuthroity"),
          styles: {
            width: "400px",
            marginLeft: "-835px",
            top: "290px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
      }
      this.authorizeStatus = false;
    });

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

    eventBus.$on("pushBuldingSettingStatus", () => {
      this.buildingSettingStatus = false;
    });
  },
  beforeDestroy() {
    eventBus.$off("pushAuthorizeStatus");
    eventBus.$off("pushEditUserPasswordStatus");
    eventBus.$off("pushBuldingSettingStatus");
  },
  methods: {
    async getBuilding() {
      await this.$store.dispatch("getBuildingList");
    },
    async getLoginEmployeeObject() {
      await this.$store.dispatch("getLoginEmployeeObject");
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
        .then((dialog) => {
          this.$store.commit("logout");
          this.$router.replace("/");
        })
        .catch(() => {
          return;
        });
    },
    selectBuilding(building) {
      this.$store.commit("buildingSelect", building);
      this.$router.push("/Hanzari");
    },
    deleteSelectBuilding(selectBuilding) {
      let message = {
        title: this.$i18n.t("titleConfirmDeleteBuilding"),
        body: this.$i18n.t("confirmDeleteBuilding", {
          buildingName: selectBuilding.buildingName,
        }),
      };
      let options = {
        html: true,
        okText: this.$i18n.t("btnConfirm"),
        cancelText: this.$i18n.t("btnCancel"),
      };
      this.$dialog
        .confirm(message, options)
        .then((dialog) => {
          this.deleteBuildingAndReloadData(selectBuilding.buildingId);
        })
        .catch(() => {});
    },
    async deleteBuildingAndReloadData(deleteBuildingId) {
      await this.$store.dispatch("deleteBuildingKey", deleteBuildingId);

      this.$store.commit("SET_BUILDINGLIST", null);
      this.$store.commit("SET_LOGINEMPLOYEEOBJECT", null);

      await this.$store.dispatch("getBuildingList");
      await this.$store.dispatch("getLoginEmployeeObject");

      this.buildingViewList = [];

      let firstCard = {};
      firstCard.buildingId = 0;
      firstCard.buildingName = this.$i18n.t("createNewBuilding");
      this.buildingViewList.push(firstCard);

      this.$store.state.getStore.allBuildings.forEach((building) => {
        this.buildingViewList.push(building);
      });
    },
    async changeBuildingNameAndReloadData(
      changeBuildingName,
      changeBuildingId
    ) {
      console.log(changeBuildingId);
      console.log(changeBuildingName);

      let changeBuilding = {};
      changeBuilding.buildingId = changeBuildingId;
      changeBuilding.buildingName = changeBuildingName;

      await this.$store.dispatch("saveBuilding", changeBuilding);

      this.$store.commit("SET_BUILDINGLIST", null);
      this.$store.commit("SET_LOGINEMPLOYEEOBJECT", null);

      await this.$store.dispatch("getBuildingList");
      await this.$store.dispatch("getLoginEmployeeObject");

      this.buildingViewList = [];

      let firstCard = {};
      firstCard.buildingId = 0;
      firstCard.buildingName = this.$i18n.t("createNewBuilding");
      this.buildingViewList.push(firstCard);

      this.$store.state.getStore.allBuildings.forEach((building) => {
        this.buildingViewList.push(building);
      });
    },
    changeBuildingName(selectBuilding) {
      let message = {
        title: this.$i18n.t("titleConfirmChangeBuildingName"),
        body: this.$i18n.t("promptChangeBuildingName", {
          buildingName: selectBuilding.buildingName,
        }),
      };
      let options = {
        html: true,
        okText: this.$i18n.t("btnConfirm"),
        cancelText: this.$i18n.t("btnCancel"),
        promptHelp: "",
      };
      this.$dialog
        .prompt(message, options)
        .then((dialog) => {
          this.changeBuildingNameAndReloadData(
            dialog.data,
            selectBuilding.buildingId
          );
        })
        .catch(() => {});
    },
    clickBuildingContextMenu(index, buildingObj) {
      switch (index) {
        case 0:
          this.deleteSelectBuilding(buildingObj);
          return;
        case 1:
          this.changeBuildingName(buildingObj);
          return;
      }
    },
    getBuildingSetting() {
      this.buildingSettingStatus = true;
    },
    getAuthorize() {
      this.authorizeStatus = true;
    },
    getEditUserPassword() {
      this.editUserPasswordStatus = true;
    },
  },
};
</script>
