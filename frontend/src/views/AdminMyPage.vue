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

        <v-divider />

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

          <v-list-item>
            <v-list-item-content>
              <v-btn
                style="height: 30px; color: white; font-size: 12px"
                color="#2c4f91"
                @click="getAuthorize"
                :disabled="authorizeStatus"
                >{{ this.$t("grantAuthority") }}</v-btn
              >
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <v-container class="py-8 px-6" fluid>
          <div
            v-if="
              !editUserPasswordStatus &&
              !authorizeStatus &&
              !buildingSettingStatus
            "
            class="text-xs-center"
          >
            <v-layout>
              <v-flex>
                <h2>{{ $t("buildingPage") }}</h2>
                <v-card
                  flat
                  class="mx-auto justify-center"
                  style="
                    margin-top: 2%;
                    border: 1px solid #dadce0;
                    padding: 1% 2% 1% 2%;
                  "
                >
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
                          style="height: 150px"
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
                              top: '10%',
                            }"
                            ><v-icon x-large dark>add_circle</v-icon></v-btn
                          >
                        </v-card>

                        <v-card
                          :elevation="hover ? 12 : 2"
                          v-else
                          style="height: 150px"
                          @click="selectBuilding(buildingObj)"
                        >
                          <v-card-title class="justify-center"
                            >{{ buildingObj.buildingName }} </v-card-title
                          ><v-col class="text-right">
                            <v-icon medium>stairs</v-icon>
                            <span>{{ buildingObj.floorCnt }}</span>
                            <v-menu bottom offset-y
                              ><template v-slot:activator="{ on, attrs }">
                                <v-btn text v-bind="attrs" v-on="on" n
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
                        </v-card>
                      </v-hover>
                    </v-col>
                  </v-row></v-card
                >
              </v-flex>
            </v-layout>
          </div>

          <AuthorizeEmployee v-else-if="authorizeStatus" />
          <EditPassword v-else-if="editUserPasswordStatus" />
          <BuildingSetting v-else-if="buildingSettingStatus" />
        </v-container>
      </v-main>
    </div>
    <ProgressDialog :dialogStatus="true" v-else />
  </v-app>
</template>

<script>
import { eventBus } from "../main";
import ProgressDialog from "@/components/ProgressDialog.vue";
import EditPassword from "@/components/EditPassword.vue";
import AuthorizeEmployee from "@/components/AuthorizeEmployee.vue";
import BuildingSetting from "@/components/BuildingSetting.vue";

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
      drawer: true,
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
    // �� ���� �����ϰ� ���������� �ٽ� ���ƿ��� �� ���� �������ֱ� ����
    await this.getBuilding();

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
      changeBuildingId,
      changeBuildingOrder
    ) {
      console.log(changeBuildingId);
      console.log(changeBuildingName);

      let changeBuilding = {};
      changeBuilding.buildingId = changeBuildingId;
      changeBuilding.buildingName = changeBuildingName;
      changeBuilding.buildingOrder = changeBuildingOrder;

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
            selectBuilding.buildingId,
            selectBuilding.buildingOrder
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
      this.authorizeStatus = false;
      this.editUserPasswordStatus = false;
    },
    getAuthorize() {
      this.buildingSettingStatus = false;
      this.authorizeStatus = true;
      this.editUserPasswordStatus = false;
    },
    getEditUserPassword() {
      this.buildingSettingStatus = false;
      this.authorizeStatus = false;
      this.editUserPasswordStatus = true;
    },
  },
};
</script>
