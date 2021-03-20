<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<style scoped>
#link {
  position: fixed;
  z-index: 99999999;
  width: 10vw;
  height: 44px;
  top: 0;
  left: 0;
  text-align: center;
  line-height: 44px;
  color: white;
}
#link a {
  text-decoration: none;
  margin: 0 5px;
  font-weight: bold;
  color: white;
}
#link a.router-link-exact-active {
  color: red;
}
</style>
