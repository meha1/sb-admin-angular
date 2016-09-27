'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */

var app = angular.module('sbAdminApp');
var productionIp = "52.28.149.249";
var stagingIp = "52.59.6.66";
var producitonCpuIp = "54.93.40.187";
var stagingCpuIp = "54.93.34.14"; 

var SERVER_IP = productionIp;
var CPU_SERVER_IP = producitonCpuIp;

//var ES_URL = "http://" + stagingIp + ":9200/";
var ES_URL = "http://" + SERVER_IP + ":9200/";

app.factory('NotifyingService', function($rootScope) {
    return {
        subscribe: function(scope, callback) {
            var handler = $rootScope.$on('notifying-service-event', callback);
            scope.$on('$destroy', handler);
        },

        notify: function() {
            $rootScope.$emit('notifying-service-event');
        }
    };
});

app.filter('ClientRelatedInstances', function (ClientFact) {
    function filterFunc(items, clientInstances) {
        var filtered = [];
        if (!clientInstances) {
            return filtered;
        }
        var len = clientInstances.length;
        var instanceIdMap = {};
        // marking all instances that belong to the user
        for (var i = 0; i < len; i++) {
            if (clientInstances[i] && clientInstances[i].id) {
                instanceIdMap[clientInstances[i].id] = true;
            }
        }
        angular.forEach(items, function (item) {
            if (instanceIdMap[item.instance_id] && ClientFact.getInstanceById[item.instance_id]) {
                //item.service_id = ClientFact.getInstanceById[item.instance_id].service_id;
                filtered.push(item);
            }
        });
        return filtered;
    };
    return filterFunc
})

