<template>
  <v-card flat>
    <v-card-title>
      <div class="mx-1"></div>
      <h4>{{ currentSelectedFloorName }}{{ $t("floor") }}</h4>
    </v-card-title>
    <div class="mx-3">
      <v-data-table
        :headers="headers"
        :items="floorInformationlist"
        height="700px"
        item-key="name"
        class="elevation-1"
        :no-data-text="$t('dataTabelNoDataTextEmployee')"
        :footer-props="{
          'items-per-page-text': $t('dataTabelPerPageTextSeat'),
        }"
      >
        <template v-slot:item="row">
          <tr>
            <td>
              {{ row.item.name }}
            </td>
            <td>
              <v-btn
                id="changeColorButton"
                elevation="2"
                v-if="
                  userAuthority === 'admin' &&
                  row.item.name != '전체' &&
                  row.item.name != '공석'
                "
                fab
                x-small
                :color="getChipColor(row.item.name)"
                @click="changeColorButtonClicked(row.item.name)"
              >
                <v-icon
                  :color="getChipTextColor(getChipColor(row.item.name))"
                  medium
                  >sync</v-icon
                >
              </v-btn>
            </td>
            <td>{{ row.item.number }}</td>
            <td>
              <v-btn
                v-if="row.item.name != '전체' && row.item.number > 0"
                outlined
                color="#2c4f91"
                style="height: 30px; font-size: 12px"
                id="showSeatButton"
                @click="showSeatButtonClicked(row.item.name)"
                >{{ $t("findSeat") }}</v-btn
              >
            </td>
          </tr>
        </template>
      </v-data-table>
    </div>
  </v-card>
</template>

<script>
import { eventBus } from "../main.js";

