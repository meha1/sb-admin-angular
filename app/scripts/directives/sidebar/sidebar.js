'use strict';

/**
 * @ngdoc directive
 * @name izzyposWebApp.directive:adminPosHeader
 * @description
 * # adminPosHeader
 */

var _DEBUG_SIDE_BAR;
angular.module('sbAdminApp')
  .directive('sidebar',['$location',function() {
    return {
      templateUrl:'scripts/directives/sidebar/sidebar.html',
      restrict: 'E',
      replace: true,
      scope: {
      },
      controller: function($scope, ClientFact){
        _DEBUG_SIDE_BAR = $scope;
        console.info("sidebar")
        $scope.ClientFact = ClientFact;
        $scope.selectedMenu = 'dashboard';
        $scope.collapseVar = 0;
        $scope.multiCollapseVar = 0;
        $scope.activeSideBar = -1;


        // $scope.setSelected = function(productIndex, imageIndex){
        //   ProductsFact.setSelected(productIndex, imageIndex)
        // }
        $scope.setSelected = function(serviceId){
          ClientFact.getSelected().selectedService = serviceId;
          console.log("Selected service is: " + serviceId)
        }
        
        $scope.check = function(x){
          $scope.activeSideBar = x;
          if(x==$scope.collapseVar)
            $scope.collapseVar = 0;
          else
            $scope.collapseVar = x;
        };

        // debugging uses:
        $scope.isEqual = function(val1, val2){
          var res = val1 == val2;
          return res;
        }
        
        $scope.multiCheck = function(y){
          
          if(y==$scope.multiCollapseVar)
            $scope.multiCollapseVar = 0;
          else
            $scope.multiCollapseVar = y;
        };
      }
    }
  }]);
