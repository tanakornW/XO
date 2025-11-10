const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const resetButton = document.getElementById('reset-button');
const refreshScoreboardButton = document.getElementById('refresh-scoreboard');
const viewTopButton = document.getElementById('view-top-button');
const scoreboardDetailsButton = document.getElementById('scoreboard-details-button');

const userInfo = document.getElementById('user-info');
const statusSection = document.getElementById('status-section');
const statusMessage = document.getElementById('status-message');
const scoreDisplay = document.getElementById('score-display');
const streakDisplay = document.getElementById('streak-display');
const rankDisplay = document.getElementById('rank-display');
const nicknameDisplay = document.getElementById('nickname-display');
const winsDisplay = document.getElementById('wins-display');
const lossesDisplay = document.getElementById('losses-display');
const drawsDisplay = document.getElementById('draws-display');
const winRateDisplay = document.getElementById('winrate-display');
const nicknameInput = document.getElementById('nickname-input');
const nicknameSaveButton = document.getElementById('nickname-save-button');
const nicknameFeedback = document.getElementById('nickname-feedback');
const gameSection = document.getElementById('game-section');
const scoreboardSection = document.getElementById('scoreboard-section');
const scoreboardNote = document.getElementById('scoreboard-note');
const scoreboardBody = document.getElementById('scoreboard-body');
const boardElement = document.getElementById('board');

const cellTemplate = document.getElementById('cell-template');

const winningPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const gameState = {
  board: Array(9).fill(null),
  playerSymbol: 'X',
  botSymbol: 'O',
  playerTurn: true,
  finished: false,
  user: null,
  authenticated: false,
  nickname: 'player00001',
  scoreboardView: 'top',
  botTimeoutId: null,
  stats: {
    score: 0,
    streak: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    rank: 'Rookie',
    nickname: 'player00001',
  },
};

async function fetchUser() {
  try {
    const response = await fetch('/api/user');
    if (!response.ok) {
      throw new Error('Not authenticated');
    }
    const data = await response.json();
    gameState.user = data.user;
    gameState.authenticated = true;
    if (data.nickname) {
      gameState.nickname = data.nickname;
    } else if (data.user?.nickname) {
      gameState.nickname = data.user.nickname;
    }
    updateUserInfo(data.user);
    updateScoreDisplays(data);
    toggleAuthState(true);
    updateSettingsState();
    return true;
  } catch (error) {
    gameState.user = null;
    gameState.authenticated = false;
    gameState.nickname = 'player00001';
    toggleAuthState(false);
    updateSettingsState();
    console.warn(error.message);
    return false;
  }
}

function updateUserInfo(user) {
  if (!user) {
    userInfo.innerHTML = '';
    userInfo.append(loginButton);
    return;
  }

  const container = document.createElement('div');
  container.classList.add('user-details');

  if (user.photo) {
    const avatar = document.createElement('img');
    avatar.src = user.photo;
    avatar.alt = user.name;
    container.append(avatar);
  }

  const nameSpan = document.createElement('span');
  nameSpan.textContent = user.name ?? user.email;
  container.append(nameSpan);

  userInfo.innerHTML = '';
  userInfo.append(container);
}

function toggleAuthState(isAuthenticated) {
  gameState.authenticated = isAuthenticated;
  if (!isAuthenticated) {
    gameState.scoreboardView = 'top';
  }
  statusSection.classList.toggle('hidden', !isAuthenticated);
  gameSection.classList.toggle('hidden', !isAuthenticated);

  if (isAuthenticated) {
    userInfo.classList.remove('hidden');
    if (!userInfo.contains(logoutButton)) {
      userInfo.append(logoutButton);
    }
  } else {
    userInfo.classList.remove('hidden');
    if (!userInfo.contains(loginButton)) {
      userInfo.append(loginButton);
    }
  }

  updateScoreboardToggleState();
  updateSettingsState();
}

function updateScoreboardToggleState() {
  if (gameState.scoreboardView !== 'top') {
    gameState.scoreboardView = 'top';
  }
}

function updateSettingsState() {
  if (!nicknameInput || !nicknameSaveButton || !nicknameFeedback) {
    return;
  }

  nicknameFeedback.classList.remove('success', 'error');

  if (!gameState.authenticated) {
    nicknameInput.value = '';
    nicknameInput.placeholder = 'player00001';
    nicknameInput.disabled = true;
    nicknameSaveButton.disabled = true;
    nicknameFeedback.textContent = 'Sign in with Google to customise your nickname.';
  } else {
    nicknameInput.disabled = false;
    nicknameSaveButton.disabled = false;
    if (gameState.nickname && document.activeElement !== nicknameInput) {
      nicknameInput.value = gameState.nickname;
    }
    nicknameInput.placeholder = gameState.nickname || 'player00001';
    nicknameFeedback.textContent = '';
  }
}

