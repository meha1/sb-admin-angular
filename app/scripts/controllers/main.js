'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */

var app = angular.module('sbAdminApp');

//var app = angular.module('sbAdminApp', ['elasticsearch']);
//
//// Create the es service from the esFactory
//app.service('esFactory', function (esFactory) {
//  return esFactory({ host: '52.28.149.249:9200' });
//});
//
//app.controller('ImageController', function ($scope, client, esFactory) {
//    // search for documents
//        esFactory.search({
//        index: 'images/images/',
//        size: 3000,
//        body: {
//        "query":
//            {
//                "match": {
//                    title:"Product1"
//                }   
//            },
//        }
//
//        })
//      .then(function (resp) {
//        $scope.clusterState = resp;
//        $scope.error = null;
//      })
//      .catch(function (err) {
//        $scope.clusterState = null;
//        $scope.error = err;
//        // if the err is a NoConnections error, then the client was not able to
//        // connect to elasticsearch. In that case, create a more detailed error
//        // message
//        if (err instanceof esFactory.errors.NoConnections) {
//          $scope.error = new Error('Unable to connect to elasticsearch. ' +
//            'Make sure that it is running and listening at http://localhost:9200');
//        }
//      });
//    });


//angular.module('sbAdminApp')

app.filter('ClientRelatedInstances', function () {
    function filterFunc(items, clientInstances) {
        var filtered = [];
        if (!clientInstances) {
            return filtered;
        }
        var len = clientInstances.length;
        var instanceIdMap = {};
        for (var i = 0; i < len; i++) {
            if (clientInstances[i] && clientInstances[i].id) {
                instanceIdMap[clientInstances[i].id] = true;
            }
        }
        angular.forEach(items, function (item) {
            if (instanceIdMap[item.instance_id]) {
                filtered.push(item);
            }
        });
        return filtered;
    };
    return filterFunc
})

