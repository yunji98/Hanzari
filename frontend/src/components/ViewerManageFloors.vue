<template>
  <div>
    <v-card flat color="transparent">
      <v-row>
        <v-col cols="12" sm="9">
          <v-card-title>
            <h4>{{ this.$t("textSelectFloor") }}</h4></v-card-title
          ></v-col
        ></v-row
      >
      <div style="overflow-x: hidden; overflow-y: auto; height: 600px">
        <v-row
          v-for="floorObject of this.allFloorList"
          :key="floorObject.floorId"
          style="padding-left: 15px"
        >
          <v-col cols="11" style="flex: 0 0 93%; max-width: 93%">
            <v-btn
              block
              large
              @click="clickFloor(floorObject)"
              :style="{
                border: clickFloorIndexes.includes(floorObject.floorId)
                  ? 'thick solid #2c4f91'
                  : '',
                fontWeight: clickFloorIndexes.includes(floorObject.floorId)
                  ? 'bold'
                  : '',
                height: '45px',
              }"
              >{{ floorObject.floorName }}</v-btn
            >
          </v-col>
        </v-row>
      </div>
    </v-card>
  </div>
</template>

<script>
import { eventBus } from "../main.js";
import "material-design-icons-iconfont/dist/material-design-icons.css";

export default {
  name: "ViewerManageFloors",
  data() {
    return {
      allFloorList: [],

      currentSelectedFloorObject: null,

      clickFloorIndexes: null,
    };
  },
  created() {
    if (
      this.$store.state.getStore.allFloor &&
      this.$store.state.getStore.allFloor.length
    ) {
      this.currentSelectedFloorObject = this.$store.state.getStore.allFloor[
        this.$store.state.getStore.allFloor.length - 1
      ];
      this.allFloorList = this.$store.state.getStore.allFloor.slice();
      let tempList = this.allFloorList.slice();
      this.allFloorList = tempList.reverse();
      this.clickFloorIndexes = this.currentSelectedFloorObject.floorId;
    }

    eventBus.$on("pushFloorOfSeat", (floorId) => {
      for (let i = 0; i < this.allFloorList.length; i++) {
        if (floorId === this.allFloorList[i].floorId) {
          this.clickFloor(this.allFloorList[i]);
        }
      }
    });
  },
  beforeDestroy() {
    eventBus.$off("pushFloorOfSeat");
  },
  methods: {
    clickFloor(floorObject) {
      this.clickFloorIndexes = [];
      this.clickFloorIndexes.push(floorObject.floorId);

      this.currentSelectedFloorObject = floorObject;
      eventBus.$emit("pushSelectedFloorObject", floorObject);
    },
  },
};
</script>
