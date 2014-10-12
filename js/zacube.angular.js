
var app = angular.module("ZACubeApp", []);
var url = "http://leonsteenkamp.co.za/collin/zacube.php";

app.controller("ZACubeCtrl", function($scope, $http, $timeout) {

  // Function to get the data
  $scope.getData = function(){
    $http.get(url)
      .success(function(data, status, headers, config) {
        $http.get(url).
          success(function(data, status, headers, config) {
            $scope.zacube = data;
          }).
          error(function(data, status, headers, config) {
            // log error
          });;
    });
  };

  // Function to replicate setInterval using $timeout service.
  $scope.intervalFunction = function(){
    $timeout(function() {
      $scope.getData();
      $scope.intervalFunction();
    }, 2500)
  };

  // Kick off the interval
  $scope.intervalFunction();

});
