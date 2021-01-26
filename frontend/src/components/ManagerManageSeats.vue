<template>
  <div>
    <v-card flat color="transparent">
      <div>
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
          :items="this.$store.state.getStore.allEmployee"
          :search="search"
          height="400px"
          class="elevation-1"
          :no-data-text="$t('dataTabelNoDataTextEmployee')"
          :footer-props="{
            'items-per-page-text': $t('dataTabelPerPageTextEmployee'),
            'items-per-page-options': [5, 10],
          }"
        >
          <template v-slot:item="row">
            <tr>
              <td>{{ row.item.name }}</td>
              <td>{{ row.item.department }}</td>
              <td>{{ row.item.number }}</td>
              <td>
                <v-icon
                  large
                  id="mappingEmployeeToVacantButton"
                  @click="clickEmployeeToMapping(row.item)"
                  >add_box</v-icon
                >
              </td>
            </tr>
          </template>
          <template v-slot:pageText="props">
            ITEMS {{ props.pageStart }} - {{ props.pageStop }} OF
            {{ props.itemsLength }}
          </template>
        </v-data-table>
        <v-card-text>
          <v-btn color="pink lighten-3" @click="clickChangeSeatToVacant"
            ><h4>
              <v-icon large>person_add_disabled</v-icon
              >{{ this.$t("btnChangeToVacant") }}
            </h4></v-btn
          ></v-card-text
        >
      </div>
    </v-card>
  </div>
</template>

<script>
import { eventBus } from "../main";
import axios from "axios";
import { refreshToken } from "@/refreshToken.js";

const HOST = "http://172.30.6.192:8080";

export default {
  name: "ManagerManageSeats",
  props: ["selectedFloorObjectToManageSeats"],
  data() {
    return {
      allFloorList: this.$store.state.getStore.allFloor,
      currentSelectedFloorObject: null,

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
        { text: "", value: "mappingEmployeeToVacantButton" },
      ],
    };
  },
  watch: {
    selectedFloorObjectToManageSeats: {
      // This will let Vue know to look inside the array
      deep: true,

      handler() {
        console.log("selectedFloorObjectToManageSeats changed!");
        this.currentSelectedFloorObject = this.selectedFloorObjectToManageSeats;
      },
    },
  },
  created() {
    // DB에 이미 있을 때 + 층 데이터 건들지 않음
    if (this.allFloorList && this.allFloorList.length) {
      this.currentSelectedFloorObject = this.allFloorList[
        this.allFloorList.length - 1
      ];
    }

    // ManagerManageSeats.vue 들어오기 전에 현재층이 바뀌었을때(단순 층 이동)
    if (this.selectedFloorObjectToManageSeats) {
      this.currentSelectedFloorObject = this.selectedFloorObjectToManageSeats;
    }
  },
  methods: {
    clickChangeSeatToVacant() {
      eventBus.$emit("changeSeatToVacant");
    },
    clickEmployeeToMapping(clickedEmployee) {
      eventBus.$emit("mappingEmployeeToVacant", clickedEmployee);
    },
  },
};
</script>