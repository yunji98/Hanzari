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
              :seatDragWidthToManageSeats="seatDragWidth"
              :seatDragHeightToManageSeats="seatDragHeight"
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

      //드래그 자리 사이즈,
      seatDragHeight: null,
      seatDragWidth: null,

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
    //초기에 두번째 탭 선택 안했을때도 선택한 자리에 대해서 뜨는 탭을 보여지게 하기 위함
    eventBus.$on(
      "pushManageSeatTabOfSelectedSeatsComponentStatus",
      (manageSeatTabOfSelectedSeatsComponentStatus) => {
        this.manageSeatTabOfSelectedSeatsComponentStatusToManageSeats = manageSeatTabOfSelectedSeatsComponentStatus;
        if (manageSeatTabOfSelectedSeatsComponentStatus) {
          this.tab = 1;
        }
        console.log(manageSeatTabOfSelectedSeatsComponentStatus);
      }
    );
    //매핑된 사원 추가시 검색 탭으로 사원 맵 받기 위한 event
    eventBus.$on("pushEachEmployeeSeatMap", (eachEmployeeSeatMap) => {
      this.eachEmployeeSeatMapToManageSearch = eachEmployeeSeatMap;
    });
    //모든 층 객체를 가지고 있는 리스트를 받기 위한 event
    eventBus.$on("pushAllFloorList", (allFloorList) => {
      console.log(this.allFloorListToManageSeats);
      console.log(allFloorList);
      this.allFloorListToManageSeats = allFloorList;
    });
    //선택한 층에 대한 값 받아와서 층 전환하기 위한 event
    eventBus.$on("pushSelectedFloorObject", (floorObject) => {
      this.selectedFloorObjectToManageSeats = floorObject;
    });

    eventBus.$on("sendDragSeatInformation", (objWidth, objHeight) => {
      console.log(objWidth + "22222" + objHeight);
      this.seatDragWidth = objWidth;
      this.seatDragHeight = objHeight;
    });

    eventBus.$on("sendDragMultipleSeatList", (objWidthList, objHeightList) => {
      console.log(objWidthList + "!!!!!!!!!!!!" + objHeightList);
    });
  },
  beforeDestroy() {
    eventBus.$off("pushManageSeatTabOfSelectedSeatsComponentStatus");
    eventBus.$off("pushEachEmployeeSeatMap");
    eventBus.$off("pushAllFloorList");
    eventBus.$off("pushSelectedFloorObject");
  },
};
</script>
