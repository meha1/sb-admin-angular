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

app.factory('LogFact', function($http, $interval, $timeout, ClientFact){
	var ES_URL = "http://52.28.149.249:9200/"
	var map = {};
	map.logs = {};
	map.fullLogs = [];

	map.resolveType = {
		0x10: 'Details',
		0x20: 'Info',
		0x30: 'Warn',
		0x40: 'Attack',
	}
	map.updateLog = function(pass){
		var that = this == undefined ? pass : this;
		//$http.get(ES_URL + "events*/_search&size=")
		var searchQuery = 
		{
		  "query": {
		    "match_all": {}
		  },
		  "size": 1000
		  ,
		  "sort": [
		    {
		      "timestamp": {
		        "order": "desc"
		      }
		    }
		  ]
		}

		$http.post(ES_URL + "events-*/_search", searchQuery)
		.then(function successCallback(response) {
		    // this callback will be called asynchronously
		    // when the response is available
		    if (response.error){
		    	console.info(response.error)
		    }else{
		    	var res = response.data.hits.hits;
		    	var len = res.length;
	    		that.logs = {};
	    		that.fullLogs = [];
		    	
		    	for ( var i = 0 ; i < len ; i++){
		    		if(!that.logs[res[i].instance_id]){
		    			that.logs[res[i].instance_id] = [];
		    		}
		    		res[i]._source.id = res[i]._id; // adding instance id into the data
		    		if(res[i]._source.instance_id){
		    			res[i]._source.instance = ClientFact.getInstanceById[res[i]._source.instance_id]
		    			if(res[i]._source.instance){
		    				res[i]._source.image = ClientFact.getImageById[res[i]._source.instance.image_id]
		    				//console.info("Enriched:")
		    				//console.info(res[i]._source)
		    			}
		    		}
		    		that.fullLogs.push(res[i]._source)
		    		that.logs[res[i].instance_id].push(res[i]._source);
		    	}
		    }
		    //console.log(that.fullLogs)
		 }, function errorCallback(response) {
	    // called asynchronously if an error occurs
	    // or server returns response with an error status.
		});
	}
	
	var logInterval;
	
	map.startLogPolling = function(millis){
		map.updateLog();
		this.stopLogPolling();
		logInterval = $interval(this.updateLog, millis, 0, true, this);
	}

	map.stopLogPolling = function(){
		if(angular.isDefined(logInterval)){
      		$interval.cancel(logInterval);
      		logInterval = undefined;
      	}
	}
	
	return map;
})

