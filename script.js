const MAX_TOTAL = 6;
const COMPUTER_STOP_TOTAL = 4;
const CARD_VALUES = [1, 2, 3, 4, 5, 6];
const SUITS = [
  { symbol: "♠", color: "black" },
  { symbol: "♥", color: "red" },
  { symbol: "♦", color: "red" },
  { symbol: "♣", color: "black" }
];
const SCORE_STORAGE_KEY = "moPaiCou6Score";

const elements = {
  score: document.querySelector("#score"),
  playerCards: document.querySelector("#playerCards"),
  computerCards: document.querySelector("#computerCards"),
  playerTotal: document.querySelector("#playerTotal"),
  computerTotal: document.querySelector("#computerTotal"),
  playerPanel: document.querySelector("#playerPanel"),
  computerPanel: document.querySelector("#computerPanel"),
  resultBox: document.querySelector("#resultBox"),
  resultIcon: document.querySelector("#resultIcon"),
  resultTitle: document.querySelector("#resultTitle"),
  resultMessage: document.querySelector("#resultMessage"),
  drawButton: document.querySelector("#drawButton"),
  stopButton: document.querySelector("#stopButton"),
  nextButton: document.querySelector("#nextButton"),
  resetButton: document.querySelector("#resetButton"),
  confetti: document.querySelector("#confetti")
};

let score = loadScore();
let playerHand = [];
let computerHand = [];
let roundState = "ready";

elements.drawButton.addEventListener("click", playerDraw);
elements.stopButton.addEventListener("click", finishPlayerTurn);
elements.nextButton.addEventListener("click", startRound);
elements.resetButton.addEventListener("click", resetGame);

renderScore();
startRound();

function loadScore() {
  const savedScore = Number.parseInt(localStorage.getItem(SCORE_STORAGE_KEY), 10);
  return Number.isFinite(savedScore) && savedScore >= 0 ? savedScore : 0;
}

function saveScore() {
  localStorage.setItem(SCORE_STORAGE_KEY, String(score));
}

function renderScore() {
  elements.score.textContent = score;
}

function drawCard() {
  const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return { value, ...suit };
}

function totalOf(hand) {
  return hand.reduce((total, card) => total + card.value, 0);
}

function playerDraw() {
  if (roundState !== "ready" && roundState !== "player") return;

  roundState = "player";
  playerHand.push(drawCard());
  renderHand(elements.playerCards, playerHand, "我的牌");

  const playerTotal = totalOf(playerHand);
  elements.playerTotal.textContent = playerTotal;
  elements.stopButton.classList.remove("is-hidden");
  setResult("🤔", `现在是 ${playerTotal} 点`, "还要再摸一张吗？想一想再决定！", "ready");

  if (playerTotal > MAX_TOTAL) {
    endRoundForPlayerBust();
  }
}

async function finishPlayerTurn() {
  if (roundState !== "player" || playerHand.length === 0) return;

  roundState = "computer";
  setTurnButtonsDisabled(true);
  setResult("🤖", "轮到电脑摸牌", "电脑正在认真想一想……", "ready");

  do {
    await wait(550);
    computerHand.push(drawCard());
    renderHand(elements.computerCards, computerHand, "电脑的牌");
    elements.computerTotal.textContent = totalOf(computerHand);
  } while (totalOf(computerHand) < COMPUTER_STOP_TOTAL);

  await wait(350);
  judgeRound();
}

function judgeRound() {
  const playerTotal = totalOf(playerHand);
  const computerTotal = totalOf(computerHand);

  if (computerTotal > MAX_TOTAL || playerTotal > computerTotal) {
    elements.playerPanel.classList.add("is-winner");
    if (computerTotal > MAX_TOTAL) {
      elements.computerPanel.classList.add("is-out");
    }
    score += 1;
    saveScore();
    renderScore();
    setResult("🎉", "太棒了，你赢啦！积分 +1", computerTotal > MAX_TOTAL
      ? "电脑超过 6 点啦，你判断得真好！"
      : "你的点数更接近 6，真厉害！", "win");
    launchConfetti();
    endRound();
    return;
  }

  if (playerTotal < computerTotal) {
    elements.computerPanel.classList.add("is-winner");
    setResult("🌱", "差一点，再试一次！", `电脑是 ${computerTotal} 点，这次电脑赢啦。`, "lose");
    endRound();
    return;
  }

  setResult("🤝", "一样大，平局！", "你们都很棒，再来一局吧！", "draw");
  endRound();
}

