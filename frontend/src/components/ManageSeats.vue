<template>
  <div>
    <v-card flat color="transparent">
      <!-- 서브메뉴 버튼 레이아웃 -->
      <v-row>
        <v-col cols="15" sm="3" style="max-width: 70px; margin-left: 10px">
          <v-btn icon @click="clickbuildSubMenu">
            <v-icon>build</v-icon>
          </v-btn>
        </v-col>
        <v-col cols="15" sm="3" style="max-width: 70px">
          <v-btn
            icon
            :disabled="!manageSeatTabOfSelectedSeatsComponentStatus"
            @click="clickAddSubMenu"
          >
            <v-icon>add</v-icon>
          </v-btn>
        </v-col>
        <v-col cols="15" sm="3" style="max-width: 70px">
          <v-btn
            icon
            :disabled="!manageSeatTabOfSelectedSeatsComponentStatus"
            @click="clickDeleteSubMenu"
          >
            <v-icon>delete</v-icon>
          </v-btn>
        </v-col>
        <v-col cols="15" sm="3" style="max-width: 70px">
          <v-btn
            icon
            :disabled="!manageSeatTabOfSelectedSeatsComponentStatus"
            @click="clickSwipeSubMenu"
          >
            <v-icon>swipe</v-icon>
          </v-btn>
        </v-col>
        <v-col cols="15" sm="3" style="max-width: 70px">
          <v-btn
            icon
            :disabled="!manageSeatTabOfSelectedSeatsComponentStatus"
            @click="clickNotesSubMenu"
          >
            <v-icon>notes</v-icon>
          </v-btn>
        </v-col>
      </v-row>

      <!-- 첫번째 서브 메뉴-->
      <div v-if="buildSubMenuState">
        <v-card-title>
          <h4>{{ this.$t("textMakeSeat") }}</h4></v-card-title
        >
        <v-row>
          <v-col cols="12" sm="10">
            <div style="margin-left: 15px">
              <vue-numeric-input
                :min="1"
                :max="50"
                v-model="selectedNumberOfAddSeat"
                controls-type="updown"
                @change="changeSelectedNumberOfAddSeat"
                @focus="onFocusInText"
                @blur="outFocusInText"
                style="width: 228px"
              ></vue-numeric-input>
            </div>
          </v-col>
          <v-col cols="12" sm="2" style="margin-top: -23px; margin-left: -5px">
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

        <v-row>
          <v-col cols="12" sm="10">
            <v-card-title>
              <h4>{{ this.$t("textViewSeatTooltip") }}</h4></v-card-title
            >
          </v-col>
          <v-col cols="12" sm="2" style="margin-top: -3px; margin-left: -5px">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <div v-bind="attrs" v-on="on">
                  <v-switch
                    v-model="showToolTipForSeatStatus"
                    @change="changeShowToolTipForSeatStatus"
                  ></v-switch>
                </div>
              </template>
              <span>{{ this.$t("tooltipForSeat") }}</span>
            </v-tooltip>
          </v-col>
        </v-row>

        <v-card-title>
          <h4>{{ this.$t("textInformationOfSeat") }}</h4></v-card-title
        >
        <v-row style="margin-left: 15px;margin-top: -10px">
          <v-radio-group @change="viewSeatInfo" v-model="viewSeatStatus" row>
            <v-radio
              :label="$t('contextMenuViewSeatAboutEmployeeName')"
              :value="0"
            ></v-radio>
            <div style="margin-right: 5px"></div>
            <v-radio
              :label="$t('contextMenuViewSeatAboutNumber')"
              :value="1"
            ></v-radio>
            <div style="margin-right: 5px"></div>
            <v-radio
              :label="$t('contextMenuViewSeatAboutDepartment')"
              :value="2"
            ></v-radio>
            <div style="margin-right: 5px"></div>
            <v-radio
              :label="$t('contextMenuViewSeatAboutName')"
              :value="3"
            ></v-radio>
          </v-radio-group>
        </v-row>
      </div>

      <!--두번째 서브메뉴-->
      <MappingEmployee v-if="addSubMenuState" />

      <!--세번째 서브메뉴-->
      <DeleteSeatOrEmployee v-if="deleteSubMenuState" />

      <!--네번째 서브메뉴-->
      <div v-if="swipeSubMenuState">
        <v-card-title>
          <h4>{{ this.$t("textChangeFloorSeat") }}</h4></v-card-title
        >
        <v-row>
          <v-col cols="12" sm="9">
            <v-select
              style="margin-left: 15px"
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
              style="
                float: right;
                top: 4px;
                margin-right: 15px;
                height: 30px;
                color: white;
                font-size: 12px;
              "
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
              style="margin-left: 15px"
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
              style="
                float: right;
                top: 4px;
                margin-right: 15px;
                height: 30px;
                color: white;
                font-size: 12px;
              "
              >{{ this.$t("btnOk") }}</v-btn
            ></v-col
          >
        </v-row>
      </div>

      <!--다섯번째 서브메뉴-->
      <div v-if="notesSubMenuState">
        <v-card-title>
          <h4>
            {{ this.$t("textChangeSeatSize") }}
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
              style="width: 290px; margin-left: -20px; top: 3px"
              @focus="onFocusInText"
              @blur="outFocusInText"
              @change="changeSelectSeatWidth"
            ></vue-numeric-input>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="2" sm="2">
            <div style="margin-left: 12px">
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
              style="width: 290px; margin-left: -20px"
              @focus="onFocusInText"
              @blur="outFocusInText"
              @change="changeSelectSeatHeight"
            ></vue-numeric-input>
          </v-col>
        </v-row>

        <v-card-title>
          <h4>{{ this.$t("textMemoToSeat") }}</h4></v-card-title
        >
        <v-textarea
          solo
          name="input-7-4"
          style="margin-left: 15px; margin-right: 15px"
          :label="$t('textInMemoTextArea')"
          v-model="memoComment"
          @focus="onFocusInText"
          @blur="outFocusInText"
          @change="writeMemo"
        ></v-textarea>
      </div>
      <v-card-actions>
        <v-checkbox
          v-if="buildSubMenuState"
          style="margin-left: 7px; margin-top: 257px; height: 10px"
          v-model="checkBoxSelectAll"
          :label="$t('checkBoxSelectAll')"
          @click="changeSelectAllStatus"
        ></v-checkbox>
      </v-card-actions>
      <v-card-actions>
        <v-checkbox
          v-if="addSubMenuState"
          style="margin-left: 7px; height: 10px"
          v-model="checkBoxSelectAll"
          :label="$t('checkBoxSelectAll')"
          @click="changeSelectAllStatus"
        ></v-checkbox>
      </v-card-actions>
      <v-card-actions>
        <v-checkbox
          v-if="deleteSubMenuState"
          style="margin-left: 7px; margin-top: 499px; height: 20px"
          v-model="checkBoxSelectAll"
          :label="$t('checkBoxSelectAll')"
          @click="changeSelectAllStatus"
        ></v-checkbox>
      </v-card-actions>
      <v-card-actions>
        <v-checkbox
          v-if="swipeSubMenuState"
          style="margin-left: 7px; margin-top: 266px; height: 20px"
          v-model="checkBoxSelectAll"
          :label="$t('checkBoxSelectAll')"
          @click="changeSelectAllStatus"
        ></v-checkbox>
      </v-card-actions>
      <v-card-actions>
        <v-checkbox
          v-if="notesSubMenuState"
          style="margin-left: 7px; margin-top: 129px; height: 20px"
          v-model="checkBoxSelectAll"
          :label="$t('checkBoxSelectAll')"
          @click="changeSelectAllStatus"
        ></v-checkbox>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import MappingEmployee from "@/components/MappingEmployee.vue";