app.factory('LogFact', function ($http, $interval, $timeout, ClientFact) {
    var map = {};
    map.logs = {};
    map.fullLogs = [];
    map.logsByInstance = {};
    map.logsByInstancePerSecond = [];
    var lastTimestamp;

    map.resolveType = {
        0x10: 'Details',
        0x20: 'Info',
        0x30: 'Warn',
        0x40: 'Attack',
    }

    map.resolveSubType = {
        0: 'Generic',
        1: 'Initialization',
        2: 'Shutdown',
        3: 'AWS instance',
        4: 'CPU ID',
        5: 'MAC address',
        64: 'File open',
        65: 'File close',
        66: 'File read',
        67: 'Secure file open',
        68: 'Secure file close',
        69: 'Secure file read',
        128: 'ASLR',
        129: 'Canary',
        130: 'NX',
        131: 'Position independent executable (PIE)',
        132: 'RELRO',
        192: 'Debugger',
        193: 'Executable memory',
        194: 'Injected shared object',
        195: 'Unauthorized process',
        196: 'Signature Check'
    }

    map.resolveAlertText = {
    	192: 'Debugger attachment was detected',
    	193: 'Monitored process memory was changed',
    	194: 'Malicious shared objected was injected',
    	195: "Malicious process detected",
    	196: "Signature doesn't match",
    }

    map.updateLog = function (pass) {
        var that = this == undefined ? pass : this;
        //$http.get(ES_URL + "events*/_search&size=")
        var now = Date.now() / 1000;
        // 24hr in seconds
        var TIME_TO_LOG = (3600 * 24) 
        var fromDate = that.lastTimestamp ? that.lastTimestamp : fromDate = now - TIME_TO_LOG;
       	
        var searchQuery = {
            "query": {
                "match_all": {}
            },
            "size": 10000,
            "sort": [{
                    "timestamp": {
                        "order": "desc"
                    }
                }
                          ],
            "filter": {
                "range": {
                    "timestamp": { // timestamp is a long unix time
                        "gt": fromDate,
                        "lt": now + (3600 * 24) //To be safe with the latest timezone 
                    }
                }
            }
        }
        $http.post(ES_URL + "events-*/_search", searchQuery)
            .then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                if (response.error) {
                    console.info(response.error)
                } else {
                    var res = response.data.hits.hits;
                    var len = res.length;
                    var fullLogs = [];
                    //that.logs = {};
                    //that.fullLogs = [];


                    that.numOfVerifications = 0;
                    that.numOfAlerts = 0

                    // updating the last query timestamp with the first record (first has the newest timestamp)
                    if(res[0] && res[0]._source && res[0]._source.timestamp){
                    	that.lastTimestamp = res[0]._source.timestamp;
                    }

                    for (var i = 0; i < len; i++) {
                        var instanceId = res[i]._source.instance_id
                        if (!instanceId || instanceId == "" || instanceId[0] == '\0')
                            continue;
                        // if (!that.logs[instanceId]) {
                        //     that.logs[instanceId] = [];
                        // }
                        //res[i]._source.id = res[i]._id; // adding instance id into the data
                        res[i]._source.instance = ClientFact.getInstanceById[instanceId]
                        if (res[i]._source.instance) {
                            res[i]._source.image = ClientFact.getImageById[res[i]._source.instance.image_id];
                            res[i]._source.service_id = res[i]._source.image.service_id; 
                            res[i]._source.id = res[i]._id;
                            if (ClientFact.getServiceById[res[i]._source.service_id]){
                                //res[i]._source.instanceName = ClientFact.getServiceById[res[i]._source.service_id].name + " " + instanceId.hashCode();
                        		res[i]._source.instanceName = ClientFact.getInstanceById[instanceId].instanceName;// + " " + instanceId.hashCode();
                            }
                                //console.info("Enriched:")
                                //console.info(res[i]._source)
                        }
                        //that.fullLogs.push(res[i]._source)
                        fullLogs.push(res[i]._source)
                        // that.logs[instanceId].push(res[i]._source);

                    }
                    // adding the new record to the begining of the existing to keep them in descending oreder
                    that.fullLogs = fullLogs.concat(that.fullLogs);

                	// locate the first record that timestamp > 'fromDate' (too old)
                    len = that.fullLogs.length;
                    fromDate = now - TIME_TO_LOG
                	var i;
                    for (i = len - 1; i >= 0 ; i--){
                    	// locating last index that is in the range
                    	if(fromDate < that.fullLogs[i].timestamp){
                    		break;
                    	}
                    }
                    that.fullLogs = that.fullLogs.slice(0, i+1);

                    len = that.fullLogs.length;
                    for (i = 0 ; i < len ; i++){
                        // counting alerts anf verifications
                        var logRow = that.fullLogs[i];
	                    if ((logRow.type == 0x10) || (logRow.type == 0x20)) {
	                        that.numOfVerifications++;
	                    } else if ((logRow.type == 0x30) || (logRow.type == 0x40)) {
	                        that.numOfAlerts++;
	                    }	
                        
                        //maping logs by instance_id
                        if(!that.logsByInstance[logRow.instance_id]){
                            that.logsByInstance[logRow.instance_id] = {};
                        }
                        // creating a map of maps for each instance, only one record is a certain second will exist (alert preferably)
                        // if there is no record for this second or the existing record isn't an alert, replace it
                        if (!that.logsByInstance[logRow.instance_id][logRow.timestamp] || 
                            !that.logsByInstance[logRow.instance_id][logRow.timestamp].type ||
                             that.logsByInstance[logRow.instance_id][logRow.timestamp].type < 0x40){
                            that.logsByInstance[logRow.instance_id][logRow.timestamp] = logRow;
                        }
                        // making the alert BOLD and WIDE
                        // if(that.logsByInstance[logRow.instance_id][logRow.timestamp].type == 0x40){
                        //     that.logsByInstance[logRow.instance_id][logRow.timestamp+1]
                        //     that.logsByInstance[logRow.instance_id][logRow.timestamp+2]
                        //     that.logsByInstance[logRow.instance_id][logRow.timestamp+3]
                        //     that.logsByInstance[logRow.instance_id][logRow.timestamp+4]
                        //     that.logsByInstance[logRow.instance_id][logRow.timestamp+5]
                        //     that.logsByInstance[logRow.instance_id][logRow.timestamp+6]
                        // }
                        //that.logsByInstance[logRow.instance_id][logRow.timestamp].push(logRow);
                    }
                    var tmpInstancesLog = {};
                    for(var instance_id in that.logsByInstance){
                        // var arr = Object.keys(that.logsByInstance[instance_id]).map(key => that.logsByInstance[instance_id][key]);
                        var arr = Object.keys(that.logsByInstance[instance_id]).map(function(key){ return that.logsByInstance[instance_id][key]});
                        tmpInstancesLog[instance_id] = arr;
                    }
                    that.logsByInstancePerSecond = [];
                    // Object.keys(tmpInstancesLog).map(key => that.logsByInstancePerSecond = that.logsByInstancePerSecond.concat(tmpInstancesLog[key]));
                    Object.keys(tmpInstancesLog).map(function(key){ that.logsByInstancePerSecond = that.logsByInstancePerSecond.concat(tmpInstancesLog[key])});
                    // that.logsByInstancePerSecond = that.logsByInstancePerSecond.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : ((b.timestamp > a.timestamp) ? - 1 : 0)).reverse();
                    that.logsByInstancePerSecond = that.logsByInstancePerSecond.sort(function(a, b){ return (a.timestamp > b.timestamp) ? 1 : ((b.timestamp > a.timestamp) ? - 1 : 0)}).reverse();
                    that.pollingIsDone(that)
                }
                //console.log(that.fullLogs)
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
    }

    var logInterval;

    map.startLogPolling = function (millis) {
        map.updateLog();
        this.stopLogPolling();
        logInterval = $interval(this.updateLog, millis, 0, true, this);
    }

    map.stopLogPolling = function () {
        if (angular.isDefined(logInterval)) {
            $interval.cancel(logInterval);
            logInterval = undefined;
        }
    }

    var pollingRegister = {};
    map.registerToPollingNotification = function (name, func) {
        if (typeof name === "string" &&
            name.length > 0 &&
            typeof func === "function")
            pollingRegister[name] = func;
    }

    map.unRegisterFromPollingNotification = function (name, func) {
        if (pollingRegister[name]) {
            delete pollingRegister[name]
        }
    }

    map.pollingIsDone = function (context) {
        angular.forEach(pollingRegister, function (value, key) {
            value();
        })
    }

    return map;
});

