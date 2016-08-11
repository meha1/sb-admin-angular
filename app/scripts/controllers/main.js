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
				"id" 	: 1,
				"name" 	: "Version1", 
				"desc" 	: "This is the vRouter first version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
			},{
				"id" 	: 2,
				"name" 	: "Version 2", 
				"desc" 	: "This is the vRouter second version",
			},{
				"id" 	: 3,
				"name" 	: "Version 3",
				"desc" 	: "This is the vRouter third version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
			}
		],
		"vSwitch":[
			{
				"id" 	: 4,
				"name" 	: "Version 1", 
				"desc" 	: "This is the vSwitch first version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
			},
			{
				"id" 	: 5,
				"name" 	: "Version 2", 
				"desc" 	: "This is the vSwitch second version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
			},{
				"id" 	: 6,
				"name" 	: "Version 3", 
				"desc" 	: "This is the vSwitch third version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
			},{
				"id" 	: 7,
				"name" 	: "Version 4", 
				"desc" 	: "This is the vSwitch fourth version",
				"sig"  	: "https://ourrepo.com/yourSigFile.sig",
				"token"	: "https://ourrepo.com/yourAccessToken.sig"
			}
		]
	}

	map.selected = [0,0];
	
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

  	$scope.addProductImage = function(serviceName, iName, iDesc){
		//TODO: Send to server and add the result to the list
		ProductsFact.addProductImage(serviceName, iName, iDesc);  		
  	}
  	//$scope.products = ["vRouter", "vSwitch"];
  	//$scope.productImages = {"vRouter":["Version1", "Version 2", "Version 3"], "vSwitch":["Version 1", "Version 2", "Version 3", "Version 4"]};
  
});
