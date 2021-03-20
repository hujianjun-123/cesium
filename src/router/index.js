import Vue from 'vue'
import VueRouter from 'vue-router'
import Trajectory from '../views/Trajectory.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Trajectory',
    component: Trajectory
  }
]

const router = new VueRouter({
  routes
})

export default router