function formatWinRate(winRate) {
  const percentage = Number.isFinite(winRate) ? winRate * 100 : 0;
  return `${Math.round(percentage * 10) / 10}%`;
}

function updateScoreDisplays({
  score = gameState.stats?.score ?? 0,
  streak = gameState.stats?.streak ?? 0,
  wins = gameState.stats?.wins ?? 0,
  losses = gameState.stats?.losses ?? 0,
  draws = gameState.stats?.draws ?? 0,
  winRate = gameState.stats?.winRate ?? 0,
  rank = gameState.stats?.rank ?? 'Rookie',
  nickname = gameState.nickname ?? '',
} = {}) {
  const resolvedScore = Number.isFinite(score) ? score : 0;
  const resolvedStreak = Number.isFinite(streak) ? streak : 0;
  const resolvedWins = Number.isFinite(wins) ? wins : 0;
  const resolvedLosses = Number.isFinite(losses) ? losses : 0;
  const resolvedDraws = Number.isFinite(draws) ? draws : 0;
  const resolvedWinRate = Number.isFinite(winRate) ? winRate : 0;
  const resolvedRank = rank ?? 'Rookie';
  const resolvedNickname =
    nickname && nickname.trim().length > 0
      ? nickname.trim()
      : gameState.nickname && gameState.nickname.trim().length > 0
        ? gameState.nickname.trim()
        : 'player00001';

  gameState.stats = {
    score: resolvedScore,
    streak: resolvedStreak,
    wins: resolvedWins,
    losses: resolvedLosses,
    draws: resolvedDraws,
    winRate: resolvedWinRate,
    rank: resolvedRank,
    nickname: resolvedNickname,
  };
  gameState.nickname = resolvedNickname;

  scoreDisplay.textContent = `Score: ${resolvedScore}`;
  streakDisplay.textContent = `Streak: ${resolvedStreak}`;
  rankDisplay.textContent = `Rank: ${resolvedRank}`;
  winsDisplay.textContent = `Wins: ${resolvedWins}`;
  lossesDisplay.textContent = `Losses: ${resolvedLosses}`;
  drawsDisplay.textContent = `Draws: ${resolvedDraws}`;
  winRateDisplay.textContent = `Win Rate: ${formatWinRate(resolvedWinRate)}`;
  if (nicknameDisplay) {
    nicknameDisplay.textContent = `Nickname: ${resolvedNickname}`;
  }

  if (
    nicknameInput &&
    document.activeElement !== nicknameInput &&
    nicknameInput.value !== resolvedNickname
  ) {
    nicknameInput.value = resolvedNickname;
  }
}

function renderBoard() {
  boardElement.innerHTML = '';
  gameState.board.forEach((value, index) => {
    const cell = cellTemplate.content.firstElementChild.cloneNode(true);
    cell.dataset.index = String(index);
    cell.textContent = value ?? '';
    cell.disabled = Boolean(value) || gameState.finished || !gameState.playerTurn || !gameState.user;
    cell.addEventListener('click', onCellClick, { once: true });
    boardElement.append(cell);
  });
}

function onCellClick(event) {
  if (gameState.finished || !gameState.playerTurn) {
    return;
  }

  const index = Number(event.currentTarget.dataset.index);
  if (Number.isNaN(index) || gameState.board[index]) {
    return;
  }

  makeMove(index, gameState.playerSymbol);
  const outcome = evaluateBoard();
  if (outcome) {
    concludeGame(outcome);
    return;
  }

  gameState.playerTurn = false;
  renderBoard();
  if (gameState.botTimeoutId) {
    clearTimeout(gameState.botTimeoutId);
    gameState.botTimeoutId = null;
  }
  gameState.botTimeoutId = window.setTimeout(() => {
    gameState.botTimeoutId = null;
    botMove();
  }, 450);
}

function makeMove(index, symbol) {
  gameState.board[index] = symbol;
  renderBoard();
}

function evaluateBoard() {
  const { board, playerSymbol, botSymbol } = gameState;

  for (const pattern of winningPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === playerSymbol ? 'player' : 'bot';
    }
  }

  if (board.every((cell) => cell !== null)) {
    return 'draw';
  }

  return null;
}

