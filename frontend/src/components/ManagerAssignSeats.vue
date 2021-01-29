<template>
  <div id="assignSeatsScreen">
    <v-toolbar color="#2c4f91" dark>
      <v-spacer></v-spacer>
      <h3>
        <span>{{ $store.state.buildingStore.building.buildingName }}</span>
      </h3>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-sm-and-down">
        <v-icon v-if="lockStatus === false" size="30px">lock</v-icon>
        <v-icon v-if="lockStatus === true" size="30px">no_encryption</v-icon>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-container fluid v-bind="attrs" v-on="on">
              <v-switch
                v-model="lockStatus"
                color="white"
                inset
              ></v-switch> </v-container
          ></template>
          <span>{{ this.$t("tooltipPanMode") }}</span>
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

        <v-menu bottom rounded offset-y>
          <template v-slot:activator="{ on: onCard }">
            <v-btn text v-on="onCard">
              <v-icon size="30px">settings_applications</v-icon>
            </v-btn>
          </template>
          <v-card min-width="250px">
            <v-list-item-content class="justify-center">
              <div class="mx-auto text-center">
                <v-row>
                  <v-col cols="12" sm="3"
                    ><v-tooltip bottom>
                      <template v-slot:activator="{ on, attrs }">
                        <v-icon size="30px" v-bind="attrs" v-on="on"
                          >preview</v-icon
                        >
                      </template>
                      <span>{{ viewSeatInfiTooltipText }}</span>
                    </v-tooltip> </v-col
                  ><v-col cols="12" sm="8">
                    <v-radio-group
                      @change="viewSeatInfo"
                      v-model="viewSeatStatus"
                      row
                    >
                      <v-radio
                        :label="$t('contextMenuViewSeatAboutEmployeeName')"
                        :value="0"
                      ></v-radio>
                      <v-radio
                        :label="$t('contextMenuViewSeatAboutNumber')"
                        :value="1"
                      ></v-radio>
                      <v-radio
                        :label="$t('contextMenuViewSeatAboutDepartment')"
                        :value="2"
                      ></v-radio>
                      <v-radio
                        :label="$t('contextMenuViewSeatAboutName')"
                        :value="3"
                      ></v-radio> </v-radio-group></v-col
                ></v-row>

                <v-divider class="mx-4"></v-divider>
                <v-row>
                  <v-col cols="12" sm="3"
                    ><v-tooltip bottom>
                      <template v-slot:activator="{ on, attrs }">
                        <v-icon size="30px" v-bind="attrs" v-on="on"
                          >opacity</v-icon
                        ></template
                      >
                      <span>{{ this.$t("tooltipSetOpacity") }}</span>
                    </v-tooltip> </v-col
                  ><v-col cols="12" sm="7">
                    <v-slider
                      v-model="seatOpacity"
                      @change="changeSeatOpacity"
                      :step="0.25"
                      :min="0"
                      :max="1"
                      class="align-center"
                    ></v-slider
                  ></v-col>
                </v-row>
              </div>
            </v-list-item-content>
          </v-card>
        </v-menu>
      </v-toolbar-items>
    </v-toolbar>
    <div id="toolBarItems">
      <v-toolbar-items>
        <v-btn
          color="blue"
          v-if="zoomStatus"
          v-on:click="zoomStatus = false"
          @click="clickResetToRatioBtn"
          text
        >
          <v-icon color="blue" x-large>zoom_out</v-icon>
          {{ this.$t("resetRatio") }}
        </v-btn>
        <v-spacer></v-spacer>

        <v-spacer></v-spacer>
        <v-btn
          v-if="saveStatus === 'ableSave'"
          @click="clickSaveBtn"
          color="red"
          text
        >
          <v-icon color="red" x-large>save</v-icon>{{ this.$t("btnSave") }}
        </v-btn>
        <v-btn v-else-if="saveStatus === 'saving'" color="red" text>
          <v-icon color="red" x-large>autorenew</v-icon
          >{{ this.$t("btnSaving") }}
        </v-btn>
        <v-btn v-else-if="saveStatus === 'done'" color="red" text>
          <v-icon color="red" x-large>done</v-icon>{{ this.$t("btnSaveDone") }}
        </v-btn>
      </v-toolbar-items>
    </div>
    <canvas
      ref="canvas"
      class="canvas"
      id="canvas"
      height="770px"
      width="1153px"
      style="text-align: center"
    ></canvas>
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
import { eventBus } from "../main.js";

