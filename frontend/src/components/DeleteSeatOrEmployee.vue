<template>
  <div>
    <v-row style="margin-top: 15px; margin-left: 15px; margin-right: 15px">
      <v-btn
        outlined
        color="#2c4f91"
        style="height: 30px; font-size: 12px; width: 310px"
        @click="clickDeleteSelectSeatBtn"
      >
        {{ this.$t("btnDeleteSeats") }}
      </v-btn>
    </v-row>
    <v-divider class="mx-4"></v-divider>
    <v-row style="margin-top: 15px; margin-left: 15px; margin-right: 15px">
      <v-btn
        outlined
        color="#2c4f91"
        style="height: 30px; font-size: 12px; width: 310px"
        @click="clickChangeSeatToVacant"
      >
        {{ this.$t("btnChangeToVacant") }}
      </v-btn>
    </v-row>
  </div>
</template>

<script>
import { eventBus } from "../main.js";
export default {
  methods: {
    clickChangeSeatToVacant() {
      eventBus.$emit("changeSeatToVacant");
    },
    clickDeleteSelectSeatBtn() {
      eventBus.$emit("pushDeleteSelectSeatStatus");
    },
  },
};
</script>