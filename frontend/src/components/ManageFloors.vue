<template>
  <div>
    <v-card flat color="transparent">
      <!-- 세팅 들어가기 이전-->
      <div v-if="!this.settingStatus">
        <v-row style="margin-top: -10px">
          <v-col cols="12" sm="9">
            <v-card-title>
              <h4>{{ this.$t("textSelectFloor") }}</h4></v-card-title
            ></v-col
          ><v-col cols="12" sm="3" style="margin-top: 15px">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  style="float: right; width: 30px"
                  text
                  @click="getSettings"
                  v-bind="attrs"
                  v-on="on"
                  ><v-icon size="30px" dark>settings</v-icon></v-btn
                ></template
              >
              <span>{{ this.$t("tooltipFloorSettingBtn") }}</span>
            </v-tooltip>
          </v-col>
        </v-row>

        <div style="overflow-x: hidden; overflow-y: auto; height: 600px">
          <v-row
            v-for="floorObject of this.allFloorList"
            :key="floorObject.floorId"
            style="padding-left: 15px"
          >
            <v-col cols="11" style="flex: 0 0 93%; max-width: 93%">
              <v-btn
                block
                @click="clickFloor(floorObject)"
                :style="{
                  border: clickFloorIndexes.includes(floorObject.floorId)
                    ? 'thick solid #2c4f91'
                    : '',
                  fontWeight: clickFloorIndexes.includes(floorObject.floorId)
                    ? 'bold'
                    : '',
                  height: '45px',
                }"
                >{{ floorObject.floorName }}</v-btn
              >
            </v-col>
          </v-row>
        </div>

        <v-divider class="mx-4"></v-divider>

        <v-card-title>
          <h4>{{ this.$t("textSettingImage") }}</h4></v-card-title
        >
        <div class="mx-3">
          <v-row>
            <v-col cols="12" sm="9">
              <v-card :height="30">
                <div class="mx-auto text-center">
                  {{ currentFloorImageName }}
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="3">
              <input
                v-show="false"
                ref="upload"
                type="file"
                @change="changeImageFile"
              />
              <v-btn
                color="#2c4f91"
                style="
                  float: right;
                  height: 30px;
                  color: white;
                  font-size: 12px;
                "
                @click="uploadImage()"
                ><h4>{{ this.$t("btnUploadImage") }}</h4></v-btn
              >
            </v-col>
          </v-row>
        </div>
      </div>

      <!-- 세팅 들어간 이후-->
      <div v-else>
        <v-row style="margin-top: -10px">
          <v-col cols="12" sm="9">
            <v-card-title>
              <h4>{{ this.$t("textSettingFloor") }}</h4></v-card-title
            > </v-col
          ><v-col cols="12" sm="3" style="margin-top: 15px">
            <v-btn style="float: right; width: 30px" text
              ><v-icon size="30px" dark @click="addFloor"
                >add_circle</v-icon
              ></v-btn
            >
          </v-col>
        </v-row>

        <div style="overflow-x: hidden; overflow-y: auto; height: 600px">
          <v-row
            v-for="floorObject of this.settingsFloorList"
            :key="floorObject.floorId"
            class="d-flex child-flex"
            style="padding-left: 15px"
          >
            <v-col cols="9">
              <v-text-field
                name="editFloorNameInSetting[]"
                v-model="editFloorNameInSetting[floorObject.floorId]"
                :label="$t('textFieldLabelEditFloorName')"
                solo
                dense
              ></v-text-field>
            </v-col>

            <v-col cols="2" style="padding-left: 25px">
              <v-btn text @click="removeFloor(floorObject.floorId)"
                ><v-icon large>delete</v-icon></v-btn
              >
            </v-col>
          </v-row>
        </div>

        <div style="text-align: right; margin-top: 50px">
          <v-btn
            @click="cancelSettings"
            style="height: 30px; font-size: 12px"
            >{{ this.$t("btnCancel") }}</v-btn
          >
          <v-btn
            @click="confirmSettings"
            color="#2c4f91"
            style="height: 30px; color: white; font-size: 12px"
            >{{ this.$t("btnConfirm") }}</v-btn
          >
        </div>
      </div>
    </v-card>
  </div>
</template>

<script>
import { eventBus } from "../main.js";
import "material-design-icons-iconfont/dist/material-design-icons.css";

