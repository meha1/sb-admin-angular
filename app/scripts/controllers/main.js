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
	map.products = ["vRouter", "vSwitch"],
	map.productImages = {
		"vRouter" : [
			{
				"name" : "Version1", 
				"desc" : "This is the vRouter first version",
				"id" : 1
			},{
				"name" : "Version 2", 
				"desc" : "This is the vRouter second version",
				"id" : 2
			},{
				"name" : "Version 3",
				"desc" : "This is the vRouter third version",
				"id" : 3
			}
		],
		"vSwitch":[
			{
				"name" : "Version 1", 
				"desc" : "This is the vSwitch first version",
				"id" : 4
			},
			{
				"name" : "Version 2", 
				"desc" : "This is the vSwitch second version",
				"id" : 5
			},{
				"name" : "Version 3", 
				"desc" : "This is the vSwitch third version",
				"id" : 6
			},{
				"name" : "Version 4", 
				"desc" : "This is the vSwitch fourth version",
				"id" : 7
			}
		]
	}
	map.selected = [0,0];
	map.setSelected = function(productIndex, imageIndex){
		this.selected = [productIndex, imageIndex];
	}
	return map;
});
app.controller('MainCtrl', function($scope,$position, ProductsFact) {
  	$scope.clientName = "Verizon" //"AT&T"
  	$scope.prod = ProductsFact;
  	//$scope.products = ["vRouter", "vSwitch"];
  	//$scope.productImages = {"vRouter":["Version1", "Version 2", "Version 3"], "vSwitch":["Version 1", "Version 2", "Version 3", "Version 4"]};
  
});
