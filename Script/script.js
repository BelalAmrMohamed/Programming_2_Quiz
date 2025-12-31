// script.js
import { questions } from "./questions.js"; // This means questions.js is in the same folder as script.js

let currentQuestion = 0;
let correctCount = 0;
let wrongCount = 0;
let answered = new Set();
let selections = {};
let timerInterval;
let timeElapsed = 0;

// Escape HTML so questions/options containing tags render as text
function escapeHTML(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeElapsed++;
    const minutes = Math.floor(timeElapsed / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeElapsed % 60).toString().padStart(2, "0");
    document.getElementById(
      "timer"
    ).textContent = `Time: ${minutes}:${seconds}`;
    saveState();
  }, 1000);
}

function renderQuestion() {
  const container = document.getElementById("quizContainer");
  container.innerHTML = "";

  const question = questions[currentQuestion];
  const index = currentQuestion;

  const card = document.createElement("div");
  card.className = "question-card";

  let optionsHTML = "";
  question.options.forEach((option, optIndex) => {
    const isAnswered = answered.has(index);
    const isSelected = selections[index] === optIndex;
    const checked = isSelected ? "checked" : "";
    const safeOption = escapeHTML(option);

    optionsHTML += `
      <label class="option-label ${
        isAnswered ? "disabled" : ""
      }" id="label-${index}-${optIndex}">
        <input type="radio" name="q${index}" value="${optIndex}" ${checked} ${
      isAnswered ? "disabled" : ""
    }>
        ${safeOption}
      </label>
    `;
  });

  card.innerHTML = `
    <div class="question-header">${escapeHTML(question.q)}</div>
    <div class="options">${optionsHTML}</div>
    <button class="submit-btn" onclick="checkAnswer(${index})" 
      ${
        answered.has(index) ? 'style="display:none;"' : ""
      }>Submit Answer</button>
    <div class="feedback" id="feedback-${index}"></div>
  `;

  container.appendChild(card);

  if (answered.has(index)) {
    showFeedback(index);
  }

  updateNavigation();
  updateProgress();
}

function showFeedback(questionIndex) {
  const correctAnswer = questions[questionIndex].correct;
  const selectedValue = selections[questionIndex];
  const feedback = document.getElementById(`feedback-${questionIndex}`);
  const labels = document.querySelectorAll(`.option-label`);

  labels.forEach((label, index) => {
    if (index === correctAnswer) label.classList.add("correct");
    if (index === selectedValue && selectedValue !== correctAnswer)
      label.classList.add("wrong");
  });

  feedback.className = `feedback ${
    selectedValue === correctAnswer ? "correct" : "wrong"
  } show`;
  if (selectedValue === correctAnswer) {
    feedback.textContent = "🎉 Correct!";
  } else {
    const correctText = escapeHTML(
      questions[questionIndex].options[correctAnswer]
    );
    feedback.textContent = `❌ Correct answer: ${correctText}`;
  }
}

function checkAnswer(questionIndex) {
  const selected = document.querySelector(
    `input[name="q${questionIndex}"]:checked`
  );
  if (!selected) return alert("Select an answer!");

  const selectedValue = parseInt(selected.value);
  selections[questionIndex] = selectedValue;
  answered.add(questionIndex);

  if (selectedValue === questions[questionIndex].correct) {
    correctCount++;
  } else {
    wrongCount++;
  }

  renderQuestion(); // Re-render to show feedback and hide button
  updateScoreboard();
  saveState();

  if (answered.size === questions.length) {
    document.getElementById("finishBtn").style.display = "inline-block";
  }
}

function updateScoreboard() {
  document.getElementById("correctCount").textContent = correctCount;
  document.getElementById("wrongCount").textContent = wrongCount;
}

function updateProgress() {
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  document.getElementById("progressBar").style.width = progress + "%";
}

function updateNavigation() {
  document.getElementById("prevBtn").disabled = currentQuestion === 0;
  document.getElementById("nextBtn").disabled =
    currentQuestion === questions.length - 1;
  document.getElementById("navigation").style.display = "flex";
}

window.prevQuestion = () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion();
    saveState();
  }
};
window.nextQuestion = () => {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    renderQuestion();
    saveState();
  }
};

window.finishQuiz = () => {
  clearInterval(timerInterval);
  document.getElementById("quizContainer").style.display = "none";
  document.getElementById("navigation").style.display = "none";
  const summary = document.getElementById("summaryContainer");
  summary.style.display = "block";
  summary.innerHTML = `<h2>Quiz Complete!</h2><p>Correct: ${correctCount} | Wrong: ${wrongCount}</p>
                       <button class="reset-quiz-btn" onclick="resetQuiz()">Restart</button>`;
};

window.resetQuiz = () => {
  localStorage.removeItem("quizState");
  location.reload();
};

function saveState() {
  const state = {
    currentQuestion,
    correctCount,
    wrongCount,
    answered: Array.from(answered),
    selections,
    timeElapsed,
  };
  localStorage.setItem("quizState", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("quizState");
  if (saved) {
    const state = JSON.parse(saved);
    currentQuestion = state.currentQuestion;
    correctCount = state.correctCount;
    wrongCount = state.wrongCount;
    answered = new Set(state.answered);
    selections = state.selections;
    timeElapsed = state.timeElapsed;
  }
  updateScoreboard();
  renderQuestion();
  startTimer();
}

loadState();
window.checkAnswer = checkAnswer;