app.factory('ClientFact', function ($http, $q, $timeout, NotifyingService) {
    

    var map = {};
    map.selectedIndex = [];

    map.clients = {
        serviceProviders: [
            {
                id: 1,
                name: "Cisco SP",
                services: [
                    {
                        //id: 1,
                        id: "Orange",
                        name: "vRouter",
                        desc: "Cisco secure virtual router"
                    },
                    {
                        //id: 1,
                        id: "Apple",
                        name: "Docker",
                        desc: "Cisco secure Docker container"
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
                services: ["Orange", "Apple", 92]
            },
            {
                id: 101,
                spId: 1,
                name: "Verizon",
                services: [92, 93]
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
            if (!that) {
                that = this;
            }
            that.getFromES(type, clientId, successCallback, errorCallback, that);
        }
        // var wait = 0;
        // var waitGap = 350;
        // map.getAllClientsInfo = function () {
        //     //wait = 0
        //     requests = [];
        //     var that = this
        //         //var wait = 0;
        //     for (var clientId in this.getClientById) {
        //         //if (this.getClientById[clientId].type != "serviceProviders") {
        //         wait += waitGap;
        //         var deferred = $q.defer();
        //         requests.push(deferred);
        //         $timeout(that.getDataPerClient, wait, true, "instances", clientId.toString(), deferred.resolve, deferred.reject, that);
        //         //}
        //         wait += waitGap;
        //         var deferred = $q.defer();
        //         requests.push(deferred.promise);
        //         //this.getDataPerClient("images", clientId, deferred.resolve, deferred.reject);
        //         $timeout(that.getDataPerClient, wait, true, "images", clientId.toString(), deferred.resolve, deferred.reject, that);

    //     }
    //     var that = this;
    //     $q.all(requests).then(function () {
    //         wait = 0;
    //         console.info("Clients Mapping updated with info:")
    //         console.info(that.getClientById)
    //         map.getDataByIdMapping('images', map.getImageById);
    //         map.getDataByIdMapping('instances', map.getInstanceById);
    //         console.info("This is map.getInstanceById: ")
    //         console.info(map.getInstanceById)
    //         console.info("This is map.getImageById: ")
    //         console.info(map.getImageById)
    //     });
    // }

    var position;
    var requestsPoll = [];

    var doneAsyncRequest = function (param) {
        if (position < requestsPoll.length) {
            requestsPoll[position][0](requestsPoll[position][1], requestsPoll[position][2], requestsPoll[position][3], requestsPoll[position][4], requestsPoll[position][5]);
            position++;
        } else {
            var len = map.clients.customers.length;
            for (var i = 0; i < len; i++) {
                var spId = map.clients.customers[i].spId;
                if (!map.getClientById[spId].instances) {
                    map.getClientById[spId].instances = [];
                }
                if (!map.clients.customers[i].instances) {
                    continue;
                } else {
                    map.getClientById[spId].instances = map.getClientById[spId].instances.concat(map.clients.customers[i].instances)
                    //map.clients.customers[i].instances = map.getClientById[spId].instances.concat(map.clients.customers[i].instances)
                }
            }
            console.info("Clients Mapping updated with info:")
            console.info(map.getClientById)
            map.getDataByIdMapping('images', map.getImageById);
            map.getDataByIdMapping('instances', map.getInstanceById);
            console.info("This is map.getInstanceById: ")
            console.info(map.getInstanceById)
            console.info("This is map.getImageById: ")
            console.info(map.getImageById)
            map.isDoneInitialLoad = true;

            //var len = map.getSelected().instances.length;
            for (var instance_id in map.getInstanceById){
                if(!map.getInstanceById.hasOwnProperty(instance_id)){
                    return;
                }
                var instance = map.getInstanceById[instance_id]
                instance.instanceName = map.getServiceById[map.getImageById[instance.image_id].service_id].name + " " + instance.id.hashCode();
            }
            NotifyingService.notify();
        }
    }
    map.isDoneInitialLoad;
    map.getAllClientsInfo = function () {
        var that = this
        position = 0;
        for (var clientId in this.getClientById) {
            requestsPoll.push([that.getDataPerClient, "instances", clientId.toString(), doneAsyncRequest, doneAsyncRequest, that]);
            requestsPoll.push([that.getDataPerClient, "images", clientId.toString(), doneAsyncRequest, doneAsyncRequest, that]);
        }
        doneAsyncRequest();
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
        // checking if the selected user is the same user
        if (this.selectedIndex[0] == type && this.selectedIndex[1] == index) {
            return;
        }
        this.selectedIndex = [type, index];
        this.selected = this.clients[type][index];
        this.selected.selectedService = null;
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


app.controller('MainCtrl', function ($scope, $rootScope, $timeout, $http, $interval, $filter, $anchorScroll, $location, $state, $uibModal, ClientFact, LogFact, Upload, NotifyingService /*FileUploader*/ ) {
    console.info("init MainCtrl!");

    if($state.current.name != 'dashboard.home'){
        $state.go('dashboard.home');
    }

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options){ 
        if(toState.name == "dashboard.home" && fromState.name != "dashboard.home"){
            // start log polling
            LogFact.registerToPollingNotification(updateInstanceTimeline.name, updateInstanceTimeline);
            console.info("Started log polling!")
        }else if(fromState.name == "dashboard.home" && toState.name != "dashboard.home"){
            // stop log polling
            LogFact.unRegisterFromPollingNotification(updateInstanceTimeline.name);
            console.info("Stopped log polling!")
        }
        if(toState.name == "dashboard.instances"){
            $timeout(drawTimelineChart, 300, false, $scope, chart1.data)
        }
    });

    //var CLOUD_WATCH_URL = "http://ec2-54-93-178-200.eu-central-1.compute.amazonaws.com:39739/cpuutilization"
    var CLOUD_WATCH_URL = "http://" + CPU_SERVER_IP + ":39739/cpuutilization";
        //var ADD_IMAGE_URL = "http://localhost:3000/fileUpload";
    //var SECURE_SERVER_URL = "http://10.56.177.31:33555/"
    var SECURE_SERVER_URL = "http://" + SERVER_IP + ":33555/";
    var ADD_IMAGE_URL = SECURE_SERVER_URL + "secure_server/upload_image";
    var ENCRYPT_DATA_URL = SECURE_SERVER_URL + "secure_server/upload_data";
    var LAST_X_HOURS = 0.5;
    var LIMIT_LOG_SIZE = $scope.limitLogSize = 1000;

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
    $scope.searchLog = {};
    $scope.searchLog.id;
    $scope.imageForm = {};

    $scope.populateInstances = function (serviceProviderId) {
        var res = {}

        for (var customer in $scope.clients['customers']) {
            if ($scope.clients['customers'][customer].spId == serviceProviderId) {
                if (ClientFact.getSelected().type == 'customers' &&
                    $scope.clients['customers'][customer].id != ClientFact.getSelected().id) {
                    continue;
                }
                var instIdArr = $scope.clients['customers'][customer].instances;
                if (instIdArr && instIdArr.length > 0) {
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
        //console.log("RES INSTANCES: " + res);
        $scope.services = res;
    };

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



    $scope.getCpuValues = function () {
        var values = [];
        for (var key in $scope.cpuValues) {
            values.push($scope.cpuValues[key]);
        }
        return values;
    };

    $scope.cpuValues = {
        'low': 1,
        'medium': 1,
        'high': 1
    };

    $scope.updateCpuValues = function () {
        var lowerThreshold = 20;
        var upperThreshold = 80;
        $scope.cpuValues = {
            'low': 0,
            'medium': 0,
            'high': 0
        };
        for (var i = 0; i < $scope.cpuLoadData.length; i++) {
            if ($scope.cpuLoadData[i].Maximum <= lowerThreshold) {
                $scope.cpuValues['low']++;
            } else if ($scope.cpuLoadData[i].Maximum >= upperThreshold) {
                $scope.cpuValues['high']++
            } else {
                $scope.cpuValues['medium']++;
            }
        }
    };


    $scope.buildCpuChart = function () {
        return {
            labels: ['low', 'medium', 'high'],
            data: [$scope.cpuValues['low'], $scope.cpuValues['medium'], $scope.cpuValues['high']],
            colors: ['#00CC00', '#CC6600', '#CC0000']
        };
    };

    $scope.buildPieChart = function (spId) {
        var pie = {
            labels: [],
            colors : ['#E7D6FF', '#C8A3FF','#FFFFFF', '#A970FF','#8B3DFF'],
            data: [],
            legend: [],
            numOfInstances: ''
        };

        var count = 0;
      
        var element = angular.element(document.querySelector('#pieLegend'));
        $(".tempLabel").remove();
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
            var htmlStr = angular.element("<div class='tempLabel'><div class='tempLabel' style='color:" + String(pie.colors[count]) +
                "'> &#9632</div> " + String(label) + "</div>");
            count = (count + 1) % pie.colors.length;
            element.append(htmlStr);
        }
        return pie;
    };


    $scope.setSelectedClient = function (type, index) {

        ClientFact.setSelected(type, index);
        //ClientFact.getAllClientsInfo();
        var servId = 0;
        if (type == 'serviceProviders') {
            servId = $scope.clients[type][index].id;
        } else {
            servId = $scope.clients[type][index].spId;
        }
        $scope.populateInstances(servId);
        $scope.pieChart = $scope.buildPieChart(servId);
        $scope.numOfInstances = $scope.pieChart.numOfInstances;
        // setValueBySteps('numOfInstances', 0, $scope.numOfInstances, 1000, $scope.numOfInstances/2);

        $scope.cpuChart = $scope.buildCpuChart();
        //        $scope.pieChart.update();
        $scope.selectedClient = ClientFact.getSelected();
        $scope.clientName = $scope.selectedClient.name //$scope.customerName[0]; //"Verizon" //"AT&T"

        if (ClientFact.selectedIndex[0] != type || ClientFact.selectedIndex[1] != index) {
        	updateInstanceTimeline();
        }
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
            var that = $scope;
            Upload.upload({
                url: ADD_IMAGE_URL,
                data: imageData,
            }).then(function (resp) {
                console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                //ClientFact.getDataPerClient("images", ClientFact.getSelected().id);
                $timeout(function () {
                    ClientFact.getDataPerClient("images", ClientFact.getSelected().id)
                }, 2000)
    			$scope.imageForm = {};
    			$scope.imageLimitations = {};
			    $scope.imageLimitations.ipRange = [{}];

            }, function (resp) {
                alert('Error status: ' + resp.status);
            }, function (evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
            });
        }
    }

    function b64toBlob(b64Data, contentType, sliceSize) {
	  contentType = contentType || '';
	  sliceSize = sliceSize || 512;

	  var byteCharacters = atob(b64Data);
	  var byteArrays = [];

	  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
	    var slice = byteCharacters.slice(offset, offset + sliceSize);

	    var byteNumbers = new Array(slice.length);
	    for (var i = 0; i < slice.length; i++) {
	      byteNumbers[i] = slice.charCodeAt(i);
	    }

	    var byteArray = new Uint8Array(byteNumbers);

	    byteArrays.push(byteArray);
	    //console.log(byteArrays)
	  }
	    
	  var blob = new Blob(byteArrays, {type: contentType});
	  return blob;
	}

    $scope.downloadDataFile = function (fileName, data, isAscii) {
        if (isAscii) {
            data = b64toBlob(data)
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

    $scope.isInstanceActive = function (instanceData) {
        // Filter dead instances. They have 'end_time' that is in the past
        if ('end_time' in instanceData) {
            var now = moment();
            var dateFormat = "DD-MM-YY HH:mm";
            try {
                var instanceEndTime = moment(instanceData['end_time'], dateFormat);
            } catch (err) {
                return false;
            }
            if (instanceEndTime < now) {
                return false;
            }
        }
        return true;
    };

    $scope.getFullInstanceInfo = function (instIdArr) {
        $scope.services = {};
        if (instIdArr) {
            var len = instIdArr.length;
            var res = [];
            for (var i = 0; i < len; i++) {
                //            var instanceData = ClientFact.getInstanceById[instIdArr[i]]

                //  var instanceData = ClientFact.getInstanceById[instIdArr[i].id]

                var instanceData = instIdArr[i]
                if (instanceData) {
                    if (!$scope.isInstanceActive(instanceData)) {
                        continue;
                    }

                    // Adding service id to instance for filtering
                    var img = ClientFact.getImageById[instanceData.image_id];
                    if (img) {
                        instanceData.service_id = img.service_id;
                        if (instanceData.service_id) {
                            if (instanceData.service_id in $scope.services) {
                                $scope.services[instanceData.service_id]++;
                            } else {
                                $scope.services[instanceData.service_id] = 1;
                            }

                            res.push(instanceData);

                        }
                    }
                }
            }
            //console.log("SID: " + $scope.services);
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
    $scope.options2 = JSON.parse(JSON.stringify($scope.options));
    $scope.options3 = JSON.parse(JSON.stringify($scope.options));
    $scope.options4 = JSON.parse(JSON.stringify($scope.options));
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
                $scope.cpuLoadAvg = response.data.data[0].Average;
                $scope.cpuLoadMax = response.data.data[0].Maximum;
                $scope.cpuLoadData = response.data.data;
                $scope.updateCpuValues();
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
    $scope.filteredLogs = [];
    $scope.fullFilteredLogs = [];

    $scope.reloadTimeline = function() {
    	updateInstanceTimeline();
    	console.info("Loaded main view!")
	};

    var updateVerificationAndAlerts = function()
    {
        $scope.numOfVerifications = LogFact.numOfVerifications;
        $scope.numOfAlerts = LogFact.numOfAlerts;
    }

    var updateInstanceTimeline = function () {
    	// ====== TODO: insert dummy event for color correction!!!
        // if instance data wasn't loaded
        if(!ClientFact.isDoneInitialLoad){
            return;
        }
        // TODO: Filter by user and service -> empty selected service == all servcies
        chart1.data = [];
        $scope.fullFilteredLogs = $filter('ClientRelatedInstances')(LogFact.fullLogs, ClientFact.getSelected().instances)
        $scope.filteredLogs = $filter('ClientRelatedInstances')(LogFact.logsByInstancePerSecond, ClientFact.getSelected().instances)
            //var len = LogFact.fullLogs.length;
        var len = $scope.filteredLogs.length
        var logRow;
        var startTime;
        var endTime;
        var instanceName;
        var type;
        var startTimestamp = ((new Date().getTime())/1000) - (LAST_X_HOURS*3600)
        var insertedDummyRow = false;
        for (var i = 0; i < len && chart1.data.length < LIMIT_LOG_SIZE; i++) {
            //logRow = LogFact.fullLogs[i];
            logRow = $scope.filteredLogs[i];
            // checking if row has all related data in instances list and that it belongs to the current user
            if (!ClientFact.getInstanceById[logRow.instance_id] ||
                !ClientFact.getInstanceById[logRow.instance_id].pc_id ){
        //||                logRow.timestamp < startTimestamp) {
                continue;
            }
            instanceName = ClientFact.getInstanceById[logRow.instance_id].instanceName;
            // if( !logRow.instance_id || 
            // 	!ClientFact.getInstanceById[logRow.instance_id] || 
            // 	!ClientFact.getInstanceById[logRow.instance_id].service_id || 
            // 	!ClientFact.getServiceById[ClientFact.getInstanceById[logRow.instance_id].service_id] || 
            // 	!ClientFact.getServiceById[ClientFact.getInstanceById[logRow.instance_id].service_id].name){
            // 	continue;
            // }
            //instanceName = logRow.instanceName;//ClientFact.getServiceById[ClientFact.getInstanceById[logRow.instance_id].service_id].name + " " + logRow.instance_id.hashCode()
            type = logRow.type > 0x30 ? ' ' : '  ';
            startTime = logRow.timestamp * 1000;
            endTime = startTime //+ (logRow.type > 0x30 ? 10 : 0);
            var tooltip = 
            	"<div>" +
            		"<div class='row'>" +
            			"<div class='col-md-3 tooltip-label'>" +
            				"Time: " +
            			"</div>" + 
            			"<div class='col-md-9 tooltip-text'>" +
            				$filter('date')(logRow.timestamp*1000,'medium') +
            			"</div>" +
            		"</div>" + 
            		"<div class='row'>" +
            			"<div class='col-md-3 tooltip-label'>" +
            				"Type: " +
            			"</div>" + 
            			"<div class='col-md-9 tooltip-text'>" +
            				LogFact.resolveType[logRow.type] +
            			"</div>" +
            		"</div>" + 
            		"<div class='row'>" +
            			"<div class='col-md-3 tooltip-label'>" +
            				"Subtype: " +
            			"</div>" + 
            			"<div class='col-md-9 tooltip-text'>" +
            				LogFact.resolveSubType[logRow.subtype] +
            			"</div>" +
            		"</div>" + 
            		"<div class='row'>" +
            			"<div class='col-md-3 tooltip-label'>" +
            				"Text: " +
            			"</div>" + 
            			"<div class='col-md-9 tooltip-text'>" +
            				logRow.txt +
            			"</div>" +
            		"</div>" + 
        		"</div>"
        	chart1.data.push([instanceName, type, tooltip ,new Date(startTime), new Date(endTime)])
            //chart1.data.push([instanceName, type, tooltip ,new Date(startTime), new Date(endTime)])
        }
        if(chart1.data && chart1.data.length > 0){
            // Inserting dummy event for color correction and timeline start point fix
            // inserting dummy events for non-active instances
            var len = ClientFact.getSelected().instances.length;
            for (var i = 0 ; i < len ; i++){
                //var instance = ClientFact.getSelected().instances[i];
                //instanceName = ClientFact.getServiceById[ClientFact.getImageById[instance.image_id].service_id].name + " " + instance.id.hashCode();
                //startTime = startTime < startTimestamp*1000 ? startTime : startTimestamp*1000;
                chart1.data.push([ClientFact.getSelected().instances[i].instanceName, '  ', "" ,new Date(startTime-1), new Date(startTime-1)])  
            }
        }

        $scope.showTimelineChart = true;
		
        if(chart1.data.length > 0){
			drawTimelineChart($scope, chart1.data)
        }else{
        	emptyTimelineChart();
        }
    }

    var updateInstanceInterval;

    NotifyingService.subscribe($scope, function clientFullInfoLoaded() {
        LogFact.registerToPollingNotification(updateInstanceTimeline.name, updateInstanceTimeline);
        LogFact.registerToPollingNotification(updateVerificationAndAlerts.name, updateVerificationAndAlerts);
        

        LogFact.startLogPolling(10000);
    	//LogFact.stopLogPolling();
        $scope.updateInstances();
        updateInstanceInterval = $interval($scope.updateInstances, 10000);
    });

    $scope.scrollToAnchor = function(index, isFullRow){
    	var record = isFullRow ? index : $scope.filteredLogs[index];
        ClientFact.getSelected().selectedService = "";
    	if(index){
    		var serviceId = record.image.service_id;
    		ClientFact.getSelected().selectedService = serviceId;
	    	$scope.searchLog.instance_id = record.instance_id;
    	}
    	if($state.current.name != 'dashboard.instances'){
    		$state.go('dashboard.instances');
    	}
    	var target = record ? record.id : '';
    	$timeout($scope.scrollToLogAnchor, 50, false, target, record);
    }

    $scope.scrollToLogAnchor = function(index, record){
        if($state.current.name != 'dashboard.instances'){
            $scope.scrollToAnchor(record, true);
            return;
        }
    	var newHash = 'logAnchor' + index;
		if ($location.hash() !== newHash) {
			// set the $location.hash to `newHash` and
			// $anchorScroll will automatically scroll to it
			$location.hash('logAnchor' + index);
		} else {
			// call $anchorScroll() explicitly,
			// since $location.hash hasn't changed
			$anchorScroll();
		}
        drawTimelineChart($scope, chart1.data)
    }

    $scope.showTimelineChart = false;
    var chart1 = {};
    $scope.chart1 = chart1;
    chart1.type = "Timeline";
    chart1.data = [ /*['ins1', ' ', new Date(0, 0, 0, 14, 30, 0), new Date(0, 0, 0, 14, 30, 0)]*/ ];
    //chart1.data.push(['Services',20000]);
    chart1.options = {
        colors: ["#00FF00", "#FF0000"],
        // displayExactValues: true,
        width: "100%",
        height: "500px",
        enableInteractivity: true,
        // is3D: true,
        // chartArea: {
        //     left: 10,
        //     top: 10,
        //     bottom: 0,
        //     height: "100%"
        // },
        // avoidOverlappingGridLines: false
    };


    $scope.chart = chart1;

    var cpuUtilInterval;
    if (!angular.isDefined(cpuUtilInterval)) {
        $scope.updateCPUUtilization()
            //LogFact.updateLog();
        console.info("init cpu interval");
        //logInterval = $interval(LogFact.updateLog, 5000);//, [count], [invokeApply], [Pass]);
        cpuUtilInterval = $interval($scope.updateCPUUtilization, 10000); //, [count], [invokeApply], [Pass]);
    }

    $scope.$on('$destroy', function () {
        // Make sure that the interval is destroyed too
        if (angular.isDefined(cpuUtilInterval)) {
            $interval.cancel(cpuUtilInterval);
            cpuUtilInterval = undefined;
        }
        if (angular.isDefined(updateInstanceInterval)) {
            $interval.cancel(updateInstanceInterval);
        }
        LogFact.stopLogPolling();
        LogFact.unRegisterFromPollingNotification(updateInstanceTimeline.name);
    });

    $scope.updateInstances = function () {
        $scope.setSelectedClient(ClientFact.selectedIndex[0], ClientFact.selectedIndex[1]);
    };

    //$scope.setSelectedClient(ClientFact.selectedIndex[0], ClientFact.selectedIndex[1]);

    $scope.openInstanceModal = function (instance) {
        //var additionalInfo = $scope.devices[index].additionalInfo;
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'additionalInfo.html',
            controller: 'ModalInstanceCtrl',
            size: 300,
            resolve: {
                instance: function () {
                  return instance;
                }
            }
        });
    };

    _DEBUG = $scope;
});

app.controller('ModalInstanceCtrl', ["$scope", "$uibModalInstance", "instance", function ($scope, $uibModalInstance, instance) {
    $scope.instance = instance; //content;
    $scope.ok = function () {
        $uibModalInstance.close();
    };
}]);
var _DEBUG;