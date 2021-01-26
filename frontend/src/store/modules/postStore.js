import axios from "axios";
import { refreshToken } from '../../refreshToken.js'

const HOST = "http://172.30.6.192:8080";

const postStore = {
    state: {
        floorDataList: [],
        seatDataList: [],
        allDepartmentList: [],
        imageList: [],
    },
    mutations: {
        PUSH_FLOORLIST(state, payload) {
            state.floorDataList.push(payload)
        },
        PUSH_SEATLIST(state, payload) {
            state.seatDataList.push(payload)
            console.log("save seat commit")
        },
        PUSH_DEPTLIST(state, payload) {
            state.allDepartmentList.push(payload)
        },
        PUSH_IMAGEOBJECT(state, payload) {
            state.imageList.push(payload)
        },
        SET_FLOORLIST(state, payload) {
            state.floorDataList = payload
        },
        SET_SEATLIST(state, payload) {
            state.seatDataList = payload
        },
        SET_DEPTLIST(state, payload) {
            state.allDepartmentList = payload
        },
        SET_IMAGELISTS(state, payload) {
            state.imageList = payload
        },
        logout: function (state) {
            state.floorDataList = []
            state.seatDataList = []
            state.allDepartmentList = []
            state.imageDataList = []
            state.imageFloorDataList = []
        },
    },
    actions: {
        async saveBuilding({rootState}, newBuilding) {
            console.log("save 빌딩 호출")
            let saveBuilding = {}
            saveBuilding.building_id = newBuilding.buildingId
            saveBuilding.building_name = newBuilding.buildingName
            let errorStatus = null;
            try {
                await axios
                    .post(
                        HOST +
                        "/api/buildings",
                        JSON.stringify(saveBuilding),
                        {
                            headers: {
                                "Content-Type": `application/json`,
                                "X-AUTH-TOKEN": rootState.userStore.token,
                            },
                        }
                    )
                    .then(function (response) {
                        console.log(response);
                    })
                    .catch(error => {
                        errorStatus = error.response.status
                        console.log(errorStatus)
                    });
                if (errorStatus === 401) {
                    await refreshToken();
                    console.log("!!!새로 발급 받은 토큰 입니다!!!")
                    console.log(rootState.userStore.token);
                    await axios
                        .post(
                            HOST +
                            "/api/buildings",
                            JSON.stringify(saveBuilding),
                            {
                                headers: {
                                    "Content-Type": `application/json`,
                                    "X-AUTH-TOKEN": rootState.userStore.token,
                                },
                            }
                        )
                        .then(function (response) {
                            console.log(response);
                        })
                }
            } catch (error) {
                console.log(error)
            }
        },
        async pushFloors({ commit, state }, allFloorList) {
            console.log("save 층 리스트 push 호출")
            console.log(allFloorList.length)
            for (let i = 0; i < allFloorList.length; i++) {
                if (allFloorList[i].httpRequestPostStatus) {
                    let floorData = {};
                    floorData.floor_id = allFloorList[i].floorId;
                    floorData.floor_name = allFloorList[i].floorName;
                    floorData.building_id = allFloorList[i].buildingId;
                    floorData.floor_order = allFloorList[i].floorOrder;
                    console.log(floorData)
                    commit("PUSH_FLOORLIST", floorData);
                }
            }

            console.log(state.floorDataList.length)
            console.log("save 층 리스트 push 호출 끝")
        },
        async saveFloors({ rootState, commit, state }) {
            console.log("save 층 호출")
            for (let i = 0; i < state.floorDataList.length; i++) {
                let errorStatus = null;
                try {
                    await axios
                        .post(
                            HOST +
                            "/api/buildings/" +
                            rootState.buildingStore.building.buildingId +
                            "/floors",
                            JSON.stringify(state.floorDataList[i]),
                            {
                                headers: {
                                    "Content-Type": `application/json`,
                                    "X-AUTH-TOKEN": rootState.userStore.token,
                                },
                            }
                        )
                        .then((response) => {
                            console.log(response);
                            if (i === state.floorDataList.length - 1) {
                                commit('SET_FLOORLIST', [])
                            }
                        })
                        .catch(error => {
                            errorStatus = error.response.status
                            console.log(errorStatus)
                        });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        await axios
                            .post(
                                HOST +
                                "/api/buildings/" +
                                rootState.buildingStore.building.buildingId +
                                "/floors",
                                JSON.stringify(state.floorDataList[i]),
                                {
                                    headers: {
                                        "Content-Type": `application/json`,
                                        "X-AUTH-TOKEN": rootState.userStore.token,
                                    },
                                }
                            )
                            .then((response) => {
                                console.log(response);
                                if (i === state.floorDataList.length - 1) {
                                    commit('SET_FLOORLIST', [])
                                }
                            })
                    }
                } catch (error) {
                    console.log(error)
                }
            }
            console.log("save 층 호출 끝")
        },
        async saveSeats({ rootState, commit, state }) {
            console.log("save 자리 호출")
            console.log(state.seatDataList)
            for (let i = 0; i < state.seatDataList.length; i++) {
                let errorStatus = null;
                try {
                    await axios
                        .post(
                            HOST +
                            "/api/buildings/" +
                            state.seatDataList[i].building_id +
                            "/floors/" +
                            state.seatDataList[i].floor +
                            "/seats",
                            JSON.stringify(state.seatDataList[i]),
                            {
                                headers: {
                                    "Content-Type": `application/json`,
                                    "X-AUTH-TOKEN": rootState.userStore.token,
                                },
                            }
                        )
                        .then(function (response) {
                            console.log(response);
                            if (i === state.seatDataList.length - 1) {
                                commit('SET_SEATLIST', [])
                            }
                        })
                        .catch(error => {
                            errorStatus = error.response.status
                            console.log(errorStatus)
                        });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        await axios
                            .post(
                                HOST +
                                "/api/buildings/" +
                                rootState.buildingStore.building.buildingId +
                                "/floors/" +
                                state.seatDataList[i].floor +
                                "/seats",
                                JSON.stringify(state.seatDataList[i]),
                                {
                                    headers: {
                                        "Content-Type": `application/json`,
                                        "X-AUTH-TOKEN": rootState.userStore.token,
                                    },
                                }
                            )
                            .then(function (response) {
                                console.log(response);
                                if (i === state.seatDataList.length - 1) {
                                    commit('SET_SEATLIST', [])
                                }
                            })
                    }
                } catch (error) {
                    console.log(error)
                }
            }
            console.log("save 자리 호출 끝")
        },
        async saveDepartments({ rootState, commit, state }, saveDepartmentList) {
            console.log("save 부서 호출")


            for (let j = 0; j < saveDepartmentList.length; j++) {
                let departmentData = {};
                departmentData.department_color =
                    saveDepartmentList[j].departmentColor;
                departmentData.department_headcount = 0;
                departmentData.department_id =
                    saveDepartmentList[j].departmentId;
                departmentData.department_name =
                    saveDepartmentList[j].departmentName;
                commit("PUSH_DEPTLIST", departmentData)
            }


            for (let i = 0; i < state.allDepartmentList.length; i++) {
                let saveData = state.allDepartmentList[i];
                try {
                    let errorStatus = null;
                    await axios
                        .post(HOST + "/api/departments", JSON.stringify(saveData), {
                            headers: {
                                "Content-Type": `application/json`,
                                "X-AUTH-TOKEN": rootState.userStore.token,
                            },
                        })
                        .then(function (response) {
                            console.log(response);
                            if (i === state.allDepartmentList.length - 1) {
                                commit('SET_DEPTLIST', [])
                            }
                        })
                        .catch(error => {
                            errorStatus = error.response.status
                            console.log(errorStatus)
                        });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        await axios
                            .post(HOST + "/api/departments", JSON.stringify(saveData), {
                                headers: {
                                    "Content-Type": `application/json`,
                                    "X-AUTH-TOKEN": rootState.userStore.token,
                                },
                            })
                            .then(function (response) {
                                console.log(response);
                                if (i === state.allDepartmentList.length - 1) {
                                    commit('SET_DEPTLIST', [])
                                }
                            })
                    }
                } catch (error) {
                    console.log(error)
                }
            }
            console.log("save 부서 호출 끝")
        },
        async saveImages({ rootState, commit, state }) {
            console.log("save 이미지 호출")
            for (let i = 0; i < state.imageList.length; i++) {
                try {
                    let errorStatus = null;
                    let imageObject = state.imageList[i]
                    await axios
                        .post(
                            HOST +
                            "/api/buildings/" +
                            rootState.buildingStore.building.buildingId +
                            "/floors/" +
                            imageObject.floorId +
                            "/images",
                            imageObject.imgData,
                            {
                                headers: {
                                    "Content-Type": "multipart/form-data",
                                    "X-AUTH-TOKEN": rootState.userStore.token,
                                },
                            }
                        )
                        .then(function (response) {
                            console.log(response)
                            if (i === state.imageList.length - 1) {
                                console.log("called")
                                commit('SET_IMAGELISTS', [])
                            }
                        })
                        .catch(error => {
                            errorStatus = error.response.status
                            console.log(errorStatus)
                        });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        await axios
                            .post(
                                HOST +
                                "/api/buildings/" +
                                rootState.buildingStore.building.buildingId +
                                "/floors/" +
                                state.imageFloorDataList[i] +
                                "/images",
                                state.imageDataList[i],
                                {
                                    headers: {
                                        "Content-Type": "multipart/form-data",
                                        "X-AUTH-TOKEN": rootState.userStore.token,
                                    },
                                }
                            ).then(function (response) {
                                console.log(response)
                                if (i === state.imageDataList.length - 1) {
                                    commit('SET_IMAGELISTS', [])
                                }
                            })
                    }
                } catch (error) {
                    console.log(error)
                }
            }
            console.log("save 이미지 호출 끝")
        },
    }
}


export default postStore