<template>
  <v-card flat>
    <v-card-title>
      <div class="mx-1"></div>
      <h4>{{ this.$t("searchEmployee") }}</h4>
    </v-card-title>
    <v-card-title>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        :label="$t('textFieldLabelSearchSeat')"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>

    <v-data-table
      :headers="headers"
      :items="allEmployeeSeat"
      :search="search"
      height="600px"
      class="elevation-1"
      :no-data-text="$t('dataTabelNoDataTextSeat')"
      :footer-props="{
        'items-per-page-text': $t('dataTabelPerPageTextSeat'),
        'items-per-page-options': [5, 10],
      }"
    >
      <template v-slot:item="row">
        <tr>
          <td>{{ row.item.name }}</td>
          <td>{{ row.item.department }}</td>
          <td>{{ row.item.number }}</td>
          <td>
            <v-btn
              outlined
              color="#2c4f91"
              style="height: 30px; font-size: 12px"
              id="showSeatButton"
              @click="showSeatButtonClicked(row.item)"
              >{{ $t("findSeat") }}</v-btn
            >
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import { eventBus } from "../main.js";

export default {
  name: "ManageSearch",
  props: ["eachEmployeeSeatMapToManageSearch"],
  data() {
    return {
      allEmployeeSeat: [],
      allEmployeeSeatMap: null,

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
        { text: "", value: "showSeatButton" },
      ],
    };
  },
  watch: {
    eachEmployeeSeatMapToManageSearch: {
      deep: true,
      handler() {
        console.log("eachEmployeeSeatMap changed!");
        this.allEmployeeSeatMap = this.eachEmployeeSeatMapToManageSearch;
        this.getAllEmployeeSeats();
      },
    },
  },
  created() {
    // created 시에는 Tabs.vue에서 eachEmployeeSeatMapToManageSearch 받아오고 이후부터는 본인 이벤트로 받아옴
    this.allEmployeeSeatMap = this.eachEmployeeSeatMapToManageSearch;

    //매핑된 사원 추가시 검색 탭으로 사원 맵 받기 위한 event
    eventBus.$on("pushEachEmployeeSeatMap", (eachEmployeeSeatMap) => {
      this.allEmployeeSeatMap = eachEmployeeSeatMap;
      this.getAllEmployeeSeats();
    });
  },
  mounted() {
    this.getAllEmployeeSeats();
  },
  beforeDestroy() {
    eventBus.$off("pushEachEmployeeSeatMap");
  },
  methods: {
    getAllEmployeeSeats() {
      if (this.allEmployeeSeatMap) {
        this.allEmployeeSeat = [];
        let keys = [];
        keys = Array.from(this.allEmployeeSeatMap.keys());

        for (let i = 0; i < keys.length; i++) {
          let seats = [];
          seats = this.allEmployeeSeatMap.get(keys[i]);
          for (let j = 0; j < seats.length; j++) {
            let newSeatObject = {};

            if (seats[j].employeeId != null) {
              //공석 제외
              newSeatObject.seatId = seats[j].seatId;
              newSeatObject.employeeId = seats[j].employeeId;
              newSeatObject.name = seats[j].employeeName;
              newSeatObject.department = seats[j].employeeDepartment;
              newSeatObject.floorId = seats[j].floorId;
              newSeatObject.number = seats[j].employeeNumber;
              this.allEmployeeSeat.push(newSeatObject);
            }
          }
        }
      }
    },
    showSeatButtonClicked(clickedSeat) {
      eventBus.$emit("showSeatHighlight", clickedSeat); //자리 하이라이트 (=> AssignSeats.vue / ViewerAssignSeats.vue)
      eventBus.$emit("pushFloorOfSeat", clickedSeat.floorId); //층 이동
    },
  },
};
</script>