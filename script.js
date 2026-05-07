const API = "http://127.0.0.1:8000";

async function analyze() {
  const code  = document.getElementById("code").value.trim();
  const tests = document.getElementById("tests").value.trim();

  if (!code || !tests) {
    alert("Please paste both your source code and test cases.");
    return;
  }

  const btn    = document.getElementById("analyzeBtn");
  const loader = document.getElementById("loader");
  const report = document.getElementById("reportSection");

  btn.disabled = true;
  document.getElementById("btnText").textContent = "Analyzing...";
  loader.classList.remove("hidden");
  report.classList.add("hidden");

  try {
    const res = await fetch(`${API}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code, test_cases: tests })
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
    renderReport(data, code);
  } catch (err) {
    alert("Could not connect to backend. Make sure uvicorn is running.\n\nError: " + err.message);
  } finally {
    btn.disabled = false;
    document.getElementById("btnText").textContent = "Analyze Coverage";
    loader.classList.add("hidden");
  }
}

function renderReport(data, code) {
  const report   = document.getElementById("reportSection");
  const list     = document.getElementById("issuesList");
  const overall  = document.getElementById("overallReport");
  const count    = document.getElementById("issueCount");
  const summary  = document.getElementById("summaryBar");

  list.innerHTML = "";
  const issues = data.issues || [];
  count.textContent = `${issues.length} issue${issues.length !== 1 ? "s" : ""} found`;

  const high   = issues.filter(i => i.severity === "HIGH").length;
  const medium = issues.filter(i => i.severity === "MEDIUM").length;
  const low    = issues.filter(i => i.severity === "LOW").length;

  summary.innerHTML = `
    <div class="summary-item HIGH">HIGH &nbsp;<strong>${high}</strong></div>
    <div class="summary-item MEDIUM">MEDIUM &nbsp;<strong>${medium}</strong></div>
    <div class="summary-item LOW">LOW &nbsp;<strong>${low}</strong></div>
  `;

  if (issues.length === 0) {
    list.innerHTML = `<div class="issue-card LOW"><div class="card-title">No gaps detected</div><p class="card-description">Your test cases appear to cover the code well.</p></div>`;
  } else {
    issues.forEach((issue, index) => {
      const card = document.createElement("div");
      card.className = `issue-card ${issue.severity || "MEDIUM"}`;
      card.id = `card-${index}`;
      card.dataset.issue = JSON.stringify(issue);
      card.dataset.code  = code;
      card.innerHTML = `
        <div class="card-top">
          <div class="card-title">${escapeHtml(issue.title)}</div>
          <span class="badge ${issue.severity}">${issue.severity}</span>
        </div>
        <p class="card-description">${escapeHtml(issue.description)}</p>
        <p class="card-location">📍 ${escapeHtml(issue.location)}</p>
        <button class="fix-btn" id="fixBtn-${index}" onclick="fixIssue(${index}, this)">Fix This Issue</button>
        <div class="fix-result hidden" id="fixResult-${index}"></div>
      `;
      list.appendChild(card);
    });
  }

  overall.innerHTML = `<h3>Overall Report</h3><p>${escapeHtml(data.overall_report || "Analysis complete.")}</p>`;
  report.classList.remove("hidden");
  report.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function fixIssue(index, btn) {
  const card      = document.getElementById(`card-${index}`);
  const resultDiv = document.getElementById(`fixResult-${index}`);
  const issue     = JSON.parse(card.dataset.issue);
  const code      = card.dataset.code;

  btn.textContent = "Generating fix...";
  btn.disabled    = true;

  try {
    const res = await fetch(`${API}/fix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code, issue: issue })
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const fix = await res.json();
    resultDiv.innerHTML = `
      <h4>Generated Test Case</h4>
      <pre>${escapeHtml(fix.generated_test)}</pre>
      <h4>Code Suggestion</h4>
      <p>${escapeHtml(fix.code_suggestion)}</p>
    `;
    resultDiv.classList.remove("hidden");
  } catch (err) {
    alert("Could not generate fix. Error: " + err.message);
  } finally {
    btn.textContent = "Fix This Issue";
    btn.disabled    = false;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}