
import * as Cesium from "cesium";

export default {
    //测量空间直线距离 
    /******************************************* */
    measureLineSpace(viewer, handler) {
        // 取消双击事件-追踪该位置
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
        var positions = [];
        var poly = null;
        var distance = 0;
        var cartesian = null;
        var floatingPoint;

        handler.setInputAction(function (movement) {
            let ray = viewer.camera.getPickRay(movement.endPosition);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (positions.length >= 2) {
                if (!Cesium.defined(poly)) {
                    poly = new PolyLinePrimitive(positions);
                } else {
                    positions.pop();
                    positions.push(cartesian);
                }
                distance = getSpaceDistance(positions);
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(function (movement) {
            let ray = viewer.camera.getPickRay(movement.position);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (positions.length == 0) {
                positions.push(cartesian.clone());
            }
            positions.push(cartesian);
            //在三维场景中添加Label
            var textDisance = distance + "米";
            floatingPoint = viewer.entities.add({
                name: '空间直线距离',
                position: positions[positions.length - 1],
                point: {
                    pixelSize: 5,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                },
                label: {
                    text: textDisance,
                    font: '18px sans-serif',
                    fillColor: Cesium.Color.GOLD,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(20, -20),
                }
            });
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(function (movement) {
            handler.destroy(); //关闭事件句柄
            positions.pop(); //最后一个点无效
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        var PolyLinePrimitive = (function () {
            function _(positions) {
                this.options = {
                    name: '直线',
                    polyline: {
                        show: true,
                        positions: [],
                        material: Cesium.Color.CHARTREUSE,
                        width: 10,
                        clampToGround: true
                    }
                };
                this.positions = positions;
                this._init();
            }

            _.prototype._init = function () {
                var _self = this;
                var _update = function () {
                    return _self.positions;
                };
                //实时更新polyline.positions
                this.options.polyline.positions = new Cesium.CallbackProperty(_update, false);
                viewer.entities.add(this.options);
            };
            return _;
        })();

        //空间两点距离计算函数
        function getSpaceDistance(positions) {
            var distance = 0;
            for (var i = 0; i < positions.length - 1; i++) {
                var point1cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
                var point2cartographic = Cesium.Cartographic.fromCartesian(positions[i + 1]);
                /**根据经纬度计算出距离**/
                var geodesic = new Cesium.EllipsoidGeodesic();
                geodesic.setEndPoints(point1cartographic, point2cartographic);
                var s = geodesic.surfaceDistance;
                //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
                //返回两点之间的距离
                s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
                distance = distance + s;
            }
            return distance.toFixed(2);
        }
    },

    //****************************测量空间面积************************************************//
    measureAreaSpace(viewer, handler) {
        // 取消双击事件-追踪该位置
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        // 鼠标事件
        handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
        var positions = [];
        var tempPoints = [];
        var polygon = null;
        var cartesian = null;
        var floatingPoint;//浮动点

        handler.setInputAction(function (movement) {
            let ray = viewer.camera.getPickRay(movement.endPosition);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (positions.length >= 2) {
                if (!Cesium.defined(polygon)) {
                    polygon = new PolygonPrimitive(positions);
                } else {
                    positions.pop();
                    positions.push(cartesian);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(function (movement) {
            let ray = viewer.camera.getPickRay(movement.position);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (positions.length == 0) {
                positions.push(cartesian.clone());
            }
            positions.push(cartesian);
            //在三维场景中添加点
            var cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 1]);
            var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
            var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
            var heightString = cartographic.height;
            tempPoints.push({ lon: longitudeString, lat: latitudeString, hei: heightString });
            floatingPoint = viewer.entities.add({
                name: '多边形面积',
                position: positions[positions.length - 1],
                point: {
                    pixelSize: 5,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(function (movement) {
            handler.destroy();
            positions.pop();
            tempPoints.pop();
            viewer.entities.remove(floatingPoint);
            //在三维场景中添加点
            var cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 1]);
            var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
            var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
            var heightString = cartographic.height;
            tempPoints.push({ lon: longitudeString, lat: latitudeString, hei: heightString });

            var textArea = getArea(tempPoints) + "平方公里";
            viewer.entities.add({
                name: '多边形面积',
                position: positions[positions.length - 1],
                point: {
                    pixelSize: 10,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                },
                label: {
                    text: textArea,
                    font: '18px sans-serif',
                    fillColor: Cesium.Color.GOLD,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(20, -40),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        var radiansPerDegree = Math.PI / 180.0;//角度转化为弧度(rad) 
        var degreesPerRadian = 180.0 / Math.PI;//弧度转化为角度

        //计算多边形面积
        function getArea(points) {
            var res = 0;
            //拆分三角曲面
            for (var i = 0; i < points.length - 2; i++) {
                var j = (i + 1) % points.length;
                var k = (i + 2) % points.length;
                var totalAngle = Angle(points[i], points[j], points[k]);
                var dis_temp1 = distance(positions[i], positions[j]);
                var dis_temp2 = distance(positions[j], positions[k]);
                res += dis_temp1 * dis_temp2 * Math.abs(Math.sin(totalAngle));
                console.log(res);
            }
            return (res / 1000000.0).toFixed(4);
        }

        /*角度*/
        function Angle(p1, p2, p3) {
            var bearing21 = Bearing(p2, p1);
            var bearing23 = Bearing(p2, p3);
            var angle = bearing21 - bearing23;
            if (angle < 0) {
                angle += 360;
            }
            return angle;
        }
        /*方向*/
        function Bearing(from, to) {
            var lat1 = from.lat * radiansPerDegree;
            var lon1 = from.lon * radiansPerDegree;
            var lat2 = to.lat * radiansPerDegree;
            var lon2 = to.lon * radiansPerDegree;
            var angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2));
            if (angle < 0) {
                angle += Math.PI * 2.0;
            }
            angle = angle * degreesPerRadian;//角度
            return angle;
        }

        var PolygonPrimitive = (function () {
            function _(positions) {
                this.options = {
                    name: '多边形',
                    polygon: {
                        hierarchy: [],
                        // perPositionHeight : true,
                        material: Cesium.Color.GREEN.withAlpha(0.5),
                        // heightReference:20000
                    }
                };

                this.hierarchy = positions;
                this._init();
            }

            _.prototype._init = function () {
                var _self = this;
                var _update = function () {
                    return _self.hierarchy;
                };
                //实时更新polygon.hierarchy
                this.options.polygon.hierarchy = new Cesium.CallbackProperty(_update, false);
                viewer.entities.add(this.options);
            };

            return _;
        })();

        function distance(point1, point2) {
            var point1cartographic = Cesium.Cartographic.fromCartesian(point1);
            var point2cartographic = Cesium.Cartographic.fromCartesian(point2);
            /**根据经纬度计算出距离**/
            var geodesic = new Cesium.EllipsoidGeodesic();
            geodesic.setEndPoints(point1cartographic, point2cartographic);
            var s = geodesic.surfaceDistance;
            //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
            //返回两点之间的距离
            s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
            return s;
        }
    },
    setBuildingClickHandler(bool) {
        this._handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        //设置鼠标左键监听事件
        this._handler.setInputAction((click) => {
            if (bool) {
                //场景场景还原最初
                this._earth.sceneTree.root.children.length = this.initChildrenLength
                //可以通过czm对象调用Cesium相关接口
                //获取点击对象
                var pickedFeature = this._earth.czm.viewer.scene.pick(click.position);
                if (typeof pickedFeature !== 'undefined' && (this.getObjClassName(pickedFeature) === 'Cesium3DTileFeature')) {
                    //获取点击位置
                    var clickPosition = this._earth.pickPosition(click.position)
                    //获取点击属性
                    var name = pickedFeature.getProperty('NAME')
                    var height = pickedFeature.getProperty('HEIGHT')
                    //构建pin弹出框json对象
                    var json = {
                        "czmObject": {
                            "xbsjType": "Pin",
                            "xbsjGuid": "c2ab17db-36b2-4982-add6-cece932b9b68",
                            "name": "城科",
                            "evalString": "const width = 200;\nconst height = 100;\nfunction createLabelCanvas(p) {\n  if (p._labelDiv) {\n    p._earth.czm.viewer.container.removeChild(p._labelDiv);\n    p._labelDiv = undefined;\n  }\n  const labelDiv = document.createElement('div');\n  labelDiv.style = 'width:'+width+'px;height: '+height+'px;position: absolute; pointer-events: none;'\n\n  p._earth.czm.viewer.container.appendChild(labelDiv);\n  p._labelDiv = labelDiv;\n\n  var dis = XE.MVVM.watch(() => {\n    labelDiv.style.display = p.enabled ? 'block' : 'none';\n  });\n\n  p.disposers.push(() => {\n    if (p._labelDiv) {\n      p._earth.czm.viewer.container.removeChild(p._labelDiv);\n      p._labelDiv = undefined;\n    }\n    dis();\n  });\n\n  const labelCanvas = document.createElement('canvas');\n  labelCanvas.style = 'width: 100%;height: 100%;';\n\n  labelCanvas.width = width;\n  labelCanvas.height = height;\n  labelDiv.appendChild(labelCanvas);\n  return labelCanvas;\n}\n\nfunction createDrawFunc(p) {\n  const labelCanvas = createLabelCanvas(p);\n  const ctx = labelCanvas.getContext('2d');\n\n  function draw(w) {\n    ctx.clearRect(0, 0, width, height);\n\n    ctx.save();\n    ctx.lineWidth = 2;\n    ctx.strokeStyle = 'rgb(31, 255,255)';\n    ctx.beginPath();\n    ctx.moveTo(width, height);\n    ctx.lineTo(width-height, 22);\n    ctx.lineTo(0, 22);\n    ctx.stroke();\n    ctx.restore();\n    ctx.font = \"16px console\"; \n    ctx.fillStyle = 'rgb(255, 255, 0)';\n    ctx.fillText('" +
                                name + " " + height + "米', 0, 20);\n    ctx.restore();\n  }\n\n  p._dDraw = draw;\n}\n\ncreateDrawFunc(p);\n\nlet d = 0;\nlet c = 0;\np._dDraw(c);\nconst preUpdateListener = p._earth.czm.scene.preUpdate.addEventListener(() => {\n  if (d !== c) {\n    c += (d - c) * 0.1;\n    if (Math.abs(c - d) < 0.1) {\n      c = d;\n    }\n    p._dDraw(c);\n  }\n});\np.disposers.push(() => preUpdateListener && preUpdateListener());\n\nconst container = p._earth.czm.viewer.container;\nconst unwatch = XE.MVVM.watch(() => [...p.winPos], winPos => {\n  if (p._labelDiv) {\n    p._labelDiv.style.left = (winPos[0] -  p._labelDiv.clientWidth) + 'px';\n    p._labelDiv.style.bottom = winPos[3]+'px';\n  } \n});\np.disposers.push(() => {\n  unwatch && unwatch();\n});",
                            "position": clickPosition,
                            "isDivImage": true,
                            "origin": [
                                1.390625,
                                -0.7
                            ],
                            "pinBuilder": {},
                            "far": 1073741824
                        }
                    }
                    //将构建的pin弹出框对象加入场景
                    this._earth.sceneTree.root.children.push(json);
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
}