function getAvailableMoves(board) {
  return board
    .map((value, index) => (value === null ? index : null))
    .filter((value) => value !== null);
}

function findCriticalMove(board, symbol) {
  for (const pattern of winningPatterns) {
    const [a, b, c] = pattern;
    const values = [board[a], board[b], board[c]];
    const filledCount = values.filter((value) => value === symbol).length;
    const emptyIndex = pattern.find((index) => board[index] === null);
    if (filledCount === 2 && emptyIndex !== undefined) {
      return emptyIndex;
    }
  }
  return null;
}

function chooseBotMove() {
  const { board, botSymbol, playerSymbol } = gameState;
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) {
    return null;
  }

  const winningMove = findCriticalMove(board, botSymbol);
  if (winningMove !== null) {
    return winningMove;
  }

  const blockingMove = findCriticalMove(board, playerSymbol);
  if (blockingMove !== null) {
    return blockingMove;
  }

  const center = 4;
  if (board[center] === null) {
    return center;
  }

  const corners = availableMoves.filter((index) => [0, 2, 6, 8].includes(index));
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function botMove() {
  if (gameState.botTimeoutId) {
    clearTimeout(gameState.botTimeoutId);
    gameState.botTimeoutId = null;
  }
  const move = chooseBotMove();
  if (move === null) {
    return;
  }
  makeMove(move, gameState.botSymbol);
  const outcome = evaluateBoard();
  if (outcome) {
    concludeGame(outcome);
  } else {
    gameState.playerTurn = true;
    renderBoard();
    statusMessage.textContent = 'Your move!';
  }
}

async function concludeGame(result) {
  if (gameState.botTimeoutId) {
    clearTimeout(gameState.botTimeoutId);
    gameState.botTimeoutId = null;
  }
  gameState.finished = true;
  renderBoard();
  let outcomeText = '';
  let payloadResult = 'draw';

  if (result === 'player') {
    outcomeText = 'You win! 🎉';
    payloadResult = 'win';
  } else if (result === 'bot') {
    outcomeText = 'Bot wins! Try again.';
    payloadResult = 'loss';
  } else {
    outcomeText = "It's a draw.";
    payloadResult = 'draw';
  }

  statusMessage.textContent = `${outcomeText} Sending result...`;

  try {
    const response = await fetch('/api/game/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: payloadResult }),
    });
    if (!response.ok) {
      throw new Error('Failed to record result');
    }
    const data = await response.json();
    updateScoreDisplays({ ...data, nickname: gameState.nickname });

    if (data.bonusAwarded) {
      statusMessage.textContent = `${outcomeText} Bonus streak awarded!`;
    } else {
      statusMessage.textContent = outcomeText;
    }
    await refreshScoreboard();
  } catch (error) {
    statusMessage.textContent = `${outcomeText} (Score update failed)`;
    console.error(error);
  }
}

function resetGameState({ forceFirst = null } = {}) {
  if (gameState.botTimeoutId) {
    clearTimeout(gameState.botTimeoutId);
    gameState.botTimeoutId = null;
  }
  gameState.board = Array(9).fill(null);
  gameState.finished = false;
  if (forceFirst === 'player') {
    gameState.playerTurn = true;
  } else if (forceFirst === 'bot') {
    gameState.playerTurn = false;
  } else {
    gameState.playerTurn = Math.random() < 0.5;
  }
  if (gameState.playerTurn) {
    statusMessage.textContent = 'Your move!';
  } else {
    statusMessage.textContent = 'Bot goes first...';
  }
  renderBoard();
  if (!gameState.playerTurn) {
    gameState.botTimeoutId = window.setTimeout(() => {
      gameState.botTimeoutId = null;
      if (!gameState.playerTurn && !gameState.finished) {
        botMove();
      }
    }, 500);
  }
}

