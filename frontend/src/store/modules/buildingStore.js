import router from '@/router'
import userStore from '@/store/modules/userStore.js'

const buildingStore = {
    state: {
        building: ''
    },
    mutations: {
        logout: function (state) {
            state.building = ''
        },
        buildingSelect: function (state, payload) {
            state.building = payload
        },
        backToMyPage: function (state) {
            state.building = ''
            if (userStore.state.authority === "admin") {
                router.push({ name: 'AdminMyPage' })
            } else {
                router.push({ name: 'MyPage' })
            }
        }
    }
}

export default buildingStore