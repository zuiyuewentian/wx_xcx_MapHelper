var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
var qqmapsdk;

Page({
  data: {
    MyLocationName:"",
    Mylatitude: null,
    Mylongitude: null,
    Mymarkers:[],
    ActiveList:[
      {
        index:1,
        name:"天隆寺[地铁站]",
        latitude: null, 
        longitude: null,
        color:"grey",
        len:""
      }, {
        index: 2,
        name: "南京市江宁区人民法院",
        latitude: null, 
        longitude: null,
        color: "grey",
        len: ""
      }, {
        index: 3,
        name: "江苏省南京市秦淮区贡院街",
        latitude: null,
        longitude: null,
        color: "grey",
        len: ""
      }
    ]
  },
  SetShadow(e) {
    this.setData({
      shadow: e.detail.value
    })
  },
  select: function(e){
    var index = e.currentTarget.dataset.index;
    //console.log("index:" + e.currentTarget.dataset.index);
    if (index==-1){
      this.OpenMap(-1);
    }else {
      var data = this.data.ActiveList;
      for(var i=0;i<data.length;i++){
        if(data[i].index==index)
        {
          var locat = data[i];
          console.log(locat);
          this.OpenMap(locat);
        }
      }
    }
  },
  OpenMap: function (locat) {
    console.log("e:" + locat);
    var _this = this;
    wx.getLocation({
      type: 'gcj02', //返回可以用于wx.openLocation的经纬度
      success(res) {
        console.log(res);
        var keyword= _this.data.MyLocationName;
        var latitude = res.latitude;
        var longitude = res.longitude;
        if (locat != -1) {
          keyword = locat.name;
          latitude = locat.latitude;
          longitude = locat.longitude;
        }
        wx.openLocation({
          latitude,
          longitude,
          address: keyword,
          scale: 18
        })
      }
    })
  },
  onReady: function () {
   
  },
  onLoad: function () {
    // 实例化API核心类
    qqmapsdk = new QQMapWX({
      key: ''
    });
  
    var _this=this;
    this.GetLocationName();
    var PromiseAllArr=[];
    for (var i = 0; i < this.data.ActiveList.length; i++) {
      PromiseAllArr.push(this.GetLocation(this.data.ActiveList[i], i));
    }
    
    Promise.all(PromiseAllArr).then(function () {
      console.log(_this.data.ActiveList);
      _this.GetDistance(_this.data.ActiveList);
    }).catch(reason => {
      console.log(reason)
    });
  },
  //计算距离
  GetDistance(locat) {
        var _this = this;
        //调用距离计算接口
        qqmapsdk.calculateDistance({
              //mode: 'driving',//可选值：'driving'（驾车）、'walking'（步行），不填默认：'walking',可不填
              //from参数不填默认当前地址
              //获取表单提交的经纬度并设置from和to参数（示例为string格式）
              from:'', //若起点有数据则采用起点坐标，若为空默认当前地址
              to: locat, //终点坐标
              success: function (res) {//成功后的回调
                  console.log(res);
                  var res = res.result;
                for (var i = 0; i < res.elements.length; i++) {
                  for(var j=0; j < locat.length;j++){
                    if (locat[j].latitude == res.elements[i].to.lat &&
                      locat[j].longitude == res.elements[i].to.lng){
                      var item = 'ActiveList[' + j + '].len';
                      _this.setData({ //设置并更新distance数据
                         [item]: res.elements[i].distance
                      });
                    }
                  }
                }
                //排序
                var data = _this.data.ActiveList;
                var newdata = data.sort(_this.compare('len'));
                _this.setData({
                  ActiveList: newdata
                });
                console.log("newdata" + newdata);
              },
              fail: function (error) {
                  console.error(error);
              },
              complete: function (res) {
                 // console.log(res);
              }
        });
  },
  //比较大小 排序
  compare(key){
    return function (value1, value2) {
      var val1 = value1[key];
      var val2 = value2[key];
      return val1 - val2;
    }
  },
  //获取指定位置坐标
  GetLocation: function (myLocat, index){
    var _this = this;
    return new Promise(function (resolve, reject) {
    //调用地址解析接口
    qqmapsdk.geocoder({
      //获取表单传入地址
      address: myLocat.name, //地址参数，例：固定地址，address: '北京市海淀区彩和坊路海淀西大街74号'
      success: function (res) {//成功后的回调
        console.log(res);
        var res = res.result;
        var latitude = res.location.lat;
        var longitude = res.location.lng;
        //根据地址解析在地图上标记解析地址位置
        var mark={
           id:myLocat.index,
           title: myLocat.name,
           latitude: latitude,
           longitude: longitude,
           iconPath:"../../resource/map.png",
           callout: {
              content: myLocat.name,
              padding: 10,
              display: 'ALWAYS',
              textAlign: 'center'
              }
            };
        var count = _this.data.Mymarkers.length;
        var item = 'Mymarkers[' + count + ']';
        var lat = 'ActiveList[' + index + '].latitude';
        var lon = 'ActiveList[' + index + '].longitude';
        _this.setData({ 
          [item]: mark,
          [lat]: latitude,
          [lon]: longitude
        });
        //console.log(_this.data.ActiveList);
      },
      fail: function (error) {
        console.error(error);
      },
      complete: function (res) {
        console.log(res);
        return resolve("true");
      }
    });
    })
  },
  //获取当前位置，逆名称解析
  GetLocationName: function() {
    var _this = this;
    qqmapsdk.reverseGeocoder({
      location: '', //获取表单传入的位置坐标,不填默认当前位置,示例为string格式
      //get_poi: 1, //是否返回周边POI列表：1.返回；0不返回(默认),非必须参数
      success: function (res) {//成功后的回调
        console.log(res);
        var res = res.result;
        _this.setData({ //设置并更新distance数据
          MyLocationName:res.address,
          Mylatitude: res.location.lat,
          Mylongitude: res.location.lng,
        });
      },
      fail: function (error) {
        console.error(error);
      },
      complete: function (res) {
       // console.log(res);
      }
    })
  }
})
