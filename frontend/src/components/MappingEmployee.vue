<template>
  <v-card flat color="transparent">
    <div>
      <v-icon large style="float: right" @click="changeBackPage">clear</v-icon>
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
        height="700px"
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
    </div>
  </v-card>
</template>

<script>
import { eventBus } from "../main";

export default {
  name: "MappingEmployee",
  data() {
    return {
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
  methods: {
    clickEmployeeToMapping(clickedEmployee) {
      eventBus.$emit("mappingEmployeeToVacant", clickedEmployee);
    },
    changeBackPage() {
      eventBus.$emit("pushMappingEmployeeComponentStatus", false);
    },
  },
};
</script>
