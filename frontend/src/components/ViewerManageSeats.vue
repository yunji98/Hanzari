<template>
  <div>
    <v-card flat color="transparent" v-if="!manageSeatTabOfSelectedSeatsComponentStatus">
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
    </v-card>

    <v-card flat color="transparent" v-else
      ><v-card-title>
        <h4>{{ this.$t("textCheckMemoToSeat") }}</h4></v-card-title
      >
      <v-row>
        <v-col cols="12" sm="9">
          <v-textarea
            solo
            name="input-7-4"
            style="margin-left: 10px"
            :label="$t('textCheckInMemoTextArea')"
            disabled
            v-model="memoComment"
          ></v-textarea>
        </v-col> </v-row
    ></v-card>
  </div>
</template>

<script>
import { eventBus } from "../main";
import "material-design-icons-iconfont/dist/material-design-icons.css";

export default {
  name: "ManageSeats",
  props: [
    "memoCommentToManageSeats",
    "manageSeatTabOfSelectedSeatsComponentStatusToManageSeats",
  ],
  data() {
    return {
      manageSeatTabOfSelectedSeatsComponentStatus:false,
      //라디오 버튼 상태값
      viewSeatStatus: 0,

      // 자리 불투명도
      seatOpacity: 1,

      // 텍스트 필드에 키보드 이벤트를 할 때 자리의 이벤트를 막기위함
      textFocusStatus: false,

      // 메모 내용
      memoComment: null,
    };
  },
  created() {
    // 만약 ManageSeats.vue에 들어오기 전에 자리 선택한 적이 있을때
    this.manageSeatTabOfSelectedSeatsComponentStatus = this.manageSeatTabOfSelectedSeatsComponentStatusToManageSeats;
    this.memoComment = this.memoCommentToManageSeats;

    eventBus.$on(
      "pushManageSeatTabOfSelectedSeatsComponentStatus",
      (manageSeatTabOfSelectedSeatsComponentStatus) => {
        this.manageSeatTabOfSelectedSeatsComponentStatus = manageSeatTabOfSelectedSeatsComponentStatus;
      }
    );

    eventBus.$on("pushMemoComment", (memoComment) => {
      this.memoComment = memoComment;
    });
  },
  beforeDestroy() {
    eventBus.$off("pushMemoComment");
  },
  methods: {
    viewSeatInfo() {
      eventBus.$emit("pushViewSeatInfo", this.viewSeatStatus);
    },
    changeSeatOpacity() {
      eventBus.$emit("pushSeatOpacity", this.seatOpacity);
    },
  },
};
</script>
