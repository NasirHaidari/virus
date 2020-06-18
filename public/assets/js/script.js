

const socket = io();


let currTime = null;
let playerName = "";
let reactionTime = "";
let score = 0;
let timeOfImg = null;



//gives information when player disconnects
const Info = document.querySelector('#info');
const informtion = (data) => {
	Info.innerHTML = "";
	const notification = document.createElement('li');

	notification.classList.add('notification');
	notification.innerHTML = data;

	Info.appendChild(notification);
}


const showAccessDenied = (msg) => {
	alert(msg);
}



//show player
const activePlayers = document.querySelector('#activePlayers');
const showOnlinePlayers = (players) => {
	activePlayers.innerHTML = players.map(player => `<li class="player">${player}</li>`).join("");
	console.log(players);
}



//final message
const finalMsg = document.querySelector('#finalMsg');
const playingField = document.querySelector('#playing-field');
const finalMessage = (player, maxRounds) => {
	finalMsg.innerHTML = `
		<img src="../assets/images/youWin.png">
		<p>Your score was ${player.score}/${maxRounds}</p>
	`
	finalMsg.classList.remove("hide");
	playingField.classList.add("hide");
}




const gameOver = document.querySelector('#game-over');
const showGameOver = (player, maxRounds) => {
	gameOver.innerHTML = `
		<img src="../assets/images/you lose.png">
		<p>You lose with a score of ${player.score}/${maxRounds}</p>
	`
	gameOver.classList.remove("hide");
	playingField.classList.add("hide");
}






//Reacting time
const reactionTimes = document.querySelector('#reaction-times');
const showReactionTime = (players) => {
	reactionTimes.innerHTML = "";
	reactionTimes.innerHTML = players.map(player => `<li>${player.alias}: ${player.reactionTime}</li>`).join("");
}







const roundsPlayed = document.querySelector('#rounds-played');
const showRound = (rounds, maxRounds) => {
	roundsPlayed.innerHTML = "";

	const roundEl = document.createElement('li');
	roundEl.innerHTML = `${rounds}/${maxRounds}`;

	roundsPlayed.appendChild(roundEl);
}





const currentScore = document.querySelector('#current-score');
const showScore = (players) => {
	currentScore.innerHTML = "";
	currentScore.innerHTML = players.map(player => `<li>${player.alias}: ${player.score}</li>`).join("");
}









const handleDisconnect = (playerAlias) => {
	informtion(`${playerAlias} left the game`);
	resetTimer();
}







const virus = document.getElementById('virusPic');
const imgCoordinates = (target) => {
	virus.style.display = "inline";
	virus.style.left = target.x + "px";
	virus.style.top = target.y + "px";
}




const initGame = (imgCords) => {
	informtion("Starting game...");

	setTimeout(() => {
		Info.innerHTML = "";
		virus.classList.remove('hide');
		startRound(imgCords);
	}, 3000);
}





const resetTimer = () => {
	clearInterval(currTime);
	timer.innerHTML = "";
}





//timer
const timer = document.querySelector('#timer');
const showTimer = (timeOfImg) => {
	let mins = 0;
	let secs = 0;
	let cents = 0;

	currTime = setInterval(() => {
		reactionTime = Date.now() - timeOfImg;
		mins = Math.floor((reactionTime / 1000 / 60)),
			secs = Math.floor((reactionTime / 1000));
		cents = Math.floor((reactionTime / 100));

		if (mins < 10) {
			mins = "0" + mins;
		}

		if (secs < 10) {
			secs = "0" + secs;
		}

		if (cents < 10) {
			cents = "0" + cents;
		}

		timer.innerHTML = mins + ":" + secs + ":" + cents;
	}, 10);
}


const startRound = (imgCords) => {
	virus.style.display = "none";

	if (currTime) {
		resetTimer();
	}

	setTimeout(() => {
		imgCoordinates(imgCords.target);
		timeOfImg = Date.now();
		showTimer(timeOfImg);
	}, imgCords.delay);
}







//adding player efter submiting
const playerForm = document.querySelector('#player-form');
playerForm.addEventListener('submit', e => {
	e.preventDefault();

	playerAlias = document.querySelector('#player-alias').value;

	socket.emit('add-player', playerAlias, (status) => {
		if (status.joinGame) {
			document.querySelector('#start').classList.add('hide');
			document.querySelector('#game-view').classList.remove('hide');

			showOnlinePlayers(status.onlinePlayer);
		}

		if (status.firstPlayer) {
			informtion("waitting for second player...");
		}

		if (status.gameOccupied) {
			showAccessDenied("Server is besy at the moment, please try agin leter")
		}
	});
});




virus.addEventListener('click', () => {
	score++;
	reactionTime = reactionTime / 1000 + " seconds";

	const playerData = {
		playerAlias,
		score,
		reactionTime,
	}

	socket.emit('player-click', playerData);
});


socket.on('active-players', (players) => {
	showOnlinePlayers(players);
});

socket.on('finalMsg', ({ winner, maxRounds }) => {
	finalMessage(winner, maxRounds);
	resetTimer();
});

socket.on('game-over', ({ loser, maxRounds }) => {
	showGameOver(loser, maxRounds);
	resetTimer();
});

socket.on('init-game', (imgCords) => {
	initGame(imgCords);
});

socket.on('new-round', (imgCords, gameData) => {
	showScore(gameData.players);
	showReactionTime(gameData.players);
	showRound(gameData.rounds, gameData.maxRounds)
	startRound(imgCords);
});

socket.on('player-disconnected', playerAlias => {
	handleDisconnect(playerAlias);
});

socket.on('reconnect', () => {
	if (playerAlias) {
		socket.emit('add-player', playerAlias, () => {
			console.log("The server acknowledged the reconnection.");
		});
	}
});

socket.on('remaining-players', (players) => {
	showOnlinePlayers(players);
});

socket.on('reset-timer', () => {
	resetTimer();
});





