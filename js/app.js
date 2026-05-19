const BOARD_THEMES = [
	{ id: 'classic', label: 'Classic', light: '#e8e6d9', dark: '#6d8a6b' },
	{ id: 'wood', label: 'Wood', light: '#f0d9b5', dark: '#b58863' },
	{ id: 'blue', label: 'Blue', light: '#e8eef7', dark: '#4a6fa5' },
	{ id: 'marble', label: 'Marble', light: '#f0f0f0', dark: '#999999' },
	{ id: 'purple', label: 'Purple', light: '#e8dff5', dark: '#7b5ea7' },
	{ id: 'coral', label: 'Coral', light: '#ffe8dc', dark: '#e07a5f' },
	{ id: 'ice', label: 'Ice', light: '#e8f4fc', dark: '#5b9bd5' },
	{ id: 'forest', label: 'Forest', light: '#d4e4c8', dark: '#4a7c3f' },
	{ id: 'slate', label: 'Slate', light: '#c4cdd8', dark: '#4a5568' },
];

class ChessTimer {
	constructor(minutesPerSide, onTimeout) {
		this.minutesPerSide = minutesPerSide;
		this.onTimeout = onTimeout;
		this.whiteMs = minutesPerSide * 60 * 1000;
		this.blackMs = minutesPerSide * 60 * 1000;
		this.activeColor = null;
		this.intervalId = null;
		this.running = false;
	}

	formatTime(ms) {
		const totalSec = Math.max(0, Math.ceil(ms / 1000));
		const min = Math.floor(totalSec / 60);
		const sec = totalSec % 60;
		return `${min}:${sec.toString().padStart(2, '0')}`;
	}

	updateDisplay() {
		const whiteEl = document.getElementById('white-clock');
		const blackEl = document.getElementById('black-clock');
		if (whiteEl) whiteEl.textContent = this.formatTime(this.whiteMs);
		if (blackEl) blackEl.textContent = this.formatTime(this.blackMs);

		document.getElementById('white-timer')?.classList.toggle('active', this.activeColor === 'white');
		document.getElementById('black-timer')?.classList.toggle('active', this.activeColor === 'black');
	}

	reset(minutesPerSide) {
		this.stop();
		this.minutesPerSide = minutesPerSide;
		this.whiteMs = minutesPerSide * 60 * 1000;
		this.blackMs = minutesPerSide * 60 * 1000;
		this.activeColor = null;
		this.updateDisplay();
	}

	startTurn(color) {
		if (!this.running) return;
		this.activeColor = color;
		this.updateDisplay();
	}

	start() {
		this.running = true;
		this.tick();
	}

	stop() {
		this.running = false;
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.activeColor = null;
		document.getElementById('white-timer')?.classList.remove('active');
		document.getElementById('black-timer')?.classList.remove('active');
	}

	tick() {
		if (this.intervalId) clearInterval(this.intervalId);
		this.intervalId = setInterval(() => {
			if (!this.running || !this.activeColor) return;

			if (this.activeColor === 'white') {
				this.whiteMs -= 100;
				if (this.whiteMs <= 0) {
					this.whiteMs = 0;
					this.updateDisplay();
					this.stop();
					this.onTimeout('white');
					return;
				}
			} else {
				this.blackMs -= 100;
				if (this.blackMs <= 0) {
					this.blackMs = 0;
					this.updateDisplay();
					this.stop();
					this.onTimeout('black');
					return;
				}
			}
			this.updateDisplay();
		}, 100);
	}
}

