<template>
  <div id="assignSeatsScreen">
    <v-toolbar id="toolbar" color="#2c4f91" dark>
      <v-btn
        v-if="saveStatus != 'saving' && saveStatus != 'done'"
        :disabled="saveStatus != 'ableSave'"
        @click="clickSaveBtn"
        text
      >
        <v-icon size="30px">save</v-icon>
      </v-btn>
      <v-btn v-if="saveStatus === 'saving'" text>
        <v-icon size="30px">autorenew</v-icon>{{ this.$t("btnSaving") }}
      </v-btn>
      <v-btn v-if="saveStatus === 'done'" text>
        <v-icon size="30px">done</v-icon>{{ this.$t("btnSaveDone") }}
      </v-btn>
      <v-spacer></v-spacer>
      <h3>
        <span>{{ $store.state.buildingStore.building.buildingName }}</span>
      </h3>
      <v-spacer></v-spacer>
      <v-toolbar-items id="toolBarItems" class="hidden-sm-and-down">
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn text v-bind="attrs" v-on="on" @click="captureBtn">
              <v-icon size="30px">photo</v-icon>
            </v-btn>
          </template>
          <span>{{ this.$t("tooltipCaptureBtn") }}</span>
        </v-tooltip>

        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn text v-bind="attrs" v-on="on" @click="clickPrintBtn">
              <v-icon size="30px">print</v-icon>
            </v-btn></template
          >
          <span>{{ this.$t("tooltipPrintBtn") }}</span>
        </v-tooltip>

        <input
          v-show="false"
          ref="Upload"
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          @change="changeCSVFile"
        />
        <v-menu offset-y>
          <template v-slot:activator="{ on: onMenu }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on: onTooltip }">
                <v-btn text v-on="{ ...onMenu, ...onTooltip }"
                  ><v-icon size="30px">cloud_download</v-icon></v-btn
                >
              </template>
              <span v-html="csvTooltipText"></span>
            </v-tooltip>
          </template>
          <v-list>
            <v-list-item
              v-for="(item, index) in csvItems"
              :key="index"
              @click="clickCSVContextMenu(item.index)"
            >
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar-items>
    </v-toolbar>
    <div id="canvas-container">
      <canvas
        ref="canvas"
        class="canvas"
        id="canvas"
        style="text-align: center"
      ></canvas>
      <v-btn
        id="resetZoomButton"
        v-on:click="zoomStatus = false"
        @click="clickResetToRatioBtn"
        fab
        small
      >
        <v-icon medium>my_location</v-icon>
      </v-btn>
      <v-btn id="lockButton" @click="clickLockBtn" fab small>
        <v-icon v-if="lockStatus === false" medium>lock</v-icon>
        <v-icon v-if="lockStatus === true" medium>no_encryption</v-icon>
      </v-btn>
    </div>
    <v-menu
      v-model="contextMenuStatus"
      :position-x="contextMenuXLocation"
      :position-y="contextMenuYLocation"
      absolute
      offset-y
      max-width="180"
    >
      <v-list>
        <v-list-item
          v-for="(item, index) in contextMenuItems"
          :key="index"
          @click="clickContextMenu(item.index)"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-tooltip
      top
      v-model="toolTipStatus"
      :position-x="toolTipXLocation"
      :position-y="toolTipYLocation"
      :color="toolTipColor"
    >
      <span v-html="toolTipText"></span>
    </v-tooltip>
  </div>
</template>

<script>
import html2canvas from "html2canvas";
//import jsPDF from "jspdf";
import { eventBus } from "../main.js";
import axios from "axios";
import { refreshToken } from "@/refreshToken.js";

