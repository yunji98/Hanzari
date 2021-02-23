<template>
  <div>
    <v-toolbar color="#2c4f91" dark :height="30"
      ><v-icon
        size="30px"
        dark
        style="background-color: #1c3563"
        @click="closeLeftDrawer"
        >keyboard_arrow_left</v-icon
      ><v-divider vertical></v-divider>
      <div class="mx-3">
        <v-toolbar-title>{{ $t("projectName") }}</v-toolbar-title>
      </div>
    </v-toolbar>
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
              :manageSeatTabOfSelectedSeatsComponentStatusToManageSeats="
                manageSeatTabOfSelectedSeatsComponentStatusToManageSeats
              "
              :memoCommentToManageSeats="memoCommentToManageSeats"
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
import ViewerManageSeats from "@/components/ViewerManageSeats.vue";
import ManageSearch from "@/components/ManageSearch.vue";

export default {
  components: {
    ViewerManageFloors,
    ViewerManageSeats,
    ManageSearch,
  },
  props: ["leftDrawer"],
  data() {
    return {
      tab: null,
      manageSeatTabOfSelectedSeatsComponentStatusToManageSeats: false,
      eachEmployeeSeatMapToManageSearch: null,

      memoCommentToManageSeats: null,

      items: [
        {
          icon: "stairs",
          index: 0,
          title: this.$i18n.t("settingFloor"),
          content: "ViewerManageFloors",
        },
        {
          icon: "event_seat",
          index: 1,
          title: this.$i18n.t("settingSeat"),
          content: "ViewerManageSeats",
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

    //초기에 두번째 탭 선택 안했을때도 선택한 자리에 대해서 뜨는 탭을 보여지게 하기 위함
    eventBus.$on(
      "pushManageSeatTabOfSelectedSeatsComponentStatus",
      (manageSeatTabOfSelectedSeatsComponentStatus) => {
        this.manageSeatTabOfSelectedSeatsComponentStatusToManageSeats = manageSeatTabOfSelectedSeatsComponentStatus;
      }
    );

    //초기에 두번째 탭 선택 안했을때도 선택한 자리에 대해서 메모를 보여지게 하기 위함
    eventBus.$on("pushMemoComment", (memoComment) => {
      this.memoCommentToManageSeats = memoComment;
    });

    //매핑된 사원 추가시 검색 탭으로 사원 맵 받기 위한 event
    eventBus.$on("pushEachEmployeeSeatMap", (eachEmployeeSeatMap) => {
      console.log(eachEmployeeSeatMap);
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
    closeLeftDrawer() {
      eventBus.$emit("closeLeftDrawer");
    },
    destroyManageSeatsEvent() {
      eventBus.$off("pushManageSeatTabOfSelectedSeatsComponentStatus");
      eventBus.$off("pushMemoComment");
    },
    destroyManageSearchEvent() {
      eventBus.$off("pushEachEmployeeSeatMap");
    },
  },
  beforeDestroy() {
    eventBus.$off("pushShowSeatTabStatus");
    eventBus.$off("destroyTabEventFromManageSeats");
    eventBus.$off("destroyTabEventFromManageSearch");
  },
};
</script>