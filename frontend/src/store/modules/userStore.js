import router from '@/router'

const userStore = {
    state: {
        token: '',
        refresh_token: '',
        authority: '',
        employeeId: '',
        employeeName: ''
    },
    mutations: {
        login: function (state, payload) {
            state.token = payload.access_token
            state.refresh_token = payload.refresh_token
            state.authority = payload.authority
        },
        setEmployeeId: function (state, payload) {
            state.employeeId = payload
        },
        setEmployeeName: function (state, payload) {
            state.employeeName = payload
        },
        setToken: function (state, payload) {
            state.token = payload.access_token
        },
        logout: function (state) {
            if (state.token != '') {
                state.token = ''
                state.refresh_token = ''
                state.authority = ''
                state.employeeId = ''
                state.employeeName = ''
            }
        },
        loginCheck: function (state) {
            if (!state.token) {
                router.push({
                    name: 'login'
                }).catch(error => {
                    console.log(error)
                })
            }
        },
    }
}

export default userStore