const HOST = "http://149.28.141.163:8080";
export default {
  name: "AssignSeats",
  data() {
    return {
      floorCanvas: null,

      //줌
      zoom: 1,
      zoomStatus: false,
      lockStatus: false,
      moveStatus: false,
      panning: null,

      viewSeatStatus: 0,

      //폰트 사이즈
      fontSize: 10,

      // 자리 투명도
      seatOpacity: 1,

      //클립보드
      clipboard: [],
      activeObjectList: [],

      //키보드 ctrl
      ctrlKey: false,

      //현재 층 객체
      currentSelectedFloorObject: null,

      //DB로부터 불러온 List OR Map
      allFloorList: this.$store.state.getStore.allFloor, // 층 객체 리스트
      allDepartmentObjectList: this.$store.state.getStore.allDepartment, // 부서 객체 리스트

      latestFloorImageFromDb: this.$store.state.getStore.latestFloorImage,
      otherFloorImageFromDb: this.$store.state.getStore.otherFloorsImageList,

      latestFloorSeatListFromDb: this.$store.state.getStore.latestFloorSeatList,
      otherFloorSeatListFromDb: this.$store.state.getStore.otherFloorsSeatMap,

      //가공되어 필요한 List OR Map
      allImageMap: null, //모든 이미지 저장과 로드할 수 있는 Map <FloorId, ImgPath>
      allDepartmentMap: null, //부서이름, 부서아이디, 부서색상값을 저장할 수 있는 Map <FloorId, DepartmentObject>
      allSeatMap: null, //자리 Map <FloorId, 자리리스트>
      eachEmployeeSeatMap: null, //각 사원의 자리 Map <EmployeeId, 자리리스트>

      //캔버스 이미지
      allCanvasImageMap: null,

      //컨택스트 메뉴
      contextMenuStatus: false,
      contextMenuXLocation: 100,
      contextMenuYLocation: 100,
      contextMenuItems: [
        { title: this.$i18n.t("contextMenuDelete"), index: 0 },
        { title: this.$i18n.t("contextMenuCopy"), index: 1 },
      ],

      //튤팁
      toolTipStatus: false,
      toolTipXLocation: 100,
      toolTipYLocation: 100,
      toolTipColor: null,
      toolTipText: null,
      viewSeatInfiTooltipText: this.$i18n.t("tooltipViewSeatInfo"),
      csvTooltipText: this.$i18n.t("tooltipCSVBtn"),

      //공석 생성하기
      addVacantSwitchStatus: false,
      numberOfAddSeat: null,
      seatNumber: 0,
      firstMouseDownX: 0,
      firstMouseDownY: 0,

      viewSeatInfoItems: [
        {
          title: this.$i18n.t("contextMenuViewSeatAboutEmployeeName"),
          index: 0,
        },
        { title: this.$i18n.t("contextMenuViewSeatAboutNumber"), index: 1 },
        { title: this.$i18n.t("contextMenuViewSeatAboutDepartment"), index: 2 },
        { title: this.$i18n.t("contextMenuViewSeatAboutName"), index: 3 },
      ],

      //CSV
      csvItems: [
        { title: this.$i18n.t("contextMenuDownloadCSV"), index: 0 },
        { title: this.$i18n.t("contextMenuUploadCSV"), index: 1 },
      ],

      //현재 상태를 저장하기 위한 상태
      saveStatus: null,
    };
  },
  created() {
    if (this.allImageMap == null) {
      this.allImageMap = new Map();
    }
    if (this.allSeatMap == null) {
      this.allSeatMap = new Map();
    }
    if (this.eachEmployeeSeatMap == null) {
      this.eachEmployeeSeatMap = new Map();
    }
    if (this.allDepartmentMap == null) {
      this.allDepartmentMap = new Map();
    }
    if (this.allCanvasImageMap == null) {
      this.allCanvasImageMap = new Map();
    }
    if (this.allFloorList && this.allFloorList.length) {
      this.currentSelectedFloorObject = this.allFloorList[
        this.allFloorList.length - 1
      ];
    }

    //선택한 층에 대한 값 받아와서 층 전환하기 위한 event
    eventBus.$on("pushSelectedFloorObject", (floorObject) => {
      if (floorObject) {
        this.currentSelectedFloorObject = floorObject;
        this.changeFloor();
      } else {
        //모든 층 삭제시
        this.currentSelectedFloorObject = null;

        this.floorCanvas.setBackgroundImage(
          null,
          this.floorCanvas.renderAll.bind(this.floorCanvas)
        );
        if (this.floorCanvas.getObjects()) {
          this.floorCanvas.getObjects().forEach((obj) => {
            this.floorCanvas.remove(obj);
          });
        }
      }
    });

    eventBus.$on("sendSeatSize", (seatWidth, seatHeight) => {
      this.changeSeatSize(seatWidth, seatHeight);
    });

    eventBus.$on("sendDragSeatSize", (seatDragWidth, seatDragHeight) => {
      this.changeDragSeatSize(seatDragWidth, seatDragHeight);
    });

    //층의 이름이 변경될시 화면에 표출되는 string값을 바꾸기 위한 event
    eventBus.$on("pushChangedCurrentFloorName", (changedFloorName) => {
      this.currentSelectedFloorObject.floorName = changedFloorName;
    });

    //공석 만들기 스위치 상태값 변경하기 위한 event
    eventBus.$on("pushAddVacantSwitchStatus", (switchStatus) => {
      this.addVacantSwitchStatus = switchStatus;
    });

    //만들고자 하는 공석의 개수를 받기 위한 event
    eventBus.$on("pushSelectedNumberOfAddSeat", (numberOfAddSeat) => {
      console.log(numberOfAddSeat);
      this.numberOfAddSeat = numberOfAddSeat;
    });

    //현재 층의 모든 자리를 삭제하기 위한 상태값(유)을 받기 위한 event
    eventBus.$on("pushDeleteAllSeatStatus", (deleteAllSeatStatus) => {
      if (deleteAllSeatStatus) {
        this.clickdeleteAllBtn();
      }
    });

    //공석에 사원을 매핑하고자 함수를 호출하기 위한 event
    eventBus.$on("mappingEmployeeToVacant", (employeeObject) => {
      this.mappingEmployeeToVacant(employeeObject);
    });

    //자리를 다른층으로 이동하고자 함수를 호출하기 위한 event
    eventBus.$on("moveSeatToAnotherFloor", (floorId) => {
      let moveFloorName = null;
      this.allFloorList.forEach((floor) => {
        if (floor.floorId === floorId) {
          moveFloorName = floor.floorName;
        }
      });

      // 선택된 자리가 없다면 경고창
      if (!this.floorCanvas.getActiveObject()) {
        this.$notice.info({
          title: this.$i18n.t("alertMoveSeatToAnotherFloor"),
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
      } // 선택된 층에 이미지가 없다면 경고창
      else if (this.allImageMap.get(floorId).imgPath === "") {
        this.$notice.info({
          title: this.$i18n.t("alertNoBackgroundImageOfTryToChangeFloor"),
          styles: {
            width: "400px",
            marginLeft: "-815px",
            top: "118px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      } else if (moveFloorName === "") {
        this.$notice.info({
          title: this.$i18n.t("alertNoFloorNameOfTryToChangeFloor"),
          styles: {
            width: "400px",
            marginLeft: "-815px",
            top: "118px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      } else if (
        this.floorCanvas.getActiveObject() &&
        this.allImageMap.get(floorId)
      ) {
        let message = {
          title: this.$i18n.t("titleConfirmMoveSeatToAnotherFloor"),
          body: this.$i18n.t("confirmMoveSeatToAnotherFloor", {
            floorName: moveFloorName,
          }),
        };
        let options = {
          html: true,
          okText: this.$i18n.t("btnConfirm"),
          cancelText: this.$i18n.t("btnCancel"),
        };
        this.$dialog
          .confirm(message, options)
          .then((dialog) => {
            this.moveSeatToAnotherFloor(floorId, moveFloorName);
          })
          .catch(() => {
            //console.log("cancel");
          });
      }
    });

    //다른 건물 층으로 자리 이동
    eventBus.$on(
      "moveSeatToAnotherBuilding",
      (moveBuildingId, moveBuildingName, moveFloorId, moveFloorName) => {
        if (this.floorCanvas.getActiveObject()) {
          let message = {
            title: this.$i18n.t("titleConfirmSaveBeforeChangeBuilding"),
            body: this.$i18n.t("confirmSaveBeforeChangeBuilding", {
              buildingName: moveBuildingName,
              floorName: moveFloorName,
            }),
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
              this.moveSeatToAnotherBuilding(
                moveBuildingId,
                moveBuildingName,
                moveFloorId,
                moveFloorName
              );
            })
            .catch(() => {
              //console.log("cancel");
            });
        } else {
          this.$notice.info({
            title: this.$i18n.t("alertMoveSeatToAnotherFloor"),
            styles: {
              width: "400px",
              marginLeft: "-815px",
              top: "118px",
              backgroundColor: "#2a88bd",
            },
            duration: 5,
          });
          return;
        }
      }
    );

    //자리의 사원을 지우고 공석으로 바꾸는 함수를 호출하기 위한 event
    eventBus.$on("changeSeatToVacant", () => {
      if (this.floorCanvas.getActiveObject()) {
        this.changeSeatToVacant();
      } else {
        this.$notice.info({
          title: this.$i18n.t("alertNoSelectedSeat"),
          styles: {
            width: "400px",
            marginLeft: "-815px",
            top: "118px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      }
    });

    //모든 층 객체를 가지고 있는 리스트를 받기 위한 event
    eventBus.$on("pushAllFloorList", (allFloorList) => {
      console.log(allFloorList);
      this.allFloorList = allFloorList;
    });

    //모든 층 이미지를 가지고 있는 Map을 받기 위한 event
    eventBus.$on("pushAllImageMap", (allImageMap) => {
      this.allImageMap = allImageMap;
      this.loadImageFile(
        this.allImageMap.get(this.currentSelectedFloorObject.floorId).imgPath
      );
    });

    //자리 상세정보 라디오에서 선택한 값을 받기 위한 event
    eventBus.$on("pushViewSeatInfo", (viewSeatStatus) => {
      this.viewSeatStatus = viewSeatStatus;
      this.viewSeatInfo();
    });

    //자리 불투명도 값을 받기 위한 event
    eventBus.$on("pushSeatOpacity", (seatOpacity) => {
      this.seatOpacity = seatOpacity;
      this.changeSeatOpacity();
    });

    //자리 하이라이트 하는 함수를 호출하기 위한 event
    eventBus.$on("showSeatHighlight", (seatObject) => {
      this.showSeatHighlight(seatObject);
    });

    //자리 하이라이트 하는 함수를 호출하기 위한 event
    eventBus.$on("showDepartmentSeatHighlight", (departmentObjectId) => {
      this.showDepartmentSeatHighlight(departmentObjectId);
    });

    //자리 채우기색(부서색)을 변경하는 함수를 호출하기 위한 event
    eventBus.$on("changeDepartmentColor", (departmentObjectId) => {
      this.changeDepartmentColor(departmentObjectId);
    });

    //삭제된 층의 리스트를 받기 위한 event
    eventBus.$on("pushDeletedFloorList", (floorList) => {
      //층만큼
      floorList.forEach((floor) => {
        let deleteFloorSeat = this.allSeatMap.get(floor.floorId);
        //삭제된 자리만큼
        if (deleteFloorSeat) {
          deleteFloorSeat.forEach((seat) => {
            let groupToObject = seat.toObject([
              "seatId",
              "employeeId",
              "employeeDepartment",
              "employeeDepartmentId",
            ]);

            this.deleteEachEmployeeSeatList(groupToObject);
          });
          this.allSeatMap.delete(floor.floorId);
        }
      });

      eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);
      eventBus.$emit("pushAllSeatMap", this.allSeatMap);
    });

    //층과 이미지 수정시 저장 상태를 받기 위한 event
    eventBus.$on("sendStoreStatus", (saveStatus) => {
      this.saveStatus = saveStatus;
    });
  },
  mounted() {
    this.initializing();
    this.loadLatestFloor(); //최신 층 이미지와 자리 로드
  },
  beforeDestroy() {
    eventBus.$off("moveSeatToAnotherFloor");
    eventBus.$off("pushSelectedFloorObject");
    eventBus.$off("pushChangedCurrentFloorName");
    eventBus.$off("pushChangedFloorNameFloorIdList");
    eventBus.$off("pushAddVacantSwitchStatus");
    eventBus.$off("mappingEmployeeToVacant");
    eventBus.$off("pushAllFloorList");
    eventBus.$off("changeSeatToVacant");
    eventBus.$off("pushAllImageMap");
    eventBus.$off("showSeatHighlight");
    eventBus.$off("showDepartmentSeatHighlight");
    eventBus.$off("pushDeletedFloorList");
    eventBus.$off("sendStoreStatus");
    eventBus.$off("pushSelectedNumberOfAddSeat");
    eventBus.$off("moveSeatToAnotherBuilding");

    document.removeEventListener("keydown", this.watchCtrlKeyDown);
    document.removeEventListener("keydown", this.manageKeyboard);
    document.removeEventListener("keyup", this.watchCtrlKeyUp);
  },
  methods: {
    initializing() {
      //canvas, map 생성
      if (this.floorCanvas == null) {
        const ref = this.$refs.canvas;
        this.floorCanvas = new fabric.Canvas(ref, {
          fireRightClick: true, //enable firing of right click events
          fireMiddleClick: true, //enable firing of middle click events
          stopContextMenu: true, //prevent context menu from showing
          imageSmoothingEnabled: false,
          enableRetinaScaling: false,
        });

        let toolBarItemsHeight = document
          .getElementById("toolbar")
          .getBoundingClientRect().height;

        let originalAssignSeatsScreenWidth = document
          .getElementById("toolbar")
          .getBoundingClientRect().width;
        let originalAssignSeatsScreenHeight =
          window.innerHeight - toolBarItemsHeight - 30;

        this.floorCanvas.setHeight(originalAssignSeatsScreenHeight);
        this.floorCanvas.setWidth(originalAssignSeatsScreenWidth - 450);
        console.log(originalAssignSeatsScreenHeight);
        console.log(originalAssignSeatsScreenWidth - 450);

        this.setMouseWheel(); //마우스 휠과 Ctrl 키로 zoom in/out
        this.setLeftDragEventForFloorCanvas(); //왼쪽 마우스 드래그 이벤트 함수
        this.setDragDropEventForAddVacantSeat();
        this.setWhenObjectModified();
        this.addKeyEventListener();
        this.ctrlKeyPressedForMultiSelection(); //ctrl키 누르고 도형 선택시 복수선택 가능
        this.whenResizingWindow(); //브라우저 창의 크기를 조절할때 (캔버스 확장/축소됨)

        this.floorCanvas.on("object:moving", function (e) {
          //자리 움직이면 자동으로 도면 움직임이 잠김
          this.lockStatus = false;
          this.moveStatus = true;
        });

        this.floorCanvas.on("object:scaling", function (e) {
          //자리 크기가 변화되면 자동으로 도면 움직임이 잠김
          this.lockStatus = false;
          this.moveStatus = true;

          let obj = e.target;
          let textObject = obj.item(1);
          let scaleX = obj.width / (obj.width * obj.scaleX);
          let scaleY = obj.height / (obj.height * obj.scaleX);

          textObject.set("lockScalingX", true);
          textObject.set("lockScalingY", true);
          textObject.set("scaleX", scaleX);
          textObject.set("scaleY", scaleY);

          obj.setCoords();
        });
      }
    },
    whenResizingWindow() {
      let originalAssignSeatsScreenWidth = document
        .getElementById("assignSeatsScreen")
        .getBoundingClientRect().width;

      let originalAssignSeatsScreenTop = document
        .getElementById("assignSeatsScreen")
        .getBoundingClientRect().top;
      let toolBarItemsHeight = document
        .getElementById("toolBarItems")
        .getBoundingClientRect().height;

      let originalAssignSeatsScreenHeight =
        window.innerHeight -
        toolBarItemsHeight -
        toolBarItemsHeight -
        originalAssignSeatsScreenTop;

      console.log(originalAssignSeatsScreenWidth);
      console.log(originalAssignSeatsScreenHeight);

      window.onresize = (event) => {
        console.log(event);
        console.log(window.innerWidth);
        console.log(window.innerHeight);

        let assignSeatsScreenWidth = document
          .getElementById("assignSeatsScreen")
          .getBoundingClientRect().width;
        let assignSeatsScreenTop = document
          .getElementById("assignSeatsScreen")
          .getBoundingClientRect().top;
        let toolBarItemsHeight = document
          .getElementById("toolbar")
          .getBoundingClientRect().height;

        this.floorCanvas.setHeight(
          window.innerHeight - toolBarItemsHeight - 30
        );
        this.floorCanvas.setWidth(assignSeatsScreenWidth);

        // let zoom;

        // if (1664.444580078125 < assignSeatsScreenWidth) {
        //   zoom =
        //     (window.innerHeight - toolBarItemsHeight - 30) /
        //     947.0069427490234;

        //   if (zoom * 1664.444580078125 > assignSeatsScreenWidth) {
        //     zoom = assignSeatsScreenWidth / 1664.444580078125;
        //   }
        // } else {
        //   zoom = assignSeatsScreenWidth / 1664.444580078125;

        //   if (
        //     zoom * 947.0069427490234 >
        //     window.innerHeight - toolBarItemsHeight - 30
        //   ) {
        //     zoom =
        //       (window.innerHeight - toolBarItemsHeight - 30) /
        //       947.0069427490234;
        //   }
        // }
        // this.floorCanvas.setZoom(zoom);

        this.floorCanvas.requestRenderAll();
        //this.floorCanvas.calcOffset();
      };
    },
    setMouseWheel() {
      this.floorCanvas.on("mouse:wheel", (opt) => {
        if (!this.floorCanvas.viewportTransform) {
          return;
        }
        let evt = opt.e;
        let deltaY = evt.deltaY;
        this.zoom = this.floorCanvas.getZoom();
        if (evt.ctrlKey === true) {
          this.zoom = this.zoom - deltaY / 1000;
          //if (this.zoom > 10) this.zoom = 10;
          //else if (this.zoom < 1) this.zoom = 1;
          //zoom in and out
          this.floorCanvas.zoomToPoint(
            new fabric.Point(evt.offsetX, evt.offsetY),
            this.zoom
          );
          this.zoomStatus = true;
        } else {
          //reset canvas ratio
          this.floorCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
          this.zoomStatus = false;
          this.lockStatus = false;
          this.zoom = 1;
          this.floorCanvas.selection = true;
        }
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });
    },
    setLeftDragEventForFloorCanvas() {
      let dragStatus = false;

      this.floorCanvas.on("mouse:down", (event) => {
        if (event.button === 1) {
          dragStatus = true;
        }
        dragStatus = false;
      });

      this.floorCanvas.on("mouse:move", (event) => {
        if (event.button === 1) {
          dragStatus = true;
        }
      });

      this.floorCanvas.on("mouse:up", (event) => {
        let multiSelectionObjectWidthList = [];
        let multiSelectionObjectHeightList = [];
        if (dragStatus) {
          if (event.button === 1) {
            if (this.floorCanvas.getActiveObjects().length > 0) {
              this.floorCanvas.getActiveObjects().forEach((obj) => {
                console.log(obj);
                multiSelectionObjectWidthList.push(obj.get("width") + 1);
                multiSelectionObjectHeightList.push(obj.get("height") + 1);
              });
              console.log(multiSelectionObjectWidthList);

              eventBus.$emit(
                "sendDragMultipleSeatList",
                multiSelectionObjectWidthList,
                multiSelectionObjectHeightList
              );
              eventBus.$emit(
                "pushManageSeatTabOfSelectedSeatsComponentStatus",
                true
              );
            }
          }
        }
      });
    },
    setDragDropEventForAddVacantSeat() {
      let rectangle;
      let canDraw = false;

      //원하는 위치에 자동으로 공석 생성하기
      this.floorCanvas.on("mouse:down", (event) => {
        this.panning = true;
        if (this.lockStatus === true) {
          this.floorCanvas.selection = false;
        } else {
          this.floorCanvas.selection = true;
        }
        if (event.button === 3) {
          //right click
          if (this.addVacantSwitchStatus) {
            canDraw = true;

            let pointer = this.floorCanvas.getPointer(event.e);
            this.firstMouseDownX = pointer.x;
            this.firstMouseDownY = pointer.y;

            rectangle = new fabric.Rect({
              left: this.firstMouseDownX,
              top: this.firstMouseDownY,
              fill: "",
              stroke: this.getColor(null),
              strokeWidth: 1,
            });
          } else if (this.floorCanvas.getActiveObject()) {
            //contextMenu
            let posX = event.e.clientX;
            let posY = event.e.clientY;
            this.showContextMenuOfOneSeat(posX, posY);
          }
        }
      });

      this.floorCanvas.on("mouse:move", (event) => {
        if (this.addVacantSwitchStatus) {
          if (canDraw) {
            //자리를 생성하면 도면이 잠김
            if (this.lockStatus === true) {
              this.$notice.info({
                title: this.$i18n.t("alertCanvasLockStatus"),
                styles: {
                  width: "400px",
                  marginLeft: "-815px",
                  top: "118px",
                  backgroundColor: "#2a88bd",
                },
                duration: 5,
              });
              this.lockStatus = false;
              this.floorCanvas.selection = true;
            }

            let pointer = this.floorCanvas.getPointer(event.e);
            if (this.firstMouseDownX > pointer.x) {
              rectangle.set("left", Math.abs(pointer.x));
            }
            if (this.firstMouseDownY > pointer.y) {
              rectangle.set("top", Math.abs(pointer.y));
            }

            rectangle.set("width", Math.abs(this.firstMouseDownX - pointer.x));
            rectangle.set("height", Math.abs(this.firstMouseDownY - pointer.y));
            this.floorCanvas.add(rectangle);
            this.floorCanvas.renderAll();
          }
        }
        if (this.lockStatus === true) {
          if (this.panning && event && event.e) {
            let delta = new fabric.Point(
              event.e.movementX / 5,
              event.e.movementY / 5
            );
            //마우스 움직일 때 캔버스 움직이기
            this.floorCanvas.relativePan(delta);
            this.zoomStatus = true;
          }
        }
      });

      this.floorCanvas.on("mouse:up", (event) => {
        this.panning = false;
        if (this.lockStatus === true) {
          this.floorCanvas.selection = false;
        } else {
          this.floorCanvas.selection = true;
        }
        if (event.button === 3) {
          //right click
          if (this.addVacantSwitchStatus) {
            canDraw = false;

            let pointer = this.floorCanvas.getPointer(event.e);
            let mouseUpX = pointer.x;
            let mouseUpY = pointer.y;

            if (
              !this.allImageMap.get(this.currentSelectedFloorObject.floorId)
            ) {
              this.$notice.info({
                title: this.$i18n.t("alertNoBackgroundImage"),
                styles: {
                  width: "400px",
                  marginLeft: "-815px",
                  top: "118px",
                  backgroundColor: "#2a88bd",
                },
                duration: 5,
              });
              this.floorCanvas.getObjects().forEach((obj) => {
                if (rectangle === obj) {
                  this.floorCanvas.remove(obj);
                }
              });
              return;
            } else if (this.currentSelectedFloorObject.floorName == "") {
              this.$notice.info({
                title: this.$i18n.t("alertNoFloorName"),
                styles: {
                  width: "400px",
                  marginLeft: "-815px",
                  top: "118px",
                  backgroundColor: "#2a88bd",
                },
                duration: 5,
              });
              this.floorCanvas.getObjects().forEach((obj) => {
                if (rectangle === obj) {
                  this.floorCanvas.remove(obj);
                }
              });
              return;
            }

            if (
              this.firstMouseDownX === mouseUpX && //Number
              this.firstMouseDownY === mouseUpY //Number
            ) {
              return;
            } else {
              this.floorCanvas.getObjects().forEach((obj) => {
                if (rectangle === obj) {
                  this.floorCanvas.remove(obj);
                }
              });

              this.addVacantSeat(
                this.firstMouseDownX,
                this.firstMouseDownY,
                mouseUpX,
                mouseUpY
              );
            }
          }
        }
      });
    },
    ctrlKeyPressedForMultiSelection() {
      let multiSelectionObjectList = [];
      let activeSelection = null;

      //selection:created(초기 도형이 select된 시점)의 도형 객체를 multiSelectionObjectList 리스트에 push하기
      this.floorCanvas.on("selection:created", (event) => {
        console.log("selection:created");
        if (this.ctrlKey) {
          event.selected.forEach((selectedObject) => {
            if (!multiSelectionObjectList.includes(selectedObject)) {
              multiSelectionObjectList.push(selectedObject);
            }
          });
        }
      });

      //selection:updated(selection이 바뀌어진 시점)의 도형 객체를 multiSelectionObjectList 리스트에 push하기
      this.floorCanvas.on("selection:updated", (event) => {
        console.log("selection:updated");
        if (this.ctrlKey) {
          event.selected.forEach((selectedObject) => {
            if (!multiSelectionObjectList.includes(selectedObject)) {
              multiSelectionObjectList.push(selectedObject);
            }
          });

          console.log(multiSelectionObjectList.length);
          if (multiSelectionObjectList.length > 0) {
            //selected:cleared(selection된 도형 객체 모두 selection RESET) 이벤트 자동 호출
            this.floorCanvas.discardActiveObject();
          }
        }
      });

      //this.floorCanvas.discardActiveObject()가 호출되면 자동으로 selection:cleared(select된 도형이 없는 시점) 이벤트 함수가 호출됨
      //관리하고있는 multiSelectionObjectList리스트를 multiSelection으로 화면에 표출하기
      this.floorCanvas.on("selection:cleared", (event) => {
        console.log("selection:cleared");
        if (this.ctrlKey) {
          if (multiSelectionObjectList.length > 0) {
            activeSelection = new fabric.ActiveSelection(
              multiSelectionObjectList,
              {
                canvas: this.floorCanvas,
              }
            );
            this.floorCanvas.setActiveObject(activeSelection);
            this.floorCanvas.requestRenderAll();
          }
        }
      });

      //select된 도형이 없을시 관리하고있던 배열과 ActiveSelection객체 초기화하고, selection 초기화하기
      this.floorCanvas.on("mouse:down", (event) => {
        if (event.button === 1) {
          if (event.target) {
          } else {
            multiSelectionObjectList = [];
            activeSelection = null;

            this.floorCanvas.discardActiveObject();
            eventBus.$emit(
              "pushManageSeatTabOfSelectedSeatsComponentStatus",
              false
            );
            eventBus.$emit("pushMappingEmployeeComponentStatus", false);
          }
        }
      });
    },
    addKeyEventListener() {
      //ctrl키가 down/up될때 ctrlKey 변수 알맞게 변환하기
      document.addEventListener("keydown", this.watchCtrlKeyDown);
      document.addEventListener("keydown", this.manageKeyboard);
      document.addEventListener("keyup", this.watchCtrlKeyUp);
    },
    watchCtrlKeyDown(event) {
      let key = window.event ? window.event.keyCode : event.keyCode;
      switch (key) {
        case 17:
          this.ctrlKey = true;
          break;
      }
    },
    watchCtrlKeyUp(event) {
      let key = window.event ? window.event.keyCode : event.keyCode;
      switch (key) {
        case 17:
          this.ctrlKey = false;
          break;
      }
    },
    manageKeyboard(event) {
      let key = window.event ? window.event.keyCode : event.keyCode;
      switch (key) {
        case 37: // left
          if (this.floorCanvas.getActiveObject()) {
            let obj = this.floorCanvas.getActiveObject();
            this.blockIntoCanvasArea(obj);
            this.saveStatus = "ableSave";
            eventBus.$emit("sendStoreStatus", this.saveStatus);
            this.floorCanvas
              .getActiveObject()
              .set("left", this.floorCanvas.getActiveObject().left - 5);
            this.floorCanvas
              .getActiveObject()
              .set("httpRequestPostStatus", true);
            this.floorCanvas.renderAll();
          }
          break;
        case 39: // right
          if (this.floorCanvas.getActiveObject()) {
            let obj = this.floorCanvas.getActiveObject();
            this.blockIntoCanvasArea(obj);
            this.saveStatus = "ableSave";
            eventBus.$emit("sendStoreStatus", this.saveStatus);
            this.floorCanvas
              .getActiveObject()
              .set("left", this.floorCanvas.getActiveObject().left + 5);
            this.floorCanvas
              .getActiveObject()
              .set("httpRequestPostStatus", true);
            this.floorCanvas.renderAll();
          }
          break;
        case 38: // up
          if (this.floorCanvas.getActiveObject()) {
            let obj = this.floorCanvas.getActiveObject();
            this.blockIntoCanvasArea(obj);
            this.saveStatus = "ableSave";
            eventBus.$emit("sendStoreStatus", this.saveStatus);
            this.floorCanvas
              .getActiveObject()
              .set("top", this.floorCanvas.getActiveObject().top - 5);
            this.floorCanvas
              .getActiveObject()
              .set("httpRequestPostStatus", true);
            this.floorCanvas.renderAll();
          }
          break;
        case 40: // down
          if (this.floorCanvas.getActiveObject()) {
            let obj = this.floorCanvas.getActiveObject();
            this.blockIntoCanvasArea(obj);
            this.saveStatus = "ableSave";
            eventBus.$emit("sendStoreStatus", this.saveStatus);
            this.floorCanvas
              .getActiveObject()
              .set("top", this.floorCanvas.getActiveObject().top + 5);
            this.floorCanvas
              .getActiveObject()
              .set("httpRequestPostStatus", true);
            this.floorCanvas.renderAll();
          }
          break;
        case 110:
        case 46: // delete
          this.deleteBtn();
          break;
      }
      if (this.ctrlKey) {
        switch (key) {
          case 67:
            this.copySelectedSeat();
            break;
          case 86:
            this.pasteSelectedSeat();
            break;
          case 65:
            //browser의 콘텐츠 전체선택 block
            event.preventDefault();
            event.stopPropagation();
            this.selectAllSeat();
            break;
        }
      }
    },
    setWhenObjectModified() {
      this.floorCanvas.on("object:modified", (e) => {
        //자리가 변경되면 도면이 잠금
        this.lockStatus = false;
        this.floorCanvas.selection = true;

        if (this.floorCanvas.getActiveObjects().length === 1) {
          e.target.set("httpRequestPostStatus", true);
        } else if (this.floorCanvas.getActiveObjects().length > 1) {
          let modifiedObjectList = e.target._objects;
          modifiedObjectList.forEach((modifiedObject) => {
            modifiedObject.set("httpRequestPostStatus", true);
          });
        }

        this.saveStatus = "ableSave";
        eventBus.$emit("sendStoreStatus", this.saveStatus);
      });
    },
    clickResetToRatioBtn() {
      this.floorCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      this.lockStatus = false;
      this.floorCanvas.selection = true;

      if (
        this.allImageMap.get(this.currentSelectedFloorObject.floorId) != null
      ) {
        let typeCheck = this.allImageMap.get(
          this.currentSelectedFloorObject.floorId
        ).imgPath;

        if (typeof typeCheck === "string") {
          this.loadImageDBFile(
            this.allImageMap.get(this.currentSelectedFloorObject.floorId)
              .imgPath,
            this.allImageMap.get(this.currentSelectedFloorObject.floorId)
              .imgType
          );
        } else {
          this.loadImageFile(
            this.allImageMap.get(this.currentSelectedFloorObject.floorId)
              .imgPath
          );
        }
      }
    },
    clickLockBtn() {
      if (!this.lockStatus) {
        this.lockStatus = true;
      } else {
        this.lockStatus = false;
      }
    },
    changeFloor() {
      this.floorCanvas
        .getObjects()
        .slice()
        .forEach((obj) => {
          this.floorCanvas.remove(obj);
        });
      this.floorCanvas.discardActiveObject();
      this.floorCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      this.lockStatus = false;
      this.floorCanvas.selection = true;
      this.changeSeatOpacity();
      this.viewSeatInfo();

      let eachfloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );

      this.seatNumber = 0;

      if (
        this.allImageMap.get(this.currentSelectedFloorObject.floorId) != null
      ) {
        let typeCheck = this.allImageMap.get(
          this.currentSelectedFloorObject.floorId
        ).imgPath;

        if (typeof typeCheck === "string") {
          this.loadImageDBFile(
            this.allImageMap.get(this.currentSelectedFloorObject.floorId)
              .imgPath,
            this.allImageMap.get(this.currentSelectedFloorObject.floorId)
              .imgType
          );
        } else {
          this.loadImageFile(
            this.allImageMap.get(this.currentSelectedFloorObject.floorId)
              .imgPath
          );
        }
        //현재 층에 그린 도형들이 있다면
        if (eachfloorSeatList) {
          for (let i = 0; i < eachfloorSeatList.length; i++) {
            this.floorCanvas.add(eachfloorSeatList[i]);
          }
          eventBus.$emit("pushAllSeatMap", this.allSeatMap);
        }

        //캔버스 이미지 Map 저장하기
        let dataUrl = document.getElementById("canvas").toDataURL();
        dataUrl = dataUrl.replace("data:image/png;base64,", "");
        //console.log(dataUrl);
        this.allCanvasImageMap.set(
          this.currentSelectedFloorObject.floorId,
          dataUrl
        );
      } else if (
        this.allImageMap.get(this.currentSelectedFloorObject.floorId) == null
      ) {
        //현재 층의 이미지가 저장되어있지 않다면 화면에 그려져있던 이미지와 도형 초기화
        this.floorCanvas
          .getObjects()
          .slice()
          .forEach((obj) => {
            this.floorCanvas.remove(obj);
          });

        this.floorCanvas.backgroundImage = 0;
        this.floorCanvas.backgroundColor = "white";
        this.floorCanvas.renderAll();

        eventBus.$emit("pushAllSeatMap", this.allSeatMap);
      }
    },
    loadImageFile(file) {
      let reader = new FileReader();
      reader.onload = (e) => {
        fabric.Image.fromURL(
          e.target.result,
          (img) => {
            img.set({
              scaleX: this.floorCanvas.width / img.width,
              scaleY: this.floorCanvas.height / img.height,
            });
            this.floorCanvas.setBackgroundImage(
              img,
              this.floorCanvas.renderAll.bind(this.floorCanvas)
            );
          },
          { crossOrigin: "Anonymous" }
        );
      };
      reader.readAsDataURL(file);
    },
    loadImageDBFile(dbFile, dbType) {
      let imgPath = "data:" + dbType + ";base64," + dbFile;
      fabric.Image.fromURL(
        imgPath,
        (img) => {
          img.set({
            scaleX: this.floorCanvas.width / img.width,
            scaleY: this.floorCanvas.height / img.height,
          });
          this.floorCanvas.setBackgroundImage(
            img,
            this.floorCanvas.renderAll.bind(this.floorCanvas)
          );
        },
        { crossOrigin: "Anonymous" }
      );
    },
    //투명도 조절
    changeSeatOpacity() {
      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );
      for (let i = 0; i < eachFloorSeatList.length; i++) {
        eachFloorSeatList[i].item(0).set("opacity", this.seatOpacity);
        eachFloorSeatList[i].item(1).set("opacity", this.seatOpacity);
        this.floorCanvas.renderAll();
      }
      this.floorCanvas.renderAll();
    },
    //각 층의 도형 리스트 반환하기
    getEachFloorSeatList: function (floor) {
      if (!floor) {
        // 초반에 층이 생성 안되었을때
        return;
      }
      //층에 해당하는 도형리스트가 만들어지지 않았을때 각 층의 도형 리스트 생성하기
      if (!this.allSeatMap.get(floor)) {
        let newSeatsList = [];
        this.allSeatMap.set(floor, newSeatsList);
        //console.log(this.allSeatMap.size + "allSeatMap 처음의 자리 맵 사이즈입니다");
        return this.allSeatMap.get(floor);
      } else {
        //console.log(this.allSeatMap.size + "allSeatMap 현재 자리 맵 사이즈입니다" );
        return this.allSeatMap.get(floor);
      }
    },
    getEachEmployeeSeatList: function (employeeId) {
      if (!this.eachEmployeeSeatMap.get(employeeId)) {
        let newEmployeeSeatList = [];
        this.eachEmployeeSeatMap.set(employeeId, newEmployeeSeatList);
        return this.eachEmployeeSeatMap.get(employeeId);
      } else {
        return this.eachEmployeeSeatMap.get(employeeId);
      }
    },
    getEachDepartmentObjectList: function (floorId) {
      if (!this.allDepartmentMap.get(floorId)) {
        let newDepartmentObjectList = [];
        this.allDepartmentMap.set(floorId, newDepartmentObjectList);
        return this.allDepartmentMap.get(floorId);
      } else {
        return this.allDepartmentMap.get(floorId);
      }
    },
    // 해당 층의 도형 리스트의 Delete field 전체 true 만들기
    deleteEachFloorSeatList: function (floor) {
      let eachFloorSeatList = this.getEachFloorSeatList(floor);
      for (let i = 0; i < eachFloorSeatList.length; i++) {
        if (eachFloorSeatList[i].isObjFromDB) {
          let deleteSeat = {};
          deleteSeat.floorId = eachFloorSeatList[i].floorId;
          deleteSeat.seatId = eachFloorSeatList[i].seatId;
          deleteSeat.buildingId = eachFloorSeatList[i].buildingId;
          this.$store.commit("PUSH_DeleteSeat", deleteSeat);
        }
      }
    },
    //사원의 자리리스트에서 삭제된 자리를 삭제하기
    deleteEachEmployeeSeatList: function (groupToObject) {
      //매핑된 자리일때
      if (groupToObject.employeeId != null) {
        let oneEmployeeSeatList = this.getEachEmployeeSeatList(
          groupToObject.employeeId
        );
        if (oneEmployeeSeatList) {
          for (let i = 0; i < oneEmployeeSeatList.length; i++) {
            if (oneEmployeeSeatList[i].seatId === groupToObject.seatId) {
              //String
              oneEmployeeSeatList.splice(i, 1);
            }
          }
        }
        //그 사원의 자리가 없어지면 사원자리 맵에서 삭제하기 위함.
        let eachEmployeeSeat = this.eachEmployeeSeatMap.get(
          groupToObject.employeeId
        );
        if (eachEmployeeSeat.length === 0) {
          this.eachEmployeeSeatMap.delete(groupToObject.employeeId);
        }
      }
    },
    blockIntoCanvasArea(obj) {
      // if object is too big ignore
      if (
        obj.currentHeight > obj.canvas.height ||
        obj.currentWidth > obj.canvas.width
      ) {
        return;
      }
      obj.setCoords();
      // top-left  corner
      if (obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0) {
        obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top);
        obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left);
      }
      // bot-right corner
      if (
        obj.getBoundingRect().top + obj.getBoundingRect().height >
          obj.canvas.height ||
        obj.getBoundingRect().left + obj.getBoundingRect().width >
          obj.canvas.width
      ) {
        obj.top = Math.min(
          obj.top,
          obj.canvas.height -
            obj.getBoundingRect().height +
            obj.top -
            obj.getBoundingRect().top
        );
        obj.left = Math.min(
          obj.left,
          obj.canvas.width -
            obj.getBoundingRect().width +
            obj.left -
            obj.getBoundingRect().left
        );
      }
    },
    createSeatUUID() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          let r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 3) | 8;
          return v.toString(16);
        }
      );
    },
    getColor(departmentId) {
      const Colors = {
        vacantColor: "#808080",
        // departmentMappingColor: //추후 고려
      };

      if (departmentId === null) {
        return Colors.vacantColor;
      }
    },
    addVacantSeat(mouseDownX, mouseDownY, mouseUpX, mouseUpY) {
      this.saveStatus = "ableSave";
      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );

      if (this.numberOfAddSeat > 0) {
        let mouseDownPointX = mouseDownX;
        let mouseDownPointY = mouseDownY;

        for (let i = 1; i <= this.numberOfAddSeat; i++) {
          if (i > 1) {
            mouseDownPointX += 10;
            mouseDownPointY += 10;
          }

          let rectangle = new fabric.Rect({
            width: Math.abs(mouseDownX - mouseUpX),
            height: Math.abs(mouseDownY - mouseUpY),
            fill: this.getColor(null),
            opacity: this.seatOpacity,
            originX: "center",
            originY: "center",
          });

          let textObject;

          if (
            this.getEachFloorSeatList(this.currentSelectedFloorObject.floorId)
              .length
          ) {
            let seatNumberArray = [];
            this.getEachFloorSeatList(
              this.currentSelectedFloorObject.floorId
            ).forEach((seat) => {
              //test-a 또는 test-1 층 이렇게 층 생성했을 때 에러 막기 위함.
              let splitArray = seat.seatName.split("-");
              seatNumberArray.push(splitArray[splitArray.length - 1]);
            });
            this.seatNumber = Math.max.apply(null, seatNumberArray); //max
          }

          this.seatNumber++;
          let seatNameText =
            this.currentSelectedFloorObject.floorName + "-" + this.seatNumber;

          textObject = new fabric.IText("", {
            left: rectangle.left,
            top: rectangle.top,
            fontSize: parseInt(this.fontSize),
            fill: this.getSeatTextColor(this.getColor(null)),
            opacity: this.seatOpacity,
            originX: "center",
            originY: "center",
          });

          let group = new fabric.Group([rectangle, textObject], {
            seatId: this.createSeatUUID(),
            seatName: seatNameText,
            floorId: this.currentSelectedFloorObject.floorId,
            buildingId: this.$store.state.buildingStore.building.buildingId,
            employeeName: null,
            employeeDepartment: null,
            employeeDepartmentId: null,
            employeeNumber: null,
            employeeId: null,
            left: mouseDownPointX,
            top: mouseDownPointY,
            angle: 0,
            isObjFromDB: false,
            httpRequestPostStatus: true,
          });

          this.floorCanvas.setActiveObject(group);
          this.floorCanvas.add(group);

          this.setToolTipForSeat(group);

          this.floorCanvas.renderAll();

          eachFloorSeatList.push(group);
        }

        eventBus.$emit("pushAllSeatMap", this.allSeatMap);
        eventBus.$emit("sendStoreStatus", this.saveStatus);
      }
    },
    //새로운 department객체를 반환
    getNewDepartmentObject(departmentId, departmentName, departmentColor) {
      let newDepartmentObject = {};
      newDepartmentObject.departmentId = departmentId; //부서 아이디로 변경예정
      newDepartmentObject.departmentName = departmentName; //부서 이름
      newDepartmentObject.departmentColor = departmentColor; //부서 색상
      return newDepartmentObject;
    },
    changeDepartmentColor(departmentObjectId) {
      //현재층의 부서객체 리스트와 다른층들의 부서객체 리스트에서
      //바꾸고자 하는 부서아이디에 대하여 랜덤 색상으로 color필드를 바꿔주기
      let currentFloorDepartmentObjectList = this.allDepartmentMap.get(
        this.currentSelectedFloorObject.floorId
      );
      let changedDepartmentColor = null;

      const idx = currentFloorDepartmentObjectList.findIndex(
        (departmentObject) => {
          return departmentObject.departmentId === departmentObjectId;
        }
      );
      if (idx > -1) {
        let departmentObject = currentFloorDepartmentObjectList[idx];
        departmentObject.departmentColor = this.hexGenerator();
        changedDepartmentColor = departmentObject.departmentColor;
      }

      let keys = [];
      keys = Array.from(this.allDepartmentMap.keys());
      let indexOfCurrentSelectedFloorObject = keys.indexOf(
        this.currentSelectedFloorObject.floorId
      );
      keys.splice(indexOfCurrentSelectedFloorObject, 1);

      for (let i = 0; i < keys.length; i++) {
        let departmentMapKey = keys[i];
        let eachFloorDepartmentObjectList = this.allDepartmentMap.get(
          departmentMapKey
        );

        const idx = eachFloorDepartmentObjectList.findIndex(
          (departmentObject) => {
            return departmentObject.departmentId === departmentObjectId;
          }
        );
        if (idx > -1) {
          let departmentObject = eachFloorDepartmentObjectList[idx];
          departmentObject.departmentColor = changedDepartmentColor;
        }
      }
      eventBus.$emit("pushDepartmentMap", this.allDepartmentMap);

      //화면에 다시 렌더링 하기 (모든 층에 대하여 자리 채우기색상 변경하기)
      for (let i = 0; i < this.allSeatMap.size; i++) {
        let keys = [];
        keys = Array.from(this.allDepartmentMap.keys());

        let eachFloorSeatList = this.getEachFloorSeatList(keys[i]);
        let changedDepartmentColorSeatList = [];
        for (let i = 0; i < eachFloorSeatList.length; i++) {
          let group = eachFloorSeatList[i];
          let asObject = group.toObject([
            "employeeId",
            "floorId",
            "seatId",
            "employeeDepartment",
            "employeeDepartmentId",
          ]);

          let objectDepartmentId = asObject.employeeDepartmentId;
          if (departmentObjectId === objectDepartmentId) {
            changedDepartmentColorSeatList.push(group);
          }
        }
        changedDepartmentColorSeatList.forEach((seat) => {
          let asObject = seat.toObject([
            "employeeId",
            "floorId",
            "seatId",
            "employeeDepartment",
            "employeeDepartmentId",
          ]);
          let newEmployeeObject = {};
          newEmployeeObject.departmentId = asObject.employeeDepartmentId;
          newEmployeeObject.department = asObject.employeeDepartment;
          seat
            .item(0)
            .set("fill", this.getDepartmentObjectColor(newEmployeeObject));
          seat
            .item(1)
            .set(
              "fill",
              this.getSeatTextColor(
                this.getDepartmentObjectColor(newEmployeeObject)
              )
            );
        });
      }
      this.saveStatus = "ableSave";
      this.floorCanvas.requestRenderAll();
    },
    hexGenerator() {
      let hexValue = ["#"];
      function randomHex() {
        let hexNumbers = new Array("A", "B", "C", "D", "E", "F");
        for (let i = 0; i < 10; i++) {
          hexNumbers.push(i);
        }
        return hexNumbers[Math.floor(Math.random() * hexNumbers.length)];
      }

      for (var i = 0; i < 6; i += 1) {
        hexValue.push(randomHex());
      }

      return hexValue.join("");
    },
    //this.allDepartmentMap에서 부서색상 찾아 반환하기, 없다면
    //db에 부서색이 null인 것은 랜덤컬러로 반환하기 (임시 방법)
    getDepartmentObjectColor(employeeObject) {
      let departmentColor = null;
      let allFloorDepartmentObjectIndex = 0;
      let eachFloorDepartmentObjectList = this.getEachDepartmentObjectList(
        this.currentSelectedFloorObject.floorId
      ); //층 아이디로 찾은 현재층의 부서객체리스트
      let foundDepartmentObjectList = null;

      for (let i = 0; i < this.allDepartmentMap.size; i++) {
        let keys = [];
        keys = Array.from(this.allDepartmentMap.keys());

        let departmentObjectList = this.allDepartmentMap.get(keys[i]);
        allFloorDepartmentObjectIndex = departmentObjectList.findIndex(
          function (departmentObject) {
            return (
              departmentObject.departmentId === employeeObject.departmentId
            );
          }
        );
        if (allFloorDepartmentObjectIndex > -1) {
          foundDepartmentObjectList = departmentObjectList;
          break;
        }
      }

      //allDepartmentMap에 해당 부서의 부서색이 저장이 되어있는게 하나라도 있으면
      //그 부서의 부서색을 찾는다.
      if (allFloorDepartmentObjectIndex > -1) {
        let currentFloorDepartmentObjectIndex = eachFloorDepartmentObjectList.findIndex(
          function (departmentObject) {
            return (
              departmentObject.departmentId === employeeObject.departmentId
            );
          }
        );
        if (currentFloorDepartmentObjectIndex > -1) {
          departmentColor =
            foundDepartmentObjectList[allFloorDepartmentObjectIndex]
              .departmentColor;
        } else {
          departmentColor =
            foundDepartmentObjectList[allFloorDepartmentObjectIndex]
              .departmentColor;
          let newDepartmentObject = this.getNewDepartmentObject(
            employeeObject.departmentId,
            employeeObject.department,
            departmentColor
          );

          eachFloorDepartmentObjectList.push(newDepartmentObject);
          eventBus.$emit("pushDepartmentMap", this.allDepartmentMap);
        }
        return departmentColor;
      }
      //allDepartmentMap에 해당 부서의 부서색이 저장이 되어있는게 하나라도 없으면
      else {
        //db로부터 받아온 부서 객체 리스트에서 그 부서의 부서색이 null이 아니고 값이 저장되있다면 그것을 찾는다.
        //null이라면 랜덤값을 준다. (임시방법)
        for (let j = 0; j < this.allDepartmentObjectList.length; j++) {
          if (
            this.allDepartmentObjectList[j].departmentId ===
            employeeObject.departmentId
          ) {
            if (this.allDepartmentObjectList[j].departmentColor != null) {
              departmentColor = this.allDepartmentObjectList[j].departmentColor;
              break;
            } else {
              departmentColor = this.hexGenerator();
              console.log(departmentColor);
              break;
            }
          }
        }

        let newDepartmentObject = this.getNewDepartmentObject(
          employeeObject.departmentId,
          employeeObject.department,
          departmentColor
        );

        eachFloorDepartmentObjectList.push(newDepartmentObject);
        eventBus.$emit("pushDepartmentMap", this.allDepartmentMap);

        return departmentColor;
      }
    },
    discriminateLightOrDark(color) {
      if (color) {
        let r = null;
        let g = null;
        let b = null;
        let hsp = null;

        // Check the format of the color, HEX or RGB?
        if (color.match(/^rgb/)) {
          // If HEX --> store the red, green, blue values in separate variables
          color = color.match(
            /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
          );

          r = color[1];
          g = color[2];
          b = color[3];
        } else {
          // If RGB --> Convert it to HEX: http://gist.github.com/983661
          color = +(
            "0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&")
          );

          r = color >> 16;
          g = (color >> 8) & 255;
          b = color & 255;
        }

        // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
        hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

        // Using the HSP value, determine whether the color is light or dark
        if (hsp > 127.5) {
          return "light";
        } else {
          return "dark";
        }
      }
    },
    getSeatTextColor(hex) {
      let darkness = this.discriminateLightOrDark(hex);
      if (darkness === "light") {
        return "black";
      } else {
        return "white";
      }
    },
    deleteDepartmentObjectFromList(listToFind, listToDelete, departmentId) {
      //자리 하나를 삭제 후 현재 층 자리리스트에서 해당 자리에 매핑되어있던 사원의 부서를 검색하여
      const idx = listToFind.findIndex((seatObject) => {
        return seatObject.employeeDepartmentId === departmentId;
      });

      //검색하여 index가 없다면
      //(즉, 현재 층 자리리스트에서 삭제한 자리에 매핑되어있던 사원의 부서와 같은 부서가 있지않다면 현재 층에 그 부서는 없다는 뜻으로
      //현재 층의 부서맵 eachFloorDepartmentObjectList에서 그 부서 객체를 지우고,
      //DepartmentColorChips컴포넌트에게 바뀐 allDepartmentMap을 알려준다.)
      //console.log(idx);
      if (idx < 0) {
        for (let i = 0; i < listToDelete.length; i++) {
          if (listToDelete[i].departmentId === departmentId) {
            listToDelete.splice(i, 1);
          }
        }

        eventBus.$emit("pushDepartmentMap", this.allDepartmentMap);
      }
    },
    //공석 자리에 사원 매핑하는 함수
    mappingEmployeeToVacant(employeeObject) {
      let eachEmployeeSeatList = this.getEachEmployeeSeatList(
        employeeObject.employeeId
      );
      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );
      let eachFloorDepartmentObjectList = this.getEachDepartmentObjectList(
        this.currentSelectedFloorObject.floorId
      );

      if (!this.floorCanvas.getActiveObject()) {
        this.$notice.info({
          title: this.$i18n.t("alertNoSelectedSeat"),
          styles: {
            width: "400px",
            marginLeft: "-815px",
            top: "118px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      }

      let mappedOtherEmployeeSeatNameList = [];
      this.floorCanvas.getActiveObjects().forEach((obj) => {
        if (obj.employeeId && obj.employeeId != employeeObject.employeeId) {
          mappedOtherEmployeeSeatNameList.push(obj.seatName);
        }
      });

      if (mappedOtherEmployeeSeatNameList.length > 0) {
        let message = {
          title: this.$i18n.t("titleConfirmChangeMapper"),
          body: this.$i18n.t("confirmChangeMapper", {
            seatNames: mappedOtherEmployeeSeatNameList.join(", "),
          }),
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
            this.mappingEmployee(employeeObject);
          })
          .catch(() => {
            //console.log("cancel");
            return;
          });
      } else {
        this.mappingEmployee(employeeObject);
      }
    },
    //자리에 사원을 매핑하는 함수
    mappingEmployee(employeeObject) {
      let eachEmployeeSeatList = this.getEachEmployeeSeatList(
        employeeObject.employeeId
      );

      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );
      let eachFloorDepartmentObjectList = this.getEachDepartmentObjectList(
        this.currentSelectedFloorObject.floorId
      );
      this.floorCanvas.getActiveObjects().forEach((obj) => {
        let beforeChangedDepartmentId = null;
        if (obj.employeeId && obj.employeeId != employeeObject.employeeId) {
          // 다른 사원이 매핑된 자리
          let groupToObject = obj.toObject([
            "seatId",
            "employeeId",
            "employeeDepartmentId",
          ]);
          beforeChangedDepartmentId = groupToObject.employeeDepartmentId;
          this.deleteEachEmployeeSeatList(groupToObject);
        }
        // 다른 사원이 매핑된 자리 또는 공석
        obj.employeeName = employeeObject.name;
        obj.employeeDepartment = employeeObject.department;
        obj.employeeDepartmentId = employeeObject.departmentId;
        obj.employeeNumber = employeeObject.number;
        obj.employeeId = employeeObject.employeeId;
        obj.item(0).set("fill", this.getDepartmentObjectColor(employeeObject));

        obj
          .item(1)
          .set(
            "fill",
            this.getSeatTextColor(this.getDepartmentObjectColor(employeeObject))
          );

        if (this.viewSeatStatus === 0) {
          obj.item(1).set("text", employeeObject.name);
        } else if (this.viewSeatStatus === 1) {
          obj.item(1).set("text", employeeObject.number);
        } else if (this.viewSeatStatus === 2) {
          obj.item(1).set("text", employeeObject.department);
        }
        obj.set("httpRequestPostStatus", true);
        eachEmployeeSeatList.push(obj);
        this.saveStatus = "ableSave";

        this.deleteDepartmentObjectFromList(
          eachFloorSeatList,
          eachFloorDepartmentObjectList,
          beforeChangedDepartmentId
        );
      });

      this.floorCanvas.renderAll();
      eventBus.$emit("sendStoreStatus", this.saveStatus);
      eventBus.$emit("pushAllSeatMap", this.allSeatMap);
      eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);
    },
    clickdeleteAllBtn() {
      let message = {
        title: this.$i18n.t("titleConfirmDeleteAll"),
        body: this.$i18n.t("confirmDeleteAll"),
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
          this.deleteEachFloorSeatList(this.currentSelectedFloorObject.floorId);
          this.getEachFloorSeatList(
            this.currentSelectedFloorObject.floorId
          ).length = 0;
          this.getEachDepartmentObjectList(
            this.currentSelectedFloorObject.floorId
          ).length = 0;

          this.floorCanvas
            .getObjects()
            .slice()
            .forEach((obj) => {
              let groupToObject = obj.toObject(["seatId", "employeeId"]);
              this.deleteEachEmployeeSeatList(groupToObject);

              this.floorCanvas.remove(obj);
            });

          this.saveStatus = "ableSave";
          eventBus.$emit("sendStoreStatus", this.saveStatus);

          eventBus.$emit("pushAllSeatMap", this.allSeatMap);
          eventBus.$emit("pushDepartmentMap", this.allDepartmentMap);
          eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);

          this.floorCanvas.discardActiveObject();
        })
        .catch(() => {
          console.log("cancel");
          return;
        });
    },
    deleteBtn() {
      let activeObject = null;
      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );
      let eachFloorDepartmentObjectList = this.getEachDepartmentObjectList(
        this.currentSelectedFloorObject.floorId
      ); //층 아이디로 찾은 부서객체 리스트

      let message = {
        title: this.$i18n.t("titleConfirmDelete"),
        body: this.$i18n.t("confirmDelete"),
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
          this.floorCanvas.getActiveObjects().forEach((obj) => {
            if (obj.isObjFromDB) {
              let deleteSeat = {};
              deleteSeat.floorId = obj.floorId;
              deleteSeat.seatId = obj.seatId;
              deleteSeat.buildingId = obj.buildingId;
              this.$store.commit("PUSH_DeleteSeat", deleteSeat);
            }

            let groupToObject = obj.toObject([
              "seatId",
              "employeeId",
              "employeeDepartment",
              "employeeDepartmentId",
            ]);
            this.deleteEachEmployeeSeatList(groupToObject);

            let index = eachFloorSeatList.indexOf(obj);
            eachFloorSeatList.splice(index, 1);

            this.deleteDepartmentObjectFromList(
              eachFloorSeatList,
              eachFloorDepartmentObjectList,
              obj.employeeDepartmentId
            );
            this.floorCanvas.remove(obj);

            this.saveStatus = "ableSave";
          });
          eventBus.$emit("sendStoreStatus", this.saveStatus);

          eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);
          eventBus.$emit("pushAllSeatMap", this.allSeatMap);

          this.floorCanvas.discardActiveObject();
        })
        .catch(() => {
          console.log("cancel");
          return;
        });
    },
    //사원이 매핑된 자리를 공석으로 만드는 함수
    changeSeatToVacant() {
      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );

      let eachFloorDepartmentObjectList = this.getEachDepartmentObjectList(
        this.currentSelectedFloorObject.floorId
      ); //층 아이디로 찾은 부서객체 리스트

      let alreadyEmptySeat = 0;
      let activeObject = 0;
      let mappedSeat = [];
      this.floorCanvas.getActiveObjects().forEach((obj) => {
        if (obj.employeeId === null) {
          alreadyEmptySeat++;
        } else {
          mappedSeat.push(obj);
        }
        activeObject++;
      });

      if (alreadyEmptySeat === activeObject) {
        this.$notice.info({
          title: this.$i18n.t("alertAlreadyEmptySeat"),
          styles: {
            width: "400px",
            marginLeft: "-815px",
            top: "118px",
            backgroundColor: "#2a88bd",
          },
          duration: 5,
        });
        return;
      }

      let mappedSeatText = [];
      mappedSeat.forEach((obj) => {
        mappedSeatText.push(" " + obj.seatName);
      });

      let message = {
        title: this.$i18n.t("titleConfirmChangeSeatToVacant"),
        body: this.$i18n.t("confirmChangeSeatToVacant", {
          seatNames: mappedSeatText,
        }),
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
          mappedSeat.forEach((obj) => {
            let beforeChangedDepartmentId = null;
            let groupToObject = obj.toObject([
              "seatId",
              "employeeId",
              "employeeDepartment",
              "employeeDepartmentId",
            ]);
            beforeChangedDepartmentId = groupToObject.employeeDepartmentId;
            this.deleteEachEmployeeSeatList(groupToObject);

            obj.set("httpRequestPostStatus", true);
            obj.set("employeeName", null);
            obj.set("employeeDepartment", null);
            obj.set("employeeDepartmentId", null);
            obj.set("employeeNumber", null);
            obj.set("employeeId", null);
            obj.item(0).set("fill", this.getColor(null));
            obj.item(1).set("fill", this.getSeatTextColor(this.getColor(null)));
            this.floorCanvas.remove(obj.item(1)); // delete textObject
            obj.item(1).set("text", "");
            this.saveStatus = "ableSave";

            this.deleteDepartmentObjectFromList(
              eachFloorSeatList,
              eachFloorDepartmentObjectList,
              beforeChangedDepartmentId
            );
          });

          this.floorCanvas.renderAll();
          eventBus.$emit("sendStoreStatus", this.saveStatus);
          eventBus.$emit("pushAllSeatMap", this.allSeatMap);
          eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);
        })
        .catch(() => {
          return;
        });
    },
    //복제하기 (컨텍스트 메뉴 내부)
    cloneSeat() {
      this.copySelectedSeat();
      this.pasteSelectedSeat();
    },
    //clone하기 (ctrl+c)
    copySelectedSeat() {
      if (!this.floorCanvas.getActiveObject()) return;

      this.clipboard = [];
      this.activeObjectList = [];

      this.floorCanvas.getActiveObjects().forEach((obj) => {
        obj.clone((cloned) => {
          this.clipboard.push(cloned);
        });
        this.activeObjectList.push(obj);
      });

      //text 삭제 (선택정보 고른 것에 따라서 다르게 보여주기 위함)
      this.clipboard.forEach((obj) => {
        obj.remove(obj.item(1));
      });
    },
    //paste하기 (ctrl+v)
    pasteSelectedSeat() {
      if (this.clipboard.length === 0) return;

      this.saveStatus = "ableSave";

      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );
      let eachEmployeeSeatList = null;

      for (let i = 0; i < this.clipboard.length; i++) {
        this.clipboard[i].clone((cloned) => {
          this.floorCanvas.discardActiveObject();

          eachEmployeeSeatList = this.getEachEmployeeSeatList(
            this.activeObjectList[i].employeeId
          );

          cloned.set({
            left: this.activeObjectList[i].left + 10,
            top: this.activeObjectList[i].top + 10,
            isObjFromDB: false,
            httpRequestPostStatus: true,
            seatId: this.createSeatUUID(),
            floorId: this.currentSelectedFloorObject.floorId,
            angle: cloned.angle,
            employeeDepartment: this.activeObjectList[i].employeeDepartment,
            employeeDepartmentId: this.activeObjectList[i].employeeDepartmentId,
            employeeId: this.activeObjectList[i].employeeId,
            employeeName: this.activeObjectList[i].employeeName,
            employeeNumber: this.activeObjectList[i].employeeNumber,
            evented: true,
          });

          let newSeatNumberArray = [];

          this.getEachFloorSeatList(
            this.currentSelectedFloorObject.floorId
          ).forEach((seat) => {
            let splitArray = seat.seatName.split("-");
            newSeatNumberArray.push(splitArray[splitArray.length - 1]);
          });

          this.seatNumber = Math.max.apply(null, newSeatNumberArray);

          this.seatNumber++;

          cloned.seatName =
            this.currentSelectedFloorObject.floorName + "-" + this.seatNumber;

          let textObject = null;

          //공석인 textObject => 이후 사용될 수 있기 때문에 공석도 ""인 텍스트가 필요
          let emptySeatTextObject = new fabric.IText("", {
            left: cloned.item(0).left,
            top: cloned.item(0).top,
            fontSize: parseInt(this.fontSize),
            fill: this.getSeatTextColor(this.getDepartmentColor(null)),
            originX: "center",
            originY: "center",
          });

          if (this.viewSeatStatus === 0) {
            //자리에 사원 이름 보이는 경우
            if (this.activeObjectList[i].employeeName) {
              textObject = new fabric.IText(
                this.activeObjectList[i].employeeName,
                {
                  left: cloned.item(0).left,
                  top: cloned.item(0).top,
                  fontSize: parseInt(this.fontSize),
                  fill: this.getSeatTextColor(
                    this.getDepartmentColor(cloned.employeeDepartmentId, cloned.floorId)
                  ),
                  originX: "center",
                  originY: "center",
                }
              );
            } else {
              textObject = emptySeatTextObject;
            }
          }
          //자리에 내선번호만 보이는 경우
          else if (this.viewSeatStatus === 1) {
            if (this.activeObjectList[i].employeeNumber) {
              textObject = new fabric.IText(
                this.activeObjectList[i].employeeNumber,
                {
                  left: cloned.item(0).left,
                  top: cloned.item(0).top,
                  fontSize: parseInt(this.fontSize),
                  fill: this.getSeatTextColor(
                    this.getDepartmentColor(cloned.employeeDepartmentId, cloned.floorId)
                  ),
                  originX: "center",
                  originY: "center",
                }
              );
            } else {
              textObject = emptySeatTextObject;
            }
          } //자리에 부서명만 보이는 경우
          else if (this.viewSeatStatus === 2) {
            if (this.activeObjectList[i].employeeDepartment) {
              textObject = new fabric.IText(
                this.activeObjectList[i].employeeDepartment,
                {
                  left: cloned.item(0).left,
                  top: cloned.item(0).top,
                  fontSize: parseInt(this.fontSize),
                  fill: this.getSeatTextColor(
                    this.getDepartmentColor(cloned.employeeDepartmentId, cloned.floorId)
                  ),
                  originX: "center",
                  originY: "center",
                }
              );
            } else {
              textObject = emptySeatTextObject;
            }
          }
          //자리에 seatName만 보이는 경우
          else if (this.viewSeatStatus === 3) {
            textObject = new fabric.IText(cloned.seatName, {
              left: cloned.item(0).left,
              top: cloned.item(0).top,
              fontSize: parseInt(this.fontSize),
              fill: this.getSeatTextColor(
                this.getDepartmentColor(cloned.employeeDepartmentId, cloned.floorId)
              ),
              originX: "center",
              originY: "center",
            });
          }

          let scaleX = cloned.width / (cloned.width * cloned.scaleX);
          let scaleY = cloned.height / (cloned.height * cloned.scaleX);

          textObject.set("lockScalingX", true);
          textObject.set("lockScalingY", true);
          textObject.set("scaleX", scaleX);
          textObject.set("scaleY", scaleY);

          cloned.add(textObject);

          if (cloned.type === "activeSelection") {
            cloned.canvas = this.floorCanvas;
            cloned.forEachObject(function (obj) {
              this.floorCanvas.add(obj);
            });
            cloned.setCoords();
          } else {
            this.floorCanvas.add(cloned);
          }

          this.floorCanvas.setActiveObject(cloned);
          this.floorCanvas.requestRenderAll();

          eachFloorSeatList.push(cloned);
          eachEmployeeSeatList.push(cloned);
        });
      }

      eventBus.$emit("sendStoreStatus", this.saveStatus);
      eventBus.$emit("pushAllSeatMap", this.allSeatMap);
      eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);

      this.floorCanvas.discardActiveObject();
    },
    selectAllSeat() {
      if (this.floorCanvas.getActiveObject()) {
        if (
          this.floorCanvas.getActiveObjects().length ===
          this.floorCanvas.getObjects().length
        ) {
          return;
        } else {
          //이전에 active 된 자리 해제하기 => 다시 active 자리들로 묶기 위함
          this.floorCanvas.discardActiveObject();
        }
      }

      let seats = new fabric.ActiveSelection(this.floorCanvas.getObjects(), {
        canvas: this.floorCanvas,
      });
      this.floorCanvas.setActiveObject(seats);
      this.floorCanvas.requestRenderAll();
    },
    showContextMenuOfOneSeat(clientX, clientY) {
      this.contextMenuStatus = false;
      this.contextMenuXLocation = clientX + 10;
      this.contextMenuYLocation = clientY;
      this.$nextTick(() => {
        this.contextMenuStatus = true;
      });
    },
    clickCSVContextMenu(index) {
      switch (index) {
        case 0:
          this.clickExportToCSVBtn();
          break;
        case 1:
          this.$refs.Upload.click();
          break;
      }
    },
    clickContextMenu(index) {
      switch (index) {
        case 0:
          this.deleteBtn();
          break;
        case 1:
          this.cloneSeat();
          break;
      }
    },
    setToolTipForSeat(group) {
      group.on("mouseover", (event) => {
        let group = event.target;
        if (group != null) {
          console.log(group.left);
          console.log(group.top);
          let posX = event.e.clientX;
          let posY = event.e.clientY;

          let groupToObject = group.toObject([
            "employeeId",
            "employeeName",
            "employeeDepartment",
            "employeeNumber",
          ]);

          this.showToolTip(
            posX,
            posY,
            groupToObject.employeeId,
            groupToObject.employeeName,
            groupToObject.employeeDepartment,
            groupToObject.employeeNumber
          );
        }
      });

      group.on("mousedown", (event) => {
        console.log("mouse:down");
        this.moveStatus = true;
        if (this.lockStatus === true && this.moveStatus === true) {
          this.lockStatus = false;
          this.floorCanvas.selection = true;
          this.$notice.info({
            title: this.$i18n.t("alertCanvasLockStatus"),
            styles: {
              width: "400px",
              marginLeft: "-815px",
              top: "118px",
              backgroundColor: "#2a88bd",
            },
            duration: 5,
          });
        }
        let objWidth = group.get("width") + 1;
        let objHeight = group.get("height") + 1;
        console.log(objWidth + "11111" + objHeight);
        eventBus.$emit("sendDragSeatInformation", objWidth, objHeight);
        eventBus.$emit("pushManageSeatTabOfSelectedSeatsComponentStatus", true);
      });

      group.on("mouseout", (event) => {
        this.toolTipStatus = false;
      });
    },
    showToolTip(
      clientX,
      clientY,
      employeeId,
      employeeName,
      employeeDepartment,
      employeeNumber
    ) {
      this.toolTipXLocation = clientX;
      this.toolTipYLocation = clientY;

      if (employeeId == null) {
        this.toolTipText = this.$i18n.t("textEmptySeat");
        this.toolTipColor = null;
      } else {
        this.toolTipText = this.$i18n.t("toolTipText", {
          employeeName: employeeName,
          employeeId: employeeId,
          employeeDepartment: employeeDepartment,
          employeeNumber: employeeNumber,
        });

        this.toolTipColor = "pink lighten-2";
      }

      this.toolTipStatus = true;
    },
    //층간 이동
    moveSeatToAnotherFloor(moveFloorId, moveFloorName) {
      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );

      let afterChangeFloorDepartmentObjectList = null;
      //층 아이디로 찾은 부서객체 리스트
      let beforeChangeFloorDepartmentObjectList = this.getEachDepartmentObjectList(
        this.currentSelectedFloorObject.floorId
      );

      let previousTop = 0;
      let previousLeft = 0;

      let movePositionLeft = -87.5;
      let activeObjectLength = this.floorCanvas.getActiveObjects().length;
      this.floorCanvas.getActiveObjects().forEach((seat) => {
        let asObject = seat.toObject([
          "employeeDepartment",
          "employeeDepartmentId",
        ]);
        seat.set("floorId", moveFloorId);
        seat.set("floorName", moveFloorName);
        seat.set("httpRequestPostStatus", true);
        seat.set("angle", 0);

        // if (activeObjectLength === 1) {
        //   //자리 한개 층간 이동
        //   seat.set("top", previousTop);
        //   seat.set("left", previousLeft);
        // } else {
        //   //자리 여러개 층간 이동
        //   let asObject = seat.toObject(["top"]);
        //   console.log(asObject.top);
        //   seat.item(0).set("top", 0);
        //   seat.set("top", 0);
        //   let asObject2 = seat.toObject(["top"]);
        //   console.log(asObject2.top);

        //   // seat.set("left", Math.abs(previousLeft));
        //   //movePositionLeft = movePositionLeft + seat.width;
        // }

        this.saveStatus = "ableSave";

        //이동 후의 층의 자리 리스트에 추가하기
        let changeFloorSeatList = this.getEachFloorSeatList(moveFloorId);
        changeFloorSeatList.push(seat);

        //이동 후의 층의 부서 객체 리스트에 부서 객체 추가하기 (employeeDepartmentId가 null이 아닐때에만 즉, 공석이 아닐때에만)
        if (asObject.employeeDepartmentId) {
          afterChangeFloorDepartmentObjectList = this.getEachDepartmentObjectList(
            moveFloorId
          );

          let afterIdx = afterChangeFloorDepartmentObjectList.findIndex(
            function (departmentObject) {
              return (
                departmentObject.departmentId === asObject.employeeDepartmentId
              );
            }
          );

          if (afterIdx < 0) {
            let newDepartmentObject = this.getNewDepartmentObject(
              asObject.employeeDepartmentId,
              asObject.employeeDepartment,
              seat.item(0).fill
            );

            afterChangeFloorDepartmentObjectList.push(newDepartmentObject);
          }
        }

        //이동 전의 층의 자리 리스트에서 삭제하기
        for (let i = 0; i < eachFloorSeatList.length; i++) {
          if (eachFloorSeatList[i].seatId === seat.seatId) {
            //String
            eachFloorSeatList[i].set("isObjFromDB", true);
            eachFloorSeatList.splice(i, 1);
          }
        }

        //이동 전의 층의 부서 객체 리스트에서 부서 객체 삭제하기
        this.deleteDepartmentObjectFromList(
          eachFloorSeatList,
          beforeChangeFloorDepartmentObjectList,
          seat.employeeDepartmentId
        );

        if (activeObjectLength === 1) {
          //자리 한개 층간 이동
          seat.set("top", previousTop);
          seat.set("left", previousLeft);
        } else {
          //자리 여러개 층간 이동
          let asObject = seat.toObject(["top"]);
          console.log(asObject.top);
          //seat.item(0).set("top", 0);
          seat.set("top", 0);
          let asObject2 = seat.toObject(["top"]);
          console.log(asObject2.top);

          // seat.set("left", Math.abs(previousLeft));
          //movePositionLeft = movePositionLeft + seat.width;
        }
        //층간 이동한 자리들 하이라이트하기
        seat.item(0).set("opacity", 0);
        seat.item(0).animate("opacity", 1, {
          duration: 2000,
          onChange: this.floorCanvas.renderAll.bind(this.floorCanvas),
        });
      });

      eventBus.$emit("pushFloorOfSeat", moveFloorId);
      eventBus.$emit("sendStoreStatus", this.saveStatus);
      eventBus.$emit("pushDepartmentMap", this.allDepartmentMap);
      eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);
    },
    // 건물별 자리 이동(부서 색은 건물을 고려하지 않으므로 삭제하지 않음)
    moveSeatToAnotherBuilding(
      moveBuildingId,
      moveBuildingName,
      moveFloorId,
      moveFloorName
    ) {
      // 이동할 자리 리스트
      let moveSeat = [];
      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );
      this.seatNumber = 0;
      let newSeatNumberArray = [];

      this.floorCanvas.getActiveObjects().forEach((obj) => {
        //현재 건물의 층에서 이동할 자리 삭제
        if (obj.isObjFromDB) {
          let deleteSeat = {};
          deleteSeat.floorId = obj.floorId;
          deleteSeat.seatId = obj.seatId;
          deleteSeat.buildingId = obj.buildingId;
          this.$store.commit("PUSH_DeleteSeat", deleteSeat);
        }

        //매핑된 자리라면 그 사원의 자리 목록에서 삭제해주기 위함
        let groupToObject = obj.toObject([
          "seatId",
          "employeeId",
          "employeeDepartment",
          "employeeDepartmentId",
        ]);
        this.deleteEachEmployeeSeatList(groupToObject);

        let index = eachFloorSeatList.indexOf(obj);
        eachFloorSeatList.splice(index, 1);

        obj.set("buildingId", moveBuildingId);
        obj.set("floorId", moveFloorId);
        moveSeat.push(obj);

        this.floorCanvas.remove(obj);
      });
      eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);
      eventBus.$emit("pushAllSeatMap", this.allSeatMap);

      this.floorCanvas.discardActiveObject();

      this.saveStatus = "saving";
      eventBus.$emit("sendStoreStatus", this.saveStatus);

      this.saveData(moveSeat, moveBuildingName);
    },
    //자리 하이라이트
    showSeatHighlight(seatObject) {
      let seatFloor = null;
      //seat의 층과 현재층이 같지 않다면
      if (this.currentSelectedFloorObject.floorId != seatObject.floorId) {
        seatFloor = seatObject.floorId;
      }
      //seat의 층과 현재층이 같다면
      else {
        seatFloor = this.currentSelectedFloorObject.floorId;
      }

      let eachFloorSeatList = this.getEachFloorSeatList(seatFloor);
      for (let i = 0; i < eachFloorSeatList.length; i++) {
        let group = eachFloorSeatList[i];
        let asObject = group.toObject([
          "employeeId",
          "floorId",
          "seatId",
          "employeeDepartment",
          "employeeDepartmentId",
        ]);

        let objectSeatId = asObject.seatId;
        if (seatObject.seatId === objectSeatId) {
          //String
          this.floorCanvas
            .getObjects()
            .slice()
            .forEach((obj) => {
              this.floorCanvas.remove(obj);
            });

          //각 층의 저장된 도형 리스트 화면에 뿌려주기
          //현재 층의 이미지가 저장되어있다면
          if (this.allImageMap.get(seatFloor) != null) {
            let typeCheck = this.allImageMap.get(
              this.currentSelectedFloorObject.floorId
            ).imgPath;

            if (typeof typeCheck === "string") {
              this.loadImageDBFile(
                this.allImageMap.get(this.currentSelectedFloorObject.floorId)
                  .imgPath,
                this.allImageMap.get(this.currentSelectedFloorObject.floorId)
                  .imgType
              );
            } else {
              this.loadImageFile(
                this.allImageMap.get(this.currentSelectedFloorObject.floorId)
                  .imgPath
              );
            }
            for (let i = 0; i < eachFloorSeatList.length; i++) {
              this.floorCanvas.add(eachFloorSeatList[i]);
            }
          }

          let canvasTop = document
            .getElementById("canvas")
            .getBoundingClientRect().top;
          let canvasLeft = document
            .getElementById("canvas")
            .getBoundingClientRect().left;

          this.showToolTip(
            group.left + canvasLeft,
            group.top + canvasTop,
            group.employeeId,
            group.employeeName,
            group.employeeDepartment,
            group.employeeNumber
          );

          //3초 뒤 툴팁 없어짐
          setTimeout(() => {
            this.toolTipStatus = false;
          }, 3000);

          group.item(1).set("opacity", 0);
          group.item(0).set("opacity", 0);
          group.item(0).set("stroke", "blue");
          group.item(0).set("strokeWidth", 5);

          group.item(0).animate("opacity", 1, {
            duration: 2000,
            onChange: this.floorCanvas.renderAll.bind(this.floorCanvas),
            onComplete: getOrginOpacity,
          });
          group.item(0).animate("fill", "red", {
            onChange: this.floorCanvas.renderAll.bind(this.floorCanvas),
            duration: 2000,
            onComplete: getOrginItem,
          });
          group.item(1).animate("opacity", 1, {
            onChange: this.floorCanvas.renderAll.bind(this.floorCanvas),
            duration: 2000,
            onComplete: getOrginText,
          });

          let newEmployeeObject = {};
          newEmployeeObject.departmentId = asObject.employeeDepartmentId;
          newEmployeeObject.department = asObject.employeeDepartment;

          let color = this.getDepartmentObjectColor(newEmployeeObject);
          let opacity = this.seatOpacity;
          let canvas = this.floorCanvas;

          function getOrginItem() {
            setTimeout(() => {
              group.item(0).set("fill", color);
              group.item(0).set("stroke", null);
              group.item(0).set("strokeWidth", null);
              canvas.renderAll();
            }, 1000);
          }
          function getOrginOpacity() {
            setTimeout(() => {
              group.item(0).set("opacity", opacity);
              canvas.renderAll();
            }, 1000);
          }
          function getOrginText() {
            setTimeout(() => {
              group.item(1).set("opacity", opacity);
              canvas.renderAll();
            }, 1000);
          }
        }
        //자리가 아직 없을때 예외처리 하기
      }
    },
    //해당 부서별 자리 하이라이트
    showDepartmentSeatHighlight(departmentObjectId) {
      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );
      let showDepartmentSeatList = [];
      for (let i = 0; i < eachFloorSeatList.length; i++) {
        let group = eachFloorSeatList[i];
        let asObject = group.toObject([
          "employeeId",
          "floorId",
          "seatId",
          "employeeDepartment",
          "employeeDepartmentId",
        ]);

        let objectDepartmentId = asObject.employeeDepartmentId;
        if (departmentObjectId === objectDepartmentId) {
          showDepartmentSeatList.push(group);
        } else if (!departmentObjectId && !objectDepartmentId) {
          showDepartmentSeatList.push(group);
        }
        showDepartmentSeatList.forEach((seat) => {
          seat.item(0).set("opacity", 0);
          seat.item(1).set("opacity", 0);

          seat.item(0).animate("opacity", 1, {
            duration: 2000,
            onChange: this.floorCanvas.renderAll.bind(this.floorCanvas),
            onComplete: getOrginItem,
          });
          group.item(1).animate("opacity", 1, {
            onChange: this.floorCanvas.renderAll.bind(this.floorCanvas),
            duration: 2000,
            onComplete: getOrginItem,
          });
        });

        let opacity = this.seatOpacity;
        let canvas = this.floorCanvas;
        function getOrginItem() {
          setTimeout(() => {
            for (let i = 0; i < showDepartmentSeatList.length; i++) {
              showDepartmentSeatList[i].item(0).set("opacity", opacity);
              showDepartmentSeatList[i].item(1).set("opacity", opacity);
              canvas.renderAll();
            }
          }, 1000);
        }
      }
    },
    clickExportToCSVBtn() {
      //csv 내려받기(seatName, employeeId, floorId)
      let floorId = this.currentSelectedFloorObject.floorId;
      this.$emit("downloadCSVFile", floorId);
    },
    changeCSVFile(e) {
      let files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;
      let message = {
        title: this.$i18n.t("titleConfirmUploadCSV"),
        body: this.$i18n.t("confirmUploadCSV", {
          filename: files[0].name,
        }),
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
          this.saveFromCSVFileToDB(files[0]);
        })
        .catch(() => {
          //console.log("cancel");
          return;
        });
    },
    saveFromCSVFileToDB(csvFile) {
      //csv 수정했을시에 db로 정보 save하기
      let newFileForCSVType = new File([csvFile], csvFile.name, {
        type: "text/csv",
      });

      let floorId = this.currentSelectedFloorObject.floorId;
      let csvFileData = new FormData();
      csvFileData.append("file", newFileForCSVType);

      this.$emit("saveFromCSVFileToDB", csvFileData, floorId);
    },
    viewSeatInfo() {
      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );
      if (this.viewSeatStatus === 0) {
        for (let i = 0; i < eachFloorSeatList.length; i++) {
          let group = eachFloorSeatList[i];
          let asObject = group.toObject(["employeeName"]);
          if (asObject.employeeName !== null) {
            eachFloorSeatList[i].item(1).set("text", asObject.employeeName);
          } else {
            eachFloorSeatList[i].item(1).set("text", "");
          }
        }
      } else if (this.viewSeatStatus === 1) {
        for (let i = 0; i < eachFloorSeatList.length; i++) {
          let group = eachFloorSeatList[i];
          let asObject = group.toObject(["employeeNumber"]);
          if (asObject.employeeNumber !== null) {
            eachFloorSeatList[i].item(1).set("text", asObject.employeeNumber);
          } else {
            eachFloorSeatList[i].item(1).set("text", "");
          }
        }
      } else if (this.viewSeatStatus === 2) {
        for (let i = 0; i < eachFloorSeatList.length; i++) {
          let group = eachFloorSeatList[i];
          let asObject = group.toObject(["employeeDepartment"]);
          if (asObject.employeeDepartment !== null) {
            eachFloorSeatList[i]
              .item(1)
              .set("text", asObject.employeeDepartment);
          } else {
            eachFloorSeatList[i].item(1).set("text", "");
          }
        }
      } else if (this.viewSeatStatus === 3) {
        for (let i = 0; i < eachFloorSeatList.length; i++) {
          let group = eachFloorSeatList[i];
          let asObject = group.toObject(["seatName"]);
          if (asObject.seatName !== null) {
            eachFloorSeatList[i].item(1).set("text", asObject.seatName);
          }
        }
      }

      this.floorCanvas.renderAll();
    },
    changeSeatSize(seatWidth, seatHeight) {
      let newSeatList = [];
      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );
      for (let i = 0; i < eachFloorSeatList.length; i++) {
        console.log(eachFloorSeatList[i]);
        let groupObject = eachFloorSeatList[i].toObject([
          "employeeDepartmentId",
          "employeeDepartment",
        ]);
        //let rectangleObject = eachFloorSeatList[i]
        //  .item(0)
        //  .toObject(["top", "left"]);
        let newEmployeeObject = {};
        newEmployeeObject.departmentId = groupObject.employeeDepartmentId;
        newEmployeeObject.department = groupObject.employeeDepartment;
        let color = this.getDepartmentObjectColor(newEmployeeObject);
        if (color === null) {
          color = "#808080";
        }
        // console.log(groupObject.width + " vs " + seatWidth);
        // console.log(groupObject.height + " vs " + seatHeight);
        /* console.log(
          eachFloorSeatList[i].get("width") +
            " vs " +
            eachFloorSeatList[i].item(0).get("width")
        );
        console.log(
          eachFloorSeatList[i].get("height") +
            " vs " +
            eachFloorSeatList[i].item(0).get("height")
        );*/
        //eachFloorSeatList[i].set("left", groupObject.left + seatWidth);
        //eachFloorSeatList[i].set("top", groupObject.top + seatWidth);
        eachFloorSeatList[i].set("width", seatWidth - 1);
        eachFloorSeatList[i].set("height", seatHeight - 1);
        eachFloorSeatList[i].item(0).set("width", seatWidth - 1);
        eachFloorSeatList[i].item(0).set("height", seatHeight - 1);
        //eachFloorSeatList[i].item(1).set("width", seatWidth - 1);
        //eachFloorSeatList[i].item(1).set("height", seatHeight - 1);
        //eachFloorSeatList[i].item(0).set("top", rectangleObject.top + seatWidth);
        //eachFloorSeatList[i].item(0).set("left", rectangleObject.left + seatHeight);
        //eachFloorSeatList[i].item(0).set("fill", color);
        //eachFloorSeatList[i].item(0).set("dirty", true);
        eachFloorSeatList[i].set("fill", color);
        eachFloorSeatList[i].set("dirty", true);
        eachFloorSeatList[i].set("httpRequestPostStatus", true);

        //this.floorCanvas.discardActiveObject();
        //var sel = new fabric.ActiveSelection(this.floorCanvas.getObjects(), {
        //  canvas: this.floorCanvas,
        //});
        //this.floorCanvas.setActiveObject(sel);
        //this.floorCanvas.requestRenderAll();
        this.floorCanvas.renderAll();
        this.saveStatus = "ableSave";

        /* console.log(
          eachFloorSeatList[i].get("width") +
            " vs " +
            eachFloorSeatList[i].item(0).get("width")
        );
        console.log(
          eachFloorSeatList[i].get("height") +
            " vs " +
            eachFloorSeatList[i].item(0).get("height")
        );*/
      }
      this.floorCanvas.getObjects().forEach((obj) => {
        newSeatList.push(obj);
      });
      console.log(newSeatList.length);
      this.allSeatMap.set(this.currentSelectedFloorObject.floorId, newSeatList);
      eventBus.$emit("pushAllSeatMap", this.allSeatMap);
      //this.floorCanvas.renderAll();
    },
    changeDragSeatSize(seatWidth, seatHeight) {
      let newSeatList = [];
      this.floorCanvas.getActiveObjects().forEach((obj) => {
        let groupObject = obj.toObject([
          "employeeDepartmentId",
          "employeeDepartment",
        ]);
        let newEmployeeObject = {};
        newEmployeeObject.departmentId = groupObject.employeeDepartmentId;
        newEmployeeObject.department = groupObject.employeeDepartment;
        let color = this.getDepartmentObjectColor(newEmployeeObject);
        if (color === null) {
          color = "#808080";
        }
        //let objWidth = obj.get("width") + 1;
        //let objHeight = obj.get("height") + 1;
        //eventBus.$emit("sendDragSeatInformation", objWidth, objHeight);

        obj.set("width", seatWidth - 1);
        obj.set("height", seatHeight - 1);
        obj.item(0).set("width", seatWidth - 1);
        obj.item(0).set("height", seatHeight - 1);
        obj.set("dirty", true);
        obj.set("httpRequestPostStatus", true);

        this.floorCanvas.renderAll();
        this.saveStatus = "ableSave";
      });
      this.floorCanvas.getObjects().forEach((obj) => {
        newSeatList.push(obj);
      });
      this.allSeatMap.set(this.currentSelectedFloorObject.floorId, newSeatList);
      eventBus.$emit("pushAllSeatMap", this.allSeatMap);
    },
    downloadURI(uri, name) {
      var link = document.createElement("a");
      if (typeof link.download === "string") {
        link.href = uri;
        link.download = name;
        console.log(link);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(uri);
      }
    },
    captureBtn() {
      html2canvas(document.querySelector("#canvas")).then((canvas) => {
        // var doc = new jsPDF("p", "mm", "a4"); // html2canvas의 canvas를 png로 바꿔준다.
        // var imgData = canvas.toDataURL("image/png"); //Image 코드로 뽑아내기
        //console.log(imgData);
        // image 추가
        //doc.addImage(imgData, "PNG", 0, 0);
        // pdf로 저장
        //doc.save("sample.pdf");
        let dataUrl = document.getElementById("canvas").toDataURL();
        let dataName = this.allImageMap.get(
          this.currentSelectedFloorObject.floorId
        ).imgFileName;
        this.downloadURI(dataUrl, dataName);
      });
      console.log(this.allCanvasImageMap);
    },
    clickPrintBtn() {
      let dataUrl = document.getElementById("canvas").toDataURL();

      let seatTable = "<table border='1' cellpadding='3'><tr>";
      seatTable += "<th>" + this.$i18n.t("seatName") + "</th>";
      seatTable += "<th>" + this.$i18n.t("textName") + "</th>";
      seatTable += "<th>" + this.$i18n.t("textDept") + "</th>";
      seatTable += "<th>" + this.$i18n.t("textNumber") + "</th>";
      seatTable += "<th>" + this.$i18n.t("textSeatType") + "</th>";
      seatTable += "</tr>";

      let styleTag = "<style>table{width: 100%;}";
      styleTag += "th{font-weight: bold; text-align:left;}</style>";

      let seatTableTd = "";
      this.floorCanvas
        .getObjects()
        .sort(function (a, b) {
          let aSeatNameArray = [];
          let bSeatNameArray = [];
          aSeatNameArray = a.seatName.split("-");
          bSeatNameArray = b.seatName.split("-");

          let aSeatNameNumber = aSeatNameArray[aSeatNameArray.length - 1];
          let bSeatNameNumber = bSeatNameArray[bSeatNameArray.length - 1];

          return aSeatNameNumber - bSeatNameNumber;
        })
        .forEach((obj) => {
          if (obj.employeeName) {
            seatTableTd += "<tr><td>" + obj.seatName + "</td>";
            seatTableTd += "<td>" + obj.employeeName + "</td>";
            seatTableTd += "<td>" + obj.employeeDepartment + "</td>";
            seatTableTd += "<td>" + obj.employeeNumber + "</td>";
            seatTableTd += "<td>" + "" + "</td></tr>";
          } else {
            seatTableTd += "<tr><td>" + obj.seatName + "</td>";
            seatTableTd += "<td>" + "" + "</td>";
            seatTableTd += "<td>" + "" + "</td>";
            seatTableTd += "<td>" + "" + "</td>";
            seatTableTd +=
              "<td>" + this.$i18n.t("textVacantSeat") + "</td></tr>";
          }
        });

      let windowContent = "<!DOCTYPE html>";
      windowContent += "<html>";
      windowContent += "<head><title>";
      windowContent +=
        this.$i18n.t("floorSeatLayout", {
          floorName: this.currentSelectedFloorObject.floorName,
        }) + "</title>";
      windowContent += styleTag;
      windowContent += "</head>";
      windowContent += "<body>";
      windowContent +=
        '<img src="' + dataUrl + '" onload=window.print();window.close();>';
      windowContent += seatTable;
      windowContent += seatTableTd;
      windowContent += "</table>";
      windowContent += "</body>";
      windowContent += "</html>";

      let printWin = window.open("", "", "width=1500,height=800");
      printWin.document.write(windowContent);
    },
    async saveData(moveSeat, moveBuildingName) {
      console.log(moveSeat);
      if (this.allFloorList) {
        //db로 보낼 자리 삭제
        if (this.$store.state.deleteStore.deleteSeatIdList.length > 0) {
          console.log(this.$store.state.deleteStore.deleteSeatIdList);
          await this.$store.dispatch("deleteSeatWithKey");
        }

        //db로 보낼 층 삭제
        if (this.$store.state.deleteStore.deleteFloorIdList.length) {
          console.log(this.$store.state.deleteStore.deleteFloorIdList);
          await this.$store.dispatch("deleteFloorWithKey");
        }

        //층 저장
        await this.$store.dispatch("pushFloors", this.allFloorList);
        await this.$store.dispatch("saveFloors");

        //자리 저장
        for (let i = 0; i < this.allFloorList.length; i++) {
          let eachFloorSeatList = this.getEachFloorSeatList(
            this.allFloorList[i].floorId
          );

          for (let j = 0; j < eachFloorSeatList.length; j++) {
            let groupToObject = eachFloorSeatList[j].toObject([
              "seatId",
              "seatName",
              "floorId",
              "buildingId",
              "left",
              "top",
              "employeeDepartment",
              "employeeId",
              "scaleX",
              "scaleY",
              "isObjFromDB",
              "httpRequestPostStatus",
            ]);

            let rectangleObject = eachFloorSeatList[j]
              .item(0)
              .toObject(["width", "height"]);

            if (groupToObject.httpRequestPostStatus) {
              let seatData = {};
              seatData.seat_id = groupToObject.seatId;
              seatData.seat_name = groupToObject.seatName;
              seatData.floor = groupToObject.floorId;
              seatData.x = groupToObject.left;
              seatData.y = groupToObject.top;
              seatData.is_group = false;
              seatData.group_id = null;
              seatData.building_id = groupToObject.buildingId;
              seatData.employee_id = groupToObject.employeeId;
              seatData.width = rectangleObject.width * groupToObject.scaleX;
              seatData.height = rectangleObject.height * groupToObject.scaleY;
              seatData.degree = groupToObject.angle;
              seatData.shape_id = "1";
              console.log(seatData);

              this.$store.commit("PUSH_SEATLIST", seatData);
            }
          }
        }

        // 다른 건물로 이동할 자리가 있다면
        if (moveSeat) {
          console.log(moveSeat);
          for (let i = 0; i < moveSeat.length; i++) {
            let seatData = {};
            seatData.seat_id = moveSeat[i].seatId;
            seatData.seat_name = moveSeat[i].seatName;
            seatData.floor = moveSeat[i].floorId;
            seatData.x = moveSeat[i].left;
            seatData.y = moveSeat[i].top;
            seatData.is_group = false;
            seatData.group_id = null;
            seatData.building_id = moveSeat[i].buildingId;
            seatData.employee_id = moveSeat[i].employeeId;
            seatData.width = moveSeat[i].width * moveSeat[i].scaleX;
            seatData.height = moveSeat[i].height * moveSeat[i].scaleY;
            seatData.degree = moveSeat[i].angle;
            seatData.shape_id = "1";
            console.log(seatData);

            this.$store.commit("PUSH_SEATLIST", seatData);
          }
        }

        await this.$store.dispatch("saveSeats");

        //부서 색 저장(새로운 부서의 사원이 매핑되고 저장되었을 경우에만 부서객체를 저장한다.)
        if (this.allDepartmentMap) {
          console.log(this.allDepartmentObjectList);
          let departmentObjectToSaveList = [];
          for (let i = 0; i < this.allDepartmentMap.size; i++) {
            let keys = [];
            keys = Array.from(this.allDepartmentMap.keys());

            let eachFloorDepartmentObjectList = this.allDepartmentMap.get(
              keys[i]
            );

            for (let i = 0; i < eachFloorDepartmentObjectList.length; i++) {
              let departmentId = eachFloorDepartmentObjectList[i].departmentId;
              let departmentColor =
                eachFloorDepartmentObjectList[i].departmentColor;

              const idx = this.allDepartmentObjectList.findIndex(
                (departmentObject) => {
                  return departmentObject.departmentId === departmentId;
                }
              );
              if (idx > -1) {
                let departmentObject = this.allDepartmentObjectList[idx];
                if (
                  //부서색이 저장되어있지 않은 경우이거나 저장되어있는 부서색과 현재 부서색이 다른경우
                  departmentObject.departmentColor === null ||
                  departmentObject.departmentColor != departmentColor
                ) {
                  departmentObjectToSaveList.push(
                    eachFloorDepartmentObjectList[i]
                  );
                }
              }
            }
            console.log(departmentObjectToSaveList);
          }
          if (departmentObjectToSaveList.length > 0) {
            await this.$store.dispatch(
              "saveDepartments",
              departmentObjectToSaveList
            );
          }
        }

        //이미지 저장
        for (let i = 0; i < this.allFloorList.length; i++) {
          let floorId = this.allFloorList[i].floorId;
          // 층에 이미지가 있다면
          if (this.allImageMap.get(floorId) != null) {
            let file = this.allImageMap.get(floorId).imgPath;
            console.log(file);
            if (typeof file === "string") {
              //dbFile
            } else {
              //File
              let imgData = new FormData();
              imgData.append("imageFile", file);
              let newImage = {};
              newImage.floorId = floorId;
              newImage.imgData = imgData;
              console.log(imgData);
              console.log(newImage);
              this.$store.commit("PUSH_IMAGEOBJECT", newImage);
            }
          }
        }

        await this.$store.dispatch("saveImages");

        this.saveStatus = "done";

        // 다른 건물로 이동할 자리가 있다면
        if (moveSeat) {
          let newSelectedbuilding = {};
          if (moveSeat.length > 0) {
            newSelectedbuilding.buildingId = moveSeat[0].buildingId;
          } else {
            newSelectedbuilding.buildingId = moveSeat.buildingId;
          }

          newSelectedbuilding.buildingName = moveBuildingName;
          this.$store.commit("buildingSelect", newSelectedbuilding);
        }

        //1초 뒤 데이터 리로드
        setTimeout(() => {
          this.$emit("reloadData");
        }, 1000);
      }
    },
    clickSaveBtn() {
      let message = {
        title: this.$i18n.t("titleConfirmSave"),
        body: this.$i18n.t("confirmSave"),
      };
      let options = {
        html: true,
        okText: this.$i18n.t("btnConfirm"),
        cancelText: this.$i18n.t("btnCancel"),
      };
      this.$dialog
        .confirm(message, options)
        .then((dialog) => {
          this.floorCanvas.discardActiveObject();

          this.saveStatus = "saving";
          eventBus.$emit("sendStoreStatus", this.saveStatus);

          this.saveData();
        })
        .catch(() => {
          //console.log("cancel");
        });
    },
    // seat table의 employeeId를 받으면 그에 맞는 정보 알아오기 위함
    getEmployeeObject(employeeId) {
      let employeeInfoList = [];
      let employeeObject = {}; // return 될 Object
      let employeeList = this.$store.state.getStore.allEmployee;

      for (let i = 0; i < employeeList.length; i++) {
        let employee = {};
        employee.name = employeeList[i].name;
        employee.department = employeeList[i].department;
        employee.departmentId = employeeList[i].departmentId;
        employee.number = employeeList[i].number;
        employee.employeeId = employeeList[i].employeeId;

        employeeInfoList.push(employee);
      }

      if (employeeId == null) {
        // 공석
        let employee = {};
        employee.name = null;
        employee.department = null;
        employee.number = null;

        employeeObject = employee;
      } else {
        // 매핑된 자리
        for (let i = 0; i < employeeInfoList.length; i++) {
          if (employeeId === employeeInfoList[i].employeeId) {
            //String
            employeeObject = employeeInfoList[i];
          }
        }
      }
      return employeeObject; // return 받아서 department, name, number 뽑아쓰기
    },
    //부서 아이디로 해당 부서의 색상 리턴하기
    //DB에 저장되어있는 부서색상이 이라면 그것을 반환하고
    //저장되어있지 않고 color값이 null인것은 랜덤컬러를 반환한다.
    getDepartmentColor(departmentId, floorId) {
      let departmentColor = null;

      //층 아이디로 찾은 객체리스트
      let eachFloorDepartmentObjectList = this.getEachDepartmentObjectList(
        floorId
      );

      if (departmentId) {
        for (let j = 0; j < this.allDepartmentObjectList.length; j++) {
          if (this.allDepartmentObjectList[j].departmentId === departmentId) {
            if (this.allDepartmentObjectList[j].departmentColor != null) {
              departmentColor = this.allDepartmentObjectList[j].departmentColor;
            }
            let newDepartmentObject = this.getNewDepartmentObject(
              departmentId,
              this.allDepartmentObjectList[j].departmentName,
              departmentColor
            );

            const idx = eachFloorDepartmentObjectList.findIndex(function (
              departmentObject
            ) {
              return departmentObject.departmentId === departmentId;
            });

            if (idx < 0) {
              eachFloorDepartmentObjectList.push(newDepartmentObject);
            }
          }
        }
        eventBus.$emit("pushDepartmentMap", this.allDepartmentMap);
      } else {
        departmentColor = this.getColor(null);
      }
      return departmentColor;
    },
    makeGroupInfo(seat) {
      let employee = this.getEmployeeObject(seat.employeeId);

      let rectangle = new fabric.Rect({
        width: seat.width,
        height: seat.height,
        fill: this.getDepartmentColor(employee.departmentId, seat.floorId),
        opacity: 1,
        originX: "center",
        originY: "center",
      });

      let textObject = null;
      if (employee.name === null) {
        textObject = new fabric.IText("", {
          left: rectangle.left,
          top: rectangle.top,
          fontSize: parseInt(this.fontSize),
          fill: this.getSeatTextColor(
            this.getDepartmentColor(employee.departmentId, seat.floorId)
          ),
          originX: "center",
          originY: "center",
        });
      } else {
        textObject = new fabric.IText(employee.name, {
          left: rectangle.left,
          top: rectangle.top,
          fontSize: parseInt(this.fontSize),
          fill: this.getSeatTextColor(
            this.getDepartmentColor(employee.departmentId, seat.floorId)
          ),
          originX: "center",
          originY: "center",
        });
      }

      let group = new fabric.Group([rectangle, textObject], {
        seatId: seat.seatId,
        buildingId: seat.buildingId,
        seatName: seat.seatName,
        employeeName: employee.name,
        employeeDepartment: employee.department,
        employeeDepartmentId: employee.departmentId,
        employeeNumber: employee.number,
        employeeId: seat.employeeId,
        floorId: seat.floorId,
        left: seat.x,
        top: seat.y,
        angle: seat.degree,
        isObjFromDB: seat.isObjFromDB,
        httpRequestPostStatus: seat.httpRequestPostStatus,
      });

      this.setToolTipForSeat(group);

      return group;
    },
    loadLatestFloor() {
      //현재 층 이미지 로드
      if (this.latestFloorImageFromDb) {
        for (let i = 0; i < this.latestFloorImageFromDb.length; i++) {
          let newImageObject = {};
          newImageObject.imgPath = this.latestFloorImageFromDb[i].imgPath;
          newImageObject.floorId = this.latestFloorImageFromDb[i].floorId;
          newImageObject.imgFileName = this.latestFloorImageFromDb[
            i
          ].imgFileName;
          newImageObject.imgFileType = this.latestFloorImageFromDb[
            i
          ].imgFileType;

          this.currentSelectedFloorObject.floorId = newImageObject.floorId;
          this.allImageMap.set(newImageObject.floorId, newImageObject);
          this.loadImageDBFile(
            newImageObject.imgPath,
            newImageObject.imgFileType
          );

          // 현재층 자리 로드
          if (this.latestFloorSeatListFromDb.length) {
            for (let i = 0; i < this.latestFloorSeatListFromDb.length; i++) {
              this.currentSelectedFloorObject.floorId = this.latestFloorSeatListFromDb[
                i
              ].floorId;

              let eachFloorSeatList = this.getEachFloorSeatList(
                this.latestFloorSeatListFromDb[i].floorId
              );

              let group = this.makeGroupInfo(this.latestFloorSeatListFromDb[i]);

              this.floorCanvas.add(group);
              eachFloorSeatList.push(group);

              if (this.latestFloorSeatListFromDb[i].employeeId != null) {
                let eachEmployeeSeatList = this.getEachEmployeeSeatList(
                  this.latestFloorSeatListFromDb[i].employeeId
                );
                eachEmployeeSeatList.push(group);
              }
            }
            //자리가 있어야만 보낼 이벤트버스
            eventBus.$emit("pushAllSeatMap", this.allSeatMap);
            eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);
          } else {
            this.currentSelectedFloorObject.floorId = newImageObject.floorId;
          }
        }

        // getStore의 floorIdList 길이가 2 이상이면 다른 층이 있다는 뜻.
        if (this.$store.state.getStore.floorIdList.length > 1) {
          this.loadOtherFloors();
        }
      }
    },
    loadOtherFloors() {
      //다른 층 이미지 로드
      for (let i = 0; i < this.otherFloorImageFromDb.length; i++) {
        let newImageObject = {};
        newImageObject.imgPath = this.otherFloorImageFromDb[i].imgPath;
        newImageObject.floorId = this.otherFloorImageFromDb[i].floorId;
        newImageObject.imgFileName = this.otherFloorImageFromDb[i].imgFileName;
        newImageObject.imgFileType = this.otherFloorImageFromDb[i].imgFileType;

        this.allImageMap.set(newImageObject.floorId, newImageObject);
      }
      //다른 층 자리 로드
      if (this.otherFloorSeatListFromDb) {
        let keys = [];
        keys = Array.from(this.otherFloorSeatListFromDb.keys());

        for (let i = 0; i < keys.length; i++) {
          let seats = [];
          seats = this.otherFloorSeatListFromDb.get(keys[i]);

          for (let j = 0; j < seats.length; j++) {
            let eachFloorSeatList = this.getEachFloorSeatList(seats[j].floorId);

            let group = this.makeGroupInfo(seats[j]);
            eachFloorSeatList.push(group);

            if (seats[j].employeeId != null) {
              let eachEmployeeSeatList = this.getEachEmployeeSeatList(
                seats[j].employeeId
              );
              eachEmployeeSeatList.push(group);
            }
          }
        }
        eventBus.$emit("pushAllSeatMap", this.allSeatMap);
        eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);
      }
    },
  },
};
</script>

<style scoped>
#canvas-container {
  position: relative;
}
#canvas {
  border: 1px solid #000;
  background: white;
  width: 100%;
  height: 100%;
}
#resetZoomButton {
  top: 1%;
  left: 1%;
  position: absolute;
}
#lockButton {
  bottom: 1%;
  left: 1%;
  position: absolute;
}
</style>