app.factory('LogFact', function ($http, $interval, $timeout, ClientFact) {
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
    map.updateLog = function (pass) {
        var that = this == undefined ? pass : this;
        //$http.get(ES_URL + "events*/_search&size=")
        var searchQuery = {
            "query": {
                "match_all": {}
            },
            "size": 1000,
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
		    	
                    that.numOfVerifications = 0;
                    that.numOfAlerts = 0

		    	for ( var i = 0 ; i < len ; i++){
		    		var instanceId = res[i]._source.instance_id
		    		if(!instanceId || instanceId == "" || instanceId[0] == '\0')
		    			continue;
		    		if(!that.logs[instanceId]){
		    			that.logs[instanceId] = [];
		    		}
		    		//res[i]._source.id = res[i]._id; // adding instance id into the data
	    			res[i]._source.instance = ClientFact.getInstanceById[instanceId]
	    			if(res[i]._source.instance){
	    				res[i]._source.image = ClientFact.getImageById[res[i]._source.instance.image_id]
	    				//console.info("Enriched:")
	    				//console.info(res[i]._source)
	    			}
		    		that.fullLogs.push(res[i]._source)
		    		that.logs[instanceId].push(res[i]._source);

                        if ((res[i]._source.type == 0x10) || (res[i]._source.type == 0x20)) {
                            that.numOfVerifications++;
                        } else if ((res[i]._source.type == 0x30) || (res[i]._source.type == 0x40)) {
                            that.numOfAlerts++;
                        }
		    	}
		    	that.pollingIsDone(that)
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

	var pollingRegister = {};
	map.registerToPollingNotification = function(name, func){
		if( typeof name === "string" &&
		    name.length > 0 && 
		    typeof func === "function")
		pollingRegister[name] = func;
	}

	map.unRegisterFromPollingNotification = function(name, func){
		if(pollingRegister[name]){
			delete pollingRegister[name]
		}
	}	

	map.pollingIsDone = function(context){
		angular.forEach(pollingRegister, function(value, key){
			value();
		})
	}

	return map;
});

app.factory('ClientFact', function ($http, $q, $timeout) {
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
                services: [
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
                services: ["Orange", 92]
			},
            {
                id: 101,
                spId: 1,
                name: "Verizon",
                services: ["Orange"]
			},
            {
                id: 102,
                spId: 2,
                name: "myStartup",
                services: [11]
			}
		]
    }

    map.getFromES = function (type, clientId, sCallback, eCallback, that) {
        var client = this.getClientById[clientId]
        if (this) {
            that = this;
        }
        $http.get(ES_URL + type + "/_search?q=user_id:'" + clientId + "'&size=700")
            .then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                if (response.error) {
                    console.info(response.error)
                    if (eCallback) {
                        eCallback(response.error)
                    }
                } else {
                    var res = response.data.hits.hits;
                    var len = res.length;
                    client[type] = [];
                    for (var i = 0; i < len; i++) {
                        res[i]._source.id = res[i]._id; // adding instance id into the data
                        client[type].push(res[i]._source);
                    }
                    if (sCallback) {
                        sCallback();
                    }
                }
            }, function errorCallback(response) {
                console.error("Got error from ES: ");
                console.info(response);
                if (eCallback) {
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

    map.getDataPerClient = function (type, clientId, successCallback, errorCallback, that) {
        //var client = this.getClientById[clientId];
        if (this) {
            that = this;
        }
        that.getFromES(type, clientId, successCallback, errorCallback, that);
    }
    var wait = 0;
    var waitGap = 350;
    map.getAllClientsInfo = function () {
        //wait = 0
        requests = [];
        var that = this
            //var wait = 0;
        for (var clientId in this.getClientById) {
            //if (this.getClientById[clientId].type != "serviceProviders") {
            wait += waitGap;
            var deferred = $q.defer();
            requests.push(deferred);
            $timeout(that.getDataPerClient, wait, true, "instances", clientId.toString(), deferred.resolve, deferred.reject, that);
            //}
            wait += waitGap;
            var deferred = $q.defer();
            requests.push(deferred.promise);
            //this.getDataPerClient("images", clientId, deferred.resolve, deferred.reject);
            $timeout(that.getDataPerClient, wait, true, "images", clientId.toString(), deferred.resolve, deferred.reject, that);

        }
        var that = this;
        $q.all(requests).then(function () {
            wait = 0;
            console.info("Clients Mapping updated with info:")
            console.info(that.getClientById)
            map.getDataByIdMapping('images', map.getImageById);
            map.getDataByIdMapping('instances', map.getInstanceById);
            console.info("This is map.getInstanceById: ")
            console.info(map.getInstanceById)
            console.info("This is map.getImageById: ")
            console.info(map.getImageById)
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

    map.getClientByIdMapping = function () {
        //var len = this.clients.serviceProviders.length
        for (var key in this.clients) {
            var len = this.clients[key].length;
            for (var i = 0; i < len; i++) {
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

    map.getServiceByIdMapping = function () {
        var spLen = this.clients.serviceProviders.length
        for (var i = 0; i < spLen; i++) {
            var servicesLen = this.clients.serviceProviders[i].services.length;
            for (var j = 0; j < servicesLen; j++) {
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

    map.getDataByIdMapping = function (type, targetDict) {
        for (var clientId in this.getClientById) {
            var array = this.getClientById[clientId][type];
            if (!array) {
                continue;
            }
            var arrayLen = array.length;
            for (var i = 0; i < arrayLen; i++) {
                targetDict[array[i].id] = array[i];
            }
        }
    }

    map.getServiceByIdMapping();

    map.getSelected = function () {
        // return this.clients[this.selected[0]][this.selected[1]];
        return this.selected;
    };

    map.getAllClients = function () {
        return this.clients;
    };

    map.setSelected = function (type, index) {
        this.selectedIndex = [type, index];
        this.selected = this.clients[type][index];
        this.selected.selectedService = "";
    }

    map.addService = function (sName, sDesc) {
        //this.clients[this.selected[0]][this.selected[1]].services.push({id: (new Date()).getTime(), name: sName, desc: sDesc})	
        var id = sName.hashCode()
        this.selected.services.push({
            id: id,
            name: sName,
            desc: sDesc
        })
        this.getServiceByIdMapping()
    }

    map.subscribeToService = function (sId) {
        //this.clients[this.selected[0]][this.selected[1]].services.push(sId);
        if (this.selected.services.indexOf(sId) == -1) {
            this.selected.services.push(sId);
        }
    }

    map.unSubscribeFromService = function (sId) {
        //this.clients[this.selected[0]][this.selected[1]].services.push(sId);
        if (this.selected.services.indexOf(sId) != -1) {
            this.selected.services.splice(this.selected.services.indexOf(sId), 1);
        }
    }

    map.getAllClientsInfo();
    //map.selectedIndex = ['serviceProviders', 0];
    map.setSelected('serviceProviders', 0)
        //map.selected = map.getSelected();

    return map;
})



app.factory('ProductsFact', function ($http) {
    var ES_URL = "http://52.28.149.249:9200/"
    var map = {};
    map.updateInstances = function () {
        var that = this;
        $http.get(ES_URL + "instances/_search?q=*:*&size=1000")
            .then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                if (response.error) {
                    console.info(response.error)
                } else {
                    var res = response.data.hits.hits;
                    var len = res.length;
                    that.productInstances = {};
                    that.instancesPer
                        // TODO: DELETE IT!!! - workaround until type will be updated
                    that.productInstances["vRouter"] = [];
                    that.productInstances["vSwutch"] = [];
                    // TODO: DELETE IT!!!

                    for (var i = 0; i < len; i++) {
                        if (!that.productInstances[res[i]._type]) {
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
            "vRouter": [
                {
                    "id": "1",
                    "name": "Version 1",
                    "desc": "This is the vRouter first version",
                    "sig": "/bower_components/ifds.sig",
                    "token": "/bower_components/ifds.tkn"
			}, {
                    "id": "2",
                    "name": "Version 2",
                    "desc": "This is the vRouter second version",
                    "sig": "/bower_components/ifds.sig",
                    "token": "/bower_components/ifds.tkn"
			}, {
                    "id": "3",
                    "name": "Version 3",
                    "desc": "This is the vRouter third version",
                    "sig": "/bower_components/ifds.sig",
                    "token": "/bower_components/ifds.tkn"
			}
		],
            "vSwitch": [
                {
                    "id": "4",
                    "name": "Version 1",
                    "desc": "This is the vSwitch first version",
                    "sig": "/bower_components/ifds.sig",
                    "token": "/bower_components/ifds.tkn"
			},
                {
                    "id": "5",
                    "name": "Version 2",
                    "desc": "This is the vSwitch second version",
                    "sig": "/bower_components/ifds.sig",
                    "token": "/bower_components/ifds.tkn"
			}, {
                    "id": "6",
                    "name": "Version 3",
                    "desc": "This is the vSwitch third version",
                    "sig": "/bower_components/ifds.sig",
                    "token": "/bower_components/ifds.tkn"
			}, {
                    "id": "7",
                    "name": "Version 4",
                    "desc": "This is the vSwitch fourth version",
                    "sig": "/bower_components/ifds.sig",
                    "token": "/bower_components/ifds.tkn"
			}
		]
        }

    map.productInstances = {
        "vRouter": [
            {
                "id": "1",
                "name": "R-F01A",
                "ip": "146.23.84.122",
                "imageId": "1",
                "cpuLoad": 12,
                "upTime": "1471151607435",
                "status": 1
			}, {
                "id": "2",
                "name": "R-F04B",
                "ip": "146.23.84.51",
                "imageId": "1",
                "cpuLoad": 17,
                "upTime": "1471164607345",
                "status": 1
			}, {
                "id": "3",
                "name": "R-F03A",
                "ip": "146.23.82.223",
                "imageId": "3",
                "cpuLoad": 23,
                "upTime": "1471141607555",
                "status": 2
			}, {
                "id": "4",
                "name": "R-F02F",
                "ip": "146.23.83.100",
                "imageId": "2",
                "cpuLoad": 14,
                "upTime": "1471161107123",
                "status": 0
			}, {
                "id": "5",
                "name": "R-F11C",
                "ip": "146.23.83.97",
                "imageId": "1",
                "cpuLoad": 8,
                "upTime": "1471151207999",
                "status": 1
			}
		],
        "vSwitch": [
            {
                "id": "6",
                "name": "S-F12V",
                "ip": "146.23.83.98",
                "imageId": "5",
                "cpuLoad": 11,
                "upTime": "1471130579111",
                "status": 1
			}, {
                "id": "7",
                "name": "S-F32C",
                "ip": "146.23.81.244",
                "imageId": "5",
                "cpuLoad": 45,
                "upTime": "1471160123222",
                "status": 1
			}, {
                "id": "8",
                "name": "S-F21A",
                "ip": "146.23.85.32",
                "imageId": "4",
                "cpuLoad": 64,
                "upTime": "1471121540333",
                "status": 0
			}, {
                "id": "9",
                "name": "S-F06E",
                "ip": "146.23.84.121",
                "imageId": "7",
                "cpuLoad": 5,
                "upTime": "1471157003444",
                "status": 1
			}, {
                "id": "10",
                "name": "S-F07Z",
                "ip": "146.23.82.81",
                "imageId": "6",
                "cpuLoad": 10,
                "upTime": "1471142612555",
                "status": 2
			}
		]
    }

    map.log = {
        "vRouter": [
            {
                "id": "123",
                "instanceId": "1",
                "timestamp": "1471161607123",
                "type": "log",
                "message": "New config load completed"
			}, {
                "id": "123",
                "instanceId": "2",
                "timestamp": "1471161607531",
                "type": "log",
                "message": "Ping!"
			}, {
                "id": "123",
                "instanceId": "2",
                "timestamp": "1471161607631",
                "type": "log",
                "message": "New config load completed"
			}, {
                "id": "123",
                "instanceId": "1",
                "timestamp": "1471161607435",
                "type": "log",
                "message": "Signature verification finished successfully"
			}, {
                "id": "123",
                "instanceId": "3",
                "timestamp": "1471161607377",
                "type": "error",
                "message": "Verification failed - wrong signature"
			}, {
                "id": "123",
                "instanceId": "3",
                "timestamp": "1471161607878",
                "type": "log",
                "message": "New config upload requested"
			}, {
                "id": "123",
                "instanceId": "1",
                "timestamp": "1471161607999",
                "type": "log",
                "message": "New config upload requested"
			}
		],
        "vSwitch": [
            {
                "id": "123",
                "instanceId": "4",
                "timestamp": "1471161607121",
                "type": "log",
                "message": "New config load completed"
			}, {
                "id": "123",
                "instanceId": "5",
                "timestamp": "1471161607222",
                "type": "log",
                "message": "New config load completed"
			}, {
                "id": "123",
                "instanceId": "5",
                "timestamp": "1471161607333",
                "type": "log",
                "message": "New config load completed"
			}, {
                "id": "123",
                "instanceId": "7",
                "timestamp": "1471161607666",
                "type": "log",
                "message": "New config load completed"
			}, {
                "id": "123",
                "instanceId": "7",
                "timestamp": "1471161607872",
                "type": "log",
                "message": "New config load completed"
			}, {
                "id": "123",
                "instanceId": "6",
                "timestamp": "1471161607949",
                "type": "log",
                "message": "New config load completed"
			}, {
                "id": "123",
                "instanceId": "4",
                "timestamp": "1471161607303",
                "type": "log",
                "message": "New config load completed"
			}
		]
    }

    map.statusToClass = ["fa-arrow-circle-down", " fa-check", "fa-times"]

    map.selected = [0, 0];

    map.instanceIdToName = {};
    map.imageIdToName = {};

    map.mapInstanceIdToName = function () {
        for (var productName in this.productInstances) {
            var len = this.productInstances[productName].length;
            for (var i = 0; i < len; i++) {
                var inst = this.productInstances[productName][i];
                // this.instanceIdToName[inst.id] = inst.name;
                this.instanceIdToName[inst._id] = inst.name;
            }
        }
    }

    map.mapImageIdToName = function () {
        for (var imageName in this.productImages) {
            var len = this.productImages[imageName].length;
            for (var i = 0; i < len; i++) {
                var img = this.productImages[imageName][i];
                this.imageIdToName[img.id] = img.name;
            }
        }
    }

    map.setSelected = function (productIndex, imageIndex) {
        this.selected = [productIndex, imageIndex];
    }

    map.addProductImage = function (serviceName, /*iId,*/ iName, iDesc, iSig, iToken) {
        this.productImages[serviceName].push({
            "id": 888, //iId
            "name": iName,
            "desc": iDesc,
            "sig": "https://ourrepo.com/yourSigFile.sig", //iSig
            "token": "https://ourrepo.com/yourAccessToken.sig" //iToken
        });
    }

    return map;
});
app.controller('MainCtrl', function ($scope, $timeout, $http, $interval, ProductsFact, ClientFact, LogFact, Upload /*FileUploader*/ ) {
    console.info("init MainCtrl!");

	var CLOUD_WATCH_URL = "http://ec2-54-93-178-200.eu-central-1.compute.amazonaws.com:39739/cpuutilization"
	//var ADD_IMAGE_URL = "http://localhost:3000/fileUpload";
	var SECURE_SERVER_URL = "http://10.56.177.31:33555/"
	var ADD_IMAGE_URL = SECURE_SERVER_URL + "secure_server/upload_image";
	var ENCRYPT_DATA_URL = SECURE_SERVER_URL + "secure_server/upload_data";

    $scope.serviceSelect = -1;

    $scope.imageLimitations = {};
    $scope.imageLimitations.ipRange = [{}];

    $scope.addIpRangeLimitation = function () {
        $scope.imageLimitations.ipRange.push({});
    }

    $scope.test = function (value) {
        console.info("Passed!");
        console.info($scope[value]);
    }


    $scope.LogFact = LogFact;
    $scope.ClientFact = ClientFact;
    $scope.clients = ClientFact.getAllClients();
    $scope.selectedClient = ClientFact.getSelected();
    $scope.clientName = $scope.selectedClient.name; //$scope.customerName[0]; //"Verizon" //"AT&T"
    $scope.prod = ProductsFact;
    $scope.searchLog = {};
    $scope.searchLog.id;
    $scope.statusToClass = ProductsFact.statusToClass;
    ProductsFact.updateInstances();
    ProductsFact.mapImageIdToName();
    $scope.mapInstanceIdToName = ProductsFact.instanceIdToName;
    $scope.mapImageIdToName = ProductsFact.imageIdToName;
    $scope.imageForm = {};

    //$scope.imageFileUpload;

    $scope.populateInstances = function (serviceProviderId) {
        var res = {}
        
        for (var customer in $scope.clients['customers']) {
            if ($scope.clients['customers'][customer].spId == serviceProviderId) {
                if (ClientFact.getSelected().type == 'customers' &&
                    $scope.clients['customers'][customer].id != ClientFact.getSelected().id) {
                    continue;
                }
                var instIdArr = $scope.clients['customers'][customer].instances;
                if (instIdArr) {
                    $scope.getFullInstanceInfo(instIdArr);
                    for (var service in $scope.services) {
                        if (service in res) {
                            res[service] += $scope.services[service];
                        } else {
                            res[service] = $scope.services[service];
                        }
                    }
                }
            }
        }
        console.log("RES INSTANCES: " + res);
        $scope.services = res;
    };


    //        $scope.getServiceNames = function () {
    //        var labels = [];
    //        if (ClientFact.getSelected().type == "serviceProviders") {
    //            var services = ClientFact.getSelected().services;
    //            for (var i = 0, len = services.length; i < len; i++) {
    //                labels.push(services[i].name);
    //            }
    //        } else {
    //            var services = ClientFact.getSelected().services;
    //            for (var i = 0, len = services.length; i < len; i++) {
    //                labels.push(ClientFact.getServiceById[services[i]].name);
    //            }
    //        }
    //        console.log("LABELS: " + labels);
    //        return labels;
    //    }

    $scope.getServiceNames = function () {
        var labels = [];
        if (ClientFact.getSelected().type == "serviceProviders") {
            var services = ClientFact.getSelected().services;
            for (var i = 0, len = services.length; i < len; i++) {
                labels.push(services[i].name);
            }
        } else {
            var services = ClientFact.getSelected().services;
            for (var i = 0, len = services.length; i < len; i++) {
                labels.push(ClientFact.getServiceById[services[i]].name);
            }
        }
        console.log("LABELS: " + labels);
        return labels;
    }

    $scope.cpuValues = {
        'low': 0,
        'medium': 0,
        'high': 0
    };

    $scope.numOfCpuSamples = 100;
    $scope.cpuSamples = [];


    $scope.getCpuValues = function () {
        var values = [];
        for (var key in $scope.cpuValues) {
            values.push($scope.cpuValues[key]);
        }
        return values;
    };

    $scope.updateCpuValues = function () {
        if ($scope.cpuLoadAvg <= 20) {
            $scope.cpuValues['low']++;
        } else if ($scope.cpuLoadAvg >= 80) {
            $scope.cpuValues['high']++
        } else {
            $scope.cpuValues['medium']++;
        }
    };



    $scope.buildPieChart = function (spId) {
        var pie = {
            labels: [''],
            data: [0],
            numOfInstances: 0
        };



        for (var service in $scope.services) {
            var label = function (spId) {
                for (var sp in $scope.clients['serviceProviders']) {
                    if ($scope.clients['serviceProviders'][sp].id == spId) {
                        for (var name in $scope.clients['serviceProviders'][sp].services) {
                            if ($scope.clients['serviceProviders'][sp].services[name].id == service) {
                                return $scope.clients['serviceProviders'][sp].services[name].name;
                            }
                        }
                    }
                }
            }(spId);
            pie.labels.push(label);
            pie.data.push($scope.services[service]);
            pie.numOfInstances += $scope.services[service];
        }
        return pie;
    };

    $scope.setSelectedClient = function (type, index) {

        ClientFact.setSelected(type, index);
        var servId = 0;
        if (type == 'serviceProviders') {
            servId = $scope.clients[type][index].id;
        } else {
            servId = $scope.clients[type][index].spId;
        }
        $scope.populateInstances(servId);
        $scope.pieChart = $scope.buildPieChart(servId);
        $scope.numOfInstances = $scope.pieChart.numOfInstances;
        $scope.numOfVerifications = LogFact.numOfVerifications;
        $scope.numOfAlerts = LogFact.numOfAlerts;
        // setValueBySteps('numOfInstances', 0, $scope.numOfInstances, 1000, $scope.numOfInstances/2);

        $scope.cpuChart = {
            labels: ["0% - 20%", "20% - 80%", "80% - 100%"],
            data: /*$scope.getCpuValues(),*/ [3, 2, 1],
            colors: ['#00CC00', '#CC6600', '#CC0000'],
        };
        //        $scope.pieChart.update();
        $scope.selectedClient = ClientFact.getSelected();
        $scope.clientName = $scope.selectedClient.name //$scope.customerName[0]; //"Verizon" //"AT&T"
    }
    $scope.numOfInstances = 0;



    $scope.addProductImage = function (iName, iDesc, serviceId, file) {
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
            for (var lim in $scope.imageLimitations.ipRange) {
                var subnet = $scope.imageLimitations.ipRange[lim].val;
                if (subnet) {
                    ipRanges.push(subnet)
                }
            }
            imageData.ip_range = JSON.stringify(ipRanges);

            Upload.upload({
                url: ADD_IMAGE_URL,
                data: imageData,
            }).then(function (resp) {
                console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                //ClientFact.getDataPerClient("images", ClientFact.getSelected().id);
                $timeout(function () {
                    ClientFact.getDataPerClient("images", ClientFact.getSelected().id)
                }, 3000)
            }, function (resp) {
                console.log('Error status: ' + resp.status);
            }, function (evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
            });
        }
    }

    $scope.downloadDataFile = function (fileName, data, isAscii) {
        if (isAscii) {
            data = atob(data)
        }
        $scope.downloadFile(fileName, data, "text/plain");
    }

    $scope.downloadFile = function (fileName, data, contentType) {
        var blob = new Blob([data], {
            type: contentType
        });
        var downloadLink = angular.element('<a></a>');
        downloadLink.attr('href', window.URL.createObjectURL(blob));
        downloadLink.attr('download', fileName);
        downloadLink[0].click();
    }

    $scope.uploadDataFile = function (imageId, file, type) {
        console.info(imageId);
        console.info(file);
        if (file) {
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


    $scope.getFullInstanceInfo = function (instIdArr) {
        $scope.services = {};
        if (instIdArr) {
            var len = instIdArr.length;
            var res = []
            for (var i = 0; i < len; i++) {
                //            var instanceData = ClientFact.getInstanceById[instIdArr[i]]

                //  var instanceData = ClientFact.getInstanceById[instIdArr[i].id]

                var instanceData = instIdArr[i]
                if (instanceData) {
                    // Adding service id to instance for filtering
                    var img = ClientFact.getImageById[instanceData.image_id];
                    if (img) {
                        instanceData.service_id = img.service_id;
                        if (instanceData.service_id) {
                            if (instanceData.service_id in $scope.services) {
                                $scope.services[instanceData.service_id]++;
                            } else {
                                $scope.services[instanceData.service_id] = 0;
                            }

                            res.push(instanceData);

                        }
                    }
                }
            }
            console.log("SID: " + $scope.services);
            return res;
        }

    }

    $scope.cpuLoadAvg = 0; //65;
    $scope.cpuLoadAvgText = 0;
    $scope.cpuLoadMax = 0; //32;
    $scope.cpuLoadMaxText = 0;
    $scope.percent3 = 15;
    $scope.percentText3 = 0;
    $scope.percent4 = 80;
    $scope.percentText4 = 0;
    //$scope.options = { animate:false, barColor:'#E67E22', scaleColor:false, lineWidth:3, lineCap:'butt' }
    $scope.options = {
        barColor: "rgba(255,255,255,0.8)",
        trackColor: "rgba(255,255,255,0.1)",
        animate: 1000,
        lineWidth: 4,
        lineCap: "round",
        scaleColor: false,
        //  onStep:function(a){this.$el.find("span").text(~~a)}
    }
    $scope.options2 = JSON.parse(JSON.stringify($scope.options))
    $scope.options3 = JSON.parse(JSON.stringify($scope.options))
    $scope.options4 = JSON.parse(JSON.stringify($scope.options))
    $scope.options.onStep = function () {
        $scope.$apply(function () {
            var parsed = parseInt($scope.cpuLoadAvgText)
            var gap = $scope.cpuLoadAvg - parsed
            var step = gap / 15
            $scope.cpuLoadAvgText = parsed + step * 2;
        })
    }
    $scope.options.onStop = function () {
        $scope.$apply(function () {
            $scope.cpuLoadAvgText = $scope.cpuLoadAvg;
        })
    }
    $scope.options2.onStep = function () {
        $scope.$apply(function () {
            $scope.cpuLoadMaxText = parseInt($scope.cpuLoadMaxText) + 1;
        })
    }
    $scope.options2.onStop = function () {
        $scope.$apply(function () {
            $scope.cpuLoadMaxText = $scope.cpuLoadMax;
        })
    }
    $scope.options3.onStep = function () {
        $scope.$apply(function () {
            $scope.percentText3 += 1;
        })
    }
    $scope.options3.onStop = function () {
        $scope.$apply(function () {
            $scope.percentText3 = $scope.percent3;
        })
    }
    $scope.options4.onStep = function () {
        $scope.$apply(function () {
            $scope.percentText4 += 1;
        })
    }
    $scope.options4.onStop = function () {
        $scope.$apply(function () {
            $scope.percentText4 = $scope.percent4;
        })
    }


    $scope.numOfVerifications = 0;
    $scope.numOfAlerts = 0;
    $scope.timerStepsCallback = function (millis, steps, callback, finalCallback) {
        if (steps <= 0 || millis <= 0) {
            finalCallback();
            return;
        }
        var time = millis / steps;
        $timeout(function () {
            callback()
            $scope.timerStepsCallback(millis - time, steps - 1, callback, finalCallback)
        }, time);
    }

    $scope.setValueBySteps = function (targetVar, startValue, targetValue, millis, steps) {
        $scope[targetVar] = startValue;
        var valJump = targetValue / steps;
        $scope.timerStepsCallback(millis, steps, function () {
            $scope[targetVar] += valJump
        }, function () {
            $scope[targetVar] = targetValue
        });

    }

    $scope.setValue = function (target, value) {
        $scope[target] = value;
    }

    $scope.updateCPUUtilization = function () {
        $http({
            method: 'POST',
            url: CLOUD_WATCH_URL,
            data: {}
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
            if (response.error) {
                console.info(response.error)
            } else {
                $scope.cpuLoadAvg = response.data.data.Average;
                $scope.cpuLoadMax = response.data.data.Maximum;
            }
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }

    $scope.toFixed = function (number, occ) {
        var num = parseFloat(number);
        var mul = Math.pow(10, occ);
        var res = Math.round(num * mul) / mul;
        return res;
    }

    var updateInstanceTimeline = function(){
		chart1.data = []
		var len = LogFact.fullLogs.length;
		var logRow;
		var startTime;
		var instanceName;
		var type;
		for(var i = 0 ; i < len ; i++){
			logRow = LogFact.fullLogs[i];
			if(!ClientFact.getInstanceById[logRow.instance_id]/* || !ClientFact.getInstanceById[logRow.instance_id].pc_id*/){
				continue;
			}
			instanceName = ClientFact.getInstanceById[logRow.instance_id].pc_id;
			startTime = logRow.timestamp * 1000;
			type = logRow.type > 0x30 ? ' ' : '  ';
			chart1.data.push([instanceName, type, new Date(startTime), new Date(startTime + 1000)])
		}
	}

	LogFact.registerToPollingNotification(updateInstanceTimeline.name, updateInstanceTimeline);

	var chart1 = {};
	$scope.chart1 = chart1;
    chart1.type = "Timeline";
    chart1.data = [
      /*[ 'ins #1', ' ', 1473033465821,  1473073465821 ],
      [ 'ins #1', '  ',  new Date(0,0,0,14,30,0), new Date(0,0,0,16,0,0) ],
      [ 'ins #1', ' ', new Date(0,0,0,16,30,0), new Date(0,0,0,19,0,0) ],
      [ 'ins #2', ' ', new Date(0,0,0,12,30,0), new Date(0,0,0,14,0,0) ],
      [ 'ins #2', '  ',  new Date(0,0,0,13,0,0), new Date(0,0,0,13,30,0) ],
      [ 'ins #2', ' ', new Date(0,0,0,16,30,0), new Date(0,0,0,18,0,0) ],
      [ 'ins #3', ' ', new Date(0,0,0,12,30,0), new Date(0,0,0,14,0,0) ],
      [ 'ins #3', '  ',  new Date(0,0,0,14,30,0), new Date(0,0,0,16,0,0) ],
      [ 'ins #3', ' ', new Date(0,0,0,16,30,0), new Date(0,0,0,18,30,0) ]*/
  	];
    //chart1.data.push(['Services',20000]);
    chart1.options = {
        colors: ["#FF0000", "#00FF00"],
        displayExactValues: true,
        width: "100%",
        height: "100%",
        is3D: true,
        chartArea: {
            left: 10,
            top: 10,
            bottom: 0,
            height: "100%"
        },
        avoidOverlappingGridLines: false
    };

    chart1.formatters = {
        number: [{
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
      LogFact.unRegisterFromPollingNotification(updateInstanceTimeline.name);
    });

    $scope.updateInstances = function () {

        $scope.setSelectedClient(ClientFact.selectedIndex[0], ClientFact.selectedIndex[1]);
    };

    $interval($scope.updateInstances, 3000);
    //$scope.setSelectedClient(ClientFact.selectedIndex[0], ClientFact.selectedIndex[1]);

    _DEBUG = $scope;
});
var _DEBUG;