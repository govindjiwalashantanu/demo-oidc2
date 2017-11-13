var app = angular.module("app", ["ngRoute", "OktaAuthClient", "WidgetConfig"]);

app.config(function ($routeProvider) {
	$routeProvider
	.when("/", {
		templateUrl: "views/dashboard.html",
		controller: "DashboardController"
	})
	.when("/login", {
		templateUrl: "views/login.html",
		controller: "LoginController"
	})
    .when("/register", {
        templateUrl: "views/register.html",
        controller: "RegistrationController"
    })
	.otherwise({redirectTo: "/"});
});

// Set up controllers
app.controller("LoginController", LoginController);
app.controller("RegistrationController", RegistrationController);
app.controller("DashboardController", DashboardController);


// Global variable "widget"
app.value("widget", undefined);
app.run(function(widgetManager, CONFIG){

	// Initialize Widget from configuration file
	widget = widgetManager.initWidget( CONFIG.options );
});

// Directive to launch the widget
app.directive("myWidget",
	function($window, widgetManager) {
		return {
			restrict: "E",
			replace: true,
			link: function(scope, element, attr) {
				var button = element.children()[0];
				angular.element(button).on("click", function() {
					scope.$apply(function() {
						scope.widget = true;
					});
					widgetManager.renderWidget(element.children()[1])
					.then(function(tokens) {
						var widget = widgetManager.getWidget();
						angular.forEach(tokens, function(token) {
							if ("idToken" in token) {
								$window.localStorage["idToken"] = angular.toJson({
									"idToken" : token.idToken,
									"claims" : token.claims
								});
								widget.tokenManager.add("idToken", token);
							}
							if ("accessToken" in token) {
								console.log(token);
								$window.localStorage["accessToken"] = angular.toJson({
									"accessToken" : token.accessToken
								});
								widget.tokenManager.add("accessToken", token);
							}
						});

					}, function(error) {
						console.error(error);
					});
				});
			}
		}
});

//renders registration view
RegistrationController.$inject = ["$window", "$http", "$location", "$scope", "widgetManager", "ORG_URL", "API_KEY"];
function RegistrationController ($window, $http, $location, $scope, widgetManager, ORG_URL, API_KEY){

		$scope.returnToLogin = function(){
			widgetManager.removeWidget();
			$location.path("/login");
		}

		$scope.createUser = function(){
        //alert($scope.fname + $scope.lname + $scope.email + $scope.password);
        var req = {
         method: 'POST',
         url: ORG_URL+'api/v1/users?activate=true',
         headers: {
           'Accept': "application/json",
             'Content-Type' : "application/json",
             'Authorization' : "SSWS "+API_KEY
         },
         data: {
             profile : {
                firstName : $scope.fname,
                 lastName : $scope.lname,
                 email : $scope.email,
                 login : $scope.email
             },
             credentials : {
                    password : {
                     value : $scope.password
                 },
                 recovery_question : {
                     question : "Who's a major player in the cowboy scene?",
                     answer : "test"
                 }
             }
         }
        }

        $http(req).
            then(
                function(res){
                    alert ("User successfully created!");
                    $scope.$apply(function() {
                        $location.path("/login");
                        console.log($location.path());
                    });
                },
                function(res){
                    alert(res);
                }
        );
    }
}

// Renders login view if session does not exist
LoginController.$inject = ["$window", "$location", "$scope", "widgetManager", "$rootScope"];
function LoginController($window, $location, $scope, widgetManager, $rootScope) {
	widgetManager.removeWidget();
	widgetManager.checkSession()
	.then(function(loggedIn) {
		$location.path("/");
    //console.log($location.path());
	});
}

// Renders dashboard view if session exists
DashboardController.$inject = ["$window", "$http", "$location", "$scope", "widgetManager","ORG_URL","API_KEY"];
function DashboardController($window,$http, $location, $scope, widgetManager, ORG_URL, API_KEY) {
	// Get idToken from LocalStorage
	var token = angular.isDefined($window.localStorage["idToken"]) ? JSON.parse($window.localStorage["idToken"]) : undefined;

	var accessToken = angular.isDefined($window.localStorage["accessToken"]) ? JSON.parse($window.localStorage["accessToken"]) : undefined;
	// Redirect if there is no token
	if (angular.isUndefined(token)) {
	    $location.path("/login");
        console.log($location.path());
	}else{
        $scope.session = true;
        $scope.token = token;
        $scope.accessToken = accessToken;



        $scope.listUserApps = function(){
            var req = {
             method: 'GET',
             url: ORG_URL+'api/v1/users/'+$scope.token.claims.sub+'/appLinks',
             headers: {
               'Accept': "application/json",
               'Content-Type' : "application/json",
               'Authorization' : "SSWS "+API_KEY
             }
            }

            $http(req).
                then(
                    function(res){
                        $scope.userApps = res.data;
                    },
                    function(res){
                        alert(res);
                    }
            );
        }

		 $scope.listUserApps();

        //	Clears the localStorage saved in the web browser and scope variables
        function clearStorage() {
            $window.localStorage.clear();
            $scope = $scope.$new(true);
        }

        //	Signout of organization
        $scope.signout = function() {
            widgetManager.logoutWidget()
            .then(function(success) {
                clearStorage();
								widgetManager.removeWidget();
                $location.path("/login");

            }, function(err) {
                // Error
            });
	};
    }


}
