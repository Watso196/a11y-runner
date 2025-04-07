// Fetch JSON data
fetch("axe-results.json")
  .then((response) => response.json())
  .then((data) => {
    console.log(data); // Check the loaded data in the console
    displayResults(data);
  })
  .catch((error) => console.error("Error loading the data:", error));

function displayResults(data) {
  const resultsContainer = document.getElementById("results");

  // Iterate over each page's results
  data.forEach((page) => {
    const pageContainer = document.createElement("div");
    pageContainer.classList.add("page-container");

    // Page Title and URL
    const pageHeader = document.createElement("h2");
    pageHeader.textContent = `${page.pageName} - ${page.url}`;
    pageContainer.appendChild(pageHeader);

    // Issue Summary
    const issueSummary = document.createElement("p");
    const totalIssues =
      page.axeResults.violations.length + page.axeResults.incomplete.length;
    issueSummary.innerHTML = `Total issues: ${totalIssues} (Violations: ${page.axeResults.violations.length}, Incomplete: ${page.axeResults.incomplete.length})`;
    pageContainer.appendChild(issueSummary);

    // Expand/Collapse Button
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "Show/Hide Issues";
    pageContainer.appendChild(toggleButton);

    // Container for Issues
    const issuesContainer = document.createElement("div");
    issuesContainer.classList.add("issues-container");

    // Create sections for Violations and Incomplete issues
    createIssuesSection(
      issuesContainer,
      "Violations",
      page.axeResults.violations
    );
    createIssuesSection(
      issuesContainer,
      "Incomplete",
      page.axeResults.incomplete
    );

    pageContainer.appendChild(issuesContainer);

    // Initially hide issues
    issuesContainer.style.display = "none";

    // Add toggle functionality for expand/collapse
    toggleButton.addEventListener("click", () => {
      if (issuesContainer.style.display === "none") {
        issuesContainer.style.display = "block";
        toggleButton.textContent = "Hide Issues";
      } else {
        issuesContainer.style.display = "none";
        toggleButton.textContent = "Show Issues";
      }
    });

    // Append the page container to the main results container
    resultsContainer.appendChild(pageContainer);
  });
}

// Function to create issues section (Violations or Incomplete)
function createIssuesSection(container, sectionName, issues) {
  if (issues.length > 0) {
    const section = document.createElement("div");
    section.classList.add("issues-section");

    const sectionHeader = document.createElement("h3");
    sectionHeader.textContent = `${sectionName} (${issues.length})`;
    section.appendChild(sectionHeader);

    issues.forEach((issue) => {
      const issueDiv = document.createElement("div");
      issueDiv.classList.add("issue");

      issueDiv.innerHTML = `
        <strong>${issue.id}</strong> - ${issue.message}<br>
        <em>Severity: ${issue.impact}</em><br>
        <em>Help: <a href="${
          issue.helpUrl
        }" target="_blank">Learn More</a></em><br>
        <pre>${escapeHtml(issue.nodeHtml)}</pre>
      `;
      section.appendChild(issueDiv);
    });

    container.appendChild(section);
  }
}

// Helper function to escape HTML
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function (match) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[match];
  });
}
