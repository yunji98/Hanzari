<template>
  <div id="assignSeatsScreen">
    <v-toolbar
      id="toolbar"
      color="#2c4f91"
      dark
      elevation="0"
      style="height: 65px"
    >
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
        v-if="canvasButtonStatus === true"
        id="zoomInButton"
        v-on:click="zoomStatus = false"
        @click="clickZoomInButton"
        fab
        small
      >
        <v-icon medium>add</v-icon>
      </v-btn>
      <v-btn
        v-if="canvasButtonStatus === true"
        id="zoomOutButton"
        v-on:click="zoomStatus = false"
        @click="clickZoomOutButton"
        fab
        small
      >
        <v-icon medium>remove</v-icon>
      </v-btn>
      <v-btn
        v-if="canvasButtonStatus === true"
        id="resetZoomButton"
        v-on:click="zoomStatus = false"
        @click="clickResetToRatioBtn"
        fab
        small
      >
        <v-icon medium>my_location</v-icon>
      </v-btn>
      <v-btn
        v-if="canvasButtonStatus === true"
        id="lockButton"
        @click="clickLockBtn"
        fab
        small
      >
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
import { eventBus } from "../main.js";

const SCALE_FACTOR = 1.2;
export default {
  name: "AssignSeats",
  props: ["leftDrawer"],
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
      toolTipSwitchStatus: true,
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

      //캔버스의 기본 스케일 값
      canvasScale: 1,
      canvasOriginalHeight: 843,
      canvasOriginalWidth: 1528,
      windowZoomScale: 1,
      canvasButtonStatus: true,

      tabFocus: false,
      leftTabDrawer: null,
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
    this.leftTabDrawer = this.leftDrawer;

    //선택한 층에 대한 값 받아와서 층 전환하기 위한 event
    eventBus.$on("pushSelectedFloorObject", (floorObject) => {
      if (floorObject) {
        this.currentSelectedFloorObject = floorObject;
        console.log("changeFloor 호출");
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

    eventBus.$on("pushChangeSeatWidth", (seatDragWidth) => {
      this.changeSelectSeatWidth(seatDragWidth);
    });

    eventBus.$on("pushChangeSeatHeight", (seatDragHeight) => {
      this.changeSelectSeatHeight(seatDragHeight);
    });

    //전체 선택 체크박스
    eventBus.$on("pushSelectAllStatus", (selectAllStatus) => {
      if (selectAllStatus) {
        this.selectAllSeat();
      } else {
        console.log(selectAllStatus);
        this.floorCanvas.discardActiveObject();
        this.floorCanvas.requestRenderAll();
      }
    });

    //층의 이름이 변경될시 화면에 표출되는 string값을 바꾸기 위한 event
    eventBus.$on("pushChangedCurrentFloorName", (changedFloorName) => {
      this.currentSelectedFloorObject.floorName = changedFloorName;
    });

    //공석 만들기 스위치 상태값 변경하기 위한 event
    eventBus.$on("pushAddVacantSwitchStatus", (switchStatus) => {
      this.addVacantSwitchStatus = switchStatus;
    });

    //툴팁 껐다 켰다 할 수 있는 event
    eventBus.$on("pushShowToolTipForSeatStatus", (switchStatus) => {
      this.toolTipSwitchStatus = switchStatus;
    });

    //만들고자 하는 공석의 개수를 받기 위한 event
    eventBus.$on("pushSelectedNumberOfAddSeat", (numberOfAddSeat) => {
      this.numberOfAddSeat = numberOfAddSeat;
    });

    //현재 층의 선택된 자리를 삭제하기 위한 상태값(유)을 받기 위한 event
    eventBus.$on("pushDeleteSelectSeatStatus", () => {
      this.deleteBtn();
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
          .catch(() => {});
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
              this.moveSeatToAnotherBuilding(
                moveBuildingId,
                moveBuildingName,
                moveFloorId,
                moveFloorName
              );
            })
            .catch(() => {});
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
      this.allFloorList = allFloorList;
    });

    //모든 층 이미지를 가지고 있는 Map을 받기 위한 event
    eventBus.$on("pushAllImageMap", (allImageMap) => {
      this.allImageMap = allImageMap;
      this.loadImageFile(
        this.allImageMap.get(this.currentSelectedFloorObject.floorId).imgPath
      );
    });

    //탭에서 키보드 이벤트 사용시(텍스트 입력,,) 이 컴포넌트에서 이벤트 없애기 위함
    eventBus.$on("pushFocusStatus", (textFocusStatus) => {
      this.tabFocus = textFocusStatus;
    });

    eventBus.$on("pushNewMemoComment", (memoComment) => {
      this.writeMemo(memoComment);
    });

    //자리 상세정보 라디오에서 선택한 값을 받기 위한 event
    eventBus.$on("pushViewSeatInfo", (viewSeatStatus) => {
      this.viewSeatStatus = viewSeatStatus;
      this.viewSeatInfo();
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
    eventBus.$off("pushChangeSeatWidth");
    eventBus.$off("pushChangeSeatHeight");
    eventBus.$off("pushSelectAllStatus");
    eventBus.$off("pushShowToolTipForSeatStatus");
    eventBus.$off("pushDeleteSelectSeatStatus");
    eventBus.$off("pushAddVacantSwitchStatus");
    eventBus.$off("mappingEmployeeToVacant");
    eventBus.$off("pushAllFloorList");
    eventBus.$off("changeSeatToVacant");
    eventBus.$off("pushAllImageMap");
    eventBus.$off("pushFocusStatus");
    eventBus.$off("pushNewMemoComment");
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
        this.windowZoomScale = window.outerWidth / window.innerWidth;

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

        //브라우저 창의 크기가 원본크기보다 작게 로드할때
        //screenLeft, top은 브라우저창과 컴퓨터화면 사이의 간격임.
        if (window.screenLeft > 0 || window.screenTop > 0) {
          let zoom;

          if (this.canvasOriginalWidth < originalAssignSeatsScreenWidth) {
            zoom = originalAssignSeatsScreenHeight / this.canvasOriginalHeight;

            if (
              zoom * this.canvasOriginalWidth >
              originalAssignSeatsScreenWidth
            ) {
              zoom = originalAssignSeatsScreenWidth / this.canvasOriginalWidth;
            }
          } else {
            zoom = originalAssignSeatsScreenWidth / this.canvasOriginalWidth;

            if (
              zoom * this.canvasOriginalHeight >
              originalAssignSeatsScreenHeight
            ) {
              zoom =
                originalAssignSeatsScreenHeight / this.canvasOriginalHeight;
            }
          }
          this.canvasScale = zoom;

          this.floorCanvas.setHeight(
            this.canvasOriginalHeight * this.canvasScale
          );
          this.floorCanvas.setWidth(
            this.canvasOriginalWidth * this.canvasScale
          );
        } else {
          this.canvasScale = this.windowZoomScale;

          this.floorCanvas.setHeight(
            this.canvasOriginalHeight * this.canvasScale
          );
          this.floorCanvas.setWidth(
            this.canvasOriginalWidth * this.canvasScale
          );
        }

        this.setAnimationForSeat();
        this.setMouseWheel(); //마우스 휠과 Ctrl 키로 zoom in/out
        this.setLeftDragEventForFloorCanvas(); //왼쪽 마우스 드래그 이벤트 함수
        this.setDragDropEventForAddVacantSeat();
        this.setWhenObjectModified();
        this.addKeyEventListener();
        this.ctrlKeyPressedForMultiSelection(); //ctrl키 누르고 도형 선택시 복수선택 가능
        this.whenResizingWindow(); //브라우저 창의 크기를 조절할때 (캔버스 확장/축소됨)

        this.floorCanvas.on("object:moving", (e) => {
          //자리 움직이면 자동으로 도면 움직임이 잠김
          this.lockStatus = false;
          this.moveStatus = true;
          this.setDefaultCursor();
        });
      }
    },
    setDefaultCursor() {
      this.floorCanvas.defaultCursor = "default";
    },
    setMoveCursor() {
      this.floorCanvas.defaultCursor = "move";
    },
    whenResizingWindow() {
      window.onresize = (event) => {
        let assignSeatsScreenWidth = document
          .getElementById("assignSeatsScreen")
          .getBoundingClientRect().width;

        let toolBarItemsHeight = document
          .getElementById("toolbar")
          .getBoundingClientRect().height;

        this.floorCanvas.setHeight(
          window.innerHeight - toolBarItemsHeight - 30
        );
        this.floorCanvas.setWidth(assignSeatsScreenWidth);

        this.floorCanvas.requestRenderAll();
      };
    },
    setAnimationForSeat() {
      this.floorCanvas.on({
        "object:moving": function (e) {
          e.target.opacity = 0.5;
        },
        "object:rotating": function (e) {
          e.target.opacity = 0.5;
        },
        "object:scaling": function (e) {
          e.target.opacity = 0.5;
        },
        "object:modified": function (e) {
          e.target.opacity = 1;
        },
      });
    },
    setMouseWheel() {
      this.floorCanvas.on("mouse:wheel", (opt) => {
        if (!this.floorCanvas.viewportTransform) {
          return;
        }
        let evt = opt.e;
        let deltaY = evt.deltaY;
        this.zoom = this.floorCanvas.getZoom();
        this.zoom = this.zoom - deltaY / 700;
        if (evt.ctrlKey === true) {
          //zoom in and out
          this.floorCanvas.zoomToPoint(
            new fabric.Point(evt.offsetX, evt.offsetY),
            this.zoom
          );
          this.zoomStatus = true;
          this.moveStatus = true;
        }

        opt.e.preventDefault();
        opt.e.stopPropagation();
      });
    },
    // floorcanvas내부에서 mouse up down move감지해서 드래그 되면 어떤일 일어나는지에 대한 함수
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

        let activeObjects = this.floorCanvas.getActiveObjects();
        if (dragStatus) {
          if (event.button === 1) {
            let eachFloorSeatList = this.getEachFloorSeatList(
              this.currentSelectedFloorObject.floorId
            );

            if (activeObjects.length > 0) {
              if (activeObjects.length === eachFloorSeatList.length) {
                eventBus.$emit("pushCheckBoxSelectAllStatus", true);
              }
              activeObjects.forEach((obj) => {
                let width = obj.item(0).get("width") * obj.get("scaleX");
                let height = obj.item(0).get("height") * obj.get("scaleY");
                width = Number(width.toFixed(2));
                height = Number(height.toFixed(2));
                multiSelectionObjectWidthList.push(width);
                multiSelectionObjectHeightList.push(height);
                console.log("mouse:up");
                obj.item(1).set("scaleX", "1");
                obj.item(1).set("scaleY", "1");
              });
              eventBus.$emit(
                "sendDragMultipleSeatList",
                multiSelectionObjectWidthList,
                multiSelectionObjectHeightList
              );

              let comment = activeObjects[0].comment;

              let warn = false;
              for (let i = 1; i < activeObjects.length; i++) {
                if (comment != activeObjects[i].comment) {
                  warn = true;
                  break;
                }
              }

              if (warn) {
                eventBus.$emit("pushMemoComment", "");
              } else {
                eventBus.$emit("pushMemoComment", comment);
              }

              eventBus.$emit(
                "pushManageSeatTabOfSelectedSeatsComponentStatus",
                true
              );
              eventBus.$emit("pushShowSeatTabStatus", true);
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
              this.setDefaultCursor();
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
          this.setMoveCursor();
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
        if (this.ctrlKey) {
          event.selected.forEach((selectedObject) => {
            if (!multiSelectionObjectList.includes(selectedObject)) {
              multiSelectionObjectList.push(selectedObject);
            }
          });

          if (multiSelectionObjectList.length > 0) {
            //selected:cleared(selection된 도형 객체 모두 selection RESET) 이벤트 자동 호출
            this.floorCanvas.discardActiveObject();
          }
        }
      });

      //this.floorCanvas.discardActiveObject()가 호출되면 자동으로 selection:cleared(select된 도형이 없는 시점) 이벤트 함수가 호출됨
      //관리하고있는 multiSelectionObjectList리스트를 multiSelection으로 화면에 표출하기
      this.floorCanvas.on("selection:cleared", (event) => {
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
            eventBus.$emit("pushMemoComment", null);
            eventBus.$emit(
              "pushManageSeatTabOfSelectedSeatsComponentStatus",
              false
            );
            eventBus.$emit("pushCheckBoxSelectAllStatus", false);
            this.tabFocus = false;
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
      if (!this.tabFocus) {
        let key = window.event ? window.event.keyCode : event.keyCode;
        switch (key) {
          case 17:
            this.ctrlKey = true;
            break;
        }
      }
    },
    watchCtrlKeyUp(event) {
      if (!this.tabFocus) {
        let key = window.event ? window.event.keyCode : event.keyCode;
        switch (key) {
          case 17:
            this.ctrlKey = false;
            break;
        }
      }
    },
    manageKeyboard(event) {
      if (!this.tabFocus) {
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
      }
    },
    setWhenObjectModified() {
      this.floorCanvas.on("object:modified", (e) => {
        //자리가 변경되면 도면이 잠금
        this.lockStatus = false;
        this.floorCanvas.selection = true;
        this.setDefaultCursor();

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
    setCanvasZoom(scaleFactor) {
      this.canvasScale = this.canvasScale * scaleFactor;
      this.floorCanvas.setZoom(this.canvasScale);
    },
    clickZoomOutButton() {
      this.setCanvasZoom(1 / SCALE_FACTOR);
    },
    clickZoomInButton() {
      this.setCanvasZoom(SCALE_FACTOR);
    },
    clickResetToRatioBtn() {
      let toolBarItemsHeight = document
        .getElementById("toolbar")
        .getBoundingClientRect().height;

      let originalAssignSeatsScreenWidth = document
        .getElementById("toolbar")
        .getBoundingClientRect().width;
      let originalAssignSeatsScreenHeight =
        window.innerHeight - toolBarItemsHeight - 30;

      let zoom;

      if (this.canvasOriginalWidth < originalAssignSeatsScreenWidth) {
        zoom = originalAssignSeatsScreenHeight / this.canvasOriginalHeight;

        if (zoom * this.canvasOriginalWidth > originalAssignSeatsScreenWidth) {
          zoom = originalAssignSeatsScreenWidth / this.canvasOriginalWidth;
        }
      } else if (this.canvasOriginalWidth > originalAssignSeatsScreenWidth) {
        zoom = originalAssignSeatsScreenWidth / this.canvasOriginalWidth;

        if (
          zoom * this.canvasOriginalHeight >
          originalAssignSeatsScreenHeight
        ) {
          zoom = originalAssignSeatsScreenHeight / this.canvasOriginalHeight;
        }
      } else if (this.canvasOriginalWidth === originalAssignSeatsScreenWidth) {
        zoom = 1;
      }
      this.canvasScale = zoom;

      this.floorCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      this.floorCanvas.setZoom(this.canvasScale);

      this.lockStatus = false;
      this.floorCanvas.selection = true;
      this.setDefaultCursor();
    },
    clickLockBtn() {
      if (!this.lockStatus) {
        this.lockStatus = true;
        this.setMoveCursor();
      } else {
        this.lockStatus = false;
        this.setDefaultCursor();
      }
    },
    changeFloor() {
      this.floorCanvas
        .getObjects()
        .slice()
        .forEach((obj) => {
          this.floorCanvas.remove(obj);
        });
      this.canvasButtonStatus = false;
      this.floorCanvas.discardActiveObject();
      this.floorCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      this.lockStatus = false;
      this.floorCanvas.selection = true;
      this.clipboard = [];
      this.setDefaultCursor();
      this.viewSeatInfo();
      let eachfloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );

      this.seatNumber = 0;

      console.log(this.floorCanvas.backgroundImage);
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
              .imgType,
            false
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
    loadImageDBFile(dbFile, dbType, isFirstLoad) {
      let toolBarItemsHeight = document
        .getElementById("toolbar")
        .getBoundingClientRect().height;

      let originalAssignSeatsScreenWidth = document
        .getElementById("toolbar")
        .getBoundingClientRect().width;

      let originalAssignSeatsScreenHeight =
        window.innerHeight - toolBarItemsHeight - 30;

      this.floorCanvas.setHeight(this.canvasOriginalHeight * this.canvasScale);
      this.floorCanvas.setWidth(this.canvasOriginalWidth * this.canvasScale);
      this.floorCanvas.setZoom(this.canvasScale);

      let imgPath = "data:" + dbType + ";base64," + dbFile;
      fabric.Image.fromURL(
        imgPath,
        (img) => {
          img.set({
            scaleX: this.floorCanvas.width / img.width / this.canvasScale,
            scaleY: this.floorCanvas.height / img.height / this.canvasScale,
          });

          this.floorCanvas.setBackgroundImage(
            img,
            this.floorCanvas.renderAll.bind(this.floorCanvas)
          );

          this.floorCanvas.setHeight(originalAssignSeatsScreenHeight);

          if (this.leftTabDrawer) {
            if (isFirstLoad) {
              this.floorCanvas.setWidth(originalAssignSeatsScreenWidth - 375);
            } else {
              this.floorCanvas.setWidth(originalAssignSeatsScreenWidth);
            }
          } else {
            this.floorCanvas.setWidth(originalAssignSeatsScreenWidth);
          }
          this.canvasButtonStatus = true;
        },
        { crossOrigin: "Anonymous" }
      );
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
        return this.allSeatMap.get(floor);
      } else {
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
            hoverCursor: "pointer",
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

        eventBus.$emit("pushMemoComment", "");
        eventBus.$emit("pushManageSeatTabOfSelectedSeatsComponentStatus", true);

        eventBus.$emit("pushShowSeatTabStatus", true);
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
          .then(() => {
            this.mappingEmployee(employeeObject);
          })
          .catch(() => {
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
          obj.item(1).set("fontFamily", "Nanum Gothic");
        } else if (this.viewSeatStatus === 1) {
          obj.item(1).set("text", employeeObject.number);
          eachFloorSeatList[i].item(1).set("fontFamily", "Nanum Gothic");
        } else if (this.viewSeatStatus === 2) {
          obj.item(1).set("text", employeeObject.department);
          obj.item(1).set("fontFamily", "Nanum Gothic");
        }

        obj.setCoords();

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
    writeMemo(memoComment) {
      let activeObject = this.floorCanvas.getActiveObjects();

      for (let i = 0; i < activeObject.length; i++) {
        activeObject[i].set("httpRequestPostStatus", true);
        activeObject[i].set("comment", memoComment);
      }

      this.saveStatus = "ableSave";
      eventBus.$emit("sendStoreStatus", this.saveStatus);
    },
    deleteBtn() {
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
        .then(() => {
          eventBus.$emit(
            "pushManageSeatTabOfSelectedSeatsComponentStatus",
            false
          );

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
      let temp = [];
      this.clipboard = []; //복사본?
      let activeObject = this.floorCanvas.getActiveObjects();
      let centerLeft = 0;
      let centerTop = 0;

      if (activeObject.length > 1) {
        activeObject.forEach((obj) => {
          temp.push(obj);
          if (centerLeft == 0) {
            centerLeft = obj.group.left;
            centerTop = obj.group.top;
          }
        });
      } else {
        activeObject.forEach((obj) => {
          temp.push(obj);
        });
      }

      this.clipboard = JSON.parse(JSON.stringify(temp));

      for (let i = 0; i < this.clipboard.length; i++) {
        this.clipboard[i].seatId = temp[i].seatId;
        this.clipboard[i].buildingId = temp[i].buildingId;
        this.clipboard[i].employeeDepartment = temp[i].employeeDepartment;
        this.clipboard[i].employeeDepartmentId = temp[i].employeeDepartmentId;
        this.clipboard[i].employeeId = temp[i].employeeId;
        this.clipboard[i].employeeName = temp[i].employeeName;
        this.clipboard[i].employeeNumber = temp[i].employeeNumber;
        this.clipboard[i].comment = temp[i].comment;
        this.clipboard[i].left = centerLeft + temp[i].left;
        this.clipboard[i].top = centerTop + temp[i].top;
        console.log(
          temp[i].width +
            ":" +
            temp[i].scaleX +
            ":" +
            temp[i].height +
            ":" +
            temp[i].scaleY
        );
        this.clipboard[i].width = temp[i].width * temp[i].scaleX;
        this.clipboard[i].height = temp[i].height * temp[i].scaleY;
        this.clipboard[i].objects.pop();
      }
    },
    //paste하기 (ctrl+v)
    pasteSelectedSeat() {
      if (this.clipboard.length === 0) return;

      this.floorCanvas.discardActiveObject();

      this.saveStatus = "ableSave";

      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );
      let eachEmployeeSeatList = null;

      let newSeatNumberArray = [];

      this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      ).forEach((seat) => {
        let splitArray = seat.seatName.split("-");
        newSeatNumberArray.push(splitArray[splitArray.length - 1]);
      });
      if (newSeatNumberArray.length > 0) {
        this.seatNumber = Math.max.apply(null, newSeatNumberArray);
      } else {
        this.seatNumber = 0;
      }

      for (let i = 0; i < this.clipboard.length; i++) {
        let rectangle = new fabric.Rect({
          width: this.clipboard[i].width,
          height: this.clipboard[i].height,
          fill: this.getDepartmentColor(
            this.clipboard[i].employeeDepartmentId,
            this.currentSelectedFloorObject.floorId
          ),
          opacity: this.clipboard[i].opacity,
          originX: "center",
          originY: "center",
        });

        this.seatNumber++;

        this.clipboard[i].seatName =
          this.currentSelectedFloorObject.floorName + "-" + this.seatNumber;

        let textObject = null;

        //공석인 textObject => 이후 사용될 수 있기 때문에 공석도 ""인 텍스트가 필요
        let emptySeatTextObject = new fabric.IText("", {
          left: this.clipboard[i].objects[0].left,
          top: this.clipboard[i].objects[0].top,
          fontSize: parseInt(this.fontSize),
          fill: this.getSeatTextColor(this.getDepartmentColor(null)),
          originX: "center",
          originY: "center",
        });

        if (this.viewSeatStatus === 0) {
          //자리에 사원 이름 보이는 경우
          if (this.clipboard[i].employeeName) {
            textObject = new fabric.IText(this.clipboard[i].employeeName, {
              left: this.clipboard[i].objects[0].left,
              top: this.clipboard[i].objects[0].top,
              fontSize: parseInt(this.fontSize),
              fill: this.getSeatTextColor(
                this.getDepartmentColor(
                  this.clipboard[i].employeeDepartmentId,
                  this.currentSelectedFloorObject.floorId
                )
              ),
              originX: "center",
              originY: "center",
            });
          } else {
            textObject = emptySeatTextObject;
          }
        }
        //자리에 내선번호만 보이는 경우
        else if (this.viewSeatStatus === 1) {
          if (this.clipboard[i].employeeNumber) {
            textObject = new fabric.IText(this.clipboard[i].employeeNumber, {
              left: this.clipboard[i].objects[0].left,
              top: this.clipboard[i].objects[0].top,
              fontSize: parseInt(this.fontSize),
              fill: this.getSeatTextColor(
                this.getDepartmentColor(
                  this.clipboard[i].employeeDepartmentId,
                  this.currentSelectedFloorObject.floorId
                )
              ),
              originX: "center",
              originY: "center",
            });
          } else {
            textObject = emptySeatTextObject;
          }
        } //자리에 부서명만 보이는 경우
        else if (this.viewSeatStatus === 2) {
          if (this.clipboard[i].employeeDepartment) {
            textObject = new fabric.IText(
              this.clipboard[i].employeeDepartment,
              {
                left: this.clipboard[i].objects[0].left,
                top: this.clipboard[i].objects[0].top,
                fontSize: parseInt(this.fontSize),
                fill: this.getSeatTextColor(
                  this.getDepartmentColor(
                    this.clipboard[i].employeeDepartmentId,
                    this.currentSelectedFloorObject.floorId
                  )
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
          textObject = new fabric.IText(this.clipboard[i].seatName, {
            left: this.clipboard[i].objects[0].left,
            top: this.clipboard[i].objects[0].top,
            fontSize: parseInt(this.fontSize),
            fill: this.getSeatTextColor(
              this.getDepartmentColor(
                this.clipboard[i].employeeDepartmentId,
                this.currentSelectedFloorObject.floorId
              )
            ),
            originX: "center",
            originY: "center",
          });
        }

        let scaleX =
          this.clipboard[i].width /
          (this.clipboard[i].width * this.clipboard[i].scaleX);
        let scaleY =
          this.clipboard[i].height /
          (this.clipboard[i].height * this.clipboard[i].scaleX);

        textObject.set("lockScalingX", true);
        textObject.set("lockScalingY", true);
        textObject.set("scaleX", scaleX);
        textObject.set("scaleY", scaleY);

        let group = new fabric.Group([rectangle, textObject], {
          hoverCursor: "pointer",
          seatId: this.createSeatUUID(),
          buildingId: this.clipboard[i].buildingId,
          seatName: this.clipboard[i].seatName,
          employeeName: this.clipboard[i].employeeName,
          employeeDepartment: this.clipboard[i].employeeDepartment,
          employeeDepartmentId: this.clipboard[i].employeeDepartmentId,
          employeeNumber: this.clipboard[i].employeeNumber,
          employeeId: this.clipboard[i].employeeId,
          floorId: this.currentSelectedFloorObject.floorId,
          left: this.clipboard[i].left + 10,
          top: this.clipboard[i].top + 10,
          angle: this.clipboard[i].degree,
          comment: this.clipboard[i].comment,
          isObjFromDB: this.clipboard[i].isObjFromDB,
          httpRequestPostStatus: this.clipboard[i].httpRequestPostStatus,
        });

        this.clipboard[i].objects.push(textObject);

        this.setToolTipForSeat(group);

        if (group === "activeSelection") {
          group.canvas = this.floorCanvas;
          group.forEachObject(function (obj) {
            this.floorCanvas.add(obj);
          });
          group.setCoords();
        } else {
          this.floorCanvas.add(group);
        }

        this.floorCanvas.setActiveObject(group);
        this.floorCanvas.requestRenderAll();

        eachFloorSeatList.push(group);

        eachEmployeeSeatList = this.getEachEmployeeSeatList(
          this.clipboard[i].employeeId
        );
        eachEmployeeSeatList.push(this.clipboard[i]);

        this.clipboard[i].left += 10;
        this.clipboard[i].top += 10;
      }

      eventBus.$emit("sendStoreStatus", this.saveStatus);
      eventBus.$emit("pushAllSeatMap", this.allSeatMap);
      eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);
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

      let activeObjects = this.floorCanvas.getActiveObjects();

      let comment = activeObjects[0].comment;

      let warn = false;
      for (let i = 1; i < activeObjects.length; i++) {
        if (comment != activeObjects[i].comment) {
          warn = true;
          break;
        }
      }

      if (warn) {
        eventBus.$emit("pushMemoComment", "");
      } else {
        eventBus.$emit("pushMemoComment", comment);
      }
      eventBus.$emit("pushManageSeatTabOfSelectedSeatsComponentStatus", true);
      eventBus.$emit("pushCheckBoxSelectAllStatus", true);
      eventBus.$emit("pushShowSeatTabStatus", true);
    },
    showContextMenuOfOneSeat(clientX, clientY) {
      this.contextMenuStatus = false;
      this.contextMenuXLocation = clientX + 20;
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
        if (this.toolTipSwitchStatus) {
          let group = event.target;
          if (group != null) {
            let posX = event.e.clientX;
            let posY = event.e.clientY;

            console.log("group width is " + group.width * group.scaleX);

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
        }
      });

      group.on("mousedown", (event) => {
        //context menu 관련
        if (event.button === 3) {
          this.floorCanvas.setActiveObject(group);
          this.floorCanvas.requestRenderAll();

          let posX = event.e.clientX;
          let posY = event.e.clientY;

          event.e.preventDefault();
          event.e.stopPropagation();

          this.showContextMenuOfOneSeat(posX, posY);
        }

        //두번째 탭 크기,메모 관련
        this.moveStatus = true;
        if (this.lockStatus === true && this.moveStatus === true) {
          this.lockStatus = false;
          this.setDefaultCursor();
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
        let objWidth = group.width * group.scaleX;
        let objHeight = group.height * group.scaleY;

        objWidth = Number(objWidth.toFixed(2));
        objHeight = Number(objHeight.toFixed(2));

        eventBus.$emit("sendDragSeatInformation", objWidth, objHeight);

        let activeObjects = this.floorCanvas.getActiveObjects();

        if (activeObjects.length > 1) {
          let comment = activeObjects[0].comment;

          let warn = false;
          for (let i = 1; i < activeObjects.length; i++) {
            if (comment != activeObjects[i].comment) {
              warn = true;
              break;
            }
          }

          if (warn) {
            eventBus.$emit("pushMemoComment", "");
          } else {
            eventBus.$emit("pushMemoComment", comment);
          }
        } else {
          eventBus.$emit("pushMemoComment", group.comment);
        }
        eventBus.$emit("pushManageSeatTabOfSelectedSeatsComponentStatus", true);
        eventBus.$emit("pushShowSeatTabStatus", true);
      });

      group.on("mouseout", () => {
        this.toolTipStatus = false;
      });

      group.on("scaling", () => {
        //자리 크기가 변화되면 자동으로 도면 움직임이 잠김
        this.lockStatus = false;
        this.moveStatus = true;
        this.setDefaultCursor();

        let textObject = group.item(1);
        //let scaleX = group.width / (group.width * group.scaleX);
        //let scaleY = group.height / (group.height * group.scaleX);
        let width = group.width * group.scaleX;
        let height = group.height * group.scaleY;
        textObject.set("lockScalingX", true);
        textObject.set("lockScalingY", true);
        textObject.set("scaleX", 1);
        textObject.set("scaleY", 1);
        group.setCoords();

        width = Number(width.toFixed(2));
        height = Number(height.toFixed(2));
        eventBus.$emit("sendDragSeatInformation", width, height);
      });

      group.on("scaled", (event) => {
        //자리 크기가 변화되면 자동으로 도면 움직임이 잠김
        this.lockStatus = false;
        this.moveStatus = true;
        this.setDefaultCursor();

        let textObject = group.item(1);
        let width = group.width * group.scaleX;
        let height = group.height * group.scaleY;

        textObject.set("lockScalingX", true);
        textObject.set("lockScalingY", true);
        textObject.set("scaleX", 1);
        textObject.set("scaleY", 1);
        group.set("scaleX", 1);
        group.set("scaleY", 1);

        group.item(0).set("width", width);
        group.item(0).set("height", height);
        group.set("width", width);
        group.set("height", height);
        group.setCoords();

        width = Number(width.toFixed(2));
        height = Number(height.toFixed(2));
        eventBus.$emit("sendDragSeatInformation", width, height);
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
          seat.set("top", 0);
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
          this.saveFromCSVFileToDB(files[0]);
        })
        .catch(() => {
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
            eachFloorSeatList[i].item(1).set("fontFamily", "Nanum Gothic");
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
            eachFloorSeatList[i].item(1).set("fontFamily", "Nanum Gothic");
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
            eachFloorSeatList[i].item(1).set("fontFamily", "Nanum Gothic");
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
            eachFloorSeatList[i].item(1).set("fontFamily", "Nanum Gothic");
          }
        }
      }

      this.floorCanvas.renderAll();
    },
    changeSelectSeatWidth(seatWidth) {
      let activeObjectList = [];
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

        //-1을 수정함
        obj.set("width", seatWidth);
        obj.item(0).set("width", seatWidth);
        obj.set("dirty", true);
        obj.set("httpRequestPostStatus", true);
        activeObjectList.push(obj);

        this.floorCanvas.renderAll();
        this.saveStatus = "ableSave";
      });

      this.floorCanvas.getObjects().forEach((obj) => {
        newSeatList.push(obj);
      });

      this.allSeatMap.set(this.currentSelectedFloorObject.floorId, newSeatList);

      eventBus.$emit("pushAllSeatMap", this.allSeatMap);

      this.floorCanvas.discardActiveObject();

      let activeSelection = new fabric.ActiveSelection(activeObjectList, {
        canvas: this.floorCanvas,
      });
      this.floorCanvas.setActiveObject(activeSelection);

      this.floorCanvas.requestRenderAll();
    },
    changeSelectSeatHeight(seatHeight) {
      let activeObjectList = [];
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

        //-1을 수정함
        obj.set("height", seatHeight);
        obj.item(0).set("height", seatHeight);
        obj.set("dirty", true);
        obj.set("httpRequestPostStatus", true);
        activeObjectList.push(obj);

        this.floorCanvas.renderAll();
        this.saveStatus = "ableSave";
      });

      this.floorCanvas.getObjects().forEach((obj) => {
        newSeatList.push(obj);
      });

      this.allSeatMap.set(this.currentSelectedFloorObject.floorId, newSeatList);

      eventBus.$emit("pushAllSeatMap", this.allSeatMap);

      this.floorCanvas.discardActiveObject();

      let activeSelection = new fabric.ActiveSelection(activeObjectList, {
        canvas: this.floorCanvas,
      });
      this.floorCanvas.setActiveObject(activeSelection);

      this.floorCanvas.requestRenderAll();
    },
    downloadURI(uri, name) {
      var link = document.createElement("a");
      if (typeof link.download === "string") {
        link.href = uri;
        link.download = name;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(uri);
      }
    },
    captureBtn() {
      html2canvas(document.querySelector("#canvas")).then((canvas) => {
        let dataUrl = document.getElementById("canvas").toDataURL();
        let dataName = this.allImageMap.get(
          this.currentSelectedFloorObject.floorId
        ).imgFileName;
        this.downloadURI(dataUrl, dataName);
      });
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
      if (this.allFloorList) {
        //db로 보낼 자리 삭제
        if (this.$store.state.deleteStore.deleteSeatIdList.length > 0) {
          await this.$store.dispatch("deleteSeatWithKey");
        }

        //db로 보낼 층 삭제
        if (this.$store.state.deleteStore.deleteFloorIdList.length) {
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
              "comment",
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
              seatData.comment = groupToObject.comment;
              seatData.shape_id = "1";

              this.$store.commit("PUSH_SEATLIST", seatData);
            }
          }
        }

        // 다른 건물로 이동할 자리가 있다면
        if (moveSeat) {
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
            seatData.comment = moveSeat[i].comment;
            seatData.shape_id = "1";

            this.$store.commit("PUSH_SEATLIST", seatData);
          }
        }

        await this.$store.dispatch("saveSeats");

        //부서 색 저장(새로운 부서의 사원이 매핑되고 저장되었을 경우에만 부서객체를 저장한다.)
        if (this.allDepartmentMap) {
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
            if (typeof file === "string") {
              //dbFile
            } else {
              //File
              let imgData = new FormData();
              imgData.append("imageFile", file);
              let newImage = {};
              newImage.floorId = floorId;
              newImage.imgData = imgData;
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
        .catch(() => {});
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
        textObject.set("fontFamily", "Nanum Gothic");
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
        textObject.set("fontFamily", "Nanum Gothic");
      }

      let group = new fabric.Group([rectangle, textObject], {
        hoverCursor: "pointer",
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
        comment: seat.comment,
        isObjFromDB: seat.isObjFromDB,
        httpRequestPostStatus: seat.httpRequestPostStatus,
      });

      this.setToolTipForSeat(group);

      return group;
    },
    loadLatestFloor() {
      //현재 층 이미지 로드
      let newImageObject = {};
      if (this.latestFloorImageFromDb) {
        for (let i = 0; i < this.latestFloorImageFromDb.length; i++) {
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

          this.floorCanvas.setZoom(this.canvasScale);
          this.loadImageDBFile(
            newImageObject.imgPath,
            newImageObject.imgFileType,
            true
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
  background: white;
  width: 100%;
  height: 100%;
}
#zoomInButton {
  top: 1.5%;
  left: 1%;
  position: absolute;
}
#zoomOutButton {
  top: 7.5%;
  left: 1%;
  position: absolute;
}
#resetZoomButton {
  top: 13.5%;
  left: 1%;
  position: absolute;
}
#lockButton {
  bottom: 1.5%;
  left: 1%;
  position: absolute;
}
</style>
