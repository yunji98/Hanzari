<template>
  <v-layout row wrap class="text-xs-center">
    <v-flex>
      <v-card flat class="mx-auto justify-center" max-width="1000">
        <v-row>
          <v-col cols="12" sm="10">
            <v-card-title>
              <h3>{{ this.$t("inputBuildingName") }}</h3></v-card-title
            ></v-col
          ></v-row
        >

        <v-row
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

        <v-row>
          <v-col cols="12" sm="10">
            <v-card-title>
              <h3>{{ this.$t("textSettingFloor") }}</h3></v-card-title
            ></v-col
          >
          <v-col cols="12" sm="2">
            <v-btn text style="top: 20px; margin-left: -40px"
              ><v-icon size="40px" dark @click="addFloor"
                >add_circle</v-icon
              ></v-btn
            >
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" sm="7">
            <v-card-subtitle>
              <h3>{{ this.$t("textLabelEditFloorName") }}</h3></v-card-subtitle
            ></v-col
          >
          <v-col cols="12" sm="5">
            <v-card-subtitle>
              <h3>{{ this.$t("textLabelMaxSeatNumber") }}</h3></v-card-subtitle
            >
          </v-col>
        </v-row>

        <v-row
          v-for="floorObject of this.settingsFloorList"
          :key="floorObject.floorId"
          class="mx-auto d-flex child-flex"
        >
          <v-col cols="12" sm="7">
              <v-text-field
                v-model="floorObject.floorName"
                :label="$t('textFieldLabelEditFloorName')"
                solo
                dense
              ></v-text-field>
          </v-col>

          <v-col cols="12" sm="3">
            <div class="mx-3">
              <v-text-field
                v-model="floorObject.maxSeatNumber"
                type="number"
                :label="$t('textFieldLabelMaxSeatNumber')"
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
                style="width: 30px; height: 30px; color: white; font-size: 12px"
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
import { eventBus } from "../main";

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
    this.newBuildling.buildingOrder = new Date().toISOString().substr(0, 23);

    let firstFloor = {};
    firstFloor.floorId = this.createUUID();
    firstFloor.floorName = "";
    firstFloor.buildingId = this.newBuildling.buildingId;
    firstFloor.floorOrder = new Date().toISOString().substr(0, 23);
    firstFloor.maxSeatNumber = 300;
    firstFloor.isObjFromDB = false;
    firstFloor.httpRequestPostStatus = true;

    this.settingsFloorList.unshift(firstFloor);
  },
  methods: {
    // key ����
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
    // �ǹ��� �� �߰�
    addFloor() {
      let newFloorObject = {};
      newFloorObject.floorId = this.createUUID();
      newFloorObject.floorName = "";
      newFloorObject.buildingId = this.newBuildling.buildingId;
      newFloorObject.floorOrder = new Date().toISOString().substr(0, 23);
      newFloorObject.maxSeatNumber = 300;
      newFloorObject.isObjFromDB = false;
      newFloorObject.httpRequestPostStatus = true;

      this.settingsFloorList.unshift(newFloorObject);
    },
    // �ǹ��� �� ����
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
      //������������ ���ư� �� ���ŵ� ���� ����Ʈ�� �ٽ� �������� ����

      this.$router.push("/Hanzari");
      //������������ �̵�
    },
  },
};
</script>