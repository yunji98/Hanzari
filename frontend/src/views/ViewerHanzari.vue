<template>
  <v-app id="app">
    <div v-if="this.$store.state.getStore.otherFloorsSeatMap" class="parent">
      <v-navigation-drawer v-model="leftDrawer" app :width="375">
        <ViewerTabs :leftDrawer="leftDrawer" />
      </v-navigation-drawer>

      <v-app-bar app color="#2c4f91" dark flat :height="30">
        <v-icon
          size="30px"
          dark
          style="background-color: #1c3563"
          @click="leftDrawer = !leftDrawer"
          v-if="!leftDrawer"
          >keyboard_arrow_right</v-icon
        >
        <v-divider vertical></v-divider>
        <div class="mx-3" v-if="!leftDrawer">
          <v-toolbar-title>{{ $t("projectName") }}</v-toolbar-title>
        </div>
        <v-spacer></v-spacer>

        <v-btn text disabled id="custom-disabled" v-if="!rightDrawer">{{
          this.$store.state.userStore.employeeName + $t("user")
        }}</v-btn>

        <v-divider vertical v-if="!rightDrawer"></v-divider>
        <v-btn text @click="backToMyPage" v-if="!rightDrawer">
          {{ $t("backToMyPage") }}
        </v-btn>

        <v-divider vertical v-if="!rightDrawer"></v-divider>
        <v-btn text @click="logout" v-if="!rightDrawer">{{
          $t("logout")
        }}</v-btn>

        <v-divider vertical v-if="!rightDrawer"></v-divider>
        <v-icon
          size="30px"
          dark
          style="background-color: #1c3563"
          @click="rightDrawer = !rightDrawer"
          v-if="!rightDrawer"
          >keyboard_arrow_left</v-icon
        >
      </v-app-bar>

      <v-main>
        <ViewerAssignSeats />
        <v-navigation-drawer
          v-model="rightDrawer"
          app
          :width="375"
          :right="true"
        >
          <v-toolbar color="#2c4f91" height="35" dark>
            <v-spacer></v-spacer>
            <v-btn text disabled id="custom-disabled">{{
              this.$store.state.userStore.employeeName + $t("user")
            }}</v-btn>

            <v-divider vertical></v-divider>
            <v-btn text @click="backToMyPage">
              {{ $t("backToMyPage") }}
            </v-btn>

            <v-divider vertical></v-divider>
            <v-btn text @click="logout">{{ $t("logout") }}</v-btn>

            <v-divider vertical></v-divider>
            <v-icon
              size="30px"
              dark
              style="background-color: #1c3563"
              @click="rightDrawer = !rightDrawer"
              v-if="rightDrawer"
              >keyboard_arrow_right</v-icon
            >
          </v-toolbar>
          <FlowInformationTable />
        </v-navigation-drawer>
      </v-main>
    </div>
    <ProgressDialog v-else :dialogStatus="true" />
  </v-app>
</template>

<script>
import { eventBus } from "../main";

import ViewerTabs from "@/components/ViewerTabs.vue";
import ViewerAssignSeats from "@/components/ViewerAssignSeats.vue";
import FlowInformationTable from "@/components/FlowInformationTable.vue";
import ProgressDialog from "@/components/ProgressDialog.vue";
import DepartmentColorChips from "@/components/DepartmentColorChips.vue";

export default {
  name: "ViewerHanzari",
  components: {
    ViewerTabs,
    ViewerAssignSeats,
    ProgressDialog,
    DepartmentColorChips,
    FlowInformationTable,
  },
  data() {
    return {
      leftDrawer: null,
      rightDrawer: false,
    };
  },
  async created() {
    if (this.$store.state.getStore.allEmployee == null) {
      await this.getEmployeeList();
    }

    if (this.$store.state.getStore.allDepartment == null) {
      await this.getDepartmentList();
    }

    await this.getFloorList();

    await this.getLatestFloorImage();
    await this.getLatestFloorSeatList();

    await this.getOtherFloorImageList();
    await this.getOtherFloorsSeatMap();

    eventBus.$on("closeLeftDrawer", () => {
      this.leftDrawer = false;
    });
  },
  beforeDestroy() {
    eventBus.$off("closeLeftDrawer");
  },
  methods: {
    async getEmployeeList() {
      await this.$store.dispatch("getAllEmployees");
    },
    async getDepartmentList() {
      await this.$store.dispatch("getDepartmentList");
    },
    async getFloorList() {
      await this.$store.dispatch("getAllFloors");
    },
    async getLatestFloor() {
      await this.$store.dispatch("getLatestFloor");
    },
    async getLatestFloorImage() {
      await this.$store.dispatch("getLatestFloorImage");
    },
    async getLatestFloorSeatList() {
      await this.$store.dispatch("getLatestFloorSeatList");
    },
    async getOtherFloorImageList() {
      await this.$store.dispatch("getOtherFloorImageList");
    },
    async getOtherFloorsSeatMap() {
      await this.$store.dispatch("getOtherFloorsSeatMap");
      console.log(this.$store.state.getStore);
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
          console.log("ok");
          this.$store.commit("logout");
          this.$router.replace("/");
        })
        .catch(() => {
          console.log("cancel");
          return;
        });
    },
    backToMyPage() {
      this.$store.commit("backToMyPage");
    },
  },
};
</script>

<style scoped>
#custom-disabled.v-btn--disabled {
  color: white !important;
}
.parent >>> .v-toolbar__content {
  padding: 0px !important;
}
</style>