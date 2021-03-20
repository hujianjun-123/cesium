var measureArea = function (viewer) {
    var tooltip = document.getElementById("ToolTip");
    var isDraw = false;
    var polygonPath = [];
    var polygon = null;
    var handler = viewer.screenSpaceEventHandler;
    handler.setInputAction(function (movement) {
        //新增部分
        var position1;
        var cartographic;
        var ray = viewer.scene.camera.getPickRay(movement.endPosition);
        if (ray)
            position1 = viewer.scene.globe.pick(ray, viewer.scene);
        if (position1)
            cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position1);
        if (cartographic) {
            //海拔
            var height = viewer.scene.globe.getHeight(cartographic);
            var point = Cesium.Cartesian3.fromDegrees(cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180, height);
            if (isDraw) {
                tooltip.style.left = movement.endPosition.x + 10 + "px";
                tooltip.style.top = movement.endPosition.y + 20 + "px";
                tooltip.style.display = "block";
                if (polygonPath.length < 2) {
                    return;
                }
                if (!Cesium.defined(polygon)) {
                    polygonPath.push(point);
                    polygon = new CreatePolygon(polygonPath, Cesium);
                    AllEnities.push(polygon);
                } else {
                    polygon.path.pop();
                    polygon.path.push(point);
                    AllEnities.push(polygon);
                }
                if (polygonPath.length >= 2) {
                    tooltip.innerHTML = '双击确定终点';
                }
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(function (movement) {
        isDraw = true;
        //新增部分
        var position1;
        var cartographic;
        var ray = viewer.scene.camera.getPickRay(movement.position);
        if (ray)
            position1 = viewer.scene.globe.pick(ray, viewer.scene);
        if (position1)
            cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position1);
        if (cartographic) {
            //海拔
            var height = viewer.scene.globe.getHeight(cartographic);
            var point = Cesium.Cartesian3.fromDegrees(cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180, height);
            if (isDraw) {
                polygonPath.push(point);
                var tmep = viewer.entities.add({
                    position: point,
                    point: {
                        show: true,
                        color: Cesium.Color.SKYBLUE,
                        pixelSize: 10,
                        outlineColor: Cesium.Color.YELLOW,
                        outlineWidth: 1
                    },
                });
                AllEnities.push(tmep);
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.setInputAction(function () {
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        if (polygonPath.length >= 2) {
            var label = String(countAreaInCartesian3(polygon.path));
            label = label.substr(0, label.indexOf(".", 0));
            var text;
            if (label.length < 6)
                text = label + "平方米";
            else {
                label = String(label / 1000000);
                label = label.substr(0, label.indexOf(".", 0) + 3);
                text = label + "平方公里"
            }
            var textArea = text;
            var lastpoint = viewer.entities.add({
                name: '多边形面积',
                position: polygon.path[polygon.path.length - 1],
                point: {
                    pixelSize: 5,
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
                    pixelOffset: new Cesium.Cartesian2(20, -40)
                }
            });
            AllEnities.push(lastpoint);
        }
        viewer.trackedEntity = undefined;
        isDraw = false;
        tooltip.style.display = 'none';
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    var CreatePolygon = (function () {
        function _(positions, cesium) {
            if (!Cesium.defined(positions)) {
                throw new Cesium.DeveloperError('positions is required!');
            }
            if (positions.length < 3) {
                throw new Cesium.DeveloperError('positions 的长度必须大于等于3');
            }
            this.options = {
                polygon: {
                    show: true,
                    hierarchy: undefined,
                    outline: true,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    material: Cesium.Color.YELLOW.withAlpha(0.4)
                }
            };
            this.path = positions;
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
            var oo = viewer.entities.add(this.options);
            AllEnities.push(oo);
        };
        return _;
    })();
    //微元法求面积
    var countAreaInCartesian3 = function (ps) {
        var s = 0;
        for (var i = 0; i < ps.length; i++) {
            var p1 = ps[i];
            var p2;
            if (i < ps.length - 1)
                p2 = ps[i + 1];
            else
                p2 = ps[0];
            s += p1.x * p2.y - p2.x * p1.y;
        }
        return Math.abs(s / 2);
    }
}