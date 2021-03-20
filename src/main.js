import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import "cesium/Build/Cesium/Widgets/widgets.css";

import * as Cesium from "cesium";
// =========================================================================  cesium
window.CESIUM_BASE_URL = 'Cesium/';


// =========================================================================  cesium
Vue.config.productionTip = false
new Vue({
  router,
  store,
  render: function (h) { return h(App) }
}).$mount('#app')
