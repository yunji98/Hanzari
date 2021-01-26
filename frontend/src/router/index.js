import Vue from 'vue'
import Router from 'vue-router'
import fabric from 'fabric'
import store from '@/store/index.js'

import Hanzari from '@/views/Hanzari'
import SuperHanzari from '@/views/SuperHanzari'
import ManagerHanzari from '@/views/ManagerHanzari'
import ViewerHanzari from '@/views/ViewerHanzari'
import Login from '@/views/Login'
import AdminMyPage from '@/views/AdminMyPage'
import MyPage from '@/views/MyPage'

Vue.use(Router)
Vue.use(fabric)

const doNotRequireAuth = () => (to, from, next) => {
  if (store.state.userStore.token != '') {
    //이후에 권한 따져서 mypage 보낼 예정
    return next('/myPage');
  }
  next()
}

const requireAuth = () => (to, from, next) => {
  if (store.state.userStore.token != '') {
    return next();
  }
  next('/')
}

const requireAuthAdmin = () => (to, from, next) => {
  if (store.state.userStore.token != '' && store.state.userStore.authority === "admin" && store.state.buildingStore.building != '') {
    return next();
  }
  next('/')
}

const requireAuthManager = () => (to, from, next) => {
  if (store.state.userStore.token != '' && store.state.userStore.authority === "manager" && store.state.buildingStore.building != '') {
    return next();
  }
  next('/')
}

const requireAuthViewer = () => (to, from, next) => {
  if (store.state.userStore.token != '' && store.state.userStore.authority === "viewer" && store.state.buildingStore.building != '') {
    return next();
  }
  next('/')
}

const enterMyPage = () => (to, from, next) => {
  if (store.state.getStore.allFloor != null) {
    store.state.getStore.allFloor = null
    store.state.getStore.floorIdList = []
    store.state.getStore.latestFloor = null
    store.state.getStore.latestFloorImage = null
    store.state.getStore.latestFloorDepartmentIdList = null
    store.state.getStore.latestFloorSeatList = null
    store.state.getStore.otherFloorsImageList = null
    store.state.getStore.otherFloorsDepartmentIdMap = null
    store.state.getStore.otherFloorsSeatMap = null

    store.state.deleteStore.deleteFloorIdList = []
    store.state.deleteStore.deleteSeatIdList = []

    store.state.postStore.floorDataList = []
    store.state.postStore.seatDataList = []
    store.state.postStore.allDepartmentList = []
    store.state.postStore.imageDataList = []
    store.state.postStore.imageFloorDataList = []
  }

  if (store.state.userStore.token != '') {
    next();
  }
  else {
    next('/')
  }

  if (store.state.userStore.authority === "super") {
    next('/SuperHanzari');
  } else if (store.state.userStore.authority === "admin") {
    next('/AdminMyPage');
  } else {
    next('/MyPage');
  }
}

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login,
      beforeEnter: doNotRequireAuth()
    },
    {
      path: '/AdminMyPage',
      name: 'AdminMyPage',
      component: AdminMyPage,
      beforeEnter: enterMyPage()
    },
    {
      path: '/MyPage',
      name: 'MyPage',
      component: MyPage,
      beforeEnter: enterMyPage()
    },
    {
      path: '/SuperHanzari',
      name: 'SuperHanzari',
      component: SuperHanzari,
      beforeEnter: requireAuth()
    },
    {
      path: '/Hanzari',
      name: 'Hanzari',
      component: Hanzari,
      beforeEnter: requireAuthAdmin()
    },
    {
      path: '/ManagerHanzari',
      name: 'ManagerHanzari',
      component: ManagerHanzari,
      beforeEnter: requireAuthManager()
    },
    {
      path: '/ViewerHanzari',
      name: 'ViewerHanzari',
      component: ViewerHanzari,
      beforeEnter: requireAuthViewer()
    }
  ]
})
