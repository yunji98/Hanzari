<template>
  <div>
    <v-card
      flat
      color="transparent"
      v-if="
        !manageSeatTabOfSelectedSeatsComponentStatus &&
        !mappingEmployeeComponentStatus
      "
    >
      <v-card-title>
        <h4>{{ this.$t("textMakeSeat") }}</h4></v-card-title
      >
      <v-row>
        <v-col cols="12" sm="10">
          <div class="mx-3">
            <vue-numeric-input
              :min="1"
              :max="50"
              v-model="selectedNumberOfAddSeat"
              controls-type="updown"
              @change="changeSelectedNumberOfAddSeat"
              style="width: 300px"
            ></vue-numeric-input>
          </div>
        </v-col>
        <v-col cols="12" sm="2" style="margin-top: -20px">
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on">
                <v-switch
                  v-model="addVacantSwitchStatus"
                  @change="changeAddVacantSwitchStatus"
                ></v-switch>
              </div>
            </template>
            <span>{{ this.$t("tooltipAddSeatSwitch") }}</span>
          </v-tooltip>
        </v-col>
      </v-row>
      <v-card-title>
        <h4>
          {{ this.$t("contextMenuSeatSize") }}
        </h4>
      </v-card-title>
      <v-row>
        <v-col cols="2" sm="2">
          <div class="mx-2">
            <img src="@/assets/width.png" width="30px" height="30px" />
          </div>
        </v-col>
        <v-col cols="3" sm="2">
          <vue-numeric-input
            :min="1"
            :max="100"
            v-model="seatWidth"
            controls-type="updown"
            style="width: 250px; margin-left: -30px; top: 6px"
          ></vue-numeric-input>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="2" sm="2" style="margin-left: 3px">
          <div class="mx-2">
            <img
              src="@/assets/height.png"
              width="30px"
              height="30px"
              margin-top="3px"
            />
          </div>
        </v-col>
        <v-col cols="3" sm="2">
          <vue-numeric-input
            :min="1"
            :max="100"
            v-model="seatHeight"
            controls-type="updown"
            style="width: 250px; margin-left: -33px; top: 5px"
          ></vue-numeric-input> </v-col
        ><v-col cols="12" sm="6">
          <v-btn
            color="#2c4f91"
            @click="clickSeatSizeBtn"
            style="
              top: 4px;
              height: 28px;
              color: white;
              font-size: 12px;
              margin-left: 180px;
            "
            >{{ this.$t("btnOk") }}</v-btn
          ></v-col
        >
      </v-row>
      <v-card-title>
        <h4>{{ this.$t("textInformationOfSeat") }}</h4></v-card-title
      >
      <v-radio-group @change="viewSeatInfo" v-model="viewSeatStatus" row>
        <div class="mx-2"></div>
        <v-radio
          :label="$t('contextMenuViewSeatAboutEmployeeName')"
          :value="0"
        ></v-radio>
        <v-radio
          :label="$t('contextMenuViewSeatAboutNumber')"
          :value="1"
        ></v-radio>
        <v-radio
          :label="$t('contextMenuViewSeatAboutDepartment')"
          :value="2"
        ></v-radio>
        <v-radio
          :label="$t('contextMenuViewSeatAboutName')"
          :value="3"
        ></v-radio>
      </v-radio-group>

      <v-card-title>
        <h4>{{ this.$t("textOpactiyOfSeat") }}</h4></v-card-title
      >
      <div class="mx-2">
        <v-slider
          v-model="seatOpacity"
          @change="changeSeatOpacity"
          :step="0.25"
          :min="0"
          :max="1"
          class="align-center"
        >
        </v-slider>
      </div>

      <v-row>
        <v-col>
          <div class="mx-4">
            <v-btn
              outlined
              color="red"
              style="height: 30px; color: white; font-size: 12px; margin-left:10px'; width:400px; "
              @click="clickDeleteAllSeatBtn"
            >
              {{ this.$t("btnDeleteAllSeats") }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <v-card
      flat
      color="transparent"
      v-if="
        manageSeatTabOfSelectedSeatsComponentStatus &&
        !mappingEmployeeComponentStatus
      "
    >
      <div>
        <v-row>
          <v-col>
            <div class="mx-1">
              <v-btn
                outlined
                color="#2c4f91"
                style="
                  height: 30px;
                  font-size: 12px;
                  width: 400px;
                  margin-left: 10px;
                "
                @click="getMappingEmployeeComponent"
              >
                {{ this.$t("btnMappingEmployee") }}
              </v-btn>
            </div>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <div class="mx-1">
              <v-btn
                outlined
                color="#2c4f91"
                style="
                  height: 30px;
                  font-size: 12px;
                  width: 400px;
                  margin-left: 10px;
                "
                @click="clickChangeSeatToVacant"
              >
                {{ this.$t("btnChangeToVacant") }}
              </v-btn>
            </div>
          </v-col>
          <v-col> </v-col>
        </v-row>
        <v-divider class="mx-4"></v-divider>
        <v-card-title>
          <h4>
            {{ this.$t("contextMenuSeatSize") }}
          </h4>
        </v-card-title>
        <v-row>
          <v-col cols="2" sm="2">
            <div class="mx-2">
              <img src="@/assets/width.png" width="30px" height="30px" />
            </div>
          </v-col>
          <v-col cols="3" sm="2">
            <vue-numeric-input
              :min="1"
              :max="1000"
              v-model="seatDragWidth"
              controls-type="updown"
              style="width: 250px; margin-left: -30px; top: 6px"
            ></vue-numeric-input>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="2" sm="2" style="margin-left: 3px">
            <div class="mx-2">
              <img
                src="@/assets/height.png"
                width="30px"
                height="30px"
                margin-top="3px"
              />
            </div>
          </v-col>
          <v-col cols="3" sm="2">
            <vue-numeric-input
              :min="1"
              :max="1000"
              v-model="seatDragHeight"
              controls-type="updown"
              style="width: 250px; margin-left: -33px; top: 5px"
            ></vue-numeric-input> </v-col
          ><v-col cols="12" sm="6">
            <v-btn
              color="#2c4f91"
              @click="clickDragSeatSizeBtn"
              style="
                top: 4px;
                height: 28px;
                color: white;
                font-size: 12px;
                margin-left: 180px;
              "
              >{{ this.$t("btnOk") }}</v-btn
            ></v-col
          >
        </v-row>

        <v-divider class="mx-4"></v-divider>

        <v-card-title>
          <h4>{{ this.$t("textChangeFloorSeat") }}</h4></v-card-title
        >
        <v-row>
          <v-col cols="12" sm="9">
            <v-select
              style="margin-left: 10px"
              :items="floorItems"
              :label="$t('selectLabelFloor')"
              :no-data-text="$t('selectNoDataFloor')"
              height="30"
              item-value="floorId"
              item-text="floorName"
              v-model="selectedFloorItemsId"
              chips
              deletable-chips
              single-line
              outlined
              dense
            ></v-select>
          </v-col>
          <v-col cols="12" sm="3"
            ><v-btn
              color="#2c4f91"
              @click="changeFloorSeat"
              style="top: 4px; height: 36px; color: white; font-size: 12px"
              >{{ this.$t("btnOk") }}</v-btn
            ></v-col
          >
        </v-row>

        <v-card-title>
          <h4>{{ this.$t("textChangeBuildingSeat") }}</h4></v-card-title
        >
        <v-row>
          <v-col cols="12" sm="9">
            <v-select
              style="margin-left: 10px"
              :items="buildingItems"
              :label="$t('selectLabelBuilding')"
              :no-data-text="$t('selectNoDataBuilding')"
              height="30"
              v-model="selectedBuildingFloorItems"
              item-value="floorId"
              item-text="floorName"
              chips
              deletable-chips
              single-line
              outlined
              dense
            ></v-select>
          </v-col>
          <v-col cols="12" sm="3"
            ><v-btn
              color="#2c4f91"
              @click="changeBuildingSeat"
              style="top: 4px; height: 36px; color: white; font-size: 12px"
              >{{ this.$t("btnOk") }}</v-btn
            ></v-col
          >
        </v-row>
        <v-divider class="mx-4"></v-divider>

        <v-card-title>
          <h4>{{ this.$t("textMemoToSeat") }}</h4></v-card-title
        >
        <v-row>
          <v-col cols="12" sm="1"></v-col>
          <v-col cols="12" sm="10">
            <v-textarea
              solo
              name="input-7-4"
              :label="$t('textInMemoTextArea')"
            ></v-textarea>
          </v-col>
          <v-col cols="12" sm="1"></v-col>
        </v-row>
      </div>
    </v-card>

    <MappingEmployee v-if="mappingEmployeeComponentStatus" />
  </div>
</template>

<script>
import MappingEmployee from "@/components/MappingEmployee.vue";
import { eventBus } from "../main";
import axios from "axios";
import { refreshToken } from "@/refreshToken.js";
import "material-design-icons-iconfont/dist/material-design-icons.css";

const HOST = "http://172.30.6.192:8080";

export default {
  name: "ManageSeats",
  components: {
    MappingEmployee,
  },
  props: [
    "allFloorListToManageSeats",
    "selectedFloorObjectToManageSeats",
    "manageSeatTabOfSelectedSeatsComponentStatusToManageSeats",
    "seatDragWidthToManageSeats",
    "seatDragHeightToManageSeats",
  ],
  data() {
    return {
      manageSeatTabOfSelectedSeatsComponentStatus: false,
      mappingEmployeeComponentStatus: false,

      floorItems: [],
      selectedFloorItemsId: null,

      buildingItems: [],
      buildingFloorItems: new Map(),
      selectedBuildingFloorItems: null,

      addVacantSwitchStatus: false,

      allFloorList: this.$store.state.getStore.allFloor,
      currentSelectedFloorObject: null,

      numberOfAddSeatItems: [],
      selectedNumberOfAddSeat: null,

      //자리 사이즈
      seatWidth: 10,
      seatHeight: 10,

      //드래그 자리 사이즈,
      seatDragHeight: null,
      seatDragWidth: null,

      //라디오 버튼 상태값
      viewSeatStatus: 0,

      // 자리 불투명도
      seatOpacity: 1,
    };
  },
  watch: {
    allFloorListToManageSeats: {
      deep: true,

      handler() {
        console.log("allFloorListToManageSeats changed!");
        this.allFloorList = this.allFloorListToManageSeats;
        if (!this.currentSelectedFloorObject) {
          this.currentSelectedFloorObject = this.allFloorList[
            this.allFloorList.length - 1
          ];
        }
        this.initFloorItems();
      },
    },
    selectedFloorObjectToManageSeats: {
      deep: true,

      handler() {
        console.log("selectedFloorObjectToManageSeats changed!");
        this.currentSelectedFloorObject = this.selectedFloorObjectToManageSeats;
        this.initFloorItems();
      },
    },
  },
  created() {
    // 만약 ManageSeats.vue에 들어오기 전에 자리 선택한 적이 있을때
    this.manageSeatTabOfSelectedSeatsComponentStatus = this.manageSeatTabOfSelectedSeatsComponentStatusToManageSeats;

    this.seatDragHeight = this.seatDragHeightToManageSeats;
    this.seatDragWidth = this.seatDragWidthToManageSeats;
    // DB에 이미 있을 때 + 층 데이터 건들지 않음
    if (this.allFloorList && this.allFloorList.length) {
      this.currentSelectedFloorObject = this.allFloorList[
        this.allFloorList.length - 1
      ];
    }

    // ManageSeats.vue 들어오기 전에 변화가 있을때(층 편집 관련)
    if (this.allFloorListToManageSeats) {
      this.allFloorList = this.allFloorListToManageSeats;
    }

    // ManageSeats.vue 들어오기 전에 현재층이 바뀌었을때(단순 층 이동)
    if (this.selectedFloorObjectToManageSeats) {
      this.currentSelectedFloorObject = this.selectedFloorObjectToManageSeats;
    }

    this.initNumberOfAddSeatItems();
    this.initFloorItems();
    this.initBuildingItems();

    eventBus.$on(
      "pushManageSeatTabOfSelectedSeatsComponentStatus",
      (manageSeatTabOfSelectedSeatsComponentStatus) => {
        this.manageSeatTabOfSelectedSeatsComponentStatus = manageSeatTabOfSelectedSeatsComponentStatus;
      }
    );
    eventBus.$on(
      "pushMappingEmployeeComponentStatus",
      (mappingEmployeeComponentStatus) => {
        this.mappingEmployeeComponentStatus = mappingEmployeeComponentStatus;
      }
    );

    eventBus.$on("sendDragSeatInformation", (objWidth, objHeight) => {
      console.log(objWidth + "33333" + objHeight);
      this.seatDragWidth = objWidth;
      this.seatDragHeight = objHeight;
    });

    eventBus.$on("sendDragMultipleSeatList", (objWidthList, objHeightList) => {
      console.log(objWidthList + "@@@@@@@" + objHeightList);
    });
  },
  beforeDestroy() {
    eventBus.$off("pushManageSeatTabOfSelectedSeatsComponentStatus");
    eventBus.$off("pushMappingEmployeeComponentStatus");
  },
  methods: {
    initNumberOfAddSeatItems() {
      for (let i = 2; i < 100; i *= 2) {
        this.numberOfAddSeatItems.push(i);
      }

      //v-select에 초기값을 설정해주는 과정으로 v-select 선택하지않아도 초기값으로 AssignSeats 에게 이벤트를 보낸다.
      this.selectedNumberOfAddSeat = this.numberOfAddSeatItems[0];
      this.changeSelectedNumberOfAddSeat();
    },
    initFloorItems() {
      if (this.allFloorList) {
        this.floorItems = [];
        for (let i = 0; i < this.allFloorList.length; i++) {
          if (
            this.currentSelectedFloorObject.floorId ===
            this.allFloorList[i].floorId //String
          ) {
            continue;
          }

          this.floorItems.push(this.allFloorList[i]);
        }
      }
    },
    //각 건물의 층을 get request 후 현재 건물을 제외하고 리스트를 초기화 시켜주는 함수
    async initBuildingItems() {
      let buildingList = this.$store.state.getStore.allBuildings;
      let response = null;
      let errorStatus = null;

      for (let i = 0; i < buildingList.length; i++) {
        if (
          buildingList[i].buildingId ===
          this.$store.state.buildingStore.building.buildingId
        ) {
          continue;
        }

        let allFloor = [];
        try {
          response = await axios
            .get(
              HOST + "/api/buildings/" + buildingList[i].buildingId + "/floors",
              {
                headers: { "X-AUTH-TOKEN": this.$store.state.userStore.token },
              }
            )
            .catch((error) => {
              errorStatus = error.response.status;
              console.log("에러 상태 : " + errorStatus);
            });
        } catch (error) {
          console.log(error);
        }
        if (errorStatus === 401) {
          await refreshToken();
          response = await axios.get(
            HOST + "/api/buildings/" + buildingList[i].buildingId + "/floors",
            { headers: { "X-AUTH-TOKEN": this.$store.state.userStore.token } }
          );
        }
        for (let i = 0; i < response.data.length; i++) {
          let newFloorObject = {};
          newFloorObject.floorId = response.data[i].floor_id;
          newFloorObject.floorName = response.data[i].floor_name;
          newFloorObject.buildingId = response.data[i].building_id;
          newFloorObject.floorOrder = response.data[i].floor_order;
          newFloorObject.isObjFromDB = true;
          newFloorObject.httpRequestPostStatus = false;

          allFloor.push(newFloorObject);
        }

        allFloor.sort(function (a, b) {
          return a.floorOrder < b.floorOrder
            ? -1
            : a.floorOrder > b.floorOrder
            ? 1
            : 0;
        });

        let buildingObject = {};
        buildingObject.buildingName = buildingList[i].buildingName;
        buildingObject.allFloorList = allFloor;

        this.buildingFloorItems.set(buildingList[i].buildingId, buildingObject);
      }

      let keys = [];
      keys = Array.from(this.buildingFloorItems.keys());

      for (let i = 0; i < this.buildingFloorItems.size; i++) {
        this.buildingItems.push({
          header: this.buildingFloorItems.get(keys[i]).buildingName,
        });
        this.buildingFloorItems.get(keys[i]).allFloorList.forEach((floor) => {
          this.buildingItems.push(floor);
        });
        this.buildingItems.push({ divider: true });
      }
    },
    changeFloorSeat() {
      console.log(this.selectedFloorItemsId);
      if (this.selectedFloorItemsId) {
        eventBus.$emit("moveSeatToAnotherFloor", this.selectedFloorItemsId);
      } else {
        this.$notice.info({
          title: this.$i18n.t("alertNoSelectFloor"),
          styles: {
            width: "400px",
            marginLeft: "-815px",
            top: "118px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      }
    },
    async isImage(buildingId, floorId) {
      let response = null;
      let errorStatus = null;
      let imgPath = null;
      try {
        response = await axios
          .get(
            HOST +
              "/api/buildings/" +
              buildingId +
              "/floors/" +
              floorId +
              "/images",
            {
              headers: {
                "X-AUTH-TOKEN": this.$store.state.userStore.token,
              },
              responseType: "arraybuffer",
            }
          )
          .catch((error) => {
            errorStatus = error.response.status;
            console.log("에러 상태 : " + errorStatus);
          });
        if (errorStatus === 401) {
          await refreshToken();
          console.log("!!!새로 발급 받은 토큰 입니다!!!");
          response = await axios.get(
            HOST +
              "/api/buildings/" +
              buildingId +
              "/floors/" +
              floorId +
              "/images",
            {
              headers: {
                "X-AUTH-TOKEN": this.$store.state.userStore.token,
              },
              responseType: "arraybuffer",
            }
          );
        }
        imgPath = new Buffer(response.data, "binary").toString("base64");
      } catch (error) {
        console.log(error);
      }
      return imgPath;
    },
    async changeBuildingSeat() {
      if (this.selectedBuildingFloorItems) {
        let keys = [];
        keys = Array.from(this.buildingFloorItems.keys());

        let moveBuildingId = null;
        let moveBuildingName = null;
        let moveFloorName = null;

        for (let i = 0; i < this.buildingFloorItems.size; i++) {
          this.buildingFloorItems.get(keys[i]).allFloorList.forEach((floor) => {
            if (floor.floorId === this.selectedBuildingFloorItems) {
              moveBuildingId = keys[i];
              moveBuildingName = this.buildingFloorItems.get(keys[i])
                .buildingName;
              moveFloorName = floor.floorName;
            }
          });
        }

        let image = await this.isImage(
          moveBuildingId,
          this.selectedBuildingFloorItems
        );

        if (image === "") {
          this.$notice.info({
            title: this.$i18n.t("alertNoImage"),
            styles: {
              width: "400px",
              marginLeft: "-815px",
              top: "118px",
              backgroundColor: "#2a88bd",
            },
            duration: 5,
          });
          return;
        } else if (moveFloorName === "") {
          this.$notice.info({
            title: this.$i18n.t("alertNoFloorNameOfTryToChangeFloor"),
            styles: {
              width: "400px",
              marginLeft: "-815px",
              top: "118px",
              backgroundColor: "#2a88bd",
            },
            duration: 5,
          });
          return;
        } else {
          eventBus.$emit(
            "moveSeatToAnotherBuilding",
            moveBuildingId,
            moveBuildingName,
            this.selectedBuildingFloorItems,
            moveFloorName
          );
        }
      } else {
        this.$notice.info({
          title: this.$i18n.t("alertNoSelectBuildingFloor"),
          styles: {
            width: "400px",
            marginLeft: "-815px",
            top: "118px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      }
    },
    changeAddVacantSwitchStatus() {
      eventBus.$emit("pushAddVacantSwitchStatus", this.addVacantSwitchStatus);
    },
    changeSelectedNumberOfAddSeat() {
      console.log(this.selectedNumberOfAddSeat);
      eventBus.$emit(
        "pushSelectedNumberOfAddSeat",
        this.selectedNumberOfAddSeat
      );
    },
    clickChangeSeatToVacant() {
      eventBus.$emit("changeSeatToVacant");
    },
    getMappingEmployeeComponent() {
      this.mappingEmployeeComponentStatus = true;
    },
    clickSeatSizeBtn() {
      console.log(this.seatWidth);
      console.log(this.seatHeight);
      eventBus.$emit("sendSeatSize", this.seatWidth, this.seatHeight);
    },
    clickDragSeatSizeBtn() {
      console.log(this.seatDragWidth);
      console.log(this.seatDragHeight);
      eventBus.$emit(
        "sendDragSeatSize",
        this.seatDragWidth,
        this.seatDragHeight
      );
    },
    viewSeatInfo() {
      eventBus.$emit("pushViewSeatInfo", this.viewSeatStatus);
    },
    changeSeatOpacity() {
      eventBus.$emit("pushSeatOpacity", this.seatOpacity);
    },
    clickDeleteAllSeatBtn() {
      eventBus.$emit("pushDeleteAllSeatStatus", true);
    },
  },
};
</script>