import DeleteSeatOrEmployee from "@/components/DeleteSeatOrEmployee.vue";
import { eventBus } from "../main";
import axios from "axios";
import { refreshToken } from "@/refreshToken.js";
import "material-design-icons-iconfont/dist/material-design-icons.css";
const HOST = "http://172.30.6.192:8080";

export default {
  name: "ManageSeats",
  components: {
    MappingEmployee,
    DeleteSeatOrEmployee,
  },
  props: [
    "allFloorListToManageSeats",
    "selectedFloorObjectToManageSeats",
    "manageSeatTabOfSelectedSeatsComponentStatusToManageSeats",
    "seatDragWidthToManageSeats",
    "seatDragHeightToManageSeats",
    "seatDragWidthListToManageSeats",
    "seatDragHeightListToManageSeats",
    "seatWidthToManageSeats",
    "seatHeightToManageSeats",
    "memoCommentToManageSeats",
    "checkBoxSelectAllStatus",
  ],
  data() {
    return {
      buildSubMenuState: true,
      addSubMenuState: false,
      deleteSubMenuState: false,
      swipeSubMenuState: false,
      notesSubMenuState: false,
      manageSeatTabOfSelectedSeatsComponentStatus: false,

      floorItems: [],
      selectedFloorItemsId: null,
      buildingItems: [],
      buildingFloorItems: new Map(),
      selectedBuildingFloorItems: null,
      addVacantSwitchStatus: false,
      showToolTipForSeatStatus: true,
      allFloorList: null,
      currentSelectedFloorObject: null,
      numberOfAddSeatItems: [],
      selectedNumberOfAddSeat: null,
      //드래그 자리 사이즈,
      seatHeight: null,
      seatWidth: null,
      seatDragHeight: null,
      seatDragWidth: null,
      seatDragHeightList: null,
      seatDragWidthList: null,
      //라디오 버튼 상태값
      viewSeatStatus: 0,
      // 텍스트 필드에 키보드 이벤트를 할 때 자리의 이벤트를 막기위함
      textFocusStatus: false,
      // 메모 내용
      memoComment: null,
      checkBoxSelectAll: false,
    };
  },
  watch: {
    allFloorListToManageSeats: {
      deep: true,
      handler() {
        console.log("allFloorListToManageSeats changed!");
        this.allFloorList = this.allFloorListToManageSeats;
        if (!this.currentSelectedFloorObject) {
          this.currentSelectedFloorObject = this.allFloorList[0];
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
    this.seatHeight = this.seatHeightToManageSeats;
    this.seatWidth = this.seatWidthToManageSeats;
    this.seatDragHeight = this.seatDragHeightToManageSeats;
    this.seatDragWidth = this.seatDragWidthToManageSeats;
    this.seatDragHeightList = this.seatDragHeightListToManageSeats;
    this.seatDragWidthList = this.seatDragWidthListToManageSeats;
    this.memoComment = this.memoCommentToManageSeats;
    this.checkBoxSelectAll = this.checkBoxSelectAllStatus;
    this.changeSeatSizeInformation();

    eventBus.$emit("destroyTabEventFromManageSeats");

    // DB에 이미 있을 때 + 층 데이터 건들지 않음
    if (
      this.$store.state.getStore.allFloor &&
      this.$store.state.getStore.allFloor.length
    ) {
      this.allFloorList = this.$store.state.getStore.allFloor.slice();
      let tempList = this.allFloorList.slice();
      this.allFloorList = tempList.reverse();
      this.currentSelectedFloorObject = this.allFloorList[0];
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
        if (!manageSeatTabOfSelectedSeatsComponentStatus) {
          this.clickbuildSubMenu();
        }
        this.manageSeatTabOfSelectedSeatsComponentStatus = manageSeatTabOfSelectedSeatsComponentStatus;
      }
    );

    eventBus.$on("pushCheckBoxSelectAllStatus", (checkBoxSelectAllStatus) => {
      this.checkBoxSelectAll = checkBoxSelectAllStatus;
    });

    eventBus.$on("pushMemoComment", (memoComment) => {
      this.memoComment = memoComment;
    });

    eventBus.$on("sendDragSeatInformation", (objWidth, objHeight) => {
      this.seatDragWidth = objWidth;
      this.seatDragHeight = objHeight;
    });

    eventBus.$on("sendDragMultipleSeatList", (objWidthList, objHeightList) => {
      this.seatDragWidthList = objWidthList;
      this.seatDragHeightList = objHeightList;
      this.changeSeatSizeInformation();
    });
  },
  beforeDestroy() {
    eventBus.$off("pushManageSeatTabOfSelectedSeatsComponentStatus");
    eventBus.$off("pushCheckBoxSelectAllStatus");
    eventBus.$off("pushMemoComment");
    eventBus.$off("sendDragSeatInformation");
    eventBus.$off("sendDragMultipleSeatList");
  },
  methods: {
    test() {
      console.log(this.memoComment);
    },
    clickbuildSubMenu() {
      this.buildSubMenuState = true;
      this.addSubMenuState = false;
      this.deleteSubMenuState = false;
      this.swipeSubMenuState = false;
      this.notesSubMenuState = false;
    },
    clickAddSubMenu() {
      this.buildSubMenuState = false;
      this.addSubMenuState = true;
      this.deleteSubMenuState = false;
      this.swipeSubMenuState = false;
      this.notesSubMenuState = false;
    },
    clickDeleteSubMenu() {
      this.buildSubMenuState = false;
      this.addSubMenuState = false;
      this.deleteSubMenuState = true;
      this.swipeSubMenuState = false;
      this.notesSubMenuState = false;
    },
    clickSwipeSubMenu() {
      this.buildSubMenuState = false;
      this.addSubMenuState = false;
      this.deleteSubMenuState = false;
      this.swipeSubMenuState = true;
      this.notesSubMenuState = false;
    },
    clickNotesSubMenu() {
      this.buildSubMenuState = false;
      this.addSubMenuState = false;
      this.deleteSubMenuState = false;
      this.swipeSubMenuState = false;
      this.notesSubMenuState = true;
    },
    onFocusInText() {
      this.textFocusStatus = true;
      eventBus.$emit("pushFocusStatus", this.textFocusStatus);
    },
    outFocusInText() {
      this.textFocusStatus = false;
      eventBus.$emit("pushFocusStatus", this.textFocusStatus);
    },
    changeSelectAllStatus() {
      eventBus.$emit("pushSelectAllStatus", this.checkBoxSelectAll);
      if (!this.checkBoxSelectAll) {
        this.manageSeatTabOfSelectedSeatsComponentStatus = false;
        this.clickbuildSubMenu();
      }
    },
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
    changeShowToolTipForSeatStatus() {
      eventBus.$emit(
        "pushShowToolTipForSeatStatus",
        this.showToolTipForSeatStatus
      );
    },
    changeSelectedNumberOfAddSeat() {
      eventBus.$emit(
        "pushSelectedNumberOfAddSeat",
        this.selectedNumberOfAddSeat
      );
    },
    changeSelectSeatWidth() {
      if (isNaN(this.seatDragWidth)) {
        this.$notice.info({
          title: this.$i18n.t("alertModifySeatWidth"),
          styles: {
            width: "400px",
            marginLeft: "-815px",
            top: "118px",
            color: "red",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      }
      eventBus.$emit("pushChangeSeatWidth", this.seatDragWidth);
    },
    changeSelectSeatHeight() {
      if (isNaN(this.seatDragHeight)) {
        this.$notice.info({
          title: this.$i18n.t("alertModifySeatHeight"),
          styles: {
            width: "400px",
            marginLeft: "-815px",
            top: "118px",
            color: "red",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      }
      eventBus.$emit("pushChangeSeatHeight", this.seatDragHeight);
    },
    clickDragSeatSizeBtn() {
      eventBus.$emit(
        "sendDragSeatSize",
        this.seatDragWidth,
        this.seatDragHeight
      );
    },
    viewSeatInfo() {
      eventBus.$emit("pushViewSeatInfo", this.viewSeatStatus);
    },
    changeSeatSizeInformation() {
      if (this.seatDragHeightList && this.seatDragWidthList) {
        let seatDragHeightSet = new Set(this.seatDragHeightList);
        let seatDragWidthSet = new Set(this.seatDragWidthList);
        //console.log(seatDragHeightSet);
        //console.log(seatDragWidthSet);
        if (seatDragHeightSet.size > 1) {
          //console.log("height different");
          this.seatDragHeight = null;
        } else {
          // console.log("height same");
          this.seatDragHeight = this.seatDragHeightList[0];
        }
        if (seatDragWidthSet.size > 1) {
          // console.log("width different");
          this.seatDragWidth = null;
        } else {
          // console.log("width same");
          this.seatDragWidth = this.seatDragWidthList[0];
        }
      }
    },
    writeMemo() {
      if (this.memoComment === "") {
        this.$notice.info({
          title: this.$i18n.t("alertNoMemoComment"),
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
      eventBus.$emit("pushNewMemoComment", this.memoComment);
    },
  },
};
</script>