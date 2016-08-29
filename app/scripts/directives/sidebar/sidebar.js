'use strict';

/**
 * @ngdoc directive
 * @name izzyposWebApp.directive:adminPosHeader
 * @description
 * # adminPosHeader
 */

angular.module('sbAdminApp')
  .directive('sidebar',['$location',function() {
    return {
      templateUrl:'scripts/directives/sidebar/sidebar.html',
      restrict: 'E',
      replace: true,
      scope: {
      },
      controller:function($scope, $timeout, ProductsFact, ClientFact){
        console.info("sidebar")
        $scope.ClientFact = ClientFact;
        $scope.products = ProductsFact.products;
        $scope.productImages = ProductsFact.productImages;
        $scope.selectedMenu = 'dashboard';
        $scope.collapseVar = 0;
        $scope.multiCollapseVar = 0;
        $scope.activeSideBar = -1;


        $scope.setSelected = function(productIndex, imageIndex){
          ProductsFact.setSelected(productIndex, imageIndex)
        }
        
        $scope.check = function(x){
          $scope.activeSideBar = x;
          if(x==$scope.collapseVar)
            $scope.collapseVar = 0;
          else
            $scope.collapseVar = x;
          // $timeout(function() {
          //    //angular.element('#btn2').triggerHandler('click');
          //     angular.element('#dontremove').triggerHandler('click'); 
          // });
          //$scope.$apply();
        };
        
        $scope.multiCheck = function(y){
          
          if(y==$scope.multiCollapseVar)
            $scope.multiCollapseVar = 0;
          else
            $scope.multiCollapseVar = y;
        };
      }
    }
  }]);
