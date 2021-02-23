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
          <v-col cols="12" sm="2" style="margin-top: -4px; margin-left: -5px">
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
      </div>

      <!--두번째 서브메뉴-->
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
    </v-card>
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
      buildSubMenuState: true,
      notesSubMenuState: false,
      manageSeatTabOfSelectedSeatsComponentStatus: false,

      //라디오 버튼 상태값
      viewSeatStatus: 0,

      showToolTipForSeatStatus: true,

      // 메모 내용
      memoComment: null,
    };
  },
  created() {
    // 만약 ManageSeats.vue에 들어오기 전에 자리 선택한 적이 있을때
    this.manageSeatTabOfSelectedSeatsComponentStatus = this.manageSeatTabOfSelectedSeatsComponentStatusToManageSeats;
    this.memoComment = this.memoCommentToManageSeats;

    eventBus.$emit("destroyTabEventFromManageSeats");

    eventBus.$on(
      "pushManageSeatTabOfSelectedSeatsComponentStatus",
      (manageSeatTabOfSelectedSeatsComponentStatus) => {
        if (!manageSeatTabOfSelectedSeatsComponentStatus) {
          this.clickbuildSubMenu();
        }
        this.manageSeatTabOfSelectedSeatsComponentStatus = manageSeatTabOfSelectedSeatsComponentStatus;
      }
    );

    eventBus.$on("pushMemoComment", (memoComment) => {
      this.memoComment = memoComment;
    });
  },
  beforeDestroy() {
    eventBus.$off("pushManageSeatTabOfSelectedSeatsComponentStatus");
    eventBus.$off("pushMemoComment");
  },
  methods: {
    clickbuildSubMenu() {
      this.buildSubMenuState = true;
      this.notesSubMenuState = false;
    },
    clickNotesSubMenu() {
      this.buildSubMenuState = false;
      this.notesSubMenuState = true;
    },
    changeShowToolTipForSeatStatus() {
      eventBus.$emit(
        "pushShowToolTipForSeatStatus",
        this.showToolTipForSeatStatus
      );
    },
    viewSeatInfo() {
      eventBus.$emit("pushViewSeatInfo", this.viewSeatStatus);
    },
  },
};
</script>