app.factory('ClientFact', function($http, $q, $timeout){
	var ES_URL = "http://52.28.149.249:9200/"

	var map = {};
	map.clients = {
		serviceProviders: [
			{
				id: 1,
				name: "Cisco",
				services: [
					{
						//id: 1,
						id: "Orange",
						name: "vRouter",
						desc: "Cisco secure virtual router"
					},
					{
						id: 92,
						name: "vSwitch",
						desc: "Cisco secure virtual switch"	
					},
					{
						id: 93,
						name: "vFirewall",
						desc: "Cisco secure virtual firewall"
					}
				]
			},
			{
				id: 2,
				name: "OwnBackup",
				services:[
					{
						id: 11,
						name: "SecureBackup",
						desc: "Encrypted backup service"
					}
				]
			}
		],
		customers: [
			{
				//id: 100,
				id: "014",
				spId: 1,
				name: "Cisco",
				services : ["Orange",92]
			},
			{
				id: 101,
				spId: 1,
				name: "Verizon",
				services : ["Orange"]
			},
			{
				id: 102,
				spId: 2,
				name: "myStartup",
				services: [11]
			}
		]
	}

	map.getFromES = function(type, clientId, sCallback, eCallback, that){
		var client = this.getClientById[clientId]
		if(this){
			that = this;
		}
		$http.get(ES_URL + type + "/_search?q=user_id:'" + clientId + "'&size=100")
		.then(function successCallback(response) {
		    // this callback will be called asynchronously
		    // when the response is available
		    if (response.error){
		    	console.info(response.error)
		    	if(eCallback){
		    		eCallback(response.error)
		    	}
		    }else{
		    	var res = response.data.hits.hits;
		    	var len = res.length;
		    	client[type] = [];
		    	for ( var i = 0 ; i < len ; i++){
		    		res[i]._source.id = res[i]._id; // adding instance id into the data
		    		client[type].push(res[i]._source);
		    	}
		    	if(sCallback){
		    		sCallback();
		    	}
		    }
		}, function errorCallback(response){
			console.error("Got error from ES: ");
			console.info(response);
			if(eCallback){
	    		eCallback(response.error)
	    	}
		})
	}

	var requests = [];
	// map.getInstancesPerClient = function(clientId, successCallback, errorCallback){
	// 	//var client = this.getClientById[clientId];
	// 	this.getFromES("instances", clientId, successCallback, errorCallback)

	// }

	// map.getImagesPerClient = function(clientId, successCallback, errorCallback){
	// 	//var client = this.getClientById[clientId];
	// 	this.getFromES("images", clientId);
	// }

	map.getDataPerClient = function(type, clientId, successCallback, errorCallback, that){
		//var client = this.getClientById[clientId];
		if(this){
			that = this;
		}
		that.getFromES(type, clientId, successCallback, errorCallback, that);
	}

	map.getAllClientsInfo = function(){
		requests = [];
		var that=this
		for( var clientId in this.getClientById){
   			if(this.getClientById[clientId].type != "serviceProviders"){
				var deferred = $q.defer();
   				requests.push(deferred);
   				$timeout(that.getDataPerClient, 600, true, "instances", clientId.toString(), deferred.resolve, deferred.reject, that);
   			}
   			var deferred = $q.defer();
			requests.push(deferred.promise);
			//this.getDataPerClient("images", clientId, deferred.resolve, deferred.reject);
			$timeout(that.getDataPerClient, 600, true, "images", clientId.toString(), deferred.resolve, deferred.reject, that);

		}
		var that = this;
		$q.all(requests).then(function(){
			console.info("Clients Mapping updated with info:")
			console.info(that.getClientById)
			map.getDataByIdMapping('images', map.getImageById);
			map.getDataByIdMapping('instances', map.getInstanceById);
			console.info("This is map.getInstanceById: ")
			console.info(map.getInstanceById)
		});
		// for (var clientId in this.getClientById){
		// 	if(this.getClientById[clientId].type != "serviceProviders"){
		// 		this.getDataPerClient("instances", clientId);
		// 	}
		// 	this.getDataPerClient("images", clientId)
		// }
		// console.info("Clients Mapping updated with info:")
		// console.info(this.getClientById)
	}

	map.getClientById = {};

	map.getClientByIdMapping = function(){
		//var len = this.clients.serviceProviders.length
		for (var key in this.clients){
			var len = this.clients[key].length;
			for(var i = 0; i < len; i++){
				//this.getSpById[this.clients.serviceProviders[i].id] = this.clients.serviceProviders[i];
				this.getClientById[this.clients[key][i].id] = this.clients[key][i];
				this.getClientById[this.clients[key][i].id].type = key;
			}
		}
		console.info("Clients Mapping:")
		console.info(this.getClientById)
	}

	map.getClientByIdMapping();

	map.getServiceById = {};
	map.getImageById = {};
	map.getInstanceById = {};

	map.getServiceByIdMapping = function(){
		var spLen = this.clients.serviceProviders.length
		for(var i = 0; i < spLen; i++){
			var servicesLen = this.clients.serviceProviders[i].services.length;
			for (var j = 0; j < servicesLen; j++){
				this.getServiceById[this.clients.serviceProviders[i].services[j].id] = this.clients.serviceProviders[i].services[j];
			} 
		}
	}

	// map.getImageByIdMapping = function(){
	// 	for(var clientId in this.getClientById){
	// 		var images = this.getClientById[clientId].images;
	// 		if(!images){
	// 			return;
	// 		}
	// 		var imagesLen = images.length;
	// 		for ( var i = 0 ; i < imagesLen ; i++){
	// 			this.getImageById[images[i].id] = images[i] 
	// 		}
	// 	}
	// }

	// map.getInstanceByIdMapping = function(){
	// 	for(var clientId in this.getClientById){
	// 		var instances = this.getClientById[clientId].instances;
	// 		if(!instances){
	// 			return;
	// 		}
	// 		var instancesLen = instances.length;
	// 		for ( var i = 0 ; i < instancesLen ; i++){
	// 			this.getInstanceById[instances[i].id] = instances[i] 
	// 		}
	// 	}
	// }

	map.getDataByIdMapping = function(type, targetDict){
		for(var clientId in this.getClientById){
			var array = this.getClientById[clientId][type];
			if(!array){
				continue;
			}
			var arrayLen = array.length;
			for ( var i = 0 ; i < arrayLen ; i++){
				targetDict[array[i].id] = array[i]; 
			}
		}
	}

	map.getServiceByIdMapping();

	map.getSelected = function(){
		// return this.clients[this.selected[0]][this.selected[1]];
		return this.selected;
	}

	map.setSelected = function(type, index){
		this.selectedIndex = [type, index];
		this.selected = this.clients[this.selectedIndex[0]][this.selectedIndex[1]];
		this.selected.selectedService = "";
	}

	map.addService = function(sName, sDesc){
		//this.clients[this.selected[0]][this.selected[1]].services.push({id: (new Date()).getTime(), name: sName, desc: sDesc})	
		this.selected.services.push({id: (new Date()).getTime(), name: sName, desc: sDesc})	
	}
	
	map.subscribeToService = function(sId){
		//this.clients[this.selected[0]][this.selected[1]].services.push(sId);
		if(this.selected.services.indexOf(sId) == -1){
			this.selected.services.push(sId);	
		}
	}

	map.unSubscribeFromService = function(sId){
		//this.clients[this.selected[0]][this.selected[1]].services.push(sId);
		if(this.selected.services.indexOf(sId) != -1){
			this.selected.services.splice(this.selected.services.indexOf(sId), 1);	
		}
	}

	map.getAllClientsInfo();
	//map.selectedIndex = ['serviceProviders', 0];
	map.setSelected('serviceProviders', 0)
	//map.selected = map.getSelected();

	return map;
})