export default {
  data() {
    return {
      allFloorList: [],
      deleteFloorList: [],

      currentSelectedFloorObject: null,

      clickFloorIndexes: null,

      settingStatus: false,
      settingsFloorList: [],

      allImageMap: null,
      currentFloorImageName: this.$i18n.t("textUploadImage"),

      editFloorNameInSetting: [],

      saveStatus: null,
    };
  },
  created() {
    //DB에 층이 있다면 현재 층, 모든 층, 모든 층 개수, 클릭된 현재층의 Id 초기화(검정 테두리 위함)
    if (
      this.$store.state.getStore.allFloor &&
      this.$store.state.getStore.allFloor.length
    ) {
      this.currentSelectedFloorObject = this.$store.state.getStore.allFloor[
        this.$store.state.getStore.allFloor.length - 1
      ];
      this.allFloorList = this.$store.state.getStore.allFloor;
      this.clickFloorIndexes = this.currentSelectedFloorObject.floorId;
    }

    if (this.allImageMap == null) {
      this.allImageMap = new Map();
      if (this.$store.state.getStore.latestFloorImage) {
        for (
          let i = 0;
          i < this.$store.state.getStore.latestFloorImage.length;
          i++
        ) {
          let newImageObject = {};
          newImageObject.imgPath = this.$store.state.getStore.latestFloorImage[
            i
          ].imgPath;
          newImageObject.floorId = this.$store.state.getStore.latestFloorImage[
            i
          ].floorId;
          newImageObject.imgFileName = this.$store.state.getStore.latestFloorImage[
            i
          ].imgFileName;
          newImageObject.imgFileType = this.$store.state.getStore.latestFloorImage[
            i
          ].imgFileType;

          this.allImageMap.set(newImageObject.floorId, newImageObject);

          this.currentFloorImageName = this.allImageMap.get(
            newImageObject.floorId
          ).imgFileName;
          if (!this.currentFloorImageName) {
            this.currentFloorImageName = this.$i18n.t("textUploadImage");
          }
        }
      }

      if (this.$store.state.getStore.otherFloorsImageList) {
        for (
          let i = 0;
          i < this.$store.state.getStore.otherFloorsImageList.length;
          i++
        ) {
          let newImageObject = {};
          newImageObject.imgPath = this.$store.state.getStore.otherFloorsImageList[
            i
          ].imgPath;
          newImageObject.floorId = this.$store.state.getStore.otherFloorsImageList[
            i
          ].floorId;
          newImageObject.imgFileName = this.$store.state.getStore.otherFloorsImageList[
            i
          ].imgFileName;
          newImageObject.imgFileType = this.$store.state.getStore.otherFloorsImageList[
            i
          ].imgFileType;

          this.allImageMap.set(newImageObject.floorId, newImageObject);
        }
      }
    }

    //자리 하이라이트시, 층 이동을 위한 이벤트
    eventBus.$on("pushFloorOfSeat", (floorId) => {
      for (let i = 0; i < this.allFloorList.length; i++) {
        if (floorId === this.allFloorList[i].floorId) {
          this.clickFloor(this.allFloorList[i]);
        }
      }
    });
  },
  beforeDestroy() {
    eventBus.$off("pushFloorOfSeat");
  },
  methods: {
    //층 클릭시마다 call
    clickFloor(floorObject) {
      if (floorObject) {
        //클릭된 층 버튼의 테두리 부각
        this.clickFloorIndexes = [];
        this.clickFloorIndexes.push(floorObject.floorId); //층에 맞는 도면의 이름 보여주기 위함.

        if (this.allImageMap.get(floorObject.floorId)) {
          this.currentFloorImageName = this.allImageMap.get(
            floorObject.floorId
          ).imgFileName;
          if (!this.currentFloorImageName) {
            this.currentFloorImageName = this.$i18n.t("textUploadImage");
          }
        } else {
          this.currentFloorImageName = this.$i18n.t("textUploadImage");
        }
      } else {
        this.currentFloorImageName = this.$i18n.t("textUploadImage");
      }

      //현재층 설정
      this.currentSelectedFloorObject = floorObject;
      eventBus.$emit("pushSelectedFloorObject", floorObject);
    },
    // 톱니바퀴 버튼을 누르면 층 세팅 가능
    getSettings() {
      //settings 리스트에 현재 층 리스트 복사
      this.settingsFloorList = this.allFloorList.slice();
      //settings 화면에 textField model 설정
      for (let i = 0; i < this.allFloorList.length; i++) {
        let floorId = this.allFloorList[i].floorId;
        this.editFloorNameInSetting[floorId] = this.allFloorList[i].floorName;
      }
      this.settingStatus = true;
    },
    // 층의 key 생성
    createFloorUUID() {
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
      newFloorObject.floorId = this.createFloorUUID();
      newFloorObject.floorName = "";
      newFloorObject.buildingId = this.$store.state.buildingStore.building.buildingId;
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

      if (idx > -1) {
        let deleteFloor = {};
        deleteFloor.floorId = this.settingsFloorList[idx].floorId;
        deleteFloor.isObjFromDB = this.settingsFloorList[idx].isObjFromDB;
        this.deleteFloorList.push(deleteFloor);

        this.settingsFloorList.splice(idx, 1);
      }
    },
    // 층 수정 데이터 확인
    confirmSettings() {
      //이전에 층이 한개도 없었다면 현재층 정의해줌
      if (this.allFloorList.length === 0) {
        //이전에 층이 한개도 없었는데 층 데이터 수정안하고 확인 누르면
        if (this.settingsFloorList.length === 0) {
          this.settingStatus = false;
          return;
        }
        this.currentSelectedFloorObject = this.settingsFloorList[
          this.settingsFloorList.length - 1
        ];
        this.clickFloor(this.currentSelectedFloorObject);
      }

      let currentSelectedFloorId = this.currentSelectedFloorObject.floorId;
      const idx = this.allFloorList.findIndex(function (item) {
        return item.floorId === currentSelectedFloorId;
      });

      //삭제 or 추가 층이 있다면
      if (this.allFloorList.length != this.settingsFloorList.length) {
        this.allFloorList = this.settingsFloorList.slice();
        if (this.allFloorList.length > 0) {
          this.clickFloor(
            this.settingsFloorList[this.settingsFloorList.length - 1]
          );
        } else {
          this.clickFloor(null);
        }

        this.saveStatus = "ableSave";
      }

      //DB에 있는 층들 삭제하기 위함
      if (this.deleteFloorList.length) {
        this.deleteFloorList.forEach((floor) => {
          if (floor.isObjFromDB) {
            this.$store.commit("PUSH_DeleteFloor", floor.floorId);
          }
        });
        eventBus.$emit("pushDeletedFloorList", this.deleteFloorList);
        this.deleteFloorList = [];
      }

      //allFloorList의 FloorObject의 floorName을 settings화면에서 바꾼 floorName으로 변경해준다.
      for (let i = 0; i < this.allFloorList.length; i++) {
        let floorId = this.allFloorList[i].floorId;
        //층 이름이 이전과 다르다면
        if (
          this.allFloorList[i].floorName != this.editFloorNameInSetting[floorId]
        ) {
          let changedFloor = {};
          changedFloor.floorName = this.editFloorNameInSetting[floorId];
          changedFloor.floorId = this.allFloorList[i].floorId;
          this.allFloorList[i].floorName = this.editFloorNameInSetting[floorId];
          this.allFloorList[i].httpRequestPostStatus = true;
          this.saveStatus = "ableSave";

          // 만약 현재층의 이름이 변했다면
          if (idx === i) {
            eventBus.$emit(
              "pushChangedCurrentFloorName",
              this.currentSelectedFloorObject.floorName
            );
          }
        }
      }

      console.log(this.currentSelectedFloorObject);

      eventBus.$emit("sendStoreStatus", this.saveStatus);
      eventBus.$emit("pushAllFloorList", this.allFloorList);
      eventBus.$emit(
        "pushSelectedFloorObject",
        this.currentSelectedFloorObject
      );
      this.settingStatus = false;
    },
    //층 세팅 취소
    cancelSettings() {
      //settings 화면에 textfield model을 원래대로(allFloorList의 FloorObject의 floorName) 설정
      for (let i = 0; i < this.allFloorList.length; i++) {
        if (
          this.settingsFloorList.length === this.allFloorList.length &&
          this.settingsFloorList[i].floorId === this.allFloorList[i].floorId
        ) {
          let floorId = this.settingsFloorList[i].floorId;
          this.editFloorNameInSetting[floorId] = this.allFloorList[i].floorName;
        }
      }
      this.settingStatus = false;
    },
    // 도면 이미지 업로드시 불리는 함수
    uploadImage() {
      if (this.allFloorList.length) {
        this.$refs.upload.value = "";
        //changeImageFile 함수 call
        this.$refs.upload.click();
      } else {
        this.$notice.info({
          title: this.$i18n.t("alertNoFloorOnImage"),
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
    changeImageFile(e) {
      let files = e.target.files;
      if (!files.length) return;
      this.saveImageFile(files[0]);
    },
    saveImageFile(file) {
      let newImageObject = {};
      newImageObject.imgPath = file;
      newImageObject.imgType = file.type;
      newImageObject.floorId = this.currentSelectedFloorObject.floorId;
      newImageObject.imgFileName = file.name;

      this.allImageMap.set(
        this.currentSelectedFloorObject.floorId,
        newImageObject
      );
      this.currentFloorImageName = this.allImageMap.get(
        this.currentSelectedFloorObject.floorId
      ).imgFileName;

      this.saveStatus = "ableSave";
      eventBus.$emit("pushAllImageMap", this.allImageMap);
      eventBus.$emit("sendStoreStatus", this.saveStatus);
    },
  },
};
</script>
