'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
var app = angular.module('sbAdminApp')

//angular.module('sbAdminApp')

app.factory('ProductsFact', function($http){
	var ES_URL = "http://52.28.149.249:9200/"
	var map = {};
	map.updateInstances = function(){
		$http.get(ES_URL + "instances/instances")
		.then(function successCallback(response) {
		    // this callback will be called asynchronously
		    // when the response is available
		    if (response.error){
		    	console.info(response.error)
		    }else{
		    	var res = response.hits.hits;
		    	var len = res.length;
	    		this.productInstances = {};

	    		// TODO: DELETE IT!!! - workaround until type will be updated
	    		this.productInstances["vRouter"] = [];
	    		this.productInstances["vSwutch"] = [];
	    		// TODO: DELETE IT!!!
		    	
		    	for ( var i = 0 ; i < len ; i++){
		    		if(!this.productInstances[res[i]._type]){
		    			this.productInstances[res[i]._type] = [];
		    		}
		    		this.productInstances[res[i]._type].push(res[i]._source);
		    		
		    		// TODO: DELETE IT!!! - workaround until type will be updated
		    		this.productInstances["vRouter"].push(res[i]._source);
		    		this.productInstances["vSwutch"].push(res[i]._source);
		    		// TODO: DELETE IT!!!
		    	}
		    	this.mapInstanceIdToName();
		    }
		 }, function errorCallback(response) {
	    // called asynchronously if an error occurs
	    // or server returns response with an error status.
		});
	}
	map.isLoaded = false;
	// load products and product images from 
	map.products = ["vRouter", "vSwitch"],
	map.productImages = {
		"vRouter" : [
			{
				"id" 	: "1",
				"name" 	: "Version 1", 
				"desc" 	: "This is the vRouter first version",
				"sig"  	: "/bower_components/ifds.sig",
				"token"	: "/bower_components/ifds.tkn"
			},{
				"id" 	: "2",
				"name" 	: "Version 2", 
				"desc" 	: "This is the vRouter second version",
				"sig"  	: "/bower_components/ifds.sig",
				"token"	: "/bower_components/ifds.tkn"
			},{
				"id" 	: "3",
				"name" 	: "Version 3",
				"desc" 	: "This is the vRouter third version",
				"sig"  	: "/bower_components/ifds.sig",
				"token"	: "/bower_components/ifds.tkn"
			}
		],
		"vSwitch":[
			{
				"id" 	: "4",
				"name" 	: "Version 1", 
				"desc" 	: "This is the vSwitch first version",
				"sig"  	: "/bower_components/ifds.sig",
				"token"	: "/bower_components/ifds.tkn"
			},
			{
				"id" 	: "5",
				"name" 	: "Version 2", 
				"desc" 	: "This is the vSwitch second version",
				"sig"  	: "/bower_components/ifds.sig",
				"token"	: "/bower_components/ifds.tkn"
			},{
				"id" 	: "6",
				"name" 	: "Version 3", 
				"desc" 	: "This is the vSwitch third version",
				"sig"  	: "/bower_components/ifds.sig",
				"token"	: "/bower_components/ifds.tkn"
			},{
				"id" 	: "7",
				"name" 	: "Version 4", 
				"desc" 	: "This is the vSwitch fourth version",
				"sig"  	: "/bower_components/ifds.sig",
				"token"	: "/bower_components/ifds.tkn"
			}
		]
	}

	map.productInstances = {
		"vRouter" : [
			{
				"id" : "1",
				"name" : "R-F01A",
				"ip" : "146.23.84.122",
				"imageId" : "1",
				"cpuLoad" : 12,
				"upTime" : "1471151607435",
				"status" : 1
			},{
				"id" : "2",
				"name" : "R-F04B",
				"ip" : "146.23.84.51",
				"imageId" : "1",
				"cpuLoad" : 17,
				"upTime" : "1471164607345",
				"status" : 1
			},{
				"id" : "3",
				"name" : "R-F03A",
				"ip" : "146.23.82.223",
				"imageId" : "3",
				"cpuLoad" : 23,
				"upTime" : "1471141607555",
				"status" : 2
			},{
				"id" : "4",
				"name" : "R-F02F",
				"ip" : "146.23.83.100",
				"imageId" : "2",
				"cpuLoad" : 14,
				"upTime" : "1471161107123",
				"status" : 0
			},{
				"id" : "5",
				"name" : "R-F11C",
				"ip" : "146.23.83.97",
				"imageId" : "1",
				"cpuLoad" : 8,
				"upTime" : "1471151207999",
				"status" : 1
			}
		],
		"vSwitch" : [
			{
				"id" : "6",
				"name" : "S-F12V",
				"ip" : "146.23.83.98",
				"imageId" : "5",
				"cpuLoad" : 11,
				"upTime" : "1471130579111",
				"status" : 1
			},{
				"id" : "7",
				"name" : "S-F32C",
				"ip" : "146.23.81.244",
				"imageId" : "5",
				"cpuLoad" : 45,
				"upTime" : "1471160123222",
				"status" : 1
			},{
				"id" : "8",
				"name" : "S-F21A",
				"ip" : "146.23.85.32",
				"imageId" : "4",
				"cpuLoad" : 64,
				"upTime" : "1471121540333",
				"status" : 0
			},{
				"id" : "9",
				"name" : "S-F06E",
				"ip" : "146.23.84.121",
				"imageId" : "7",
				"cpuLoad" : 5,
				"upTime" : "1471157003444",
				"status" : 1
			},{
				"id" : "10",
				"name" : "S-F07Z",
				"ip" : "146.23.82.81",
				"imageId" : "6",
				"cpuLoad" : 10,
				"upTime" : "1471142612555",
				"status" : 2
			}
		]
	}

	map.log = {
		"vRouter" : [
			{
				"id" : "123",
				"instanceId" : "1",
				"timestamp" : "1471161607123",
				"type" : "log",
				"message" : "New config load completed"
			},{
				"id" : "123",
				"instanceId" : "2",
				"timestamp" : "1471161607531",
				"type" : "log",
				"message" : "Ping!"
			},{
				"id" : "123",
				"instanceId" : "2",
				"timestamp" : "1471161607631",
				"type" : "log",
				"message" : "New config load completed"
			},{
				"id" : "123",
				"instanceId" : "1",
				"timestamp" : "1471161607435",
				"type" : "log",
				"message" : "Signature verification finished successfully"
			},{
				"id" : "123",
				"instanceId" : "3",
				"timestamp" : "1471161607377",
				"type" : "error",
				"message" : "Verification failed - wrong signature"
			},{
				"id" : "123",
				"instanceId" : "3",
				"timestamp" : "1471161607878",
				"type" : "log",
				"message" : "New config upload requested"
			},{
				"id" : "123",
				"instanceId" : "1",
				"timestamp" : "1471161607999",
				"type" : "log",
				"message" : "New config upload requested"
			}
		],
		"vSwitch" : [
			{
				"id" : "123",
				"instanceId" : "4",
				"timestamp" : "1471161607121",
				"type" : "log",
				"message" : "New config load completed"
			},{
				"id" : "123",
				"instanceId" : "5",
				"timestamp" : "1471161607222",
				"type" : "log",
				"message" : "New config load completed"
			},{
				"id" : "123",
				"instanceId" : "5",
				"timestamp" : "1471161607333",
				"type" : "log",
				"message" : "New config load completed"
			},{
				"id" : "123",
				"instanceId" : "7",
				"timestamp" : "1471161607666",
				"type" : "log",
				"message" : "New config load completed"
			},{
				"id" : "123",
				"instanceId" : "7",
				"timestamp" : "1471161607872",
				"type" : "log",
				"message" : "New config load completed"
			},{
				"id" : "123",
				"instanceId" : "6",
				"timestamp" : "1471161607949",
				"type" : "log",
				"message" : "New config load completed"
			},{
				"id" : "123",
				"instanceId" : "4",
				"timestamp" : "1471161607303",
				"type" : "log",
				"message" : "New config load completed"
			}
		]
	}

	map.statusToClass = ["fa-arrow-circle-down", " fa-check", "fa-times"]

	map.selected = [0,0];

	map.instanceIdToName = {};
	map.imageIdToName = {};

	map.mapInstanceIdToName = function(){
		for (var productName in this.productInstances){
			var len = this.productInstances[productName].length;
			for (var i = 0 ; i < len ; i++){
				var inst = this.productInstances[productName][i];
				this.instanceIdToName[inst.id] = inst.name;
			}
		}
	}

	map.mapImageIdToName = function(){
		for (var imageName in this.productImages){
			var len = this.productImages[imageName].length;
			for (var i = 0 ; i < len ; i++){
				var img = this.productImages[imageName][i];
				this.imageIdToName[img.id] = img.name;
			}
		}
	}
	
	map.setSelected = function(productIndex, imageIndex){
		this.selected = [productIndex, imageIndex];
	}
	
	map.addProductImage = function(serviceName, /*iId,*/ iName, iDesc, iSig, iToken){
		this.productImages[serviceName].push({
			"id" : 888, //iId
			"name" : iName,
			"desc" : iDesc,
			"sig"  	: "https://ourrepo.com/yourSigFile.sig", //iSig
			"token"	: "https://ourrepo.com/yourAccessToken.sig" //iToken
		});
	}
	
	return map;
});
app.controller('MainCtrl', function($scope, $timeout, $http, $interval, ProductsFact, FileUploader) {
	var CLOUD_WATCH_URL = "http://localhost:3000/cpuutilization"
	var ADD_IMAGE_URL = "http://localhost:3000/fileUpload";
	var SIGN_FILE_URL = "";
	var uploader = $scope.uploader = new FileUploader();

    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
        console.info('onWhenAddingFileFailed', item, filter, options);
    };
    uploader.onAfterAddingFile = function(fileItem) {
        console.info('onAfterAddingFile', fileItem);
    };
    uploader.onAfterAddingAll = function(addedFileItems) {
        console.info('onAfterAddingAll', addedFileItems);
    };
    uploader.onBeforeUploadItem = function(item) {
        console.info('onBeforeUploadItem', item);
    };
    uploader.onProgressItem = function(fileItem, progress) {
        console.info('onProgressItem', fileItem, progress);
    };
    uploader.onProgressAll = function(progress) {
        console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
        console.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function(fileItem, response, status, headers) {
        console.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function(fileItem, response, status, headers) {
        console.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function(fileItem, response, status, headers) {
        console.info('onCompleteItem', fileItem, response, status, headers);
    };
    uploader.onCompleteAll = function() {
        console.info('onCompleteAll');
        //$scope.uploader.clearQueue();
    };

  	$scope.clientName = "Verizon" //"AT&T"
  	$scope.prod = ProductsFact;
	$scope.searchLog = {};
  	$scope.searchLog.id = "";
  	$scope.statusToClass = ProductsFact.statusToClass;
  	ProductsFact.updateInstances();
  	ProductsFact.mapImageIdToName();
  	$scope.mapInstanceIdToName = ProductsFact.instanceIdToName;
  	$scope.mapImageIdToName = ProductsFact.imageIdToName;


  	$scope.addProductImage = function(serviceName, iName, iDesc){
		//TODO: Send to server and add the result to the list
		ProductsFact.addProductImage(serviceName, iName, iDesc);  
		$scope.imageName = "";
		$scope.imageDesc = "";	
		//$scope.uploader = "";
		//$scope.uploadImageFile.value = "";
		//$scope.uploader = new FileUploader();
		console.info("Uploader: " + $scope.uploader);
		$scope.uploader.queue[0].url = ADD_IMAGE_URL;
		$scope.uploader.queue[0].data = {name: iName, desc: iDesc};
		// $scope.uploader.queue[0].removeAfterUpload = true
		$scope.uploader.queue[0].upload();
		//$scope.uploader.queue[0].value = "";
		//$scope.uploader = new FileUploader();
  	}

  	// $scope.setFile = function(file){
  	// 	$scope.uploadImageFile = file;
  	// }


  	$scope.labels = ["Download Sales", "In-Store Sales", "Mail-Order Sales"];
	$scope.data = [300, 500, 100];

    $scope.cpuLoadAvg = 0;//65;
    $scope.cpuLoadAvgText = 0;
    $scope.cpuLoadMax = 0;//32;
    $scope.cpuLoadMaxText = 0;
    $scope.percent3 = 15;
    $scope.percentText3 = 0;
    $scope.percent4 = 80;
    $scope.percentText4 = 0;
	//$scope.options = { animate:false, barColor:'#E67E22', scaleColor:false, lineWidth:3, lineCap:'butt' }
	$scope.options = {
		barColor:"rgba(255,255,255,0.8)",
      	trackColor:"rgba(255,255,255,0.1)",
    	animate:1000,
	    lineWidth:4,
	    lineCap:"round",
	  	scaleColor: false,
	  //  onStep:function(a){this.$el.find("span").text(~~a)}
  	}
  	$scope.options2 = JSON.parse(JSON.stringify($scope.options))
  	$scope.options3 = JSON.parse(JSON.stringify($scope.options))
  	$scope.options4 = JSON.parse(JSON.stringify($scope.options))
  	$scope.options.onStep = function(){
  		$scope.$apply(function(){
  			var parsed = parseInt($scope.cpuLoadAvgText)
  			var gap = $scope.cpuLoadAvg - parsed
  			var step = gap / 15
  			$scope.cpuLoadAvgText = parsed + step*2;
  		})
  	}
	$scope.options.onStop = function(){
  		$scope.$apply(function(){
  			$scope.cpuLoadAvgText = $scope.cpuLoadAvg; 
  		})	
  	}
  	$scope.options2.onStep = function(){
  		$scope.$apply(function(){
  			$scope.cpuLoadMaxText = parseInt($scope.cpuLoadMaxText) + 1;
  		})
  	}
	$scope.options2.onStop = function(){
  		$scope.$apply(function(){
  			$scope.cpuLoadMaxText = $scope.cpuLoadMax; 
  		})	
  	}
  	$scope.options3.onStep = function(){
  		$scope.$apply(function(){
  			$scope.percentText3 += 1;
  		})
  	}
	$scope.options3.onStop = function(){
  		$scope.$apply(function(){
  			$scope.percentText3 = $scope.percent3; 
  		})	
  	}
  	$scope.options4.onStep = function(){
  		$scope.$apply(function(){
  			$scope.percentText4 += 1;
  		})
  	}
	$scope.options4.onStop = function(){
  		$scope.$apply(function(){
  			$scope.percentText4 = $scope.percent4; 
  		})	
  	}

  	$scope.numOfInstances = 0;
  	$scope.numOfVerifications = 0;
  	$scope.numOfAlerts = 0;
  	$scope.timerStepsCallback = function(millis, steps, callback, finalCallback){
  		if (steps <= 0 || millis <= 0){
  			finalCallback();
  			return;
  		}
  		var time = millis / steps;
  		$timeout(function(){
  			callback()
  			$scope.timerStepsCallback(millis - time, steps-1, callback, finalCallback)
  		},time);
  	}

  	$scope.setValueBySteps = function(targetVar, startValue, targetValue, millis, steps){
  		$scope[targetVar] = startValue;
  		var valJump = targetValue / steps;
  		$scope.timerStepsCallback(millis, steps, function(){$scope[targetVar] += valJump}, function(){$scope[targetVar] = targetValue});
  	}
  	//$scope.products = ["vRouter", "vSwitch"];
  	//$scope.productImages = {"vRouter":["Version1", "Version 2", "Version 3"], "vSwitch":["Version 1", "Version 2", "Version 3", "Version 4"]};
  	// $scope.changeValue = function(target, value){
  	// 	$scope[target] = value;
  	// }

  	$scope.updateCPUUtilization = function(){
  		$http({
		  method: 'POST',
		  url: CLOUD_WATCH_URL,
		  data: {}
		}).then(function successCallback(response) {
		    // this callback will be called asynchronously
		    // when the response is available
		    if (response.error){
		    	console.info(response.error)
		    }else{
		    	$scope.cpuLoadAvg = response.data.data.Average;
		    	$scope.cpuLoadMax = response.data.data.Maximum;
		    }
		 }, function errorCallback(response) {
		    // called asynchronously if an error occurs
		    // or server returns response with an error status.
		});
	}
	
	var cpuUtilInterval;
  	if(!angular.isDefined(cpuUtilInterval)){
  		$scope.updateCPUUtilization()
		console.info("init!");
  		cpuUtilInterval = $interval($scope.updateCPUUtilization, 10000);//, [count], [invokeApply], [Pass]);
	}

	$scope.$on('$destroy', function() {
      // Make sure that the interval is destroyed too
      if(angular.isDefined(cpuUtilInterval)){
      	$interval.cancel(cpuUtilInterval);
      	cpuUtilInterval = undefined;
      }
    });
	//ProductsFact.isLoaded = true;
	//_DEBUG = $scope;
});
//var _DEBUG;
// app.directive("fileread", [function () {
//     return {
//         scope: {
//             fileread: "="
//         },
//         link: function (scope, element, attributes) {
//             element.bind("change", function (changeEvent) {
//                 var reader = new FileReader();
//                 reader.onload = function (loadEvent) {
//                     scope.$apply(function () {
//                         scope.fileread = loadEvent.target.result;
//                     });
//                 }
//                 reader.readAsDataURL(changeEvent.target.files[0]);
//             });
//         }
//     }
// }]);