app.factory('ProductsFact', function($http){
	var ES_URL = "http://52.28.149.249:9200/"
	var map = {};
	map.updateInstances = function(){
		var that = this;
		$http.get(ES_URL + "instances/_search?q=*:*&size=1000")
		.then(function successCallback(response) {
		    // this callback will be called asynchronously
		    // when the response is available
		    if (response.error){
		    	console.info(response.error)
		    }else{
		    	var res = response.data.hits.hits;
		    	var len = res.length;
	    		that.productInstances = {};
    			that.instancesPer
	    		// TODO: DELETE IT!!! - workaround until type will be updated
	    		that.productInstances["vRouter"] = [];
	    		that.productInstances["vSwutch"] = [];
	    		// TODO: DELETE IT!!!
		    	
		    	for ( var i = 0 ; i < len ; i++){
		    		if(!that.productInstances[res[i]._type]){
		    			that.productInstances[res[i]._type] = [];
		    		}
		    		res[i]._source.id = res[i]._id; // adding instance id into the data
		    		that.productInstances[res[i]._type].push(res[i]._source);
		    		
		    		// TODO: DELETE IT!!! - workaround until type will be updated
		    		that.productInstances["vRouter"].push(res[i]._source);
		    		that.productInstances["vSwutch"].push(res[i]._source);
		    		// TODO: DELETE IT!!!
		    	}
		    	that.mapInstanceIdToName();
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
				// this.instanceIdToName[inst.id] = inst.name;
				this.instanceIdToName[inst._id] = inst.name;
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
app.controller('MainCtrl', function($scope, $timeout, $http, $interval, ProductsFact, ClientFact, LogFact, Upload/*FileUploader*/) {
	console.info("init MainCtrl!");

	var CLOUD_WATCH_URL = "http://localhost:3000/cpuutilization"
	//var ADD_IMAGE_URL = "http://localhost:3000/fileUpload";
	var SECURE_SERVER_URL = "http://10.56.177.31:33555/"
	var ADD_IMAGE_URL = SECURE_SERVER_URL + "secure_server/upload_image";
	var ENCRYPT_DATA_URL = SECURE_SERVER_URL + "secure_server/upload_data";
	//var uploader = $scope.uploader = new FileUploader();

	$scope.serviceSelect = -1;

	$scope.imageLimitations = {};
	$scope.imageLimitations.ipRange = [{}];

	$scope.addIpRangeLimitation = function(){
		$scope.imageLimitations.ipRange.push({});
	}

    $scope.test =  function(value){
    	console.info("Passed!");
    	console.info($scope[value]);
    }

  	$scope.LogFact = LogFact;
  	$scope.ClientFact = ClientFact;
  	$scope.clients = ClientFact.clients;
  	$scope.selectedClient = ClientFact.getSelected();
  	$scope.clientName = $scope.selectedClient.name;//$scope.customerName[0]; //"Verizon" //"AT&T"
  	$scope.prod = ProductsFact;
	$scope.searchLog = {};
  	$scope.searchLog.id = "";
  	$scope.statusToClass = ProductsFact.statusToClass;
  	ProductsFact.updateInstances();
  	ProductsFact.mapImageIdToName();
  	$scope.mapInstanceIdToName = ProductsFact.instanceIdToName;
  	$scope.mapImageIdToName = ProductsFact.imageIdToName;
  	$scope.imageForm = {};

	//$scope.imageFileUpload;

  	$scope.setSelectedClient = function(type, index){
  		ClientFact.setSelected(type, index);
  		$scope.selectedClient = ClientFact.getSelected()
  		$scope.clientName = $scope.selectedClient.name//$scope.customerName[0]; //"Verizon" //"AT&T"	
  	}

  	$scope.addProductImage = function(iName, iDesc, serviceId, file){
  		//TODO: CLEAR FORM
		if (file) {
			var imageData = {
        		file: file, 
        		user_id: ClientFact.getSelected().id,
        		service_id: serviceId,
        		name: iName,
        		desc: iDesc,
        		num_of_instances: $scope.imageLimitations.num ? $scope.imageLimitations.num : 0, 
        	}

        	var ipRanges = [];
        	for (var lim in $scope.imageLimitations.ipRange){
        		var subnet = $scope.imageLimitations.ipRange[lim].val;
        		if(subnet){
        			ipRanges.push(subnet)
        		}
        	}
        	imageData.ip_range = JSON.stringify(ipRanges);

        	Upload.upload({
            	url: ADD_IMAGE_URL,
            	data: imageData,
	        }).then(function (resp) {
	            console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
	            ClientFact.getDataPerClient("images", ClientFact.getSelected().id);
	        }, function (resp) {
	            console.log('Error status: ' + resp.status);
	        }, function (evt) {
	            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
	            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
	        });
      	}
//      	$timeout(function(){ClientFact.getDataPerClient("images", ClientFact.getSelected().id)}, 3000)
		iName = "";//$scope.imageName = "";
		iDesc = ""//$scope.imageDesc = "";	
  	}

  	$scope.downloadDataFile = function(fileName, data, isAscii){
  		if(isAscii){
  			data = atob(data)
  		}
  		$scope.downloadFile(fileName, data, "text/plain");
  	}

  	$scope.downloadFile = function(fileName, data, contentType){
		var blob = new Blob([data], { type:contentType});			
		var downloadLink = angular.element('<a></a>');
        downloadLink.attr('href',window.URL.createObjectURL(blob));
        downloadLink.attr('download', fileName);
		downloadLink[0].click();
  	}

  	$scope.uploadDataFile = function(imageId, file, type){
  		console.info(imageId);
  		console.info(file);
  		if(file){
  			Upload.upload({
            	url: ENCRYPT_DATA_URL,
            	data: {
            		image_id: imageId,
            		file: file 
            	},
	        }).then(function (resp) {
	            console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
	            $scope.downloadFile(file.name + ".enc", resp.data, "application/octet_stream")
	        }, function (resp) {
	            console.log('Error status: ' + resp.status);
	        }, function (evt) {
	            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
	            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
	        });	
  		}
  	}

  	// $scope.setFile = function(file){
  	// 	$scope.uploadImageFile = file;
  	// }


  	 $scope.donut = {
    	labels: ["Download Sales", "In-Store Sales", "Mail-Order Sales"],
    	data: [300, 500, 100]
    };

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
    
    $scope.pieChart = {
    	labels: ["vRouter", "vSwitch", "vFirewall"],
    	data: [80, 70, 60],
        sumOfInstances: 60+70+80
    };
    
    
//    $scope.setPieValueBySteps = function(targetVar, startValue, targetValue, millis, steps){
//  		$scope[targetVar] = startValue;
//  		var valJump = targetValue / steps;
//  		$scope.timerStepsCallback(millis, steps, function(){$scope[targetVar] += valJump}, function(){$scope[targetVar] = targetValue});
//  	    $scope.products = ["vRouter", "vSwitch"];
//  	    $scope.productImages = {"vRouter":["Version1", "Version 2", "Version 3"], "vSwitch":["Version 1", "Version 2", "Version 3", "Version 4"]};
//    }
  	$scope.setValue = function(target, value){
  		$scope[target] = value;
  	}

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

	$scope.toFixed = function(number, occ){
		var num = parseFloat(number);
		var mul = Math.pow(10, occ);
		var res = Math.round(num * mul) / mul;
		return res;
	}

	var chart1 = {};
    chart1.type = "Timeline";
    chart1.data = [
      [ 'ins #1', 'Normal',    new Date(0,0,0,12,0,0),  new Date(0,0,0,14,0,0) ],
      [ 'ins #1', 'Error',    new Date(0,0,0,14,30,0), new Date(0,0,0,16,0,0) ],
      [ 'ins #1', 'Normal', new Date(0,0,0,16,30,0), new Date(0,0,0,19,0,0) ],
      [ 'ins #2', 'Normal',   new Date(0,0,0,12,30,0), new Date(0,0,0,14,0,0) ],
      [ 'ins #2', 'Error',    new Date(0,0,0,13,0,0), new Date(0,0,0,13,30,0) ],
      [ 'ins #2', 'Normal',   new Date(0,0,0,16,30,0), new Date(0,0,0,18,0,0) ],
      [ 'ins #3', 'Normal',       new Date(0,0,0,12,30,0), new Date(0,0,0,14,0,0) ],
      [ 'ins #3', 'Error',        new Date(0,0,0,14,30,0), new Date(0,0,0,16,0,0) ],
      [ 'ins #3', 'Normal',       new Date(0,0,0,16,30,0), new Date(0,0,0,18,30,0) ]
      ];
    //chart1.data.push(['Services',20000]);
    chart1.options = {
    	colors : ["#FF0000", "#00FF00"],
        displayExactValues: true,
        width: "100%",
        height: "100%",
        is3D: true,
        chartArea: {left:10,top:10,bottom:0,height:"100%"},
        avoidOverlappingGridLines: false
    };

    chart1.formatters = {
      number : [{
        columnNum: 1,
        pattern: "$ #,##0.00"
      }]
    };

    $scope.chart = chart1;
	
	var cpuUtilInterval;
  	if(!angular.isDefined(cpuUtilInterval)){
  		$scope.updateCPUUtilization()
  		//LogFact.updateLog();
		console.info("init cpu interval");
  		//logInterval = $interval(LogFact.updateLog, 5000);//, [count], [invokeApply], [Pass]);
  		cpuUtilInterval = $interval($scope.updateCPUUtilization, 10000);//, [count], [invokeApply], [Pass]);
	}

	LogFact.startLogPolling(10000);
	$scope.$on('$destroy', function() {
      // Make sure that the interval is destroyed too
      if(angular.isDefined(cpuUtilInterval)){
      	$interval.cancel(cpuUtilInterval);
      	cpuUtilInterval = undefined;
      }
      LogFact.stopLogPolling();

    });
	_DEBUG = $scope;
});
var _DEBUG;

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

