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
          height="550px"
          class="elevation-1"
          :no-data-text="$t('dataTabelNoDataTextEmployee')"
          :footer-props="{
            'items-per-page-text': $t('dataTabelPerPageTextEmployee'),
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
                  id="mappingEmployeeToVacantButton"
                  @click="clickEmployeeToMapping(row.item)"
                  >{{ $t("mapping") }}</v-btn
                >
              </td>
            </tr>
          </template>
          <template v-slot:pageText="props">
            ITEMS {{ props.pageStart }} - {{ props.pageStop }} OF
            {{ props.itemsLength }}
          </template>
        </v-data-table>
        <v-row>
          <v-col>
            <div class="mx-1">
              <v-btn
                outlined
                color="#2c4f91"
                style="
                  height: 30px;
                  font-size: 12px;
                  width: 405px;
                  top: 10px;
                  margin-left: 5px;
                "
                @click="clickChangeSeatToVacant"
              >
                {{ this.$t("btnChangeToVacant") }}
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-card>
  </div>
</template>

<script>
import { eventBus } from "../main";

const HOST = "http://172.30.6.192:8082";

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
    // DB�� �̹� ���� �� + �� ������ �ǵ��� ����
    if (this.allFloorList && this.allFloorList.length) {
      this.currentSelectedFloorObject = this.allFloorList[
        this.allFloorList.length - 1
      ];
    }

    // ManagerManageSeats.vue ������ ���� �������� �ٲ������(�ܼ� �� �̵�)
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