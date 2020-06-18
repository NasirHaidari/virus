

const debug = require('debug')('kill-the-virus:socket_controller');

let io = null;



let rounds = 0;
const maxRounds = 10;
const players = [];
let player = {};



function randomCordination() {
	return {
		target: {
			x: RandomNr(400),
			y: RandomNr(400)
		},


		delay: RandomNr(3000),
	};
}





//Winer & Loser
function winerOrLoser() {

	const winner = players.reduce((max, player) => max.score > player.score ? max : player);
	const loser = players.reduce((min, player) => min.score < player.score ? min : player);

	io.to(winner.playerId).emit('finalMsg', { winner, maxRounds });
	io.to(loser.playerId).emit('game-over', { loser, maxRounds });
}





// Get the player 
function getPlayerById(id) {
	return players.find(player => player.playerId === id);
}



//names of Online players 
function getPlayerNames() {
	return players.map(player => player.nickname);
}

//getting a random number 
function RandomNr(range) {
	return Math.floor(Math.random() * range)
};

//when a player clicks
function handleClick(playerData) {
	rounds++;

	io.emit('reset-timer');

	const playerIndex = players.findIndex((player => player.playerId === this.id));
	players[playerIndex].nickname = playerData.nickname;
	players[playerIndex].score = playerData.score;
	players[playerIndex].reactionTime = playerData.reactionTime;

	const imgCords = randomCordination();

	const gameData = {
		players,
		rounds,
		maxRounds,
	}

	if (rounds < maxRounds) {
		io.emit('new-round', imgCords, gameData);
	} else if (rounds === maxRounds) {
		winerOrLoser();
		rounds = 0;
	}
}

//new player joining 
function handleNewPlayer(nickname, callback) {
	const activePlayers = getPlayerNames();

	const imgCords = randomCordination();

	player = {
		playerId: this.id,
		alias: nickname,
		score: 0,
		reactionTime: "",
	}

	if (activePlayers.length === 0) {
		players.push(player)

		callback({
			joinGame: true,
			activePlayers: getPlayerNames(),
			firstPlayer: true,
		});

	} else if (activePlayers.length === 1) {
		players.push(player)

		callback({
			joinGame: true,
			activePlayers: getPlayerNames(),
		});

		// Emit online players and event to start new game
		io.emit('active-players', getPlayerNames());
		io.emit('init-game', imgCords);
	}

	else {
		callback({
			gameOccupied: true,
		})
	}
}


function handlePlayerDisconnect() {

	const player = getPlayerById(this.id);

	this.broadcast.emit('player-disconnected', player.nickname)

	for (let i = 0; i < players.length; i++) {
		if (players[i].playerId === this.id) {
			players.splice(i, 1);
			break;
		}
	}

	io.emit('remaining-players', getPlayerNames());
}




module.exports = function (socket) {
	debug(`Client ${socket.id} connected!`);

	io = this;

	socket.on('disconnect', handlePlayerDisconnect);
	socket.on('player-click', handleClick);
	socket.on('add-player', handleNewPlayer);
}

