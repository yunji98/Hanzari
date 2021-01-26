<template>
  <v-app id="app">
    <div v-if="this.$store.state.getStore.otherFloorsSeatMap" class="parent">
      <v-navigation-drawer v-model="leftDrawer" app :width="450">
        <Tabs />
      </v-navigation-drawer>

      <v-app-bar app color="#2c4f91" dark flat :height="30">
        <v-icon
          size="30px"
          dark
          style="background-color: #1c3563"
          @click="leftDrawer = !leftDrawer"
          v-if="leftDrawer"
          >keyboard_arrow_left</v-icon
        >
        <v-icon
          size="30px"
          dark
          style="background-color: #1c3563"
          @click="leftDrawer = !leftDrawer"
          v-if="!leftDrawer"
          >keyboard_arrow_right</v-icon
        >
        <v-divider vertical></v-divider>
        <div class="mx-3">
          <v-toolbar-title>{{ $t("projectName") }}</v-toolbar-title>
        </div>
        <v-spacer></v-spacer>

        <v-btn text disabled id="custom-disabled">{{
          this.$store.state.userStore.employeeName + $t("user")
        }}</v-btn>

        <v-divider vertical></v-divider>
        <v-btn
          text
          v-if="saveStatus"
          v-confirm="{
            ok: backToMyPage,
            message: message,
            html: true,
            okText: okText,
            cancelText: cancelText,
          }"
        >
          {{ $t("backToMyPage") }}
        </v-btn>
        <v-btn text @click="backToMyPage" v-if="!saveStatus">
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
        <v-icon
          size="30px"
          dark
          style="background-color: #1c3563"
          @click="rightDrawer = !rightDrawer"
          v-if="!rightDrawer"
          >keyboard_arrow_left</v-icon
        >
      </v-app-bar>

      <v-main
        ><AssignSeats
          v-on:reloadData="reloadData"
          v-on:downloadCSVFile="downloadCSVFile"
          v-on:saveFromCSVFileToDB="saveFromCSVFileToDB"
        />
        <v-navigation-drawer
          v-model="rightDrawer"
          app
          :width="450"
          :right="true"
        >
          <v-toolbar color="#2c4f91" :height="95" dark> </v-toolbar>
          <FlowInformationTable />
        </v-navigation-drawer>
      </v-main>
    </div>
    <ProgressDialog v-else :dialogStatus="true" />
  </v-app>
</template>

<script>
import axios from "axios";
import { eventBus } from "../main";

import Tabs from "@/components/Tabs.vue";
import AssignSeats from "@/components/AssignSeats.vue";
import ProgressDialog from "@/components/ProgressDialog.vue";
import DepartmentColorChips from "@/components/DepartmentColorChips.vue";
import FlowInformationTable from "@/components/FlowInformationTable.vue";
import { refreshToken } from "../refreshToken.js";

const HOST = "http://172.30.6.192:8080";

