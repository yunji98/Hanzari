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
            @click="clickNotesSubMenu"
          >
            <v-icon>notes</v-icon>
          </v-btn>
        </v-col>
      </v-row>

      <!-- 첫번째 서브 메뉴-->
      <div v-if="buildSubMenuState">
        <v-row>
          <v-col cols="12" sm="10">
            <v-card-title>
              <h4>{{ this.$t("textViewSeatTooltip") }}</h4></v-card-title
            >
          </v-col>
          <v-col cols="12" sm="2" style="margin-top: -7px; margin-left: -5px">
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

        <v-divider class="mx-4"></v-divider>

        <v-card-title>
          <h4>{{ this.$t("textInformationOfSeat") }}</h4></v-card-title
        >
        <v-row style="margin-left: 15px; margin-top: -10px">
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
      <DeleteEmployee v-if="deleteSubMenuState" />

      <!--네번째 서브메뉴-->
      <div v-if="notesSubMenuState">
        <v-card-title>
          <h4>{{ this.$t("textCheckMemoToSeat") }}</h4></v-card-title
        >

        <v-textarea
          solo
          name="input-7-4"
          style="margin-left: 15px; margin-right: 15px"
          :label="$t('textCheckInMemoTextArea')"
          disabled
          v-model="memoComment"
        ></v-textarea>
      </div>

      <v-card-actions>
        <v-checkbox
          v-if="buildSubMenuState"
          style="margin-left: 7px; margin-top: 389px; height: 10px"
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
          style="margin-left: 7px; margin-top: 545px; height: 20px"
          v-model="checkBoxSelectAll"
          :label="$t('checkBoxSelectAll')"
          @click="changeSelectAllStatus"
        ></v-checkbox>
      </v-card-actions>
      <v-card-actions>
        <v-checkbox
          v-if="notesSubMenuState"
          style="margin-left: 7px; margin-top: 330px; height: 20px"
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
import DeleteEmployee from "@/components/DeleteEmployee.vue";
import { eventBus } from "../main";
import "material-design-icons-iconfont/dist/material-design-icons.css";

export default {
  name: "ManagerManageSeats",
  components: {
    MappingEmployee,
    DeleteEmployee,
  },
  props: [
    "selectedFloorObjectToManageSeats",
    "manageSeatTabOfSelectedSeatsComponentStatusToManageSeats",
    "memoCommentToManageSeats",
    "checkBoxSelectAllStatus",
  ],
  data() {
    return {
      buildSubMenuState: true,
      addSubMenuState: false,
      deleteSubMenuState: false,
      notesSubMenuState: false,
      manageSeatTabOfSelectedSeatsComponentStatus: false,

      allFloorList: this.$store.state.getStore.allFloor,
      currentSelectedFloorObject: null,

      showToolTipForSeatStatus: true,

      memoComment: null,

      //라디오 버튼 상태값
      viewSeatStatus: 0,

      checkBoxSelectAll: false,
    };
  },
  watch: {
    selectedFloorObjectToManageSeats: {
      // This will let Vue know to look inside the array
      deep: true,

      handler() {
        console.log("selectedFloorObjectToManageSeats changed!");
        this.currentSelectedFloorObject = this.selectedFloorObjectToManageSeats;
      },
    },
  },
  created() {
    this.memoComment = this.memoCommentToManageSeats;
    this.manageSeatTabOfSelectedSeatsComponentStatus = this.manageSeatTabOfSelectedSeatsComponentStatusToManageSeats;
    this.checkBoxSelectAll = this.checkBoxSelectAllStatus;

    eventBus.$emit("destroyTabEventFromManageSeats");

    if (this.allFloorList && this.allFloorList.length) {
      this.currentSelectedFloorObject = this.allFloorList[
        this.allFloorList.length - 1
      ];
    }

    // ManageSeats.vue 들어오기 전에 현재층이 바뀌었을때(단순 층 이동)
    if (this.selectedFloorObjectToManageSeats) {
      this.currentSelectedFloorObject = this.selectedFloorObjectToManageSeats;
    }

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
  },
  beforeDestroy() {
    eventBus.$off("pushManageSeatTabOfSelectedSeatsComponentStatus");
    eventBus.$off("pushCheckBoxSelectAllStatus");
    eventBus.$off("pushMemoComment");
  },
  methods: {
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
    clickNotesSubMenu() {
      this.buildSubMenuState = false;
      this.addSubMenuState = false;
      this.deleteSubMenuState = false;
      this.swipeSubMenuState = false;
      this.notesSubMenuState = true;
    },
    changeSelectAllStatus() {
      eventBus.$emit("pushSelectAllStatus", this.checkBoxSelectAll);
      if (!this.checkBoxSelectAll) {
        this.manageSeatTabOfSelectedSeatsComponentStatus = false;
        this.clickbuildSubMenu();
      }
    },
    changeShowToolTipForSeatStatus() {
      eventBus.$emit(
        "pushShowToolTipForSeatStatus",
        this.showToolTipForSeatStatus
      );
    },
    clickChangeSeatToVacant() {
      eventBus.$emit("changeSeatToVacant");
    },
    clickEmployeeToMapping(clickedEmployee) {
      eventBus.$emit("mappingEmployeeToVacant", clickedEmployee);
    },
    viewSeatInfo() {
      eventBus.$emit("pushViewSeatInfo", this.viewSeatStatus);
    },
    changeSeatOpacity() {
      eventBus.$emit("pushSeatOpacity", this.seatOpacity);
    },
    getMappingEmployeeComponent() {
      this.mappingEmployeeComponentStatus = true;
    },
  },
};
</script>