function endRoundForPlayerBust() {
  elements.playerPanel.classList.add("is-out");
  elements.computerPanel.classList.add("is-winner");
  setResult("💪", "你超过6点了，电脑赢了", "超过 6 点啦，下次要更会判断哦！", "lose");
  endRound();
}

function endRound() {
  roundState = "over";
  elements.drawButton.classList.add("is-hidden");
  elements.stopButton.classList.add("is-hidden");
  elements.nextButton.classList.remove("is-hidden");
  setTurnButtonsDisabled(false);
  elements.nextButton.focus({ preventScroll: true });
}

function startRound() {
  playerHand = [];
  computerHand = [];
  roundState = "ready";
  clearRoundStyles();
  renderEmptyHand(elements.playerCards);
  renderEmptyHand(elements.computerCards);
  elements.playerTotal.textContent = "0";
  elements.computerTotal.textContent = "0";
  elements.drawButton.classList.remove("is-hidden");
  elements.drawButton.disabled = false;
  elements.stopButton.classList.add("is-hidden");
  elements.stopButton.disabled = false;
  elements.nextButton.classList.add("is-hidden");
  elements.resetButton.disabled = false;
  setResult("👋", "准备好了吗？", "先摸一张牌，开始挑战吧！", "ready");
}

function resetGame() {
  score = 0;
  saveScore();
  renderScore();
  startRound();
  setResult("🌟", "重新出发！", "积分已经清零，来挑战 6 点吧！", "ready");
}

function renderHand(container, hand, owner) {
  container.replaceChildren(...hand.map((card, index) => createCardElement(card, `${owner}第 ${index + 1} 张`)));
  container.scrollLeft = container.scrollWidth;
}

function renderEmptyHand(container) {
  const card = document.createElement("div");
  card.className = "playing-card card-back";
  card.setAttribute("aria-hidden", "true");
  card.innerHTML = '<span class="card-pattern">?</span>';
  container.replaceChildren(card);
}

function createCardElement(card, label) {
  const cardElement = document.createElement("div");
  const face = card.value === 1 ? "A" : String(card.value);
  cardElement.className = `playing-card ${card.color}`;
  cardElement.setAttribute("aria-label", `${label}：${face}${card.symbol}，${card.value} 点`);
  cardElement.innerHTML = `
    <span class="card-corner">${face}<small>${card.symbol}</small></span>
    <span class="card-suit" aria-hidden="true">${card.symbol}</span>
    <span class="card-corner card-corner--bottom" aria-hidden="true">${face}<small>${card.symbol}</small></span>
  `;
  return cardElement;
}

function setTurnButtonsDisabled(disabled) {
  elements.drawButton.disabled = disabled;
  elements.stopButton.disabled = disabled;
  elements.resetButton.disabled = disabled;
}

function setResult(icon, title, message, type) {
  elements.resultIcon.textContent = icon;
  elements.resultTitle.textContent = title;
  elements.resultMessage.textContent = message;
  elements.resultBox.className = `result-box result-box--${type}`;
}

function clearRoundStyles() {
  elements.playerPanel.classList.remove("is-winner", "is-out");
  elements.computerPanel.classList.remove("is-winner", "is-out");
  elements.confetti.replaceChildren();
}

function launchConfetti() {
  const colors = ["#ff718e", "#ffc84a", "#54c795", "#5f9df7", "#8075e5"];

  for (let i = 0; i < 42; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    piece.style.setProperty("--drift", `${Math.random() * 180 - 90}px`);
    elements.confetti.appendChild(piece);
  }

  window.setTimeout(() => elements.confetti.replaceChildren(), 1700);
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
