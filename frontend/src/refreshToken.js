import axios from "axios";
import store from '@/store/index.js'
import router from '@/router'

const HOST = "http://172.30.6.192:8080";

export async function refreshToken() {
    let saveData = {};
    saveData.employeeId = store.state.userStore.employeeId;
    saveData.grant_type = "refresh_token";
    saveData.refresh_token = store.state.userStore.refresh_token;
    console.log(saveData);
    try {
        let errorStatus = null;
        if (saveData.employeeId) {
            await axios.post(HOST + '/v1/refresh-access-token', JSON.stringify(saveData), {
                headers: {
                    "Content-Type": `application/json`,
                },
            }).then((res) => {
                store.commit("setToken", res.data);
                console.log("새로운 토큰을 받겠습니다...")
                console.log(store.state.userStore.token)

            }).catch(error => {
                errorStatus = error.response.status
                console.log(errorStatus)
            });
            if (errorStatus === 417) {
                console.log("!!!refresh token 만료되어서 로그아웃함!!!")
                store.commit("logout");
                router.replace("/");
            }
        }
    } catch (error) {
        console.log(error);
    }
}