// script.js
import { questions } from "./questions.js";

let currentQuestion = 0;
let correctCount = 0;
let wrongCount = 0;
let answered = new Set();
let selections = {};
let timerInterval;
let timeElapsed = 0;
let includeTimer = true;

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

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
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

// Try to submit current selected answer without alert (used by navigation)
function submitSelection(questionIndex, suppressAlert = false) {
  if (answered.has(questionIndex)) return true;
  const selected = document.querySelector(
    `input[name="q${questionIndex}"]:checked`
  );
  if (!selected) {
    if (!suppressAlert) alert("Select an answer!");
    return false;
  }
  const selectedValue = parseInt(selected.value);
  selections[questionIndex] = selectedValue;
  answered.add(questionIndex);

  if (selectedValue === questions[questionIndex].correct) {
    correctCount++;
  } else {
    wrongCount++;
  }

  updateScoreboard();
  saveState();
  renderQuestion();

  if (answered.size === questions.length) {
    document.getElementById("finishBtn").style.display = "inline-block";
  }
  return true;
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
  return submitSelection(questionIndex, false);
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
    // auto-submit current selection if present
    submitSelection(currentQuestion, true);
    currentQuestion--;
    renderQuestion();
    saveState();
  }
};
window.nextQuestion = () => {
  if (currentQuestion < questions.length - 1) {
    // auto-submit current selection if present
    submitSelection(currentQuestion, true);
    currentQuestion++;
    renderQuestion();
    saveState();
  }
};

window.finishQuiz = () => {
  stopTimer();
  document.getElementById("quizContainer").style.display = "none";
  document.getElementById("navigation").style.display = "none";
  const summary = document.getElementById("summaryContainer");
  summary.style.display = "block";

  let html = `<h2>Quiz Complete!</h2><p>Correct: ${correctCount} | Wrong: ${wrongCount} | Total: ${questions.length}</p>`;
  html += '<div class="summary-list">';
  questions.forEach((q, i) => {
    const user = selections.hasOwnProperty(i) ? selections[i] : null;
    const correct = q.correct;
    const statusClass =
      user === null ? "unanswered" : user === correct ? "correct" : "wrong";
    const userText = user === null ? "Unanswered" : escapeHTML(q.options[user]);
    const correctText = escapeHTML(q.options[correct]);
    html += `<div class="summary-item ${statusClass}"><div class="question-header">${escapeHTML(
      q.q
    )}</div><div> Your answer: ${userText}</div><div> Correct answer: ${correctText}</div></div>`;
  });
  html += "</div>";
  html += `<button class="reset-quiz-btn" onclick="resetQuiz()">Restart</button>`;
  summary.innerHTML = html;
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
  // Do not auto-start timer here; caller decides based on user choice
}

function startQuiz(resumeOnly = false) {
  // read timer preference
  const timerCheckbox = document.getElementById("includeTimer");
  includeTimer = timerCheckbox ? timerCheckbox.checked : true;
  // hide start menu
  const startMenu = document.getElementById("startMenu");
  if (startMenu) startMenu.style.display = "none";
  // show quiz UI
  document.getElementById("quizContainer").style.display = "block";
  document.getElementById("navigation").style.display = "flex";

  const saved = localStorage.getItem("quizState");
  if (saved && resumeOnly) {
    loadState();
  } else if (saved && !resumeOnly) {
    // ask to resume if found (simple behavior: resume automatically)
    loadState();
  } else {
    // fresh start
    currentQuestion = 0;
    correctCount = 0;
    wrongCount = 0;
    answered = new Set();
    selections = {};
    timeElapsed = 0;
    updateScoreboard();
    renderQuestion();
  }

  if (includeTimer) startTimer();
  else {
    stopTimer();
    document.getElementById("timer").textContent = "Timer disabled";
  }
}

// If there's saved progress, show a resume button on the start menu
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("quizState");
  if (saved) {
    const resumeBtn = document.getElementById("resumeBtn");
    if (resumeBtn) resumeBtn.style.display = "inline-block";
  }
});

window.startQuiz = startQuiz;
window.checkAnswer = checkAnswer;
