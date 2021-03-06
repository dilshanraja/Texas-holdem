'use strict';

pokerApp.controller('HomeCtrl', [
	'$scope',
	'$rootScope',
	'$filter',
	'$uibModal',
	'$state',
	'apiServices',
	'Pusher',

	function ($scope, $rootScope, $filter, $uibModal, $state, apiServices, Pusher) {
		$scope.rooms = [];
		$scope.error = "";
		$scope.room_selected ="";
		$scope.buy_in = $scope.user.balance / 4;

		loadRooms();
		
		$scope.open = function (size) {
			var modalInstance = $uibModal.open({
				templateUrl: 'modals/CreateGameRoom.html',
				controller: 'ModalInstanceCtrl',
				size: size,
				resolve: {
					items: function () {
						return $scope.items;
					}
				}
			});

			modalInstance.result.then(function (gameRoom) {
				$scope.createRoom(gameRoom)
			}, function () {
				$log.info('Modal dismissed at: ' + new Date());
			});
		};

		$scope.createRoom = function (gameroom) {
			apiServices.GameService.Create({
				name: gameroom.name,
				min_bet: gameroom.min_bet
			});
		};
		
		$scope.openBuyInDialogue = function(user_in, room_id){
		  $scope.room_selected = room_id;

		  if (user_in){
		    $scope.joinGameRoom();
		  }
		  else {
		    $("#buy_in_dialogue").fadeIn();
		  }
		};
		
		$scope.closeBuyInDialogue = function(){
		  $("#buy_in_dialogue").fadeOut();
		  $scope.error = "";
		};
		
		$scope.joinGameRoom = function(){
		  if ($scope.buy_in > 0 && $scope.buy_in <= $scope.user.balance){
		    $scope.closeBuyInDialogue();
		    window.location.href = "#/gameroom/"+ $scope.room_selected +"?bIn="+$scope.buy_in;
		  }
		  else if ($scope.buy_in > $scope.user.balance) {
		    $scope.error = "Buy in exceeds account balance!";
		  }
		  else {
		    $scope.error = "Invalid buy in amount!";
		  }
		};

		//--Pusher Subscriptions--
		Pusher.subscribe('gamerooms', 'new', function (gameroom) {
			gameroom.players = [];
			$scope.rooms.push(gameroom);
		});

		Pusher.subscribe('gamerooms', 'closed', function (gid) {
			var i = $scope.rooms.map(function (r) {
				return r._id;
			}).indexOf(gid);

			if(i > -1){
				$scope.rooms.splice(i, 1);
			}
		});

		Pusher.subscribe('gamerooms', 'players', function (players) {
			updatePlayers(players);
		});

		Pusher.subscribe('gamerooms', 'states', function (newstate) {
			updateState(newstate);
		});

		//--Private funcs--
		function loadRooms() {
			apiServices.GameService.GetRooms().success(function (data) {
				angular.copy(data.rooms, $scope.rooms);

				updatePlayers(data.players);
			});
		}

		function updatePlayers(players){
			angular.forEach(players, function(p){
				var room = $scope.rooms.filter(function (r) {
					return r._id == p.gid;
				});

				room[0].players = p.list;

				var user = p.list.filter(function (p){
					return p.owner._id == $rootScope.user._id;
				});

				if (!$filter('isEmpty')(user)){
					room[0].user_in = true;
				}
			});
		}

		function updateState(state){
			var room = $scope.rooms.filter(function (r) {
				return r._id == state.gid;
			});

			room[0].active = state.active;
		}

	}]);

pokerApp.controller('ModalInstanceCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
	$scope.gameroom = {};

	$scope.ok = function () {
		$modalInstance.close($scope.gameroom);
	};

	$scope.dismiss = function () {
		$modalInstance.dismiss('cancel');
	};
}]);