async function refreshScoreboard() {
  try {
    const response = await fetch('/api/scores/summary');
    if (!response.ok) {
      throw new Error('Unable to load scoreboard');
    }
    const summary = await response.json();
    const currentUserId = gameState.user?.id;
    const topArray = Array.isArray(summary.top) ? summary.top : [];
    const rows = [...topArray];

    if (
      summary.player &&
      summary.player.id &&
      !rows.some((entry) => entry.id === summary.player.id)
    ) {
      rows.push(summary.player);
    }

    if (scoreboardNote) {
      if (
        summary.player &&
        summary.player.id &&
        rows.length > topArray.length &&
        rows[rows.length - 1].id === summary.player.id &&
        !topArray.some((entry) => entry.id === summary.player.id)
      ) {
        scoreboardNote.textContent = 'Top 5 nicknames plus your position';
      } else {
        scoreboardNote.textContent = 'Top 5 nicknames (sign in to customise yours)';
      }
    }

    scoreboardBody.innerHTML = '';
    rows.forEach((entry, index) => {
      const row = document.createElement('tr');
      if (entry.id === currentUserId) {
        row.classList.add('current-user');
      }
      const winRatePercentage = formatWinRate(entry.winRate);
      const rankFromTop = topArray.findIndex((item) => item.id === entry.id);
      const displayRank =
        entry.rank && Number.isFinite(entry.rank)
          ? entry.rank
          : rankFromTop >= 0
            ? rankFromTop + 1
            : index + 1;
      const cells = [
        displayRank,
        entry.nickname || entry.name || 'player',
        winRatePercentage,
        entry.score,
      ];
      cells.forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      scoreboardBody.append(row);
    });
  } catch (error) {
    console.error(error);
  }
}

async function handleNicknameSave() {
  if (!nicknameInput || !nicknameSaveButton || !nicknameFeedback) {
    return;
  }

  if (!gameState.authenticated) {
    nicknameFeedback.textContent = 'Sign in with Google to customise your nickname.';
    nicknameFeedback.classList.remove('success');
    nicknameFeedback.classList.add('error');
    statusMessage.textContent = 'Please sign in to customise your nickname.';
    return;
  }

  const desiredNickname = nicknameInput.value.trim();
  if (desiredNickname.length < 3 || desiredNickname.length > 24) {
    nicknameFeedback.textContent = 'Nickname must be 3-24 characters long.';
    nicknameFeedback.classList.remove('success');
    nicknameFeedback.classList.add('error');
    return;
  }

  if (!/^[a-zA-Z0-9 _-]+$/.test(desiredNickname)) {
    nicknameFeedback.textContent = 'Use only letters, numbers, spaces, hyphen, or underscore.';
    nicknameFeedback.classList.remove('success');
    nicknameFeedback.classList.add('error');
    return;
  }

  nicknameFeedback.textContent = 'Saving...';
  nicknameFeedback.classList.remove('success', 'error');
  nicknameSaveButton.disabled = true;
  nicknameInput.disabled = true;

  try {
    const response = await fetch('/api/user/nickname', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: desiredNickname }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message = errorPayload.error || 'Failed to update nickname.';
      throw new Error(message);
    }

    const payload = await response.json();
    const savedNickname = payload.nickname || desiredNickname;
    gameState.nickname = savedNickname;
    nicknameFeedback.textContent = 'Nickname updated!';
    nicknameFeedback.classList.remove('error');
    nicknameFeedback.classList.add('success');
    updateScoreDisplays({ nickname: savedNickname });
    await refreshScoreboard();
  } catch (error) {
    nicknameFeedback.textContent = error.message || 'Failed to update nickname.';
    nicknameFeedback.classList.remove('success');
    nicknameFeedback.classList.add('error');
  } finally {
    if (gameState.authenticated) {
      nicknameInput.disabled = false;
      nicknameSaveButton.disabled = false;
    }
    updateSettingsState();
  }
}

loginButton?.addEventListener('click', () => {
  window.location.href = '/auth/google';
});

logoutButton?.addEventListener('click', async () => {
  try {
    const response = await fetch('/auth/logout', { method: 'POST' });
    if (!response.ok) {
      throw new Error('Failed to log out');
    }
    window.location.reload();
  } catch (error) {
    console.error(error);
  }
});

resetButton?.addEventListener('click', () => {
  resetGameState();
});

refreshScoreboardButton?.addEventListener('click', () => {
  refreshScoreboard();
});

nicknameSaveButton?.addEventListener('click', () => {
  handleNicknameSave();
});

nicknameInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleNicknameSave();
  }
});

nicknameInput?.addEventListener('input', () => {
  if (!nicknameFeedback) {
    return;
  }
  nicknameFeedback.textContent = '';
  nicknameFeedback.classList.remove('success', 'error');
});

scoreboardDetailsButton?.addEventListener('click', () => {
  window.location.href = '/scoreboard';
});

window.addEventListener('DOMContentLoaded', async () => {
  updateSettingsState();
  const authenticated = await fetchUser();
  if (authenticated) {
    resetGameState();
    await refreshScoreboard();
  } else {
    statusMessage.textContent = 'Please sign in to play.';
    await refreshScoreboard();
  }
});


