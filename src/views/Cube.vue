<template>
  <div>
    <div class="coordinate">
      <div>经度：{{ longitude }}</div>
      <div>纬度：{{ latitude }}</div>
    </div>
    <div id="code"></div>
  </div>
</template>

<script>
export default {
  name: "Home",
  components: {},
  data() {
    return {
      longitude: null,
      latitude: null
    };
  },
  methods: {},
  mounted() {
    const viewer = new Cesium.Viewer("code", {
      terrainProvider: Cesium.createWorldTerrain()
    });
    Cesium.Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMGVkYWY1ZS1jYjZlLTQ2MTAtOGFkMy0yODdiYjgwOTkzN2IiLCJpZCI6NDYwNjMsImlhdCI6MTYxNTgxMjgwMX0.hIV--wvBDJRTRdGgOECFf4vz1Q1BGNFIhVjx-LHkCwY";

    const osmBuildings = viewer.scene.primitives.add(
      Cesium.createOsmBuildings()
    );

    // 增加建筑
    const newBuildingTileset = viewer.scene.primitives.add(
      new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(368458)
      })
    );

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 100)
    });

    viewer.flyTo(newBuildingTileset);

    // ==========================   拾取经纬度
    let that = this;
    var scene = viewer.scene;
    if (!scene.pickPositionSupported) {
      window.alert("This browser does not support pickPosition.");
    }
    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(function(movement) {
      var cartesian = viewer.camera.pickEllipsoid(
        movement.endPosition,
        scene.globe.ellipsoid
      );
      if (cartesian) {
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var longitudeString = Cesium.Math.toDegrees(
          cartographic.longitude
        ).toFixed(8);
        var latitudeString = Cesium.Math.toDegrees(
          cartographic.latitude
        ).toFixed(8);
        that.longitude = longitudeString;
        that.latitude = latitudeString;
      } 
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


    
  }
};
</script>
<style >
.coordinate {
  position: fixed;
  z-index: 999999;
  top: 44px;
  left: 0;
  width: 300px;
  font-size: 18px;
  background-color: #fff;
  padding: 10px;
}
</style>