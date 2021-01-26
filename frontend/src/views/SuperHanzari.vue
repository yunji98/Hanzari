<template>
  <v-app id="app">
    <v-app-bar app color="#2c4f91" dark flat :height="30">
      <v-toolbar-title>{{ $t("superMypageTitle") }}</v-toolbar-title>
      <v-spacer />
      <v-btn text @click="logout">{{ $t("logout") }}</v-btn>
    </v-app-bar>
    <v-main>
      <v-card flat color="transparent" style="margin: 50px">
        <v-row v-if="this.$store.state.getStore.allEmployee" class="mx-auto">
          <v-col cols="12" sm="5">
            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="leftComboBoxSelectString"
                  :items="leftComboBoxItemList"
                  hide-selected
                  outlined
                  solo
                  v-on:change="changeAuthorityInLeftComboBox"
                ></v-combobox>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="employeeSearch"
                  append-icon="mdi-magnify"
                  :label="$t('textFieldLabelSearchEmployee')"
                  single-line
                  hide-details
                ></v-text-field>
                <v-data-table
                  v-model="leftDataTableSelectedItemList"
                  item-key="employeeId"
                  show-select
                  :headers="headers"
                  :items="leftDataTableEmployeeList"
                  :search="employeeSearch"
                  height="400px"
                  class="elevation-1"
                  :no-data-text="$t('dataTabelNoDataTextEmployee')"
                  :footer-props="{
                    'items-per-page-text': $t('dataTabelPerPageTextEmployee'),
                    'items-per-page-options': [5, 10],
                  }"
                >
                </v-data-table>
              </v-col> </v-row
          ></v-col>
          <v-col cols="12" sm="2"
            ><v-row>
              <v-col cols="12">
                <v-btn
                  x-large
                  @click="moveEmployeeToRightDataTable"
                  :disabled="!moveEmployeeToRightBtnStatus"
                  >{{ this.$i18n.t("btnMoveEmployeeToRightDataTable") }}</v-btn
                >
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-btn
                  x-large
                  @click="moveEmployeeToLeftDataTable"
                  :disabled="!moveEmployeeToLeftBtnStatus"
                  >{{ this.$i18n.t("btnMoveEmployeeToLeftDataTable") }}</v-btn
                >
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" sm="5">
            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="rightComboBoxSelectString"
                  :items="afterComboBoxItemList"
                  hide-selected
                  outlined
                  solo
                  v-on:change="changeAuthorityInRightComboBox"
                ></v-combobox>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="employeeSearch"
                  append-icon="mdi-magnify"
                  :label="$t('textFieldLabelSearchEmployee')"
                  single-line
                  hide-details
                ></v-text-field>
                <v-data-table
                  v-model="rightDataTableSelectedItemList"
                  item-key="employeeId"
                  show-select
                  :headers="headers"
                  :items="rightDataTableEmployeeList"
                  :search="employeeSearch"
                  height="400px"
                  class="elevation-1"
                  :no-data-text="$t('dataTabelNoDataTextEmployee')"
                  :footer-props="{
                    'items-per-page-text': $t('dataTabelPerPageTextEmployee'),
                    'items-per-page-options': [5, 10],
                  }"
                >
                </v-data-table>
              </v-col>
            </v-row>
          </v-col>
          <v-row>
            <v-col class="text-left">
              <v-btn
                style="height: 30px; font-size: 12px; margin-left: 10px"
                @click="resetAuthorizeEmployee"
                >{{ this.$i18n.t("btnResetAuthorizeEmployee") }}</v-btn
              >
            </v-col>
            <v-col class="text-right">
              <v-btn
                color="#2c4f91"
                style="
                  margin-right : 10px
                  height: 30px;
                  color: white;
                  font-size: 12px;
                "
                @click="confirmAuthorizeEmployee"
                >{{ this.$i18n.t("btnConfirm") }}</v-btn
              >
            </v-col>
          </v-row>
        </v-row>
      </v-card>
      <ProgressDialog
        v-if="!this.$store.state.getStore.allEmployee"
        :dialogStatus="true"
      />
    </v-main>
  </v-app>
</template>

<script>
import axios from "axios";
import { eventBus } from "../main";
import { refreshToken } from "@/refreshToken.js";
import i18n from "../plugins/i18n.js";

