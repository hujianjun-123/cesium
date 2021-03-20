<template>
  <!-- 轨迹 -->
  <div>
    <div class="coordinate">
      <div>
        <span>经度：</span>
        <span v-text="longitude"></span>
      </div>
      <div>
        <span>纬度：</span>
        <span v-text="latitude"></span>
      </div>
      <div>
        <span>高度：</span>
        <span v-text="height"></span>
      </div>
      <div :class="ispunctuation ? 'ispunctuation' : 'punctuation'" @click="setpunctuation">标点</div>
      <div :class="isusebox ? 'isusebox' : 'usebox'" @click="setusebox">隔离模型</div>
    </div>
    <div id="trajectory"></div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      longitude: 0,
      latitude: 0,
      height: 0,
      flightData: [],
      oldflightDatalength: 0,
      ispunctuation: false,
      isusebox: false,
      pointDraged: null,
      leftDownFlag: false
    };
  },
  methods: {
    setpunctuation() {
      this.ispunctuation = !this.ispunctuation;
    },
    setusebox() {
      this.isusebox = !this.isusebox;
    }
  },
  mounted() {
    let that = this;
    const viewer = new Cesium.Viewer("trajectory");

    viewer.scene.globe.depthTestAgainstTerrain = true;
    Cesium.Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMGVkYWY1ZS1jYjZlLTQ2MTAtOGFkMy0yODdiYjgwOTkzN2IiLCJpZCI6NDYwNjMsImlhdCI6MTYxNTgxMjgwMX0.hIV--wvBDJRTRdGgOECFf4vz1Q1BGNFIhVjx-LHkCwY";
    // ===================================================
    const osmBuildings = viewer.scene.primitives.add(
      Cesium.createOsmBuildings()
    );
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 60)
    });
    // 增加建筑
    const newBuildingTileset = viewer.scene.primitives.add(
      new Cesium.Cesium3DTileset({
        id: "id",
        url: Cesium.IonResource.fromAssetId(368458)
      })
    );
    // viewer.scene.primitives.remove(newBuildingTileset);
    // viewer.flyTo(newBuildingTileset);

    var scene = viewer.scene;
    if (!scene.pickPositionSupported) {
      window.alert("This browser does not support pickPosition.");
    }
    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    // 鼠标移动获取经纬度
    var pointDraged = null;
    var leftDownFlag = false;
    var params = {
      tx: 0, //模型中心X轴坐标（经度，单位：十进制度）
      ty: 0, //模型中心Y轴坐标（纬度，单位：十进制度）
      tz: 0, //模型中心Z轴坐标（高程，单位：米）
      rx: 0, //X轴（经度）方向旋转角度（单位：度）
      ry: 0, //Y轴（纬度）方向旋转角度（单位：度）
      rz: 0, //Z轴（高程）方向旋转角度（单位：度）
      scale: 1 //缩放比例
    };
    var click_mode = false;
    var oldheight = 0;

    handler.setInputAction(function(movement) {
      var pickedObject = scene.pick(movement.endPosition);
      let positiondata = {};
      if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
        var cartesian = viewer.scene.pickPosition(movement.endPosition);
        if (Cesium.defined(cartesian)) {
          var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          var longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(
            10
          );
          var latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(
            10
          );
          var height = cartographic.height.toFixed(10); //模型高度
          that.longitude = longitude;
          that.latitude = latitude;
          that.height = height;
          positiondata = { longitude, latitude, height };
        }
      } else {
        var cartesian = viewer.camera.pickEllipsoid(
          movement.endPosition,
          scene.globe.ellipsoid
        );
        if (cartesian) {
          var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          var longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(
            10
          );
          var latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(
            10
          );
          var height = Cesium.Math.toDegrees(cartographic.height).toFixed(10);
          that.longitude = longitude;
          that.latitude = latitude;
          that.height = height;
          positiondata = { longitude, latitude, height };
        }
      }
      if (click_mode === true && !that.ispunctuation) {
        params.tx = positiondata.longitude;
        params.ty = positiondata.latitude;
        var position = Cesium.Cartesian3.fromDegrees(params.tx, params.ty);
        var m = Cesium.Transforms.eastNorthUpToFixedFrame(position);
        newBuildingTileset._root.transform = m;
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 左键按下
    handler.setInputAction(function leftDownAction(e) {
      if (that.ispunctuation) {
        return false;
      }
      var scene = viewer.scene;
      var pickedObject = scene.pick(e.position);
      if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
        click_mode = true;
        var cartesian = viewer.scene.pickPosition(e.position);
        if (Cesium.defined(cartesian)) {
          var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          var height = cartographic.height; //模型高度
          oldheight = height;
        }
        console.log("左键按下");
        viewer.scene.screenSpaceCameraController.enableRotate = false; //锁定相机
      } else {
        click_mode = false;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 左键抬起
    handler.setInputAction(function leftUpAction(e) {
      if (that.ispunctuation) {
        return false;
      }
      console.log("左键抬起");
      click_mode = false;
      viewer.scene.screenSpaceCameraController.enableRotate = true; //解锁相机
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // 双击鼠标左键清除默认事件
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    // 点击鼠标左键绘制点
    handler.setInputAction(function(event) {
      var scene = viewer.scene;
      let dataPoint = {};
      let click_mode = false;
      // 判断是否点击的建筑
      if (scene.mode !== Cesium.SceneMode.MORPHING) {
        var pickedObject = scene.pick(event.position);
        if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
          click_mode = true;
          var cartesian = viewer.scene.pickPosition(event.position);
          if (Cesium.defined(cartesian)) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitude = Cesium.Math.toDegrees(cartographic.longitude);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude);
            var height = cartographic.height; //模型高度
            dataPoint = {
              longitude: that.longitude,
              latitude: that.latitude,
              height: that.height
            };
          }
        } else {
          dataPoint = {
            longitude: that.longitude,
            latitude: that.latitude,
            height: that.height
          };
        }
      }
      // 是否标记点
      if (that.ispunctuation) {
        let flightData = that.flightData;
        flightData.push(dataPoint);
        that.flightData = flightData;
        const pointEntity = viewer.entities.add({
          description: `此点位于 (${dataPoint.longitude}, ${dataPoint.latitude})`,
          position: Cesium.Cartesian3.fromDegrees(
            dataPoint.longitude,
            dataPoint.latitude,
            dataPoint.height
          ),
          point: { pixelSize: 20, color: Cesium.Color.RED }
        });
      }
      // 是否使用立方体包围目标  仅点击建筑有效
      if (that.isusebox && click_mode) {
        var redBox = viewer.entities.add({
          id: `${dataPoint.longitude}${dataPoint.latitude}`,
          name: "red box with white outline",
          position: Cesium.Cartesian3.fromDegrees(
            dataPoint.longitude,
            dataPoint.latitude,
            dataPoint.height / 2
          ),
          box: {
            dimensions: new Cesium.Cartesian3(4.0, 4.0, dataPoint.height),
            material: Cesium.Color.RED.withAlpha(0.5),
            outline: false,
            outlineColor: Cesium.Color.WHITE
          }
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 点击鼠标右键绘制轨迹
    handler.setInputAction(function(event) {
      let flightData = that.flightData;
      let oldflightDatalength = that.oldflightDatalength;
      if (flightData.length <= 1 || flightData.length <= oldflightDatalength) {
        return false;
      }
      that.oldflightDatalength = flightData.length;
      const timeStepInSeconds = 30;
      const totalSeconds = timeStepInSeconds * (flightData.length - 1);
      const start = Cesium.JulianDate.fromIso8601("2020-03-19T23:10:00Z");
      const stop = Cesium.JulianDate.addSeconds(
        start,
        totalSeconds,
        new Cesium.JulianDate()
      );
      viewer.clock.startTime = start.clone();
      viewer.clock.stopTime = stop.clone();
      viewer.clock.currentTime = start.clone();
      viewer.timeline.zoomTo(start, stop);
      viewer.clock.multiplier = 1;
      viewer.clock.shouldAnimate = true;

      const positionProperty = new Cesium.SampledPositionProperty();
      for (let i = 0; i < flightData.length; i++) {
        const dataPoint = flightData[i];
        const time = Cesium.JulianDate.addSeconds(
          start,
          i * timeStepInSeconds,
          new Cesium.JulianDate()
        );
        const position = Cesium.Cartesian3.fromDegrees(
          dataPoint.longitude,
          dataPoint.latitude,
          dataPoint.height
        );
        positionProperty.addSample(time, position);

        // viewer.entities.add({
        //   description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
        //   position: position,
        //   point: { pixelSize: 10, color: Cesium.Color.RED }
        // });
      }

      const airplaneEntity = viewer.entities.add({
        availability: new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({ start: start, stop: stop })
        ]),
        position: positionProperty,
        point: { pixelSize: 30, color: Cesium.Color.GREEN },
        path: new Cesium.PathGraphics({ width: 3 })
      });
      viewer.trackedEntity = airplaneEntity;
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    // ==================================
  }
};
</script>

<style>
.coordinate {
  position: fixed;
  z-index: 999999;
  top: 0;
  left: 0;
  width: 240px;
  font-size: 18px;
  background-color: rgba(255, 255, 255, 1);
  padding: 10px;
}
.coordinate div {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  align-items: center;
}
.coordinate .punctuation {
  display: inline-block;
  border: 1px solid;
  padding: 4px 10px;
  margin: 10px 0;
  cursor: pointer;
}
.coordinate .ispunctuation {
  display: inline-block;
  border: 1px solid;
  padding: 4px 10px;
  margin: 10px 0;
  cursor: pointer;
  background-color: red;
  color: white;
  border: 1px solid red;
}
.coordinate .usebox {
  display: inline-block;
  border: 1px solid;
  padding: 4px 10px;
  margin: 10px;
  cursor: pointer;
}
.coordinate .isusebox {
  display: inline-block;
  border: 1px solid;
  padding: 4px 10px;
  margin: 10px;
  cursor: pointer;
  background-color: red;
  color: white;
  border: 1px solid red;
}
</style>
