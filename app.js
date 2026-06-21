const app = document.getElementById("app");

const state = {
  screen: "home",
  history: [],
  learnNumber: null,
  drillActive: false,
  drillLine: null,
  drillAnswerShown: false,
  selectedTables: new Set(),
  testQuestions: [],
  testIndex: 0,
  testPhase: "answer", // answer | reveal | done
  currentAnswer: "",
  lastCorrect: null
};

function go(screen, payload = {}) {
  state.history.push(state.screen);
  state.screen = screen;
  Object.assign(state, payload);
  render();
}

function back() {
  if (state.drillActive) {
    state.drillActive = false;
    state.drillLine = null;
    state.drillAnswerShown = false;
    render();
    return;
  }
  const previous = state.history.pop() || "home";
  state.screen = previous;
  render();
}

function home() {
  state.history = [];
  state.screen = "home";
  state.drillActive = false;
  state.drillLine = null;
  state.drillAnswerShown = false;
  render();
}

function tableNumbers() {
  return Array.from({ length: 12 }, (_, i) => i + 1);
}

function factors() {
  return Array.from({ length: 12 }, (_, i) => i + 1);
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function newDrillLine() {
  const options = factors();
  let next = randomItem(options);
  if (options.length > 1 && next === state.drillLine) {
    next = randomItem(options.filter(n => n !== state.drillLine));
  }
  state.drillLine = next;
  state.drillAnswerShown = false;
  state.currentAnswer = "";
}

function startDrill() {
  state.drillActive = true;
  newDrillLine();
  render();
  setTimeout(focusAnswer, 50);
}

function checkDrill() {
  const correct = state.learnNumber * state.drillLine;
  const entered = Number(state.currentAnswer);
  state.lastCorrect = entered === correct;
  state.drillAnswerShown = true;
  render();
}

function nextDrill() {
  newDrillLine();
  render();
  setTimeout(focusAnswer, 50);
}

function makeQuestions() {
  const tables = Array.from(state.selectedTables);
  const pool = [];
  tables.forEach(t => factors().forEach(f => pool.push({ a: t, b: f, answer: t * f })));

  const questions = [];
  const used = new Set();

  while (questions.length < 10 && pool.length) {
    const q = randomItem(pool);
    const key = `${q.a}x${q.b}`;
    if (!used.has(key) || used.size >= pool.length) {
      questions.push(q);
      used.add(key);
    }
  }
  return questions;
}

function startTest() {
  if (state.selectedTables.size === 0) return;
  state.testQuestions = makeQuestions();
  state.testIndex = 0;
  state.testPhase = "answer";
  state.currentAnswer = "";
  state.lastCorrect = null;
  go("testRun");
  setTimeout(focusAnswer, 50);
}

function advanceTest() {
  if (state.testIndex >= state.testQuestions.length - 1) {
    state.testPhase = "done";
    render();
    return;
  }

  state.testIndex += 1;
  state.testPhase = "answer";
  state.currentAnswer = "";
  state.lastCorrect = null;
  render();
  setTimeout(focusAnswer, 50);
}

function submitTestAnswer() {
  if (state.currentAnswer.trim() === "") return;

  const q = state.testQuestions[state.testIndex];
  state.lastCorrect = Number(state.currentAnswer) === q.answer;

  if (state.lastCorrect) {
    state.testPhase = "reveal";
  } else {
    state.currentAnswer = "";
  }

  render();
  if (!state.lastCorrect) setTimeout(focusAnswer, 50);
}

function skipTestQuestion() {
  advanceTest();
}

function restartTest() {
  state.testQuestions = makeQuestions();
  state.testIndex = 0;
  state.testPhase = "answer";
  state.currentAnswer = "";
  state.lastCorrect = null;
  render();
  setTimeout(focusAnswer, 50);
}

function focusAnswer() {
  const input = document.querySelector("#answerInput");
  if (input) input.focus();
}

function shell(title, subtitle, content, options = {}) {
  const backButton = options.noBack ? "" : `<button class="btn ghost small" onclick="back()">← Back</button>`;
  const descriptionAction = options.descriptionAction || "";
  return `
    <main class="screen">
      <div class="topbar">
        <div class="topbar-left">${backButton}</div>
        <div class="topbar-right">
          ${options.noHome ? "" : `<button class="btn ghost small" onclick="home()">Home</button>`}
        </div>
      </div>
      <section class="card">
        <div class="section-heading">
          <h2>${title}</h2>
        </div>
        ${subtitle ? `<p>${subtitle}</p>` : ""}
        ${descriptionAction ? `<div class="description-action">${descriptionAction}</div>` : ""}
        ${content}
      </section>
    </main>
  `;
}

function renderHome() {
  app.innerHTML = `
    <main class="screen hero">
      <section class="card">
        <h1>Times Tables<br>Drill</h1>
        <p>Learn, drill your memory, then test yourself from 1 to 12.</p>
        <div class="actions two">
          <button class="btn" onclick="go('learnPick')">Learn</button>
          <button class="btn secondary" onclick="go('testPick')">Test</button>
        </div>
      </section>
    </main>
  `;
}

function renderLearnPick() {
  const grid = tableNumbers().map(n => `
    <button class="number-btn" onclick="go('learnTable', { learnNumber: ${n}, drillActive: false, drillLine: null })">${n}</button>
  `).join("");

  app.innerHTML = shell(
    "Choose a table",
    "Pick a number from 1 to 12.",
    `<div class="grid">${grid}</div>`
  );
}

function renderLearnTable() {
  const n = state.learnNumber;
  const lines = factors().map(f => {
    const answer = n * f;
    const isBlank = state.drillActive && state.drillLine === f && !state.drillAnswerShown;
    const right = state.drillActive && state.drillLine === f && state.drillAnswerShown;
    return `
      <div class="table-line">
        <span>${n} × ${f} = ${isBlank ? `<span class="blank">?</span>` : answer}</span>
        ${right ? `<span>${state.lastCorrect ? "✅" : "💡"}</span>` : ""}
      </div>
    `;
  }).join("");

  const drillPanel = state.drillActive ? `
    <div class="drill-box">
      <div class="big-question">${n} × ${state.drillLine} = ${state.drillAnswerShown ? n * state.drillLine : "?"}</div>
      ${state.drillAnswerShown ? `
        <div class="feedback ${state.lastCorrect ? "good" : "bad"}">
          ${state.lastCorrect ? "Correct!" : `The right answer is ${n * state.drillLine}.`}
        </div>
        <div class="actions">
          <button class="btn" onclick="nextDrill()">Next blank</button>
        </div>
      ` : `
        <div class="answer-row">
          <input id="answerInput" class="answer-input" inputmode="numeric" pattern="[0-9]*" value="${state.currentAnswer}" oninput="state.currentAnswer=this.value" onkeydown="if(event.key==='Enter') checkDrill()" aria-label="Answer" />
          <button class="btn" onclick="checkDrill()">Check</button>
        </div>
      `}
    </div>
  ` : "";

  app.innerHTML = shell(
    `Table ${n}`,
    state.drillActive ? "Fill in the missing answer. Press Back to stop the drill." : "Read through the times table, then start a memory drill.",
    `<div class="table-list">${lines}</div>${drillPanel}`,
    {
      descriptionAction: state.drillActive
        ? ""
        : `<button class="btn secondary small" onclick="startDrill()">Memory drill</button>`
    }
  );
}

function renderTestPick() {
  state.selectedTables.delete(0);
  const allSelected = state.selectedTables.size === tableNumbers().length;
  const grid = tableNumbers().map(n => `
    <button class="number-btn ${state.selectedTables.has(n) ? "selected" : ""}" onclick="toggleTable(${n})">${n}</button>
  `).join("");

  app.innerHTML = shell(
    "Choose test tables",
    "Select one table, multiple tables, or all tables. The test will ask 10 questions.",
    `
      <div class="select-all">
        <button class="btn ghost small" onclick="selectAllTables()">${allSelected ? "Clear all" : "Select all"}</button>
      </div>
      <div class="grid">${grid}</div>
      <div class="actions">
        <button class="btn" ${state.selectedTables.size === 0 ? "disabled" : ""} onclick="startTest()">Next</button>
      </div>
    `
  );
}

function toggleTable(n) {
  if (state.selectedTables.has(n)) state.selectedTables.delete(n);
  else state.selectedTables.add(n);
  render();
}

function selectAllTables() {
  if (state.selectedTables.size === tableNumbers().length) state.selectedTables.clear();
  else tableNumbers().forEach(n => state.selectedTables.add(n));
  render();
}

function renderTestRun() {
  if (state.testPhase === "done") {
    app.innerHTML = shell(
      "Test complete",
      "Great job! You finished 10 questions.",
      `
        <div class="actions">
          <button class="btn" onclick="restartTest()">Generate test questions again</button>
          <button class="btn ghost" onclick="home()">Back to homepage</button>
        </div>
      `
    );
    return;
  }

  const q = state.testQuestions[state.testIndex];
  const reveal = state.testPhase === "reveal";

  app.innerHTML = shell(
    "Test",
    `<span class="progress">Question ${state.testIndex + 1} of 10</span>`,
    `
      <div class="question-box">
        <div class="big-question">${q.a} × ${q.b} = ${reveal ? q.answer : "?"}</div>
        ${reveal ? `
          <div class="feedback good">Correct!</div>
          <div class="actions">
            <button class="btn" onclick="advanceTest()">${state.testIndex >= 9 ? "Finish" : "Next question"}</button>
          </div>
        ` : `
          ${state.lastCorrect === false ? `<div class="feedback bad">Not quite. Try the same question again.</div>` : ""}
          <div class="answer-row">
            <input id="answerInput" class="answer-input" inputmode="numeric" pattern="[0-9]*" value="${state.currentAnswer}" oninput="state.currentAnswer=this.value" onkeydown="if(event.key==='Enter') submitTestAnswer()" aria-label="Answer" />
            <button class="btn" onclick="submitTestAnswer()">Submit</button>
            <button class="btn ghost" onclick="skipTestQuestion()">Skip</button>
          </div>
        `}
      </div>
    `
  );
}

function render() {
  if (state.screen === "home") renderHome();
  if (state.screen === "learnPick") renderLearnPick();
  if (state.screen === "learnTable") renderLearnTable();
  if (state.screen === "testPick") renderTestPick();
  if (state.screen === "testRun") renderTestRun();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

render();
