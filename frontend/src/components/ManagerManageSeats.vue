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
      <div>
        <v-row>
          <v-col cols="12" sm="10">
            <v-card-title>
              <h4>{{ this.$t("textViewSeatTooltip") }}</h4></v-card-title
            >
          </v-col>
          <v-col cols="12" sm="2" style="margin-top: -10px; margin-left: -5px">
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
        ><v-row>
          <v-radio-group @change="viewSeatInfo" v-model="viewSeatStatus" row>
            <div class="mx-3"></div>
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
        </v-row>

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
      </div>
    </v-card>

    <v-card
      flat
      color="transparent"
      v-if="
        manageSeatTabOfSelectedSeatsComponentStatus &&
        !mappingEmployeeComponentStatus
      "
    >
      <v-row>
        <v-col>
          <div class="mx-1">
            <v-btn
              outlined
              color="#2c4f91"
              style="
                height: 30px;
                font-size: 12px;
                width: 405px;
                top: 10px;
                margin-left: 5px;
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
                width: 405px;
                top: 10px;
                margin-left: 5px;
              "
              @click="clickChangeSeatToVacant"
            >
              {{ this.$t("btnChangeToVacant") }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
      <v-card-title>
        <h4>{{ this.$t("textCheckMemoToSeat") }}</h4></v-card-title
      >
      <v-row>
        <v-col cols="12" sm="9">
          <v-textarea
            solo
            name="input-7-4"
            style="margin-left: 15px"
            :label="$t('textCheckInMemoTextArea')"
            disabled
            v-model="memoComment"
          ></v-textarea>
        </v-col>
      </v-row>
    </v-card>

    <MappingEmployee v-if="mappingEmployeeComponentStatus" />
  </div>
</template>

<script>
import MappingEmployee from "@/components/MappingEmployee.vue";
import { eventBus } from "../main";
import "material-design-icons-iconfont/dist/material-design-icons.css";

export default {
  name: "ManagerManageSeats",
  props: [
    "selectedFloorObjectToManageSeats",
    "memoCommentToManageSeats",
    "manageSeatTabOfSelectedSeatsComponentStatusToManageSeats",
  ],
  components: {
    MappingEmployee,
  },
  data() {
    return {
      allFloorList: this.$store.state.getStore.allFloor,
      currentSelectedFloorObject: null,

      showToolTipForSeatStatus: true,

      manageSeatTabOfSelectedSeatsComponentStatus: false,
      mappingEmployeeComponentStatus: false,
      memoComment: null,

      search: "",
      headers: [
        {
          text: this.$i18n.t("textName"),
          align: "start",
          sortable: true,
          value: "name",
        },
        { text: this.$i18n.t("textDept"), value: "department" },
        { text: this.$i18n.t("textNumber"), value: "number" },
        { text: "", value: "mappingEmployeeToVacantButton" },
      ],

      //라디오 버튼 상태값
      viewSeatStatus: 0,

      // 자리 불투명도
      seatOpacity: 1,
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

    // DB�� �̹� ���� �� + �� ������ �ǵ��� ����
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
      "pushMappingEmployeeComponentStatus",
      (mappingEmployeeComponentStatus) => {
        this.mappingEmployeeComponentStatus = mappingEmployeeComponentStatus;
      }
    );

    eventBus.$on("pushMemoComment", (memoComment) => {
      this.memoComment = memoComment;
    });

    eventBus.$on(
      "pushManageSeatTabOfSelectedSeatsComponentStatus",
      (manageSeatTabOfSelectedSeatsComponentStatus) => {
        this.manageSeatTabOfSelectedSeatsComponentStatus = manageSeatTabOfSelectedSeatsComponentStatus;
      }
    );
  },
  beforeDestroy() {
    eventBus.$off("pushMappingEmployeeComponentStatus");
  },
  methods: {
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