import ProgressDialog from "@/components/ProgressDialog.vue";

const HOST = "http://172.30.6.192:8080";

const Authority = {
  Viewer: "뷰어",
  Admin: "관리자",
  Manager: "매니저",
};

export default {
  data() {
    return {
      //왼쪽,오른쪽 상단의 콤보박스에 선택된 값
      leftComboBoxSelectString: null,
      rightComboBoxSelectString: null,

      //유지해야할 임시 권한 리스트
      authorityList: [Authority.Viewer, Authority.Admin, Authority.Manager],

      //왼쪽,오른쪽 상단의 콤보박스 아이템 리스트
      leftComboBoxItemList: [
        Authority.Viewer,
        Authority.Admin,
        Authority.Manager,
      ],
      afterComboBoxItemList: [
        Authority.Viewer,
        Authority.Admin,
        Authority.Manager,
      ],

      //데이터테이블에 필요한 값
      headers: [
        {
          text: this.$i18n.t("textName"),
          align: "start",
          sortable: true,
          value: "name",
        },
        { text: this.$i18n.t("textDept"), value: "department" },
        { text: this.$i18n.t("textNumber"), value: "number" },
      ],
      employeeSearch: "",

      //왼쪽,오른쪽 데이터 테이블의 사원리스트
      leftDataTableEmployeeList: [],
      rightDataTableEmployeeList: [],

      //권한이 괸리자/매니저/사원인 권한별 사원리스트
      adminEmployeeList: [],
      managerEmployeeList: [],
      viewerEmployeeList: [],

      //DB로 권한을 변경하고자 하는 사원 리스트
      employeeListToChangeAuthority: [],

      //왼쪽,오른쪽 데이터테이블에서 선택(체크)한 사원리스트
      leftDataTableSelectedItemList: [],
      rightDataTableSelectedItemList: [],

      //가운데 추가/삭제 버튼의 상태값
      moveEmployeeToRightBtnStatus: false,
      moveEmployeeToLeftBtnStatus: false,
    };
  },
  components: {
    ProgressDialog,
  },
  watch: {
    //추가하고자 하는 사원을 왼쪽 데이터테이블에서 선택했을 시 추가버튼 활성화
    //선택한 사원이 없을시 다시 추가버튼 비활성화
    leftDataTableSelectedItemList: {
      handler: function (newValue) {
        console.log(newValue);
        if (newValue.length > 0) {
          //오른쪽 데이터테이블에서 선택된 사원이 있다면
          if (this.rightDataTableSelectedItemList.length > 0) {
            //!!체크 해제 해달라는 알림창!! 띄워주고 리스트 초기화
            this.$notice.info({
              title: this.$i18n.t("alertRemoveCheckRightTable"),
              styles: {
                width: "400px",
                marginLeft: "-835px",
                top: "290px",
                backgroundColor: "#2a88bd",
              },
              duration: 5,
            });
            this.leftDataTableSelectedItemList = [];
            this.moveEmployeeToRightBtnStatus = false;
          }
          this.moveEmployeeToRightBtnStatus = true;
        } else {
          this.moveEmployeeToRightBtnStatus = false;
        }
      },
    },
    //삭제하고자 하는 사원을 오른쪽 데이터테이블에서 선택했을 시 삭제버튼 활성화
    //선택한 사원이 없을시 다시 삭제버튼 비활성화
    rightDataTableSelectedItemList: {
      handler: function (newValue) {
        console.log(newValue);
        if (newValue.length > 0) {
          //왼쪽 데이터테이블에서 선택된 사원이 있다면
          if (this.leftDataTableSelectedItemList.length > 0) {
            //!!체크 해제 해달라는 알림창!! 띄워주고 리스트 초기화
            this.$notice.warning({
              title: this.$i18n.t("alertRemoveCheckLeftTable"),
              styles: {
                width: "400px",
                marginLeft: "-835px",
                top: "290px",
                backgroundColor: "#2a88bd",
              },
              duration: 5,
            });
            this.rightDataTableSelectedItemList = [];
            this.moveEmployeeToLeftBtnStatus = false;
          } else {
            this.moveEmployeeToLeftBtnStatus = true;
          }
        } else {
          this.moveEmployeeToLeftBtnStatus = false;
        }
      },
    },
  },
  async created() {
    if (this.$store.state.getStore.allEmployee == null) {
      await this.getEmployeeList();
    }

    //enum Authority의 키값들만 모아서 리스트로 만들어 그것을 기준으로 관리자/매니저/뷰어 사원리스트에 사원객체를 초기 삽입하기
    let keysFromEnum = Object.keys(Authority);
    for (let i = 0; i < keysFromEnum.length; i++) {
      this.pushEmployeeToListByAuthority(keysFromEnum[i].toLowerCase());
    }

    //왼쪽, 오른쪽의 콤보박스에 선택되는 값을 초기 설정하기
    this.leftComboBoxSelectString = this.leftComboBoxItemList[0];
    this.rightComboBoxSelectString = this.afterComboBoxItemList[1];

    //왼쪽,오른쪽의 콤보박스의 아이템들은 각각의 다른쪽에 선택되어있는 콤보박스의 값을 제외한 값으로 초기 설정하기
    this.leftComboBoxItemList.splice(
      this.leftComboBoxItemList.indexOf(this.rightComboBoxSelectString),
      1
    );
    this.afterComboBoxItemList.splice(
      this.afterComboBoxItemList.indexOf(this.leftComboBoxSelectString),
      1
    );

    //왼쪽, 오른쪽의 데이터테이블에 보여질 사원 리스트를 초기 설정하기
    this.leftDataTableEmployeeList = this.getEmployeeListByAuthority(
      this.leftComboBoxSelectString
    );
    this.rightDataTableEmployeeList = this.getEmployeeListByAuthority(
      this.rightComboBoxSelectString
    );
  },
  methods: {
    //사원리스트 가져오기
    async getEmployeeList() {
      await this.$store.dispatch("getAllEmployees");
    },
    //초기시작시 권한별 사원리스트에 push 하기
    pushEmployeeToListByAuthority(authority) {
      let employeeListByAuthority = [];

      if (authority == "viewer") {
        employeeListByAuthority = this.viewerEmployeeList;
      } else if (authority == "admin") {
        employeeListByAuthority = this.adminEmployeeList;
      } else if (authority == "manager") {
        employeeListByAuthority = this.managerEmployeeList;
      }

      if (this.$store.state.getStore.allEmployee) {
        //DB로부터 로드해온 사원리스트를 권한별로 관리자/매니저/뷰어 사원리스트에 차례대로 담기
        for (
          let i = 0;
          i < this.$store.state.getStore.allEmployee.length;
          i++
        ) {
          let employeeObject = this.$store.state.getStore.allEmployee[i];
          if (employeeObject.authority == authority) {
            employeeListByAuthority.push(employeeObject);
          }
        }
      }
    },
    //원래의 사원객체를 얕은 복사로 객체를 생성하기, 원래의 사원객체에는 값변경의 영향을 미치기 않기 위하여
    getShallowCopyEmployeeObject(employeeObjectToCopy, authorityToChange) {
      let employeeObject = Object.assign({}, employeeObjectToCopy); //얕은 복사
      employeeObject.authority = authorityToChange;
      return employeeObject;
    },
    //">>이동"버튼을 누를시 오른쪽 데이터테이블로 사원 이동시키기
    //왼쪽 데이터테이블에서는 사라지게 하기
    moveEmployeeToRightDataTable() {
      this.rightDataTableEmployeeList = [];
      switch (this.rightComboBoxSelectString) {
        //오른쪽 데이터테이블의 상단의 콤보박스를 관리자로 선택하였다면
        case Authority.Admin:
          for (let i = 0; i < this.leftDataTableSelectedItemList.length; i++) {
            //오른쪽 데이터테이블의 사원리스트에 권한 필드를 알맞게 변경한 사원 객체를 제일 첫번째에 삽입하기
            this.adminEmployeeList.unshift(
              this.getShallowCopyEmployeeObject(
                this.leftDataTableSelectedItemList[i],
                "admin"
              )
            );

            //왼쪽 데이터테이블의 사원 리스트 리턴받기
            let leftAuthorityList = this.getEmployeeListByAuthority(
              this.leftComboBoxSelectString
            );

            //왼쪽 데이터테이블의 사원 리스트에서 해당 선택된 사원 삭제하기
            leftAuthorityList.splice(
              leftAuthorityList.indexOf(this.leftDataTableSelectedItemList[i]),
              1
            );
          }
          //오른쪽 데이터테이블의 사원리스트를 관리자 사원 리스트로 변경하기
          this.rightDataTableEmployeeList = this.adminEmployeeList;
          break;
        case Authority.Manager:
          for (let i = 0; i < this.leftDataTableSelectedItemList.length; i++) {
            this.managerEmployeeList.unshift(
              this.getShallowCopyEmployeeObject(
                this.leftDataTableSelectedItemList[i],
                "manager"
              )
            );

            let leftAuthorityList = this.getEmployeeListByAuthority(
              this.leftComboBoxSelectString
            );

            leftAuthorityList.splice(
              leftAuthorityList.indexOf(this.leftDataTableSelectedItemList[i]),
              1
            );
          }
          this.rightDataTableEmployeeList = this.managerEmployeeList;
          break;
        case Authority.Viewer:
          for (let i = 0; i < this.leftDataTableSelectedItemList.length; i++) {
            this.viewerEmployeeList.unshift(
              this.getShallowCopyEmployeeObject(
                this.leftDataTableSelectedItemList[i],
                "viewer"
              )
            );
            let leftAuthorityList = this.getEmployeeListByAuthority(
              this.leftComboBoxSelectString
            );

            leftAuthorityList.splice(
              leftAuthorityList.indexOf(this.leftDataTableSelectedItemList[i]),
              1
            );
          }
          this.rightDataTableEmployeeList = this.viewerEmployeeList;
          break;
      }
      this.leftDataTableSelectedItemList = []; //왼쪽 데이터테이블에 체크된 사원 비우기
    },
    //"<<이동"버튼을 누를시 왼쪽 데이터테이블로 사원 이동시키기
    //왼쪽 데이터테이블에서 사원을 제일 처음에 보여지게 하기 (push 대신 unshift)
    moveEmployeeToLeftDataTable() {
      this.leftDataTableEmployeeList = [];
      switch (this.leftComboBoxSelectString) {
        case Authority.Admin:
          for (let i = 0; i < this.rightDataTableSelectedItemList.length; i++) {
            this.adminEmployeeList.unshift(
              this.getShallowCopyEmployeeObject(
                this.rightDataTableSelectedItemList[i],
                "admin"
              )
            );

            let rightAuthorityList = this.getEmployeeListByAuthority(
              this.rightComboBoxSelectString
            );
            rightAuthorityList.splice(
              rightAuthorityList.indexOf(
                this.rightDataTableSelectedItemList[i]
              ),
              1
            );
          }
          this.leftDataTableEmployeeList = this.adminEmployeeList;
          break;
        case Authority.Manager:
          for (let i = 0; i < this.rightDataTableSelectedItemList.length; i++) {
            this.managerEmployeeList.unshift(
              this.getShallowCopyEmployeeObject(
                this.rightDataTableSelectedItemList[i],
                "manager"
              )
            );
            let rightAuthorityList = this.getEmployeeListByAuthority(
              this.rightComboBoxSelectString
            );
            rightAuthorityList.splice(
              rightAuthorityList.indexOf(
                this.rightDataTableSelectedItemList[i]
              ),
              1
            );
          }
          this.leftDataTableEmployeeList = this.managerEmployeeList;
          break;
        case Authority.Viewer:
          for (let i = 0; i < this.rightDataTableSelectedItemList.length; i++) {
            this.viewerEmployeeList.unshift(
              this.getShallowCopyEmployeeObject(
                this.rightDataTableSelectedItemList[i],
                "viewer"
              )
            );
            let rightAuthorityList = this.getEmployeeListByAuthority(
              this.rightComboBoxSelectString
            );
            rightAuthorityList.splice(
              rightAuthorityList.indexOf(
                this.rightDataTableSelectedItemList[i]
              ),
              1
            );
          }
          this.leftDataTableEmployeeList = this.viewerEmployeeList;
          break;
      }
      this.rightDataTableSelectedItemList = [];
    },
    //권한별로 사원 리스트 리턴하기
    getEmployeeListByAuthority(authority) {
      if (authority == Authority.Admin) {
        return this.adminEmployeeList;
      } else if (authority == Authority.Manager) {
        return this.managerEmployeeList;
      } else {
        return this.viewerEmployeeList;
      }
    },
    //왼쪽 데이터 테이블 위에 있는 콤보박스 클릭시
    changeAuthorityInLeftComboBox(selectedItem) {
      //콤보박스 아이템을 다시 기존으로 바꾸기
      this.afterComboBoxItemList = this.authorityList.slice();

      this.leftDataTableEmployeeList = [];
      switch (selectedItem) {
        case Authority.Admin:
          this.leftDataTableEmployeeList = this.adminEmployeeList;
          break;
        case Authority.Manager:
          this.leftDataTableEmployeeList = this.managerEmployeeList;
          break;
        case Authority.Viewer:
          this.leftDataTableEmployeeList = this.viewerEmployeeList;
      }

      //오른쪽 콤보박스 아이템들 중 현재 선택된 "권한"을 제외시키기
      this.afterComboBoxItemList.splice(
        this.afterComboBoxItemList.indexOf(selectedItem),
        1
      );
      //오른쪽 데이터 테이블의 사원 리스트를 콤보박스에 선택된 권한의 사원리스트로 표출하기
      this.rightDataTableEmployeeList = this.getEmployeeListByAuthority(
        this.rightComboBoxSelectString
      );
    },

    //오른쪽 데이터 테이블 위에 있는 콤보박스 클릭시
    changeAuthorityInRightComboBox(selectedItem) {
      this.leftComboBoxItemList = this.authorityList.slice();

      this.rightDataTableEmployeeList = [];
      switch (selectedItem) {
        case Authority.Admin:
          this.rightDataTableEmployeeList = this.adminEmployeeList;
          break;
        case Authority.Manager:
          this.rightDataTableEmployeeList = this.managerEmployeeList;
          break;
        case Authority.Viewer:
          this.rightDataTableEmployeeList = this.viewerEmployeeList;
      }

      this.leftComboBoxItemList.splice(
        this.leftComboBoxItemList.indexOf(selectedItem),
        1
      );
      this.leftDataTableEmployeeList = this.getEmployeeListByAuthority(
        this.leftComboBoxSelectString
      );
    },
    //초기화 버튼을 누를시
    resetAuthorizeEmployee() {
      let message = {
        title: this.$i18n.t("titleConfirmReset"),
        body: this.$i18n.t("confirmReset"),
      };
      let options = {
        html: true,
        okText: this.$i18n.t("btnConfirm"),
        cancelText: this.$i18n.t("btnCancel"),
      };
      this.$dialog
        .confirm(message, options)
        .then((dialog) => {
          //console.log("ok");
          t; //데이터테이블에서 체크된 것들 모두 초기화하기
          this.leftDataTableSelectedItemList = [];
          this.rightDataTableSelectedItemList = [];

          //모든 리스트 초기화하기
          this.rightDataTableEmployeeList = [];
          this.leftDataTableEmployeeList = [];
          this.viewerEmployeeList = [];
          this.adminEmployeeList = [];
          this.managerEmployeeList = [];

          //관리자/매니저/뷰어 사원리스트를 다시 넣어주기
          this.pushEmployeeToListByAuthority("viewer");
          this.pushEmployeeToListByAuthority("admin");
          this.pushEmployeeToListByAuthority("manager");

          //현재 선택되어있는 콤보박스의 권한에 따른 사원리스트를 데이터테이블에 각각 보여지게 하기
          this.rightDataTableEmployeeList = this.getEmployeeListByAuthority(
            this.rightComboBoxSelectString
          );
          this.leftDataTableEmployeeList = this.getEmployeeListByAuthority(
            this.leftComboBoxSelectString
          );
        })
        .catch(() => {
          //console.log("cancel");
          return;
        });
    },
    //API를 호출해서 권한을 변경시켜야할 사원들만 추출하기
    pushEmployeeListToChangeAuthorityList(authority) {
      let employeeListByAuthority = [];

      if (authority == "admin") {
        employeeListByAuthority = this.adminEmployeeList;
      } else if (authority == "manager") {
        employeeListByAuthority = this.managerEmployeeList;
      } else {
        employeeListByAuthority = this.viewerEmployeeList;
      }

      for (let i = 0; i < employeeListByAuthority.length; i++) {
        const idx = this.$store.state.getStore.allEmployee.findIndex(
          (employeeObject) => {
            return (
              employeeObject.employeeId ===
              employeeListByAuthority[i].employeeId
            );
          }
        );
        if (idx > -1) {
          if (
            this.$store.state.getStore.allEmployee[idx].authority !==
            employeeListByAuthority[i].authority
          ) {
            let employeeObject = this.getShallowCopyEmployeeObject(
              this.$store.state.getStore.allEmployee[idx],
              authority
            );
            employeeObject.employeeId = this.$store.state.getStore.allEmployee[
              idx
            ].employeeId;
            this.employeeListToChangeAuthority.push(employeeObject);
          }
        }
      }
    },
    //확인 버튼을 누를시
    //권한이 변경된 것만 API를 호출하도록 하기
    confirmAuthorizeEmployee() {
      let message = {
        title: this.$i18n.t("titleConfirmAuthorize"),
        body: this.$i18n.t("confirmAuthorize"),
      };
      let options = {
        html: true,
        okText: this.$i18n.t("btnConfirm"),
        cancelText: this.$i18n.t("btnCancel"),
      };
      this.$dialog
        .confirm(message, options)
        .then((dialog) => {
          //console.log("ok");
          this.pushEmployeeListToChangeAuthorityList("admin");
          this.pushEmployeeListToChangeAuthorityList("manager");
          this.pushEmployeeListToChangeAuthorityList("viewer");

          console.log(this.employeeListToChangeAuthority);
          this.changeAuthority(this.employeeListToChangeAuthority);
        })
        .catch(() => {
          //console.log("cancel");
        });
    },
    //권한을 변경하고자 axios 호출하기
    async changeAuthority(employeeListWithAuthority) {
      for (let i = 0; i < employeeListWithAuthority.length; i++) {
        let response = null;
        let errorStatus = null;
        let saveData = {};
        saveData.authority = employeeListWithAuthority[i].authority;
        saveData.employeeId = employeeListWithAuthority[i].employeeId;
        try {
          response = await axios
            .post(
              HOST + "/api/employee/changeAuthority",
              JSON.stringify(saveData),
              {
                headers: {
                  "Content-Type": `application/json`,
                  "X-AUTH-TOKEN": this.$store.state.userStore.token,
                },
              }
            )
            .catch((error) => {
              errorStatus = error.response.status;
              console.log("에러 상태: " + errorStatus);
            })
            .then((res) => {
              if (res) {
                if (res.status === 200) {
                  //권한 변경 성공
                  this.$notice.info({
                    title: this.$i18n.t("alertSuccessChangeEmployeeAuthority"),
                    styles: {
                      width: "400px",
                      marginLeft: "-815px",
                      top: "118px",
                      color: "red",
                      backgroundColor: "#2a88bd",
                    },
                    duration: 5,
                  });
                  return;
                }
              }
            });
          if (errorStatus === 401) {
            await refreshToken();
            console.log("!!!새로 발급 받은 토큰 입니다!!!");
            console.log(this.$store.state.userStore.token);
            response = await axios
              .post(
                HOST + "/api/employee/changeAuthority",
                JSON.stringify(saveData),
                {
                  headers: {
                    "Content-Type": `application/json`,
                    "X-AUTH-TOKEN": this.$store.state.userStore.token,
                  },
                }
              )
              .then((res) => {
                if (res) {
                  if (res.status === 200) {
                    //권한 변경 성공
                    this.$notice.info({
                      title: this.$i18n.t(
                        "alertSuccessChangeEmployeeAuthority"
                      ),
                      styles: {
                        width: "400px",
                        marginLeft: "-815px",
                        top: "118px",
                        color: "red",
                        backgroundColor: "#2a88bd",
                      },
                      duration: 5,
                    });
                    return;
                  }
                }
              });
          }
          console.log(response);
        } catch (error) {
          console.log(error);
        }
      }
    },
    logout() {
      let message = {
        title: this.$i18n.t("titleConfirmLogout"),
        body: this.$i18n.t("confirmLogout"),
      };
      let options = {
        html: true,
        okText: this.$i18n.t("btnConfirm"),
        cancelText: this.$i18n.t("btnCancel"),
      };
      this.$dialog
        .confirm(message, options)
        .then((dialog) => {
          console.log("ok");
          this.$store.commit("logout");
          this.$router.replace("/");
        })
        .catch(() => {
          console.log("cancel");
          return;
        });
    },
  },
};
</script>
