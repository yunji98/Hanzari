<template>
  <div>
    <v-toolbar color="#2c4f91" dark :height="30"> </v-toolbar>
    <v-tabs
      v-model="tab"
      background-color="#2c4f91"
      dark
      height="65"
      horizontal
      grow
    >
      <v-tabs-slider color="blue"></v-tabs-slider>
      <v-tab v-for="item in items" :key="item.index">
        <v-icon size="30px" dark>{{ item.icon }}</v-icon></v-tab
      >
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item v-for="item in items" :key="item.index">
        <v-card flat>
          <v-card-text>
            <component
              v-bind:is="item.content"
              :manageSeatTabOfSelectedSeatsComponentStatusToManageSeats="
                manageSeatTabOfSelectedSeatsComponentStatusToManageSeats
              "
              :eachEmployeeSeatMapToManageSearch="
                eachEmployeeSeatMapToManageSearch
              "
              :allFloorListToManageSeats="allFloorListToManageSeats"
              :selectedFloorObjectToManageSeats="
                selectedFloorObjectToManageSeats
              "
              :seatWidthToManageSeats="seatWidth"
              :seatHeightToManageSeats="seatHeight"
              :seatDragWidthToManageSeats="seatDragWidth"
              :seatDragHeightToManageSeats="seatDragHeight"
              :seatDragWidthListToManageSeats="seatDragWidthList"
              :seatDragHeightListToManageSeats="seatDragHeightList"
              :memoCommentToManageSeats="memoCommentToManageSeats"
              :checkBoxSelectAllStatus="checkBoxSelectAllStatus"
            ></component>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script>
import { eventBus } from "../main";
import ManageSeats from "@/components/ManageSeats.vue";
import ManageFloors from "@/components/ManageFloors.vue";
import ManageSearch from "@/components/ManageSearch.vue";

export default {
  components: {
    ManageSeats,
    ManageFloors,
    ManageSearch,
  },
  data() {
    return {
      tab: 0,

      manageSeatTabOfSelectedSeatsComponentStatusToManageSeats: false,

      eachEmployeeSeatMapToManageSearch: null,
      allFloorListToManageSeats: null,
      selectedFloorObjectToManageSeats: null,

      memoCommentToManageSeats: null,
      checkBoxSelectAllStatus: null,

      //드래그 자리 사이즈,
      seatHeight: null,
      seatWidth: null,
      seatDragHeight: null,
      seatDragWidth: null,
      seatDragWidthList: null,
      seatDragHeightList: null,

      items: [
        {
          icon: "stairs",
          title: this.$i18n.t("settingFloor"),
          index: 0,
          content: "ManageFloors",
        },
        {
          icon: "event_seat",
          title: this.$i18n.t("settingSeat"),
          index: 1,
          content: "ManageSeats",
        },
        {
          icon: "search",
          index: 2,
          title: this.$i18n.t("search"),
          content: "ManageSearch",
        },
      ],
    };
  },
  created() {
    //자리 선택시 무조건 두번째 탭으로 자동 이동
    eventBus.$on("pushShowSeatTabStatus", () => {
      this.tab = 1;
    });

    //초기에 두번째 탭 선택 안했을때 자리를 선택하면 나머지 서브메뉴들 enable 시켜주기 위함
    eventBus.$on(
      "pushManageSeatTabOfSelectedSeatsComponentStatus",
      (manageSeatTabOfSelectedSeatsComponentStatus) => {
        this.manageSeatTabOfSelectedSeatsComponentStatusToManageSeats = manageSeatTabOfSelectedSeatsComponentStatus;
        if (manageSeatTabOfSelectedSeatsComponentStatus === false) {
          this.seatHeight = null;
          this.seatWidth = null;
        }
      }
    );

    //초기에 두번째 탭 선택 안했을때 자리가 전체 선택일때 체크박스에 감지하기 위함
    eventBus.$on("pushCheckBoxSelectAllStatus", (checkBoxSelectAllStatus) => {
      this.checkBoxSelectAllStatus = checkBoxSelectAllStatus;
    });

    //초기에 두번째 탭 선택 안했을때 선택한 자리에 대해서 메모를 보여지게 하기 위함
    eventBus.$on("pushMemoComment", (memoComment) => {
      this.memoCommentToManageSeats = memoComment;
    });

    //모든 층 객체를 가지고 있는 리스트를 받기 위한 event => watch로 감시
    eventBus.$on("pushAllFloorList", (allFloorList) => {
      this.allFloorListToManageSeats = allFloorList;
    });

    //선택한 층에 대한 값 받아와서 층 전환하기 위한 event => watch로 감시
    eventBus.$on("pushSelectedFloorObject", (floorObject) => {
      this.selectedFloorObjectToManageSeats = floorObject;
    });

    eventBus.$on("sendDragSeatInformation", (objWidth, objHeight) => {
      this.seatDragWidth = objWidth;
      this.seatDragHeight = objHeight;
    });

    eventBus.$on("sendDragMultipleSeatList", (objWidthList, objHeightList) => {
      this.seatDragWidthList = objWidthList;
      this.seatDragHeightList = objHeightList;
    });

    //매핑된 사원 추가시 검색 탭으로 사원 맵 받기 위한 event
    eventBus.$on("pushEachEmployeeSeatMap", (eachEmployeeSeatMap) => {
      this.eachEmployeeSeatMapToManageSearch = eachEmployeeSeatMap;
    });

    eventBus.$on("destroyTabEventFromManageSeats", () => {
      this.destroyManageSeatsEvent();
    });

    eventBus.$on("destroyTabEventFromManageSearch", () => {
      this.destroyManageSearchEvent();
    });
  },
  methods: {
    destroyManageSeatsEvent() {
      eventBus.$off("pushManageSeatTabOfSelectedSeatsComponentStatus");
      eventBus.$off("pushCheckBoxSelectAllStatus");
      eventBus.$off("pushMemoComment");
      eventBus.$off("sendDragSeatInformation");
      eventBus.$off("sendDragMultipleSeatList");
    },
    destroyManageSearchEvent() {
      eventBus.$off("pushEachEmployeeSeatMap");
    },
  },
  beforeDestroy() {
    eventBus.$off("pushAllFloorList");
    eventBus.$off("pushSelectedFloorObject");
    eventBus.$off("destroyTabEventFromManageSeats");
    eventBus.$off("destroyTabEventFromManageSearch");
  },
};
</script>
