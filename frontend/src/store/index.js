import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate';

Vue.use(Vuex)

import userStore from '@/store/modules/userStore.js'
import buildingStore from '@/store/modules/buildingStore.js'
import getStore from '@/store/modules/getStore';
import deleteStore from '@/store/modules/deleteStore';
import postStore from '@/store/modules/postStore';

const store = new Vuex.Store({
    modules: {
        //키: 값 형태로 저장됩니다.
        userStore: userStore,
        buildingStore: buildingStore,
        getStore: getStore,
        deleteStore: deleteStore,
        postStore: postStore,
    },
    plugins: [createPersistedState({
        paths: ["userStore", "buildingStore"]
    }),
    ]
});

export default store