<template>
  <v-card flat>
    <v-card-title>
      <h4>{{ this.$t("searchEmployee") }}</h4>
    </v-card-title>
    <v-card-title>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        :label="$t('textFieldLabelSearchSeat')"
        single-line
        hide-details
        @focus="onFocusInText"
        @blur="outFocusInText"
      ></v-text-field>
    </v-card-title>

    <div style="margin-left: 10px; margin-right: 10px">
      <v-data-table
        :headers="headers"
        :items="allEmployeeSeat"
        :search="search"
        :page.sync="page"
        :items-per-page="itemsPerPage"
        class="elevation-1"
        :no-data-text="$t('dataTabelNoDataTextSeat')"
        hide-default-header
        hide-default-footer
        @page-count="pageCount = $event"
      >
        <template v-slot:item="row">
          <tr>
            <td style="font-size: 12px; width: 500px; text-align: left">
              <b>{{ row.item.name }}</b>
              <br />{{ row.item.department }} <br />{{ row.item.number }}
            </td>
            <td>
              <v-btn
                outlined
                color="#2c4f91"
                style="height: 30px; font-size: 12px; width: 30px"
                id="showSeatButton"
                @click="showSeatButtonClicked(row.item)"
                >{{ $t("findSeat") }}</v-btn
              >
            </td>
          </tr>
        </template>
      </v-data-table>
      <v-pagination
        v-model="page"
        :length="pageCount"
      ></v-pagination>
    </div>
  </v-card>
</template>

<script>
import { eventBus } from "../main.js";

export default {
  name: "ManageSearch",
  props: ["eachEmployeeSeatMapToManageSearch"],
  data() {
    return {
      page: 1,
      pageCount: 0,
      itemsPerPage:11,

      allEmployeeSeat: [],
      allEmployeeSeatMap: null,

      search: "",
      headers: [
        {
          text: this.$i18n.t("textName"),
          align: "center",
          sortable: true,
          value: "name",
        },
        { text: "", value: "showSeatButton", sortable: false },
      ],
      textFocusStatus: false,
    };
  },
  created() {
    // created 시에는 Tabs.vue에서 eachEmployeeSeatMapToManageSearch 받아오고 이후부터는 본인 이벤트로 받아옴
    this.allEmployeeSeatMap = this.eachEmployeeSeatMapToManageSearch;

    eventBus.$emit("destroyTabEventFromManageSearch");

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
    onFocusInText() {
      this.textFocusStatus = true;
      eventBus.$emit("pushFocusStatus", this.textFocusStatus);
    },
    outFocusInText() {
      this.textFocusStatus = false;
      eventBus.$emit("pushFocusStatus", this.textFocusStatus);
    },
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