const chessApp = {
	timer: null,
	matchOptions: null,
	boardSession: null,

	init() {
		this.boardSession = initBoardSession();
		this.buildThemeOptions('menu-theme-options', 'menu');
		this.initBoardTheme();
		this.bindMenu();
		this.showMenu();
	},

	bindMenu() {
		document.querySelectorAll('input[name="oponent"]').forEach((input) => {
			input.addEventListener('change', () => this.updateColorSelectVisibility());
		});
		document.getElementById('btn-new-game').addEventListener('click', () => this.launchGame());
		document.getElementById('btn-quit').addEventListener('click', () => this.quitGame());
		document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
		document.getElementById('btn-resign').addEventListener('click', () => this.resign());
		document.getElementById('btn-end-play-again').addEventListener('click', () => this.restartGame());
		document.getElementById('btn-end-menu').addEventListener('click', () => this.quitGame());
		this.updateColorSelectVisibility();
	},

	updateColorSelectVisibility() {
		const playAgainst = document.querySelector('input[name="oponent"]:checked')?.value;
		const colorBlock = document.getElementById('color-select-block');
		if (colorBlock) {
			colorBlock.classList.toggle('hidden', playAgainst !== 'ai');
		}
	},

	getMatchOptions() {
		const playAgainst = document.querySelector('input[name="oponent"]:checked').value;
		const humanColor = document.querySelector('input[name="human_color"]:checked')?.value || 'white';
		const timerMinutes = parseInt(document.querySelector('input[name="timer"]:checked').value, 10);
		return {
			playAgainst,
			humanColor,
			aiColor: humanColor === 'white' ? 'black' : 'white',
			aiLevel: 'dumb',
			timerMinutes,
		};
	},

	showMenu() {
		document.getElementById('menu-page').classList.add('active');
		document.getElementById('game-page').classList.remove('active');
		document.getElementById('endscene').classList.remove('show');
		this.timer?.stop();
		document.body.classList.remove('in-game');
	},

	showGame() {
		document.getElementById('menu-page').classList.remove('active');
		document.getElementById('game-page').classList.add('active');
		document.body.classList.add('in-game');
	},

	launchGame() {
		this.matchOptions = this.getMatchOptions();
		this.timer = new ChessTimer(this.matchOptions.timerMinutes, (loser) => {
			const winner = loser === 'white' ? 'black' : 'white';
			const name = winner.charAt(0).toUpperCase() + winner.slice(1);
			this.boardSession.endGame(name + ' wins (time)', winner);
		});
		this.timer.reset(this.matchOptions.timerMinutes);
		this.showGame();
		this.boardSession.startMatch(this.matchOptions);
		this.timer.start();
		this.timer.startTurn('white');
	},

	restartGame() {
		if (!this.matchOptions) return;
		document.getElementById('endscene').classList.remove('show');
		this.timer.reset(this.matchOptions.timerMinutes);
		this.boardSession.startMatch(this.matchOptions);
		this.timer.start();
		this.timer.startTurn('white');
	},

	quitGame() {
		this.timer?.stop();
		this.boardSession?.stopMatch();
		document.getElementById('endscene').classList.remove('show');
		this.showMenu();
	},

	resign() {
		if (!this.matchOptions || this.boardSession.isEnded()) return;
		if (!confirm('Resign this game? Your opponent will win.')) return;

		let loser;
		if (this.matchOptions.playAgainst === 'ai') {
			loser = this.matchOptions.humanColor;
		} else {
			loser = this.boardSession.getGame().turn;
		}
		const winner = loser === 'white' ? 'black' : 'white';
		const name = winner.charAt(0).toUpperCase() + winner.slice(1);
		this.boardSession.endGame(name + ' wins (resignation)', winner);
	},

	onTurnChange(turn) {
		this.timer?.startTurn(turn);
	},

	onMatchEnd() {
		this.timer?.stop();
	},

	buildThemeOptions(containerId, idPrefix) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = '';
		BOARD_THEMES.forEach((theme) => {
			const inputId = `${idPrefix}-theme-${theme.id}`;
			const input = document.createElement('input');
			input.type = 'radio';
			input.name = 'board_theme';
			input.id = inputId;
			input.value = theme.id;
			input.addEventListener('change', () => this.setBoardTheme(theme.id));

			const label = document.createElement('label');
			label.htmlFor = inputId;
			label.className = 'theme-swatch';
			label.title = theme.label;
			label.innerHTML = `
				<span class="checker">
					<span style="background:${theme.light}"></span>
					<span style="background:${theme.dark}"></span>
					<span style="background:${theme.dark}"></span>
					<span style="background:${theme.light}"></span>
				</span>
				${theme.label}
			`;

			container.appendChild(input);
			container.appendChild(label);
		});
	},

	setBoardTheme(themeId) {
		document.body.dataset.boardTheme = themeId;
		localStorage.setItem('boardTheme', themeId);
		document.querySelectorAll('input[name="board_theme"]').forEach((radio) => {
			radio.checked = radio.value === themeId;
		});
	},

	initBoardTheme() {
		const saved = localStorage.getItem('boardTheme') || 'classic';
		if (BOARD_THEMES.some((t) => t.id === saved)) {
			this.setBoardTheme(saved);
		}
	},
};

document.addEventListener('DOMContentLoaded', () => chessApp.init());