const HOST = "http://172.30.6.192:8082";
export default {
  name: "AssignSeats",
  data() {
    return {
      floorCanvas: null,

      //��
      zoom: 1,
      zoomStatus: false,
      lockStatus: false,
      moveStatus: false,
      panning: null,

      viewSeatStatus: 0,

      //��Ʈ ������
      fontSize: 10,

      // �ڸ� ������
      seatOpacity: 1,

      //Ű���� ctrl
      ctrlKey: false,

      //���� �� ��ü
      currentSelectedFloorObject: null,

      //DB�κ��� �ҷ��� List OR Map
      allFloorList: this.$store.state.getStore.allFloor, // �� ��ü ����Ʈ
      allDepartmentObjectList: this.$store.state.getStore.allDepartment, // �μ� ��ü ����Ʈ

      latestFloorImageFromDb: this.$store.state.getStore.latestFloorImage,
      otherFloorImageFromDb: this.$store.state.getStore.otherFloorsImageList,

      latestFloorSeatListFromDb: this.$store.state.getStore.latestFloorSeatList,
      otherFloorSeatListFromDb: this.$store.state.getStore.otherFloorsSeatMap,

      //�����Ǿ� �ʿ��� List OR Map
      allImageMap: null, //��� �̹��� ����� �ε��� �� �ִ� Map <FloorId, ImgPath>
      allDepartmentMap: null, //�μ��̸�, �μ����̵�, �μ������� ������ �� �ִ� Map <FloorId, DepartmentObject>
      allSeatMap: null, //�ڸ� Map <FloorId, �ڸ�����Ʈ>
      eachEmployeeSeatMap: null, //�� ����� �ڸ� Map <EmployeeId, �ڸ�����Ʈ>

      //ƫ��
      toolTipStatus: false,
      toolTipXLocation: 100,
      toolTipYLocation: 100,
      toolTipColor: null,
      toolTipText: null,
      viewSeatInfiTooltipText: this.$i18n.t("tooltipViewSeatInfo"),
      csvTooltipText: this.$i18n.t("tooltipCSVBtn"),

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

      //���� ���¸� �����ϱ� ���� ����
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

    if (this.allFloorList && this.allFloorList.length) {
      this.currentSelectedFloorObject = this.allFloorList[
        this.allFloorList.length - 1
      ];
    }

    //������ ���� ���� �� �޾ƿͼ� �� ��ȯ�ϱ� ���� event
    eventBus.$on("pushSelectedFloorObject", (floorObject) => {
      if (floorObject) {
        this.currentSelectedFloorObject = floorObject;
        this.changeFloor();
      } else {
        //��� �� ������
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

    //������ ����� �����ϰ��� �Լ��� ȣ���ϱ� ���� event
    eventBus.$on("mappingEmployeeToVacant", (employeeObject) => {
      this.mappingEmployeeToVacant(employeeObject);
    });

    //�ڸ��� ����� ����� �������� �ٲٴ� �Լ��� ȣ���ϱ� ���� event
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

    //��� �� ��ü�� ������ �ִ� ����Ʈ�� �ޱ� ���� event
    eventBus.$on("pushAllFloorList", (allFloorList) => {
      console.log(allFloorList);
      this.allFloorList = allFloorList;
    });

    //��� �� �̹����� ������ �ִ� Map�� �ޱ� ���� event
    eventBus.$on("pushAllImageMap", (allImageMap) => {
      this.allImageMap = allImageMap;
      this.loadImageFile(
        this.allImageMap.get(this.currentSelectedFloorObject.floorId).imgPath
      );
    });

    //�ڸ� ���̶���Ʈ �ϴ� �Լ��� ȣ���ϱ� ���� event
    eventBus.$on("showSeatHighlight", (seatObject) => {
      this.showSeatHighlight(seatObject);
    });

    //�ڸ� ���̶���Ʈ �ϴ� �Լ��� ȣ���ϱ� ���� event
    eventBus.$on("showDepartmentSeatHighlight", (departmentObjectId) => {
      this.showDepartmentSeatHighlight(departmentObjectId);
    });
  },
  mounted() {
    this.initializing();
    this.loadLatestFloor(); //�ֽ� �� �̹����� �ڸ� �ε�
  },
  beforeDestroy() {
    eventBus.$off("pushSelectedFloorObject");
    eventBus.$off("mappingEmployeeToVacant");
    eventBus.$off("pushAllFloorList");
    eventBus.$off("changeSeatToVacant");
    eventBus.$off("pushAllImageMap");
    eventBus.$off("showSeatHighlight");
    eventBus.$off("showDepartmentSeatHighlight");

    document.removeEventListener("keydown", this.watchCtrlKeyDown);
    document.removeEventListener("keydown", this.manageKeyboard);
    document.removeEventListener("keyup", this.watchCtrlKeyUp);
  },
  methods: {
    initializing() {
      //canvas, map ����
      if (this.floorCanvas == null) {
        const ref = this.$refs.canvas;
        this.floorCanvas = new fabric.Canvas(ref, {
          fireRightClick: true, //enable firing of right click events
          fireMiddleClick: true, //enable firing of middle click events
          stopContextMenu: true, //prevent context menu from showing
          imageSmoothingEnabled: false,
          enableRetinaScaling: false,
        });

        this.setMouseWheel(); //���콺 �ٰ� Ctrl Ű�� zoom in/out
        this.addKeyEventListener();
        this.ctrlKeyPressedForMultiSelection(); //ctrlŰ ������ ���� ���ý� �������� ����
        this.blockMultiObjectMovementAndScale(); // �������� �ڸ� ������ �̵� �� ������ ���� ����
        this.whenResizingWindow(); //������ â�� ũ�⸦ �����Ҷ� (ĵ���� Ȯ��/��ҵ�)
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
          .getElementById("toolBarItems")
          .getBoundingClientRect().height;

        let zoom;

        if (1153 < assignSeatsScreenWidth) {
          zoom =
            (window.innerHeight -
              toolBarItemsHeight -
              toolBarItemsHeight -
              assignSeatsScreenTop) /
            770;

          if (zoom * 1153 > assignSeatsScreenWidth) {
            zoom = assignSeatsScreenWidth / 1153;
          }
        } else {
          zoom = assignSeatsScreenWidth / 1153;

          if (
            zoom * 770 >
            window.innerHeight -
              toolBarItemsHeight -
              toolBarItemsHeight -
              assignSeatsScreenTop
          ) {
            zoom =
              (window.innerHeight -
                toolBarItemsHeight -
                toolBarItemsHeight -
                assignSeatsScreenTop) /
              770;
          }
        }
        this.floorCanvas.setZoom(zoom);

        /*this.floorCanvas.setHeight(
          window.innerHeight -
            toolBarItemsHeight -
            toolBarItemsHeight -
            assignSeatsScreenTop
        );*/
        this.floorCanvas.setHeight(770);
        this.floorCanvas.setWidth(assignSeatsScreenWidth);
        this.floorCanvas.requestRenderAll();
        this.floorCanvas.calcOffset();
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
        this.zoom = this.zoom - deltaY / 300;

        if (evt.ctrlKey === true) {
          if (this.zoom > 10) this.zoom = 10;
          else if (this.zoom < 1) this.zoom = 1;
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
    ctrlKeyPressedForMultiSelection() {
      let multiSelectionObjectList = [];
      let activeSelection = null;

      //selection:created(�ʱ� ������ select�� ����)�� ���� ��ü�� multiSelectionObjectList ����Ʈ�� push�ϱ�
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

      //selection:updated(selection�� �ٲ���� ����)�� ���� ��ü�� multiSelectionObjectList ����Ʈ�� push�ϱ�
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
            //selected:cleared(selection�� ���� ��ü ��� selection RESET) �̺�Ʈ �ڵ� ȣ��
            this.floorCanvas.discardActiveObject();
          }
        }
      });

      //this.floorCanvas.discardActiveObject()�� ȣ��Ǹ� �ڵ����� selection:cleared(select�� ������ ���� ����) �̺�Ʈ �Լ��� ȣ���
      //�����ϰ��ִ� multiSelectionObjectList����Ʈ�� multiSelection���� ȭ�鿡 ǥ���ϱ�
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

      //select�� ������ ������ �����ϰ��ִ� �迭�� ActiveSelection��ü �ʱ�ȭ�ϰ�, selection �ʱ�ȭ�ϱ�
      this.floorCanvas.on("mouse:down", (event) => {
        if (event.button === 1) {
          if (event.target) {
          } else {
            multiSelectionObjectList = [];
            activeSelection = null;

            this.floorCanvas.discardActiveObject();
          }
        }
      });
    },
    blockMultiObjectMovementAndScale() {
      this.floorCanvas.on("selection:created", ({ selected, target }) => {
        if (selected.some((obj) => obj.lockMovementX)) {
          target.lockMovementX = true;
        }
        if (selected.some((obj) => obj.lockMovementY)) {
          target.lockMovementY = true;
        }
        if (selected.some((obj) => obj.lockScalingX)) {
          target.lockScalingX = true;
        }
        if (selected.some((obj) => obj.lockScalingY)) {
          target.lockScalingY = true;
        }
      });
    },
    addKeyEventListener() {
      //ctrlŰ�� down/up�ɶ� ctrlKey ���� �˸°� ��ȯ�ϱ�
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
      if (this.ctrlKey) {
        switch (key) {
          case 65:
            //browser�� ������ ��ü���� block
            event.preventDefault();
            event.stopPropagation();
            this.selectAllSeat();
            break;
        }
      }
    },
    clickResetToRatioBtn() {
      this.floorCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      this.lockStatus = false;
      this.floorCanvas.selection = true;
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
        //���� ���� �׸� �������� �ִٸ�
        if (eachfloorSeatList) {
          for (let i = 0; i < eachfloorSeatList.length; i++) {
            this.floorCanvas.add(eachfloorSeatList[i]);
          }
          eventBus.$emit("pushAllSeatMap", this.allSeatMap);
        }
      } else if (
        this.allImageMap.get(this.currentSelectedFloorObject.floorId) == null
      ) {
        //���� ���� �̹����� ����Ǿ����� �ʴٸ� ȭ�鿡 �׷����ִ� �̹����� ���� �ʱ�ȭ
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
    //������ ����
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
    //�� ���� ���� ����Ʈ ��ȯ�ϱ�
    getEachFloorSeatList: function (floor) {
      if (!floor) {
        // �ʹݿ� ���� ���� �ȵǾ�����
        return;
      }
      //���� �ش��ϴ� ��������Ʈ�� ��������� �ʾ����� �� ���� ���� ����Ʈ �����ϱ�
      if (!this.allSeatMap.get(floor)) {
        let newSeatsList = [];
        this.allSeatMap.set(floor, newSeatsList);
        //console.log(this.allSeatMap.size + "allSeatMap ó���� �ڸ� �� �������Դϴ�");
        return this.allSeatMap.get(floor);
      } else {
        //console.log(this.allSeatMap.size + "allSeatMap ���� �ڸ� �� �������Դϴ�" );
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
    //����� �ڸ�����Ʈ���� ������ �ڸ��� �����ϱ�
    deleteEachEmployeeSeatList: function (groupToObject) {
      //���ε� �ڸ��϶�
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
        //�� ����� �ڸ��� �������� ����ڸ� �ʿ��� �����ϱ� ����.
        let eachEmployeeSeat = this.eachEmployeeSeatMap.get(
          groupToObject.employeeId
        );
        if (eachEmployeeSeat.length === 0) {
          this.eachEmployeeSeatMap.delete(groupToObject.employeeId);
        }
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
      };

      if (departmentId === null) {
        return Colors.vacantColor;
      }
    },
    //���ο� department��ü�� ��ȯ
    getNewDepartmentObject(departmentId, departmentName, departmentColor) {
      let newDepartmentObject = {};
      newDepartmentObject.departmentId = departmentId; //�μ� ���̵�� ���濹��
      newDepartmentObject.departmentName = departmentName; //�μ� �̸�
      newDepartmentObject.departmentColor = departmentColor; //�μ� ����
      return newDepartmentObject;
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
    //this.allDepartmentMap���� �μ����� ã�� ��ȯ�ϱ�, ���ٸ�
    //db�� �μ����� null�� ���� �����÷��� ��ȯ�ϱ� (�ӽ� ���)
    getDepartmentObjectColor(employeeObject) {
      let departmentColor = null;
      let allFloorDepartmentObjectIndex = 0;
      let eachFloorDepartmentObjectList = this.getEachDepartmentObjectList(
        this.currentSelectedFloorObject.floorId
      ); //�� ���̵�� ã�� �������� �μ���ü����Ʈ
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

      //allDepartmentMap�� �ش� �μ��� �μ����� ������ �Ǿ��ִ°� �ϳ��� ������
      //�� �μ��� �μ����� ã�´�.
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
      //allDepartmentMap�� �ش� �μ��� �μ����� ������ �Ǿ��ִ°� �ϳ��� ������
      else {
        //db�κ��� �޾ƿ� �μ� ��ü ����Ʈ���� �� �μ��� �μ����� null�� �ƴϰ� ���� ������ִٸ� �װ��� ã�´�.
        //null�̶�� �������� �ش�. (�ӽù��)
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
      //�ڸ� �ϳ��� ���� �� ���� �� �ڸ�����Ʈ���� �ش� �ڸ��� ���εǾ��ִ� ����� �μ��� �˻��Ͽ�
      const idx = listToFind.findIndex((seatObject) => {
        return seatObject.employeeDepartmentId === departmentId;
      });

      //�˻��Ͽ� index�� ���ٸ�
      //(��, ���� �� �ڸ�����Ʈ���� ������ �ڸ��� ���εǾ��ִ� ����� �μ��� ���� �μ��� �����ʴٸ� ���� ���� �� �μ��� ���ٴ� ������
      //���� ���� �μ��� eachFloorDepartmentObjectList���� �� �μ� ��ü�� �����,
      //DepartmentColorChips������Ʈ���� �ٲ� allDepartmentMap�� �˷��ش�.)
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
    //���� �ڸ��� ��� �����ϴ� �Լ�
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
            this.mappingEmployee(employeeObject);
          })
          .catch(() => {
            return;
          });
      } else {
        this.mappingEmployee(employeeObject);
      }
    },
    //�ڸ��� ����� �����ϴ� �Լ�
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
          // �ٸ� ����� ���ε� �ڸ�
          let groupToObject = obj.toObject([
            "seatId",
            "employeeId",
            "employeeDepartmentId",
          ]);
          beforeChangedDepartmentId = groupToObject.employeeDepartmentId;
          this.deleteEachEmployeeSeatList(groupToObject);
        }
        // �ٸ� ����� ���ε� �ڸ� �Ǵ� ����
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
    //����� ���ε� �ڸ��� �������� ����� �Լ�
    changeSeatToVacant() {
      let eachFloorSeatList = this.getEachFloorSeatList(
        this.currentSelectedFloorObject.floorId
      );

      let eachFloorDepartmentObjectList = this.getEachDepartmentObjectList(
        this.currentSelectedFloorObject.floorId
      ); //�� ���̵�� ã�� �μ���ü ����Ʈ

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
    selectAllSeat() {
      if (this.floorCanvas.getActiveObject()) {
        if (
          this.floorCanvas.getActiveObjects().length ===
          this.floorCanvas.getObjects().length
        ) {
          return;
        } else {
          //������ active �� �ڸ� �����ϱ� => �ٽ� active �ڸ���� ���� ����
          this.floorCanvas.discardActiveObject();
        }
      }

      let seats = new fabric.ActiveSelection(this.floorCanvas.getObjects(), {
        canvas: this.floorCanvas,
      });
      this.floorCanvas.setActiveObject(seats);
      this.floorCanvas.requestRenderAll();
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
    //�ڸ� ���̶���Ʈ
    showSeatHighlight(seatObject) {
      let seatFloor = null;
      //seat�� ���� �������� ���� �ʴٸ�
      if (this.currentSelectedFloorObject.floorId != seatObject.floorId) {
        seatFloor = seatObject.floorId;
      }
      //seat�� ���� �������� ���ٸ�
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

          //�� ���� ����� ���� ����Ʈ ȭ�鿡 �ѷ��ֱ�
          //���� ���� �̹����� ����Ǿ��ִٸ�
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

          //3�� �� ���� ������
          setTimeout(() => {
            this.toolTipStatus = false;
          }, 3000);

          group.item(0).set("opacity", 0);
          group.item(0).set("stroke", "blue");
          group.item(0).set("strokeWidth", 5);

          group.item(0).animate("opacity", 1, {
            duration: 2000,
            onChange: this.floorCanvas.renderAll.bind(this.floorCanvas),
          });
          group.item(0).animate("fill", "red", {
            onChange: this.floorCanvas.renderAll.bind(this.floorCanvas),
            duration: 2000,
            onComplete: getOrginItem,
          });

          let newEmployeeObject = {};
          newEmployeeObject.departmentId = asObject.employeeDepartmentId;
          newEmployeeObject.department = asObject.employeeDepartment;

          let color = this.getDepartmentObjectColor(newEmployeeObject);
          function getOrginItem() {
            group.item(0).set("opacity", 1);
            group.item(0).set("fill", color);
            group.item(0).set("stroke", null);
            group.item(0).set("strokeWidth", null);
          }
        }
        //�ڸ��� ���� ������ ����ó�� �ϱ�
      }
    },
    //�ش� �μ��� �ڸ� ���̶���Ʈ
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
        }
      }
      showDepartmentSeatList.forEach((seat) => {
        seat.item(0).set("opacity", 0);
        seat.item(0).animate("opacity", 1, {
          duration: 2000,
          onChange: this.floorCanvas.renderAll.bind(this.floorCanvas),
        });
      });
    },
    clickExportToCSVBtn() {
      //csv �����ޱ�(seatName, employeeId, floorId)
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
      //csv ���������ÿ� db�� ���� save�ϱ�
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
    async saveData() {
      if (this.allFloorList) {
        //db�� ���� �ڸ� ����
        if (this.$store.state.deleteStore.deleteSeatIdList.length > 0) {
          console.log(this.$store.state.deleteStore.deleteSeatIdList);
          await this.$store.dispatch("deleteSeatWithKey");
        }

        //db�� ���� �� ����
        if (this.$store.state.deleteStore.deleteFloorIdList.length) {
          console.log(this.$store.state.deleteStore.deleteFloorIdList);
          await this.$store.dispatch("deleteFloorWithKey");
        }

        //�� ����
        await this.$store.dispatch("pushFloors", this.allFloorList);
        await this.$store.dispatch("saveFloors");

        //�ڸ� ����
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

        await this.$store.dispatch("saveSeats");

        //�μ� �� ����(���ο� �μ��� ����� ���εǰ� ����Ǿ��� ��쿡�� �μ���ü�� �����Ѵ�.)
        if (this.allDepartmentMap) {
          //console.log(this.allDepartmentObjectList);
          let departmentObjectToSaveList = [];
          for (let i = 0; i < this.allDepartmentMap.size; i++) {
            let keys = [];
            keys = Array.from(this.allDepartmentMap.keys());

            let eachFloorDepartmentObjectList = this.allDepartmentMap.get(
              keys[i]
            );

            for (let i = 0; i < eachFloorDepartmentObjectList.length; i++) {
              let departmentId = eachFloorDepartmentObjectList[i].departmentId;
              const idx = this.allDepartmentObjectList.findIndex(
                (departmentObject) => {
                  return departmentObject.departmentId === departmentId;
                }
              );
              if (idx > -1) {
                let departmentObject = this.allDepartmentObjectList[idx];
                if (departmentObject.departmentColor === null) {
                  departmentObjectToSaveList.push(
                    eachFloorDepartmentObjectList[i]
                  );
                }
              }
            }
            //console.log(departmentObjectToSaveList);
          }
          if (departmentObjectToSaveList.length > 0) {
            await this.$store.dispatch(
              "saveDepartments",
              departmentObjectToSaveList
            );
          }
        }

        //�̹��� ����
        for (let i = 0; i < this.allFloorList.length; i++) {
          let floorId = this.allFloorList[i].floorId;
          // ���� �̹����� �ִٸ�
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
              console.log(newImage);
              this.$store.commit("PUSH_IMAGEOBJECT", newImage);
            }
          }
        }

        await this.$store.dispatch("saveImages");

        this.saveStatus = "done";

        //1�� �� ������ ���ε�
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
    // seat table�� employeeId�� ������ �׿� �´� ���� �˾ƿ��� ����
    getEmployeeObject(employeeId) {
      let employeeInfoList = [];
      let employeeObject = {}; // return �� Object
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
        // ����
        let employee = {};
        employee.name = null;
        employee.department = null;
        employee.number = null;

        employeeObject = employee;
      } else {
        // ���ε� �ڸ�
        for (let i = 0; i < employeeInfoList.length; i++) {
          if (employeeId === employeeInfoList[i].employeeId) {
            //String
            employeeObject = employeeInfoList[i];
          }
        }
      }
      return employeeObject; // return �޾Ƽ� department, name, number �̾ƾ���
    },
    //�μ� ���̵�� �ش� �μ��� ���� �����ϱ�
    //DB�� ����Ǿ��ִ� �μ������� �̶�� �װ��� ��ȯ�ϰ�
    //����Ǿ����� �ʰ� color���� null�ΰ��� �����÷��� ��ȯ�Ѵ�.
    getDepartmentColor(departmentId, floorId) {
      let departmentColor = null;

      //�� ���̵�� ã�� ��ü����Ʈ
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

      group.lockMovementX = true;
      group.lockMovementY = true;
      group.lockScalingX = true;
      group.lockScalingY = true;

      this.setToolTipForSeat(group);

      return group;
    },
    loadLatestFloor() {
      //���� �� �̹��� �ε�
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

          // ������ �ڸ� �ε�
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
            //�ڸ��� �־�߸� ���� �̺�Ʈ����
            eventBus.$emit("pushAllSeatMap", this.allSeatMap);
            eventBus.$emit("pushEachEmployeeSeatMap", this.eachEmployeeSeatMap);
          } else {
            this.currentSelectedFloorObject.floorId = newImageObject.floorId;
          }
        }

        // getStore�� floorIdList ���̰� 2 �̻��̸� �ٸ� ���� �ִٴ� ��.
        if (this.$store.state.getStore.floorIdList.length > 1) {
          this.loadOtherFloors();
        }
      }
    },
    loadOtherFloors() {
      //�ٸ� �� �̹��� �ε�
      for (let i = 0; i < this.otherFloorImageFromDb.length; i++) {
        let newImageObject = {};
        newImageObject.imgPath = this.otherFloorImageFromDb[i].imgPath;
        newImageObject.floorId = this.otherFloorImageFromDb[i].floorId;
        newImageObject.imgFileName = this.otherFloorImageFromDb[i].imgFileName;
        newImageObject.imgFileType = this.otherFloorImageFromDb[i].imgFileType;

        this.allImageMap.set(newImageObject.floorId, newImageObject);
      }
      //�ٸ� �� �ڸ� �ε�
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
.canvas {
  border: 1px solid #000;
  background: white;
  width: 100%;
  height: 100%;
}
</style>