export default {
  name: "Hanzari",
  components: {
    Tabs,
    AssignSeats,
    ProgressDialog,
    DepartmentColorChips,
    FlowInformationTable,
  },
  data() {
    return {
      leftDrawer: null,
      rightDrawer: false,
      saveStatus: null,
      message: {
        title: this.$i18n.t("titleConfirmNotSaveWork"),
        body: this.$i18n.t("confirmNotSaveWork"),
      },
      okText: this.$i18n.t("btnConfirm"),
      cancelText: this.$i18n.t("btnCancel"),
    };
  },
  async created() {
    if (this.$store.state.getStore.allBuildings === null) {
      await this.getBuildingList();
    }

    if (this.$store.state.getStore.allEmployee === null) {
      await this.getEmployeeList();
    }

    await this.getDepartmentList();

    await this.getFloorList();

    await this.getLatestFloorImage();
    await this.getLatestFloorSeatList();

    await this.getOtherFloorImageList();
    await this.getOtherFloorsSeatMap();

    eventBus.$on("sendStoreStatus", (saveStatus) => {
      this.saveStatus = saveStatus;
    });
  },
  beforeDestroy() {
    eventBus.$off("sendStoreStatus");
  },
  methods: {
    async getBuildingList() {
      await this.$store.dispatch("getBuildingList");
    },
    async getEmployeeList() {
      await this.$store.dispatch("getAllEmployees");
    },
    async getDepartmentList() {
      await this.$store.dispatch("getDepartmentList");
    },
    async getFloorList() {
      //if (this.$store.state.getStore.allFloor != null) {
      await this.$store.dispatch("getAllFloors");
      //}
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
          //console.log("ok");
          this.$store.commit("logout");
          this.$router.replace("/");
        })
        .catch(() => {
          //console.log("cancel");
          return;
        });
    },
    backToMyPage() {
      if (this.saveStatus === "ableSave") {
        this.$store.commit("backToMyPage");
      } else {
        this.$store.commit("backToMyPage");
      }
    },
    //get CSV File from DB and download CSV file
    async downloadCSVFile(floorId) {
      let response = null;
      let errorStatus = null;
      try {
        response = await axios
          .get(
            HOST +
              "/api/buildings/" +
              this.$store.state.buildingStore.building.buildingId +
              "/floors/" +
              floorId +
              "/seats/get-csv-file-allfloor-seats",
            {
              headers: {
                "Content-Type": "text/csv",
                "X-AUTH-TOKEN": this.$store.state.userStore.token,
              },
            }
          )
          .catch((error) => {
            errorStatus = error.response.status;
            console.log(errorStatus);
          });
        if (errorStatus === 401) {
          await refreshToken();
          console.log("!!!새로 발급 받은 토큰 입니다!!!");
          console.log(this.$store.state.userStore.token);
          response = await axios.get(
            HOST +
              "/api/buildings/" +
              this.$store.state.buildingStore.building.buildingId +
              "/floors/" +
              floorId +
              "/seats/get-csv-file-allfloor-seats",
            {
              headers: {
                "Content-Type": "text/csv",
                "X-AUTH-TOKEN": this.$store.state.userStore.token,
              },
            }
          );
        }

        let url = window.URL.createObjectURL(new Blob([response.data]));
        let link = document.createElement("a");
        let contentDisposition = response.headers["content-disposition"]; // 파일 이름 //cors

        let filename = null;
        if (contentDisposition) {
          let [fileNameMatch] = contentDisposition
            .split(";")
            .filter((str) => str.includes("filename"));
          if (fileNameMatch) [, filename] = fileNameMatch.split("=");
        }
        link.href = url;
        link.setAttribute("download", `${filename}`);
        link.style.cssText = "display:none";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.log(error);
      }
    },

    //set confirm창
    getErrorMessageFromOneFailReason(objectFromFailedList) {
      let errorMessage = null;
      console.log(objectFromFailedList);

      if (objectFromFailedList.reason === "seatId is null") {
        if (objectFromFailedList.faildVo.seatName) {
          errorMessage = this.$i18n.t(
            "errorMessageWhenSeatIdIsNullWithSeatName",
            {
              seatNameFromCSV: objectFromFailedList.faildVo.seatName,
            }
          );
        } else {
          errorMessage = this.$i18n.t(
            "errorMessageWhenSeatIdIsNullWithoutSeatName"
          );
        }
      } else if (objectFromFailedList.reason === "seat doesn't exist") {
        if (objectFromFailedList.faildVo.seatName) {
          errorMessage = this.$i18n.t(
            "errorMessageWhenSeatIdNotExistWithSeatName",
            {
              seatNameFromCSV: objectFromFailedList.faildVo.seatName,
            }
          );
        } else {
          errorMessage = this.$i18n.t(
            "errorMessageWhenSeatIdNotExistWithoutSeatName"
          );
        }
      } else if (objectFromFailedList.reason === "employee doesn't exist") {
        if (objectFromFailedList.faildVo.seatName) {
          errorMessage = this.$i18n.t(
            "errorMessageWhenEmployeeIdNotExistWithSeatName",
            {
              seatNameFromCSV: objectFromFailedList.faildVo.seatName,
            }
          );
        } else {
          errorMessage = this.$i18n.t(
            "errorMessageWhenEmployeeIdNotExistWithoutSeatName"
          );
        }
      }
      return errorMessage;
    },

    getErrorMessageFromFailReasons(failedObjectsList) {
      let errorMessage = null;

      let numberOfSeatIdIsNull = 0;
      let seatNameOfSeatIdIsNull = "";
      let numberOfSeatIsNotExist = 0;
      let seatNameOfSeatIsNotExist = "";
      let numberOfEmployeeIsNotExist = 0;
      let seatNameOfEmployeeIsNotExist = "";

      for (let i = 0; i < failedObjectsList.length; i++) {
        if (failedObjectsList[i].reason === "seatId is null") {
          numberOfSeatIdIsNull++;
          seatNameOfSeatIdIsNull += failedObjectsList[i].faildVo.seatName + " ";
        } else if (failedObjectsList[i].reason === "seat doesn't exist") {
          numberOfSeatIsNotExist++;
          seatNameOfSeatIsNotExist +=
            failedObjectsList[i].faildVo.seatName + " ";
        } else if (failedObjectsList[i].reason === "employee doesn't exist") {
          numberOfEmployeeIsNotExist++;
          seatNameOfEmployeeIsNotExist +=
            failedObjectsList[i].faildVo.seatName + " ";
        }
      }
      errorMessage = this.$i18n.t("errorMessageWhenFailedObjectsAreMany", {
        numberOfSeatIdIsNullText: numberOfSeatIdIsNull,
        seatNameOfSeatIdIsNullText: seatNameOfSeatIdIsNull,
        numberOfSeatIsNotExistText: numberOfSeatIsNotExist,
        seatNameOfSeatIsNotExistText: seatNameOfSeatIsNotExist,
        numberOfEmployeeIsNotExistText: numberOfEmployeeIsNotExist,
        seatNameOfEmployeeIsNotExistText: seatNameOfEmployeeIsNotExist,
      });
      return errorMessage;
    },

    //save information from CSV to DB
    async saveFromCSVFileToDB(saveData, floorId) {
      let errorStatus = null;
      try {
        await axios
          .post(
            HOST +
              "/api/buildings/" +
              this.$store.state.buildingStore.building.buildingId +
              "/floors/" +
              floorId +
              "/seats/update-by-file",
            saveData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                "X-AUTH-TOKEN": this.$store.state.userStore.token,
              },
            }
          )
          .then((response) => {
            console.log(response);
            if (response.status === 206) {
              let errorMessage = null;
              let failedObjectsList = [];

              for (let i = 0; i < response.data.failedList.length; i++) {
                console.log(response.data.failedList);
                //저장을 실패한 자리들의 개수가 여러개라면 failedObjectsList리스트에 push하기
                if (response.data.failedList.length > 1) {
                  failedObjectsList.push(response.data.failedList[i]);
                }
                //저장을 실패한 자리들의 개수가 1개라면
                else if (response.data.failedList.length === 1) {
                  errorMessage = this.getErrorMessageFromOneFailReason(
                    response.data.failedList[i]
                  );
                }
              }

              //failedObjectsList의 push된 객체들이 있다면 그에 맞는 errorMessage추출하기
              if (failedObjectsList.length > 0) {
                errorMessage = this.getErrorMessageFromFailReasons(
                  failedObjectsList
                );
                console.log(errorMessage);
              }
              let message = {
                title: this.$i18n.t("titleOfCSVErrorConfirmDialog"),
                body: errorMessage,
              };
              let options = {
                html: true,
                okText: this.$i18n.t("btnOK"),
              };
              this.$dialog
                .alert(message, options)
                .then((dialog) => {
                  //console.log("ok");
                  return;
                })
                .catch(() => {
                  //console.log("cancel");
                  return;
                });
            } else if (response.status === 200) {
              this.reloadData();
            }
          })
          .catch((error) => {
            errorStatus = error.response.status;
            console.log("에러 상태" + errorStatus);
          });

        if (errorStatus === 401) {
          await refreshToken();
          console.log("!!!새로 발급 받은 토큰 입니다!!!");
          console.log(this.$store.state.userStore.token);
          await axios
            .post(
              HOST +
                "/api/buildings/" +
                this.$store.state.buildingStore.building.buildingId +
                "/floors/" +
                floorId +
                "/seats/update-by-file",
              saveData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  "X-AUTH-TOKEN": this.$store.state.userStore.token,
                },
              }
            )
            .then((response) => {
              console.log(response);
              this.reloadData();
            })
            .catch((error) => {
              errorStatus = error.response.status;
              console.log("에러 상태" + errorStatus);
            });
        }
      } catch (error) {
        console.log(error);
      }
    },

    async reloadData() {
      // 리로드 할 때 층이 한개도 없다면
      // 리로드 이후에도 이전의 최신 층, 다른 층 관련 데이터들이 남아있다.
      this.$store.state.getStore.latestFloorImage = null;
      this.$store.state.getStore.latestFloorSeatList = null;

      this.$store.state.getStore.otherFloorsImageList = null;
      this.$store.state.getStore.otherFloorsSeatMap = null;
      this.saveStatus = null;

      await this.getDepartmentList();

      await this.getFloorList();

      await this.getLatestFloorImage();
      await this.getLatestFloorSeatList();

      await this.getOtherFloorImageList();
      await this.getOtherFloorsSeatMap();
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