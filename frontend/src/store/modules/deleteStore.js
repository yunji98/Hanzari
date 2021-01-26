import axios from "axios";
import { refreshToken } from '../../refreshToken.js'

const HOST = "http://172.30.6.192:8080";

const deleteStore = {
    state: {
        deleteFloorIdList: [],
        deleteSeatIdList: []
    },
    mutations: {
        PUSH_DeleteFloor: function (state, payload) {
            console.log(payload)
            state.deleteFloorIdList.push(payload)
            console.log(state.deleteFloorIdList)
        },
        SET_DeleteFloor: function (state, payload) {
            state.deleteFloorIdList = payload
            console.log(state.deleteFloorIdList)
        },
        PUSH_DeleteSeat: function (state, payload) {
            state.deleteSeatIdList.push(payload)
            console.log(state.deleteSeatIdList)
        },
        SET_DeleteSeat: function (state, payload) {
            state.deleteSeatIdList = payload
            console.log(state.deleteSeatIdList)
        },
        logout: function (state) {
            state.deleteFloorIdList = []
            state.deleteSeatIdList = []
        },
    },
    actions: {
        async deleteBuildingKey({ rootState }, deleteBuildingKey) {
            console.log("delete 건물 호출")
            let errorStatus = null;
            try {
                await axios.delete(
                    HOST +
                    "/api/buildings/" + deleteBuildingKey,
                    {
                        headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                    }
                ).then(function (response) {
                    console.log(response)
                }).catch(error => {
                    errorStatus = error.response.status
                    console.log(errorStatus)
                });
                if (errorStatus === 401) {
                    await refreshToken();
                    console.log("!!!새로 발급 받은 토큰 입니다!!!")
                    console.log(rootState.userStore.token);
                    await axios.delete(
                        HOST +
                        "/api/buildings/" + deleteBuildingKey,
                        {
                            headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                        }
                    ).then(function (response) {
                        console.log(response)
                    })
                }
            } catch (error) {
                console.log(error)
            }
        },
        async deleteFloorWithKey({ rootState, commit, state }) {
            console.log("delete 층 호출")
            console.log(state.deleteFloorIdList)
            let errorStatus = null;
            for (let i = 0; i < state.deleteFloorIdList.length; i++) {
                try {
                    await axios.delete(
                        HOST +
                        "/api/buildings/" +
                        rootState.buildingStore.building.buildingId +
                        "/floors/" +
                        state.deleteFloorIdList[i],
                        {
                            headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                        }
                    ).then(function (response) {
                        console.log(response)
                        if (i === state.deleteFloorIdList.length - 1) {
                            commit('SET_DeleteFloor', [])
                        }
                    }).catch(error => {
                        errorStatus = error.response.status
                        console.log(errorStatus)
                    });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        await axios.delete(
                            HOST +
                            "/api/buildings/" +
                            rootState.buildingStore.building.buildingId +
                            "/floors/" +
                            state.deleteFloorIdList[i],
                            {
                                headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                            }
                        ).then(function (response) {
                            console.log(response)
                            if (i === state.deleteFloorIdList.length - 1) {
                                commit('SET_DeleteFloor', [])
                            }
                        })
                    }

                } catch (error) {
                    console.log(error)
                }
            }
            console.log("delete 층 호출 끝")
            console.log(state.deleteFloorIdList)
        },
        async deleteSeatWithKey({ rootState, commit, state }) {
            console.log("delete 자리 호출")
            let errorStatus = null;
            for (let i = 0; i < state.deleteSeatIdList.length; i++) {
                console.log(state.deleteSeatIdList[i])
                try {
                    await axios.delete(
                        HOST +
                        "/api/buildings/" +
                        state.deleteSeatIdList[i].buildingId +
                        "/floors/" +
                        state.deleteSeatIdList[i].floorId +
                        "/seats/" +
                        state.deleteSeatIdList[i].seatId,
                        {
                            headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                        }
                    ).then(function (response) {
                        console.log(response)
                        if (i === state.deleteSeatIdList.length - 1) {
                            commit('SET_DeleteSeat', [])
                        }
                    }).catch(error => {
                        errorStatus = error.response.status
                        console.log(errorStatus)
                    });
                    if (errorStatus === 401) {
                        await refreshToken();
                        console.log("!!!새로 발급 받은 토큰 입니다!!!")
                        console.log(rootState.userStore.token);
                        await axios.delete(
                            HOST +
                            "/api/buildings/" +
                            rootState.buildingStore.building.buildingId +
                            "/floors/" +
                            state.deleteSeatIdList[i].floorId +
                            "/seats/" +
                            state.deleteSeatIdList[i].seatId,
                            {
                                headers: { "X-AUTH-TOKEN": rootState.userStore.token },
                            }
                        ).then(function (response) {
                            console.log(response)
                            if (i === state.deleteSeatIdList.length - 1) {
                                commit('SET_DeleteSeat', [])
                            }
                        })
                    }
                } catch (error) {
                    console.log(error)
                }
            }
            console.log("delete 자리 호출 끝")
            console.log(state.deleteSeatIdList)
        }
    }
}

export default deleteStore