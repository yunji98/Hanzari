<template>
  <v-layout row wrap class="text-xs-center">
    <v-flex>
      <v-card flat class="mx-auto justify-center" max-width="1000">
        <v-row class="mx-auto text-center">
          <v-col cols="12" sm="10">
            <v-card-title>
              <h3>{{ this.$t("inputBuildingName") }}</h3></v-card-title
            ></v-col
          ></v-row
        >

        <v-row class="mx-auto text-center"
          ><v-col cols="12" sm="10">
            <div class="mx-3">
              <v-text-field
                v-model="newBuildling.buildingName"
                :label="$t('textInputBuildingName')"
                solo
                dense
              ></v-text-field>
            </div> </v-col
        ></v-row>

        <v-row class="mx-auto">
          <v-col cols="12" sm="10">
            <v-card-title>
              <h3>{{ this.$t("textSettingFloor") }}</h3></v-card-title
            ></v-col
          >
          <v-col cols="12" sm="2">
            <v-btn text style="top: 20px; margin-left: -30px"
              ><v-icon size="40px" dark @click="addFloor"
                >add_circle</v-icon
              ></v-btn
            >
          </v-col>
        </v-row>

        <v-row
          v-for="floorObject of this.settingsFloorList"
          :key="floorObject.floorId"
          class="mx-auto d-flex child-flex"
        >
          <v-col cols="12" sm="10">
            <div class="mx-3">
              <v-text-field
                v-model="floorObject.floorName"
                :label="$t('textFieldLabelEditFloorName')"
                solo
                dense
              ></v-text-field>
            </div>
          </v-col>

          <v-col cols="12" sm="2">
            <v-btn text style="margin-left: -30px"
              ><v-icon
                size="40px"
                dark
                @click="removeFloor(floorObject.floorId)"
                >delete</v-icon
              ></v-btn
            >
          </v-col>
        </v-row>
        <v-card-actions>
          <v-row>
            <v-col>
              <v-btn
                style="
                  width: 30px;
                  font-size: 12px;
                  margin-left: 725px;
                  height: 30px;
                "
                @click="cancelBuildingSetting"
                >{{ this.$i18n.t("btnCancel") }}</v-btn
              >
              <v-btn
                dark
                color="#2c4f91"
                style="
                  width: 30px;
                  height: 30px;
                  color: white;
                  font-size: 12px;
                "
                @click="confirmBuildingSetting"
                >{{ this.$i18n.t("btnConfirm") }}</v-btn
              >
            </v-col>
          </v-row>
        </v-card-actions>
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
      newBuildling: {},
      settingsFloorList: [],
    };
  },
  created() {
    this.newBuildling.buildingId = this.createUUID();
    this.newBuildling.buildingName = null;

    let firstFloor = {};
    firstFloor.floorId = this.createUUID();
    firstFloor.floorName = "";
    firstFloor.buildingId = this.newBuildling.buildingId;
    firstFloor.floorOrder = 0;
    firstFloor.isObjFromDB = false;
    firstFloor.httpRequestPostStatus = true;

    this.settingsFloorList.push(firstFloor);
  },
  methods: {
    // key 생성
    createUUID() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          let r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 3) | 8;
          return v.toString(16);
        }
      );
    },
    // 층 추가
    addFloor() {
      let addFloorTimeStamp;
      let newFloorObject = {};
      newFloorObject.floorId = this.createUUID();
      newFloorObject.floorName = "";
      newFloorObject.buildingId = this.newBuildling.buildingId;
      newFloorObject.floorOrder = this.settingsFloorList.length;
      newFloorObject.isObjFromDB = false;
      newFloorObject.httpRequestPostStatus = true;

      this.settingsFloorList.push(newFloorObject);

      addFloorTimeStamp = new Date().toISOString().substr(0, 23);
      console.log(addFloorTimeStamp);
    },
    // 층 삭제
    removeFloor(floorId) {
      const idx = this.settingsFloorList.findIndex(function (item) {
        return item.floorId === floorId; //String
      });

      this.settingsFloorList.splice(idx, 1);
    },
    cancelBuildingSetting() {
      eventBus.$emit("pushBuldingSettingStatus", false);
    },
    async confirmBuildingSetting() {
      await this.$store.dispatch("saveBuilding", this.newBuildling);
      this.$store.commit("buildingSelect", this.newBuildling);

      await this.$store.dispatch("pushFloors", this.settingsFloorList);
      await this.$store.dispatch("saveFloors");

      this.$store.commit("SET_BUILDINGLIST", null);
      //다음에 마이페이지 갔을때 새로워진 건물 리스트 다시 받기 위함.

      this.$router.push("/Hanzari");
      //새로 만들어진 건물의 자리배치도 조작 페이지로 이동
    },
  },
};
</script>