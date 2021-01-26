// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import vSelectMenu from 'v-selectmenu'
import { i18n } from '@/plugins/i18n'
import axios from 'axios' // we can use this.$axios without using 'import' in vue instance
import store from '@/store/index.js'
import VuejsDialog from 'vuejs-dialog';
import 'vuejs-dialog/dist/vuejs-dialog.min.css';
import CripNotice from "crip-vue-notice"
import VueNumericInput from 'vue-numeric-input';

export const eventBus = new Vue()
Vue.prototype.$axios = axios

export default new Vuetify({
  icons: {
    iconfont: 'md' // 'md' || 'mdi' || 'fa' || 'fa4'
  }
})

Vue.use(Vuetify)
Vue.use(vSelectMenu)
Vue.use(VuejsDialog);
Vue.use(CripNotice)
Vue.use(VueNumericInput)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  components: { App },
  template: '<App/>',
  vuetify: new Vuetify(),
})
