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

app.factory('ProductsFact', function(){
	var map = {};
	// load products and product images from 
	map.products = ["vRouter", "vSwitch"],
	map.productImages = {
		"vRouter" : [
			{
				"id" 	: "1",
				"name" 	: "Version 1", 
				"desc" 	: "This is the vRouter first version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
			},{
				"id" 	: "2",
				"name" 	: "Version 2", 
				"desc" 	: "This is the vRouter second version",
			},{
				"id" 	: "3",
				"name" 	: "Version 3",
				"desc" 	: "This is the vRouter third version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
			}
		],
		"vSwitch":[
			{
				"id" 	: "4",
				"name" 	: "Version 1", 
				"desc" 	: "This is the vSwitch first version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
			},
			{
				"id" 	: "5",
				"name" 	: "Version 2", 
				"desc" 	: "This is the vSwitch second version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
			},{
				"id" 	: "6",
				"name" 	: "Version 3", 
				"desc" 	: "This is the vSwitch third version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
			},{
				"id" 	: "7",
				"name" 	: "Version 4", 
				"desc" 	: "This is the vSwitch fourth version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
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
	
	map.addProductImage = function(serviceName, iId, iName, iDesc, iSig, iToken){
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
app.controller('MainCtrl', function($scope,$position, ProductsFact) {
  	$scope.clientName = "Verizon" //"AT&T"
  	$scope.prod = ProductsFact;
	$scope.searchLog = {};
  	$scope.searchLog.id = "";
  	$scope.statusToClass = ProductsFact.statusToClass;
  	ProductsFact.mapInstanceIdToName();
  	ProductsFact.mapImageIdToName();
  	$scope.mapInstanceIdToName = ProductsFact.instanceIdToName;
  	$scope.mapImageIdToName = ProductsFact.imageIdToName;


  	$scope.addProductImage = function(serviceName, iName, iDesc){
		//TODO: Send to server and add the result to the list
		ProductsFact.addProductImage(serviceName, iName, iDesc);  		
  	}
  	//$scope.products = ["vRouter", "vSwitch"];
  	//$scope.productImages = {"vRouter":["Version1", "Version 2", "Version 3"], "vSwitch":["Version 1", "Version 2", "Version 3", "Version 4"]};
  
});
