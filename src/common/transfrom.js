var params = {
    tx: 110.5,  //模型中心X轴坐标（经度，单位：十进制度）
    ty: 30,    //模型中心Y轴坐标（纬度，单位：十进制度）
    tz: 1120,    //模型中心Z轴坐标（高程，单位：米）
    rx: 60,    //X轴（经度）方向旋转角度（单位：度）
    ry: 30,    //Y轴（纬度）方向旋转角度（单位：度）
    rz: 0,       //Z轴（高程）方向旋转角度（单位：度）
    scale: 1   //缩放比例
};

//平移、贴地、旋转模型
function update3dtilesMaxtrix(tileset) {
    //旋转
    var mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(params.rx));
    var my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(params.ry));
    var mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(params.rz));
    var rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
    var rotationY = Cesium.Matrix4.fromRotationTranslation(my);
    var rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);

    //平移
    var position = Cesium.Cartesian3.fromDegrees(params.tx, params.ty, params.tz);
    var m = Cesium.Transforms.eastNorthUpToFixedFrame(position);

    //旋转、平移矩阵相乘
    Cesium.Matrix4.multiply(m, rotationX, m);
    Cesium.Matrix4.multiply(m, rotationY, m);
    Cesium.Matrix4.multiply(m, rotationZ, m);

    //赋值给tileset
    tileset._root.transform = m;

    //缩放
    zoom3dtiles(tsfParams);

}

function zoom3dtiles(tileset) {
    var scale = (params.scale || 1) * 1;
    tileset._root.customTransform = {
        matrix: {
            origin: tileset._root.transform.clone(),
            rotation: Cesium.Matrix4.IDENTITY,
            translation: Cesium.Matrix4.IDENTITY,
        }
    };
    var m1 = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(scale, scale, scale));
    tileset._root.customTransform.matrix.scale = m1;
    tileset._root.customTransform.scale = scale;
    var m2 = new Cesium.Matrix4();
    Cesium.Matrix4.multiply(tileset._root.customTransform.matrix.origin, tileset._root.customTransform.matrix.rotation, m2);
    Cesium.Matrix4.multiply(m2, tileset._root.customTransform.matrix.scale, m2);
    Cesium.Matrix4.multiply(m2, tileset._root.customTransform.matrix.translation, tileset._root.transform);
}

//调用示例
function test(viewer) {
    viewer.scene.globe.depthTestAgainstTerrain = true;
    var url = "./test/tileset.json";
    var tileset = new Cesium.Cesium3DTileset({
        url: url
    });
    var primitive = viewer.scene.primitives.add(tileset);
    primitive.readyPromise.then(function (t) {
        var originalSphere = t.boundingSphere;
        var radius = originalSphere.radius;
        viewer.zoomTo(t, new Cesium.HeadingPitchRange(0.5, -0.5, radius * 4.0));
        //平移、贴地、旋转模型
        update3dtilesMaxtrix(tileset);
    }).otherwise(function (error) {
        var msg = JSON.stringify(error);
        console.log(msg);
    });
}
