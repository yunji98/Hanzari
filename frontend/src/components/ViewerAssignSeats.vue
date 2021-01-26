<template>
  <div>
    <v-toolbar color="#2c4f91" dark>
      <v-spacer></v-spacer>
      <h3>
        <span>{{ $store.state.buildingStore.building.buildingName }}</span>
      </h3>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-sm-and-down">
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn text v-bind="attrs" v-on="on" @click="clickPrintBtn">
              <v-icon size="30px">print</v-icon>
            </v-btn></template
          >
          <span>{{ this.$t("tooltipPrintBtn") }}</span>
        </v-tooltip>
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
    </v-toolbar-items>
    <canvas
      ref="canvas"
      class="canvas"
      id="canvas"
      height="770px"
      width="1150px"
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
export default {
  name: "ViewerAttachSeats",
  data() {
    return {
      floorCanvas: null,

      //줌
      zoom: 1,
      zoomStatus: false,
      moveStatus: false,
      panning: null,

      viewSeatStatus: 0,

      //폰트 사이즈
      fontSize: 10,

      // 자리 투명도
      seatOpacity: 1,

      currentSelectedFloorObject: null,

      latestFloorImageFromDb: this.$store.state.getStore.latestFloorImage,
      otherFloorImageFromDb: this.$store.state.getStore.otherFloorsImageList,

      latestFloorSeatListFromDb: this.$store.state.getStore.latestFloorSeatList,
      otherFloorSeatListFromDb: this.$store.state.getStore.otherFloorsSeatMap,

      allFloorList: this.$store.state.getStore.allFloor,
      allDepartmentObjectList: this.$store.state.getStore.allDepartment, // 부서 객체 리스트

      allImageMap: null, //이미지 Map<FloorId, ImgPath>
      allDepartmentMap: null, //부서이름, 부서아이디, 부서색상값을 저장할 수 있는 Map <FloorId, DepartmentObject>
      allSeatMap: null, //자리 Map<층이름, 자리리스트>
      eachEmployeeSeatMap: null, //each Employee's seats map

      toolTipStatus: false,
      toolTipXLocation: 100,
      toolTipYLocation: 100,
      toolTipColor: null,
      toolTipText: null,
      viewSeatInfiTooltipText: this.$i18n.t("tooltipViewSeatInfo"),

      viewSeatStatus: 0,
    };
  },
  created() {
    if (this.allFloorList && this.allFloorList.length) {
      this.currentSelectedFloorObject = this.allFloorList[
        this.allFloorList.length - 1
      ];
    }

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

    //선택한 층에 대한 값 받아와서 층 전환하기 위한 event
    eventBus.$on("pushSelectedFloorObject", (floorObject) => {
      if (floorObject) {
        this.currentSelectedFloorObject = floorObject;
        this.changeFloor();
      } else {
        this.currentSelectedFloorObject = null;

        this.floorCanvas.backgroundImage = 0;
        this.floorCanvas.backgroundColor = "white";
        this.floorCanvas.getObjects().forEach((obj) => {
          this.floorCanvas.remove(obj);
        });
      }
    });

    //모든 층 객체를 가지고 있는 리스트를 받기 위한 event
    eventBus.$on("pushAllFloorList", (allFloorList) => {
      this.allFloorList = allFloorList;
    });

    //이미지 Map 받아오기
    eventBus.$on("pushAllImageMap", (allImageMap) => {
      this.allImageMap = allImageMap;
      this.loadImageFile(
        this.allImageMap.get(this.currentSelectedFloorObject.floorId).imgPath
      );
    });

    //자리 하이라이트 하는 함수를 호출하기 위한 event
    eventBus.$on("showSeatHighlight", (seatObject) => {
      this.showSeatHighlight(seatObject);
    });
    //자리 하이라이트 하는 함수를 호출하기 위한 event
    eventBus.$on("showDepartmentSeatHighlight", (departmentObjectId) => {
      this.showDepartmentSeatHighlight(departmentObjectId);
    });
  },
  mounted() {
    this.initializing();
    this.loadLatestFloor();
  },
  beforeDestroy() {
    eventBus.$off("pushSelectedFloorObject");
    eventBus.$off("pushAllFloorList");
    eventBus.$off("pushAllImageMap");
    eventBus.$off("showSeatHighlight");
    eventBus.$off("showDepartmentSeatHighlight");
  },
  methods: {
    initializing() {
      //canvas, map 생성
      if (this.floorCanvas == null) {
        const ref = this.$refs.canvas;
        this.floorCanvas = new fabric.Canvas(ref, {
          stopContextMenu: true, //prevent context menu from showing
          hoverCursor: "pointer",
          selection: false,
        });

        this.setMouseWheel();
        this.floorCanvas.on("mouse:move", (event) => {
          if (this.moveStatus === true) {
            if (this.panning && event && event.e) {
              let delta = new fabric.Point(
                event.e.movementX / 5,
                event.e.movementY / 5
              );
              this.floorCanvas.relativePan(delta);
              this.zoomStatus = true;
            }
          }
        });
        this.floorCanvas.on("mouse:up", (event) => {
          this.panning = false;
          this.floorCanvas.selection = false;
        });
        this.floorCanvas.on("mouse:down", (event) => {
          this.panning = true;
          this.floorCanvas.selection = false;
        });
      }
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
          //zoom in and out
          if (this.zoom > 10) this.zoom = 10;
          else if (this.zoom < 1) this.zoom = 1;
          this.floorCanvas.zoomToPoint(
            new fabric.Point(evt.offsetX, evt.offsetY),
            this.zoom
          );
          this.zoomStatus = true;
          this.moveStatus = true;
        } else {
          //reset canvas ratio
          this.zoomStatus = false;
          this.moveStatus = false;
          this.floorCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
          this.zoom = 1;
        }

        opt.e.preventDefault();
        opt.e.stopPropagation();
      });
    },
    clickResetToRatioBtn() {
      this.floorCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      this.moveStatus = false;
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
      this.moveStatus = false;
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
              .imgPath
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
          this.floorCanvas.getObjects().forEach((obj) => {
            obj.selectable = false;
          });
          eventBus.$emit("pushAllSeatMap", this.allSeatMap);
        }
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
    loadImageDBFile(dbFile) {
      let imgType = "image/png";
      let imgPath = "data:" + imgType + ";base64," + dbFile;
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
        console.log(eachFloorSeatList[i]);
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
    getColor(departmentId) {
      const Colors = {
        vacantColor: "Gray",
        // departmentMappingColor: //추후 고려
      };
      if (departmentId === null) {
        return Colors.vacantColor;
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
              departmentColor =
                "#" + Math.floor(Math.random() * 16777215).toString(16);
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
          seat.item(0).animate("opacity", 1, {
            duration: 2000,
            onChange: this.floorCanvas.renderAll.bind(this.floorCanvas),
          });
        });
      }
    },
    showSeatHighlight(seatObject) {
      //자리 하이라이트
      let seatFloor = null;
      //seat의 층과 현재층이 같지 않다면
      if (this.currentSelectedFloorObject.floorId != seatObject.floorId) {
        //탭 전환 코드
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
        //자리가 아직 없을때 예외처리 하기
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
    getEmployeeObject(employeeId) {
      // seat table의 employeeId를 받으면 그에 맞는 정보 알아오기 위함
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
        });
      } else {
        textObject = new fabric.IText(employee.name, {
          left: rectangle.left,
          top: rectangle.top,
          fontSize: parseInt(this.fontSize),
          fill: this.getSeatTextColor(
            this.getDepartmentColor(employee.departmentId, seat.floorId)
          ),
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
    setToolTipForSeat(group) {
      group.on("mouseover", (event) => {
        let group = event.target;
        if (group != null) {
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

          this.currentSelectedFloorObject.floorId = newImageObject.floorId;
          this.allImageMap.set(newImageObject.floorId, newImageObject);
          this.loadImageDBFile(newImageObject.imgPath);
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

            this.floorCanvas.getObjects().forEach((obj) => {
              obj.selectable = false;
            });
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
    clickPrintBtn() {
      let dataUrl = document.getElementById("canvas").toDataURL();

      let seatTable = "<table border='1' cellpadding='3'><tr>";
      seatTable += "<th>" + this.$i18n.t("seatName") + "</th>";
      seatTable += "<th>" + this.$i18n.t("textName") + "</th>";
      seatTable += "<th>" + this.$i18n.t("textDept") + "</th>";
      seatTable += "<th>" + this.$i18n.t("textNumber") + "</th>";
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
          seatTableTd += "<tr><td>" + obj.seatName + "</td>";
          seatTableTd += "<td>" + obj.employeeName + "</td>";
          seatTableTd += "<td>" + obj.employeeDepartment + "</td>";
          seatTableTd += "<td>" + obj.employeeNumber + "</td></tr>";
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
  },
};
</script>

<style scoped>
.canvas {
  border: 1px solid #000;
  background: white;
  width: 75%;
  height: 100%;
}
ul {
  padding: 0px;
  margin: 0px;
  display: block;
}
</style>
