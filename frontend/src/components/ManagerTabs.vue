<template>
  <div>
    <v-toolbar color="#2c4f91" dark> </v-toolbar>
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
              :eachEmployeeSeatMapToManageSearch="
                eachEmployeeSeatMapToManageSearch
              "
              :selectedFloorObjectToManageSeats="
                selectedFloorObjectToManageSeats
              "
            ></component>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script>
import { eventBus } from "../main";
import ViewerManageFloors from "@/components/ViewerManageFloors.vue";
import ManagerManageSeats from "@/components/ManagerManageSeats.vue";
import ManageSearch from "@/components/ManageSearch.vue";

export default {
  components: {
    ViewerManageFloors,
    ManagerManageSeats,
    ManageSearch,
  },
  data() {
    return {
      tab: null,

      eachEmployeeSeatMapToManageSearch: null,
      selectedFloorObjectToManageSeats: null,

      items: [
        {
          icon: "stairs",
          index: 0,
          title: this.$i18n.t("settingFloor"),
          content: "ViewerManageFloors",
        },
        {
          icon: "event_seat",
          title: this.$i18n.t("settingSeat"),
          index: 1,
          content: "ManagerManageSeats",
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
    //매핑된 사원 추가시 검색 탭으로 사원 맵 받기 위한 event
    eventBus.$on("pushEachEmployeeSeatMap", (eachEmployeeSeatMap) => {
      console.log(eachEmployeeSeatMap);
      this.eachEmployeeSeatMapToManageSearch = eachEmployeeSeatMap;
    });
    //선택한 층에 대한 값 받아와서 층 전환하기 위한 event
    eventBus.$on("pushSelectedFloorObject", (floorObject) => {
      this.selectedFloorObjectToManageSeats = floorObject;
    });
  },
  beforeDestroy() {
    eventBus.$off("pushEachEmployeeSeatMap");
    eventBus.$off("pushSelectedFloorObject");
  },
};
</script>