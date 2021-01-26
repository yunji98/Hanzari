<template>
  <div class="pa-4">
    <div v-if="departmentMap">
      <v-chip-group active-class="primary--text" column>
        <v-chip
          v-for="departmentObject in this.currentFloorDepartmentList"
          :key="departmentObject.departmentId"
          :color="getDepartmentColor(departmentObject)"
          @click="chipClicked(departmentObject.departmentId)"
          :text-color="getChipTextColor(getDepartmentColor(departmentObject))"
        >
          {{ departmentObject.departmentName }}
        </v-chip>
      </v-chip-group>
    </div>
  </div>
</template>

<script>
import { eventBus } from "../main.js";

export default {
  name: "DepartmentColorChips",
  data() {
    return {
      picker: null,
      currentFloorDepartmentList: [],
      allDepartmentObjectList: this.$store.state.getStore.allDepartment,
      departmentMap: null,
      departmentColor: null,

      allFloorList: this.$store.state.getStore.allFloor, // 가시적 층 리스트
      currentSelectedFloorId: null,
    };
  },
  created() {
    if (this.departmentMap === null) {
      this.departmentMap = new Map();
    }
    if (this.allFloorList && this.allFloorList.length) {
      this.currentSelectedFloorId = this.allFloorList[
        this.allFloorList.length - 1
      ].floorId;
    }

    //선택한 층에 대한 값 받아와서 층 전환하기 위한 event
    eventBus.$on("pushSelectedFloorObject", (floorObject) => {
      if (floorObject) {
        this.currentSelectedFloorId = floorObject.floorId;
        this.currentFloorDepartmentList = [];
        this.currentFloorDepartmentList = this.departmentMap.get(
          this.currentSelectedFloorId
        );
      } else {
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
  },
  beforeDestroy() {
    eventBus.$off("pushSelectedFloorObject");
    eventBus.$off("pushDepartmentMap");
  },
  methods: {
    getDepartmentColor(departmentObject) {
      return departmentObject.departmentColor;
    },
    discriminateLightOrDark(color) {
      console.log(color);
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
    },
    getChipTextColor(departmentColor) {
      let darkness = this.discriminateLightOrDark(departmentColor);
      if (darkness === "light") {
        return "black";
      } else {
        return "white";
      }
    },
    chipClicked(departmentObjectId) {
      eventBus.$emit("showDepartmentSeatHighlight", departmentObjectId);
    },
  },
};
</script>
