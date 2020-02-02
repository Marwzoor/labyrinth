function Vector(x, y) {
	this.x = x;
	this.y = y;

	this.getX = function () {
		return this.x;
	};

	this.getY = function () {
		return this.y;
	};
}

function QAgent(alpha, gamma, rewards, locationToState, stateToLocation, Q) {
	this.alpha = alpha;
	this.gamma = gamma;
	this.rewards = rewards;
	this.currentRewards = rewards;
	this.locationToState = locationToState;
	this.stateToLocation = stateToLocation;
	this.Q = Q;
	this.currentState = null;
	this.endingState = null;

	this.setupEnvironment = function (startLocation, endLocation) {
		this.currentState = this.locationToState[startLocation.getX() + ',' + startLocation.getY()];

		// Copy rewards
		this.currentRewards = this.rewards.concat();

		this.endingState = this.locationToState[endLocation.getX() + ',' + endLocation.getY()];

		// Mark end location
		this.currentRewards[this.endingState][this.endingState] = 999;

		this.train(1000);
	};

	this.train = function (iterations) {
		for (var i=0;i<iterations;++i) {
			var currentState = Math.round(Math.random() * (this.currentRewards.length - 1));
			var playableActions = [];

			for (var j=0;j<this.currentRewards[currentState].length;++j) {
				if (this.currentRewards[currentState][j] > 0) {
					playableActions.push(j);
				}
			}

			var nextState = playableActions[Math.round(Math.random() * (playableActions.length - 1))];

			var TD = this.currentRewards[currentState][nextState] + this.gamma * Math.max.apply(null, this.Q[nextState])
				- this.Q[currentState][nextState];

			this.Q[currentState][nextState] += this.alpha * TD;
		}
	};

	this.trainAtState = function (state) {
		var playableActions = [];

		for (var j=0;j<this.currentRewards[state].length;++j) {
			if (this.currentRewards[state][j] > 0) {
				playableActions.push(j);
			}
		}

		var nextState = playableActions[Math.round(Math.random() * (playableActions.length - 1))];

		var TD = this.currentRewards[state][nextState] + this.gamma * Math.max.apply(null, this.Q[nextState])
			- this.Q[state][nextState];

		this.Q[state][nextState] += this.alpha * TD;
	};

	this.nextStep = function () {
		var bestAction = 0;
		var bestActionValue = 0;

		var availableActions = this.Q[this.currentState];

		for (var i=0;i<availableActions.length;++i) {
			if (availableActions[i] > bestActionValue) {
				bestAction = i;
				bestActionValue = availableActions[i];
			}
		}
		
		this.currentState = bestAction;

		if (bestActionValue <= 0) {
			this.trainAtState(this.currentState);
		}
	};

	this.goToLocation = function (loc) {
		this.currentState = this.locationToState[loc.getX() + ',' + loc.getY()];
	};

	this.getLocation = function () {
		return this.stateToLocation[this.currentState];
	};

	this.getCurrentState = function () {
		return this.currentState;
	};
}

// Parameters
var gamma = 0.75;
var alpha = 0.9;

var locationToState = {};
var stateToLocation = {};

var rewards = [];
var Q = [];

var arenaXSize = 20;
var arenaYSize = 20;
var states = arenaXSize * arenaYSize;

// Create maze
var obstacles = [];

var init = function () {
	// for (var i=0;i<500;++i) {
	// 	obstacles.push(new Vector(Math.round(Math.random() * 49), Math.round(Math.random() * 49)));
	// }

	var obstacleAtLocation = function (loc) {
		for (var i=0;i<obstacles.length;++i) {
			if (loc.getX() === obstacles[i].getX() && loc.getY() === obstacles[i].getY()) {
				return true;
			}
		}

		return false;
	};

	var state = 0;

	for (var x1=0;x1<arenaXSize;++x1) {
		for (var y1=0;y1<arenaYSize;++y1) {
			locationToState[x1 + ',' + y1] = state;
			stateToLocation[state] = new Vector(x1, y1);

			var actions = [];
			var qValues = [];

			// Actions for this state
			for (var x2=0;x2<arenaXSize;++x2) {
				for (var y2=0;y2<arenaYSize;++y2) {
					var xDiff = x1 - x2;
					var yDiff = y1 - y2;

					// Left, Up, Right or Left
					if ((((xDiff === -1 || xDiff === 1) && yDiff === 0) ||
						((yDiff === -1 || yDiff === 1) && xDiff === 0)) &&
						!obstacleAtLocation(new Vector(x2, y2))) {
						actions.push(1);
					} else {
						actions.push(0);
					}

					qValues.push(0);
				}
			}

			rewards.push(actions);
			Q.push(qValues);

			++state;
		}
	}

	var startLocation = new Vector(0, 0);
	var endLocation = new Vector(19, 19);

	var agent = new QAgent(alpha, gamma, rewards, locationToState, stateToLocation, Q);
	agent.setupEnvironment(startLocation, endLocation);
	agent.train(100);

	var viewportEl = document.getElementById('viewport');
	var viewport = viewportEl.getContext('2d');

	viewportEl.width = 400;
	viewportEl.height = 400;
	viewportEl.style.width = '200px';
	viewportEl.style.height = '200px';

	var nextMove = function () {
		viewport.clearRect(0, 0, 400, 400);

		viewport.fillStyle = 'green';
		viewport.fillRect(startLocation.getX() * 20, startLocation.getY() * 20, 20, 20);

		viewport.fillStyle = 'red';
		viewport.fillRect(endLocation.getX() * 20, endLocation.getY() * 20, 20, 20);

		for (var i=0;i<obstacles.length;++i) {
			viewport.fillStyle = 'purple';
			viewport.fillRect(obstacles[i].getX() * 20, obstacles[i].getY() * 20, 20, 20);
		}

		viewport.fillStyle = '#1ab7e6';
		viewport.fillRect(agent.getLocation().getX() * 20, agent.getLocation().getY() * 20, 20, 20);

		agent.nextStep();

		if (agent.getLocation().getX() === endLocation.getX() && agent.getLocation().getY() === endLocation.getY()) {
			agent.goToLocation(startLocation);
		}

		agent.train(1000);

		setTimeout(nextMove, 60);
	};

	nextMove();
};

var xhttp = new XMLHttpRequest();

xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
	   var rows = xhttp.responseText.split('\n');
	   
	   for (var y=0;y<rows.length;++y) {
		   var row = rows[y].split('');
		   
		   for (var x=0;x<row.length;++x) {
			   if (row[x] === '0') {
				   obstacles.push(new Vector(x, y));
			   }
		   }
	   }

	   init();
    }
};

xhttp.open('GET', 'obstacles.txt', true);
xhttp.send();