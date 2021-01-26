import axios from "axios";
import { refreshToken } from '../../refreshToken.js'

const HOST = "http://172.30.6.192:8080";

const getStore = {
    state: {
        allBuildings: null,
        loginEmployeeObject: null,
        allEmployee: null,
        allDepartment: null,
        allFloor: null,
        floorIdList: [],
        latestFloor: null,
        latestFloorImage: null,
        latestFloorSeatList: null,
        otherFloorsImageList: null,
        otherFloorsSeatMap: null
    },
    mutations: {
        SET_BUILDINGLIST(state, gets) {
            state.allBuildings = gets
        },
        SET_LOGINEMPLOYEEOBJECT(state, gets) {
            state.loginEmployeeObject = gets
        },
        SET_EMPLOYEES(state, gets) {
            state.allEmployee = gets
        },
        SET_DEPARTMENTS(state, gets) {
            state.allDepartment = gets
        },
        SET_FLOORS(state, gets) {
            state.allFloor = gets
        },
        SET_FLOORIDLIST(state, gets) {
            state.floorIdList = gets
        },
        SET_LATESTFLOOR(state, gets) {
            state.latestFloor = gets
        },
        SET_LATESTFLOORIMAGE(state, gets) {
            state.latestFloorImage = gets
        },
        SET_LATESTFLOORSEATLIST(state, gets) {
            state.latestFloorSeatList = gets
        },
        SET_OTHERFLOORSIMAGELIST(state, gets) {
            state.otherFloorsImageList = gets
        },
        SET_OTHERFLOORSSEATMAP(state, gets) {
            state.otherFloorsSeatMap = gets
        },
        logout: function (state) {
            state.loginEmployeeObject = null
            state.allBuildings = null
            state.allEmployee = null
            state.allDepartment = null
            state.allFloor = null
            state.floorIdList = []
            state.latestFloor = null
            state.latestFloorImage = null
            state.latestFloorSeatList = null
            state.otherFloorsImageList = null
            state.otherFloorsSeatMap = null
            localStorage.clear()
        },
    },
    actions: {
        async getBuildingList({ rootState, commit }) {
            console.log("getBuildingList")
            let response = null;
            let buildingList = [];
            let errorStatus = null;
            try {
                if (rootState.userStore.token != '') {
                    response = await axios.get(HOST + "/api/buildings", {
                        headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                    }).catch(error => {
                        errorStatus = error.response.status
                        console.log("에러 상태 : " + errorStatus)
                    });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        if (rootState.userStore.token != '') {
                            response = await axios.get(HOST + "/api/buildings", {
                                headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                            })
                        }
                    }

                    for (let i = 0; i < response.data.length; i++) {
                        let newBuildingObject = {};
                        newBuildingObject.buildingId = response.data[i].building_id;
                        newBuildingObject.buildingName = response.data[i].building_name;
                        newBuildingObject.floorCnt = response.data[i].floorCnt;

                        buildingList.push(newBuildingObject);
                    }

                    buildingList.sort(function (a, b) {
                        return a.buildingName < b.buildingName ? -1 : a.buildingName > b.buildingName ? 1 : 0;
                    }); // 오름차순 정렬

                }
            } catch (error) {
                //console.log(error);
            }
            commit("SET_BUILDINGLIST", buildingList)
            console.log(buildingList)
        },
        async getLoginEmployeeObject({ commit, rootState }) {
            console.log("getLoginEmployee")
            let employeeObject = {};
            let errorStatus = null;
            let response = null;
            try {
                if (rootState.userStore.token != '') {
                    response = await axios
                        .get(
                            HOST + "/api/employee/" + rootState.userStore.employeeId,
                            {
                                headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                            }
                        )
                        .catch((error) => {
                            errorStatus = error.response.status;
                            console.log(errorStatus);
                        });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!");
                        console.log(rootState.userStore.token);
                        if (rootState.userStore.token != '') {
                            response = await axios.get(
                                HOST + "/api/employee/" + rootState.userStore.employeeId,
                                {
                                    headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                                }
                            )
                        }
                    }
                    employeeObject.departmentName = response.data.department_name;
                    employeeObject.employeeName = response.data.employee_name;
                    employeeObject.extensionNumber = response.data.extension_number;
                }
            } catch (error) {
                //console.log(error);
            }
            commit("SET_LOGINEMPLOYEEOBJECT", employeeObject)
        },
        async getAllEmployees({ rootState, commit }) {
            let response = null;
            let allEmployeeList = [];
            let errorStatus = null;
            try {
                if (rootState.userStore.token != '') {
                    response = await axios.get(HOST + "/api/employee", {
                        headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                    }).catch(async error => {
                        errorStatus = error.response.status
                        console.log("에러 상태 : " + errorStatus)
                    });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        if (rootState.userStore.token != '') {
                            if (rootState.userStore.employeeId) {
                                response = await axios.get(HOST + "/api/employee", {
                                    headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                                })
                            }
                        }
                    }
                    for (let i = 0; i < response.data.length; i++) {
                        let newEmployeeObject = {};
                        newEmployeeObject.authority = response.data[i].authority;
                        newEmployeeObject.name = response.data[i].employee_name;
                        newEmployeeObject.department = response.data[i].department_name;
                        newEmployeeObject.departmentId = response.data[i].department_id;
                        newEmployeeObject.number = response.data[i].extension_number;
                        newEmployeeObject.employeeId = response.data[i].employee_id;
                        newEmployeeObject.seatIdList = response.data[i].seatList;

                        allEmployeeList.push(newEmployeeObject);
                    }
                    commit('SET_EMPLOYEES', allEmployeeList)
                }
            } catch (error) {
                //console.log(error)
            }
        },
        async getDepartmentList({ rootState, commit }) {
            let response = null;
            let allDepartmentList = [];
            let errorStatus = null;
            try {
                if (rootState.userStore.token != '') {
                    response = await axios.get(HOST + "/api/departments/", {
                        headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                    }).catch(error => {
                        errorStatus = error.response.status
                        console.log("에러 상태 : " + errorStatus)
                    });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        if (rootState.userStore.token != '') {
                            response = await axios.get(HOST + "/api/departments/", {
                                headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                            })
                        }
                    }
                    for (let i = 0; i < response.data.length; i++) {
                        let newDepartmentObject = {};
                        newDepartmentObject.departmentId = response.data[i].department_id;
                        newDepartmentObject.departmentName = response.data[i].department_name;
                        newDepartmentObject.departmentColor =
                            response.data[i].department_color;
                        //newDepartmentObject.sfdfdsf = response.data[i].deparment_headcount;
                        allDepartmentList.push(newDepartmentObject);
                    }
                }
            } catch (error) {
                //console.log(error)
            }
            commit('SET_DEPARTMENTS', allDepartmentList)
        },
        async getAllFloors({ rootState, commit }) {
            let response = null;
            let allFloorList = [];
            let floorIdList = [];
            let errorStatus = null;
            let latestFloor = null;
            try {
                console.log("called - 층 호출")
                if (rootState.userStore.token != '') {
                    response = await axios.get(
                        HOST +
                        "/api/buildings/" +
                        rootState.buildingStore.building.buildingId +
                        "/floors",
                        {
                            headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                        }
                    ).catch(error => {
                        errorStatus = error.response.status
                        console.log("에러 상태 : " + errorStatus)
                    });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        if (rootState.userStore.token != '') {
                            response = await axios.get(HOST +
                                "/api/buildings/" +
                                rootState.buildingStore.building.buildingId +
                                "/floors",
                                { headers: { "X-AUTH-TOKEN": rootState.userStore.token } })
                        }
                    }

                    for (let i = 0; i < response.data.length; i++) {
                        let newFloorObject = {};
                        newFloorObject.floorId = response.data[i].floor_id;
                        newFloorObject.floorName = response.data[i].floor_name;
                        newFloorObject.buildingId = response.data[i].building_id;
                        newFloorObject.floorOrder = response.data[i].floor_order;
                        newFloorObject.isObjFromDB = true;
                        newFloorObject.httpRequestPostStatus = false;

                        allFloorList.push(newFloorObject);
                    }

                    allFloorList.sort(function (a, b) {
                        return a.floorOrder < b.floorOrder
                            ? -1
                            : a.floorOrder > b.floorOrder
                                ? 1
                                : 0;
                    });

                    for (let i = 0; i < allFloorList.length; i++) {
                        floorIdList.push(allFloorList[i].floorId);
                    }
                    console.log("called - 층 호출 끝")
                    commit('SET_FLOORS', allFloorList)
                    commit('SET_FLOORIDLIST', floorIdList)
                }
            } catch (error) {
                //console.log(error)
            }

            if (response.data.length > 0) {
                console.log("called - 최신 층 호출")
                response = null;
                errorStatus = null;
                try {
                    if (rootState.userStore.token != '') {
                        response = await axios.get(
                            HOST +
                            "/api/buildings/" +
                            rootState.buildingStore.building.buildingId +
                            "/floors/get-latest-floor",
                            {
                                headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                            }
                        ).catch(error => {
                            errorStatus = error.response.status
                            console.log("에러 상태 : " + errorStatus)
                        });
                        if (errorStatus === 401) {
                            await refreshToken();
                            console.log("!!!새로 발급 받은 토큰 입니다!!!")
                            console.log(rootState.userStore.token);
                            console.log(rootState.userStore.employeeId)
                            if (rootState.userStore.token != '') {
                                response = await axios.get(
                                    HOST +
                                    "/api/buildings/" +
                                    rootState.buildingStore.building.buildingId +
                                    "/floors/get-latest-floor",
                                    {
                                        headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                                    }
                                )
                            }
                        }
                        latestFloor = response.data;
                    }
                } catch (error) {
                    //console.log(error)
                }
                console.log("called - 최신 층 호출 끝")
                commit('SET_LATESTFLOOR', latestFloor);
            } else {
                commit('SET_LATESTFLOOR', null);
            }
        },
        async getLatestFloorImage({ rootState, commit, state }) {
            if (state.latestFloor) {
                console.log("called - 최신 층 이미지 호출")
                let response = null;
                let latestFloorImage = [];
                let errorStatus = null;
                let latestFloorId = state.latestFloor.floor_id;

                try {
                    response = await axios.get(
                        HOST +
                        "/api/buildings/" +
                        rootState.buildingStore.building.buildingId +
                        "/floors/" +
                        latestFloorId +
                        "/images",
                        {
                            headers: {
                                "X-AUTH-TOKEN": rootState.userStore.token,
                            },
                            responseType: "arraybuffer",
                        }
                    ).catch((error) => {
                        errorStatus = error.response.status
                        console.log("에러 상태 : " + errorStatus)
                    });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        if (rootState.userStore.token != '') {
                            response = await axios.get(
                                HOST +
                                "/api/buildings/" +
                                rootState.buildingStore.building.buildingId +
                                "/floors/" +
                                latestFloorId +
                                "/images",
                                {
                                    headers: {
                                        "X-AUTH-TOKEN": rootState.userStore.token,
                                    },
                                    responseType: "arraybuffer",
                                }
                            )
                        }
                    }
                    let imgPath = new Buffer(response.data, "binary").toString("base64");

                    let fileType = null;
                    let filename = null;

                    let contentDisposition = response.headers["content-disposition"]; // 파일 이름
                    if (contentDisposition) {
                        let [fileNameMatch] = contentDisposition
                            .split(";")
                            .filter((str) => str.includes("filename"));
                        if (fileNameMatch) [, filename] = fileNameMatch.split("=");
                        filename = decodeURIComponent(filename);
                    }

                    if (contentDisposition) {
                        let [fileTypeMatch] = contentDisposition
                            .split(";")
                            .filter((str) => str.includes("contenttype"));
                        if (fileTypeMatch) [, fileType] = fileTypeMatch.split("=");
                        fileType = decodeURIComponent(fileType);
                    }

                    let newImageObject = {};
                    newImageObject.imgPath = imgPath;
                    newImageObject.floorId = latestFloorId;
                    newImageObject.imgFileName = filename;
                    newImageObject.imgFileType = fileType;

                    latestFloorImage.push(newImageObject);
                } catch (error) {
                    //console.log(error)
                }
                console.log("called - 최신 층 이미지 호출 끝")
                commit('SET_LATESTFLOORIMAGE', latestFloorImage);
            }
        },
        async getLatestFloorSeatList({ rootState, commit, state }) {
            if (state.latestFloor) {
                console.log("called - 최신 층 자리 호출")
                let response = null;
                let latestFloorSeatList = [];
                let errorStatus = null;

                let latestFloorId = state.latestFloor.floor_id;
                try {
                    response = await axios.get(
                        HOST +
                        "/api/buildings/" +
                        rootState.buildingStore.building.buildingId +
                        "/floors/" +
                        latestFloorId +
                        "/seats",
                        {
                            headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                        }
                    ).catch(error => {
                        errorStatus = error.response.status
                        console.log("에러 상태 : " + errorStatus)
                    });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        if (rootState.userStore.token != '') {
                            response = await axios.get(
                                HOST +
                                "/api/buildings/" +
                                rootState.buildingStore.building.buildingId +
                                "/floors/" +
                                latestFloorId +
                                "/seats",
                                {
                                    headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                                }
                            )
                        }
                    }
                    for (let i = 0; i < response.data.length; i++) {
                        let newSeatObject = {};

                        newSeatObject.seatId = response.data[i].seat_id;
                        newSeatObject.seatName = response.data[i].seat_name;
                        newSeatObject.floorId = response.data[i].floor;
                        newSeatObject.x = response.data[i].x;
                        newSeatObject.y = response.data[i].y;
                        newSeatObject.isGroup = response.data[i].is_group;
                        newSeatObject.buildingId = response.data[i].building_id;
                        newSeatObject.employeeId = response.data[i].employee_id;
                        newSeatObject.width = response.data[i].width;
                        newSeatObject.height = response.data[i].height;
                        newSeatObject.degree = response.data[i].degree;
                        newSeatObject.shapeId = response.data[i].shape_id;
                        newSeatObject.isObjFromDB = true;
                        newSeatObject.httpRequestPostStatus = false;

                        latestFloorSeatList.push(newSeatObject);
                    }
                } catch (error) {
                    // console.log(error)
                }
                console.log("called - 최신 층 자리 호출 끝")
                commit('SET_LATESTFLOORSEATLIST', latestFloorSeatList);
            }
        },
        async getOtherFloorImageList({ rootState, commit, state }) {
            if (state.floorIdList.length > 1) {
                console.log("called - 다른 층 이미지 호출")
                let response = null;
                let otherFloorsImageList = [];
                let responseList = null;
                let errorStatus = null;
                try {
                    for (let i = 0; i < state.floorIdList.length - 1; i++) {
                        response = await axios.get(
                            HOST +
                            "/api/buildings/" +
                            rootState.buildingStore.building.buildingId +
                            "/floors/" +
                            state.floorIdList[i] +
                            "/images",
                            {
                                headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                                responseType: "arraybuffer",
                            }
                        ).catch(error => {
                            errorStatus = error.response.status
                            console.log("에러 상태 : " + errorStatus)
                        });
                        if (errorStatus === 401) {
                            await refreshToken();
                            console.log("!!!새로 발급 받은 토큰 입니다!!!")
                            console.log(rootState.userStore.token);
                            if (rootState.userStore.token != '') {
                                response = await axios.get(
                                    HOST +
                                    "/api/buildings/" +
                                    rootState.buildingStore.building.buildingId +
                                    "/floors/" +
                                    state.floorIdList[i] +
                                    "/images",
                                    {
                                        headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                                        responseType: "arraybuffer",
                                    }
                                )
                            }
                        }

                        let imgPath = new Buffer(response.data, "binary").toString("base64");

                        let fileType = null;
                        let filename = null;

                        let contentDisposition = response.headers["content-disposition"]; // 파일 이름
                        if (contentDisposition) {
                            let [fileNameMatch] = contentDisposition
                                .split(";")
                                .filter((str) => str.includes("filename"));
                            if (fileNameMatch) [, filename] = fileNameMatch.split("=");
                            filename = decodeURIComponent(filename);
                        }

                        if (contentDisposition) {
                            let [fileTypeMatch] = contentDisposition
                                .split(";")
                                .filter((str) => str.includes("contenttype"));
                            if (fileTypeMatch) [, fileType] = fileTypeMatch.split("=");
                            fileType = decodeURIComponent(fileType);
                        }

                        let newImageObject = {};
                        newImageObject.imgPath = imgPath;
                        newImageObject.floorId = state.floorIdList[i];
                        newImageObject.imgFileName = filename;
                        newImageObject.imgFileType = fileType;

                        responseList = newImageObject;

                        otherFloorsImageList.push(responseList);
                    }
                } catch (error) {
                    // console.log(error)
                }
                console.log("called - 다른 층 이미지 호출 끝")
                commit('SET_OTHERFLOORSIMAGELIST', otherFloorsImageList);
            }
        },
        async getOtherFloorsSeatMap({ rootState, commit, state }) {
            let otherFloorsSeatMap = new Map();
            if (state.floorIdList.length > 1) {
                console.log("called - 다른 층 자리 호출")
                let response = null;
                let errorStatus = null;
                try {
                    for (let i = 0; i < state.floorIdList.length - 1; i++) {
                        response = await axios.get(
                            HOST +
                            "/api/buildings/" +
                            rootState.buildingStore.building.buildingId +
                            "/floors/" +
                            state.floorIdList[i] +
                            "/seats",
                            {
                                headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                            }
                        ).catch(error => {
                            errorStatus = error.response.status
                            console.log("에러 상태 : " + errorStatus)
                        });
                        if (errorStatus === 401) {
                            await refreshToken();
                            console.log("!!!새로 발급 받은 토큰 입니다!!!")
                            console.log(rootState.userStore.token);
                            if (rootState.userStore.token != '') {
                                response = await axios.get(
                                    HOST +
                                    "/api/buildings/" +
                                    rootState.buildingStore.building.buildingId +
                                    "/floors/" +
                                    state.floorIdList[i] +
                                    "/seats",
                                    {
                                        headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                                    }
                                )
                            }
                        }
                        let responseList = [];
                        // 그 층에 자리가 없다면
                        if (response.data.length === 0) {
                            //number
                            otherFloorsSeatMap.set(state.floorIdList[i], []);
                        } else {
                            for (let j = 0; j < response.data.length; j++) {
                                // 자리 수 만큼 돈다
                                let newSeatObject = {};
                                newSeatObject.seatId = response.data[j].seat_id;
                                newSeatObject.seatName = response.data[j].seat_name;
                                newSeatObject.floorId = response.data[j].floor;
                                newSeatObject.x = response.data[j].x;
                                newSeatObject.y = response.data[j].y;
                                newSeatObject.isGroup = response.data[j].is_group;
                                newSeatObject.buildingId = response.data[j].building_id;
                                newSeatObject.employeeId = response.data[j].employee_id;
                                newSeatObject.width = response.data[j].width;
                                newSeatObject.height = response.data[j].height;
                                newSeatObject.degree = response.data[j].degree;
                                newSeatObject.shapeId = response.data[j].shape_id;
                                newSeatObject.isObjFromDB = true;
                                newSeatObject.httpRequestPostStatus = false;

                                responseList.push(newSeatObject);

                                if (state.floorIdList[i] === response.data[j].floor) {//String
                                    otherFloorsSeatMap.set(
                                        state.floorIdList[i],
                                        responseList
                                    );
                                }
                            }
                        }
                    }
                } catch (error) {
                    // console.log(error)
                }
                console.log("called - 다른 층 자리 호출 끝")
            }
            commit('SET_OTHERFLOORSSEATMAP', otherFloorsSeatMap);
        },
    }
}

export default getStore