export default {
  name: "FlowInformationTable",
  data() {
    return {
      userAuthority: null,

      allFloorList: null,
      allSeatMap: null,

      currentSelectedFloorId: null,
      currentSelectedFloorName: null,
      allFloorIdList: [],

      latestFloorSeatList: this.$store.state.getStore.latestFloorSeatList,
      otherFloorSeatMap: this.$store.state.getStore.otherFloorsSeatMap,

      floorInformationlist: [],

      headers: [
        { text: this.$i18n.t("headersDivision"), value: "name" },
        { text: "", value: "changeColorButton" },
        { text: this.$i18n.t("headersNumberOfSeat"), value: "number" },
        { text: "", value: "showSeatButton" },
      ],

      floorSeatsNumber: 0,
      floorVacantSeatsNumber: 0,

      currentFloorDepartmentList: [],
      allDepartmentObjectList: this.$store.state.getStore.allDepartment,
      departmentMap: null,
      departmentColor: null,
    };
  },
  created() {
    this.userAuthority = this.$store.state.userStore.authority;

    this.allSeatMap = new Map();
    if (this.departmentMap === null) {
      this.departmentMap = new Map();
    }

    //층 변할때 그 층에 맞는 현황표 보여주기 위함
    eventBus.$on("pushSelectedFloorObject", (floorObject) => {
      if (floorObject) {
        this.currentSelectedFloorName = floorObject.floorName;
        this.currentSelectedFloorId = floorObject.floorId;
        this.getFloorInformation();

        this.currentFloorDepartmentList = [];
        this.currentFloorDepartmentList = this.departmentMap.get(
          this.currentSelectedFloorId
        );
      } else {
        this.currentSelectedFloorId = null;
        this.currentSelectedFloorName = null;
        this.currentFloorDepartmentList = [];
      }
    });

    eventBus.$on("pushDepartmentMap", (departmentMap) => {
      this.departmentMap = departmentMap;

      this.currentFloorDepartmentList = [];
      this.currentFloorDepartmentList = departmentMap.get(
        this.currentSelectedFloorId
      );
    });

    //현황표 변경되었을때
    eventBus.$on("pushAllSeatMap", (allSeatMap) => {
      //console.log(allSeatMap);
      this.allSeatMap = allSeatMap;
      if (this.allSeatMap.size === 0) {
        this.initFloorInformation();
      } else {
        this.getFloorInformation();
      }
    });

    if (
      this.$store.state.getStore.allFloor &&
      this.$store.state.getStore.allFloor.length
    ) {
      let currentFloorObject = this.$store.state.getStore.allFloor[
        this.$store.state.getStore.allFloor.length - 1
      ];
      this.currentSelectedFloorId = currentFloorObject.floorId;
      this.currentSelectedFloorName = currentFloorObject.floorName;

      this.allFloorList = this.$store.state.getStore.allFloor;

      for (let i = 0; i < this.allFloorList.length; i++) {
        this.allFloorIdList.push(this.allFloorList[i].floorId);
      }
    }

    if (this.latestFloorSeatList && this.latestFloorSeatList.length) {
      let newSeatsList = this.latestFloorSeatList;
      let floorId = this.currentSelectedFloorId;
      this.allSeatMap.set(floorId, newSeatsList);
    }

    if (this.otherFloorSeatMap && this.otherFloorSeatMap.size) {
      let keys = [];
      keys = Array.from(this.otherFloorSeatMap.keys());

      for (let i = 0; i < keys.length; i++) {
        let newSeatsList = this.otherFloorSeatMap.get(keys[i]);
        let floorId = keys[i];
        this.allSeatMap.set(floorId, newSeatsList);
      }
    }
  },
  beforeDestroy() {
    eventBus.$off("pushSelectedFloorObject");
    eventBus.$off("pushAllSeatMap");
    eventBus.$off("pushDepartmentMap");
  },
  mounted() {
    this.getFloorInformation();
  },
  methods: {
    getChipColor(name) {
      let chipColor = null;

      if (name === this.$i18n.t("textAllSeat")) {
        chipColor = "#ffffff";
      }

      if (this.currentFloorDepartmentList) {
        for (let i = 0; i < this.currentFloorDepartmentList.length; i++) {
          if (name === this.currentFloorDepartmentList[i].departmentName) {
            chipColor = this.currentFloorDepartmentList[i].departmentColor;
          }
        }
      }
      return chipColor;
    },
    discriminateLightOrDark(color) {
      console.log(color);
      if (color) {
        let r = null;
        let g = null;
        let b = null;
        let hsp = null;

        if (color.match(/^rgb/)) {
          color = color.match(
            /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
          );

          r = color[1];
          g = color[2];
          b = color[3];
        } else {
          color = +(
            "0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&")
          );

          r = color >> 16;
          g = (color >> 8) & 255;
          b = color & 255;
        }

        hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

        if (hsp > 127.5) {
          return "light";
        } else {
          return "dark";
        }
      }
    },
    getChipTextColor(departmentColor) {
      let darkness = this.discriminateLightOrDark(departmentColor);
      if (darkness === "light") {
        return "black";
      } else {
        return "white";
      }
    },
    initFloorInformation() {
      this.floorInformationlist = [];

      let floordata = {};
      floordata.name = this.$i18n.t("textAllSeat");
      floordata.number = 0;
      this.floorInformationlist.push(floordata);

      floordata = {};
      floordata.name = this.$i18n.t("textEmptySeat");
      floordata.number = 0;
      this.floorInformationlist.push(floordata);
    },
    getFloorInformation() {
      this.floorInformationlist = [];
      let departmentList = [];

      if (this.allSeatMap && this.currentSelectedFloorId) {
        if (this.allSeatMap.get(this.currentSelectedFloorId)) {
          this.floorSeatsNumber = 0;
          this.floorVacantSeatsNumber = 0;
          if (this.allSeatMap.get(this.currentSelectedFloorId).length > 0) {
            let floorSeatList = this.allSeatMap.get(
              this.currentSelectedFloorId
            );
            let floorSeatsLength = floorSeatList.length;
            let floorVacantSeatsLength = 0;

            let department = [];
            let employeeDepartmentMap = new Map();

            if (floorSeatsLength > 0) {
              for (let i = 0; i < floorSeatList.length; i++) {
                if (floorSeatList[i].employeeId == null) {
                  //공석 자리
                  floorVacantSeatsLength++;
                } else {
                  //매핑된 자리
                  if (
                    !employeeDepartmentMap.get(
                      floorSeatList[i].employeeDepartment
                    )
                  ) {
                    let employees = [];
                    employeeDepartmentMap.set(
                      floorSeatList[i].employeeDepartment,
                      employees
                    );
                  }
                  employeeDepartmentMap
                    .get(floorSeatList[i].employeeDepartment)
                    .push(floorSeatList[i].employeeId);
                }
              }

              let keys = [];
              keys = Array.from(employeeDepartmentMap.keys());

              for (let i = 0; i < keys.length; i++) {
                let floordata = {};
                floordata.name = keys[i];
                floordata.number = employeeDepartmentMap.get(keys[i]).length;
                departmentList.push(floordata);
              }
            }
            this.floorSeatsNumber = floorSeatsLength;
            this.floorVacantSeatsNumber = floorVacantSeatsLength;
          }
        }
      }
      let floordata = {};
      floordata.name = this.$i18n.t("textAllSeat");
      floordata.number = this.floorSeatsNumber;
      this.floorInformationlist.push(floordata);

      floordata = {};
      floordata.name = this.$i18n.t("textEmptySeat");
      floordata.number = this.floorVacantSeatsNumber;
      this.floorInformationlist.push(floordata);

      if (departmentList.length > 0) {
        for (let i = 0; i < departmentList.length; i++) {
          this.floorInformationlist.push(departmentList[i]);
        }
      }
    },
    showSeatButtonClicked(departmentName) {
      let departmentObjectId = null;
      for (let i = 0; i < this.currentFloorDepartmentList.length; i++) {
        if (
          departmentName === this.currentFloorDepartmentList[i].departmentName
        ) {
          departmentObjectId = this.currentFloorDepartmentList[i].departmentId;
        }
      }
      eventBus.$emit("showDepartmentSeatHighlight", departmentObjectId);
    },
    changeColorButtonClicked(departmentName) {
      let departmentObjectId = null;
      for (let i = 0; i < this.currentFloorDepartmentList.length; i++) {
        if (
          departmentName === this.currentFloorDepartmentList[i].departmentName
        ) {
          departmentObjectId = this.currentFloorDepartmentList[i].departmentId;
        }
      }
      eventBus.$emit("changeDepartmentColor", departmentObjectId);
    },
  },
};
</script>
