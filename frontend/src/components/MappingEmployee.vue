<template>
  <div>
    <v-card-title>
      <h4>{{ this.$t("btnMappingEmployee") }}</h4>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        :label="$t('textFieldLabelSearchSeat')"
        single-line
        hide-details
        @focus="onFocusInText"
        @blur="outFocusInText"
      ></v-text-field
    ></v-card-title>

    <!--div style="margin-left: 15px; margin-right: 15px"-->
    <div style="margin-left: 5px; margin-right: 5px">
      <v-data-table
        :headers="headers"
        :items="this.$store.state.getStore.allEmployee"
        :search="search"
        :page.sync="page"
        :items-per-page="itemsPerPage"
        class="elevation-1"
        :no-data-text="$t('dataTabelNoDataTextEmployee')"
        hide-default-header
        hide-default-footer
        @page-count="pageCount = $event"
      >
        <template v-slot:item="row">
          <tr>
            <td style="font-size: 12px; width: 300px">
              <b>{{ row.item.name }}</b>
              <br>{{ row.item.department }}
              <br>{{ row.item.number }}
            </td>
            <td>
              <v-btn
                outlined
                color="#2c4f91"
                style="height: 30px; font-size: 12px; width: 50px"
                id="mappingEmployeeToVacantButton"
                @click="clickEmployeeToMapping(row.item)"
                >{{ $t("mapping") }}</v-btn
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
  </div>
</template>

<script>
import { eventBus } from "../main";

export default {
  name: "MappingEmployee",
  data() {
    return {
      page: 1,
      pageCount: 0,
      itemsPerPage:9,

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
      textFocusStatus: false,
    };
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
    clickEmployeeToMapping(clickedEmployee) {
      eventBus.$emit("mappingEmployeeToVacant", clickedEmployee);
    },
  },
};
</script>
