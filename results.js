// Fetch JSON data
fetch("axe-results.json")
  .then((response) => response.json())
  .then((data) => {
    console.log(data); // Confirm structure
    displayResults(data);
  })
  .catch((error) => console.error("Error loading the data:", error));

function displayResults(data) {
  const resultsContainer = document.getElementById("results");

  data.forEach((page, index) => {
    const pageContainer = document.createElement("div");
    pageContainer.classList.add("page-result");

    // Page Title and URL
    const pageHeader = document.createElement("h2");
    const pageLabel = page.url || `Page ${index + 1}`;
    pageHeader.textContent = pageLabel;
    pageContainer.appendChild(pageHeader);

    // Filter out incomplete results
    const filteredViolations = (page.violations || []).filter((violation) => {
      return (violation.nodes || []).length > 0;
    });

    // Issue Summary
    const issueSummary = document.createElement("p");
    issueSummary.innerHTML = `Total issues: ${filteredViolations.length}`;
    pageContainer.appendChild(issueSummary);

    // Expand/Collapse Button
    const toggleButton = document.createElement("button");
    toggleButton.classList.add("toggle-btn");
    toggleButton.textContent = "Show Issues";
    pageContainer.appendChild(toggleButton);

    // Container for Issues
    const issuesContainer = document.createElement("div");
    issuesContainer.classList.add("expandable");

    // Create only Violations section
    createIssuesSection(issuesContainer, "Violations", filteredViolations);
    pageContainer.appendChild(issuesContainer);

    // Toggle behavior
    toggleButton.addEventListener("click", () => {
      const isVisible = issuesContainer.classList.contains("open");
      issuesContainer.classList.toggle("open", !isVisible);
      toggleButton.textContent = isVisible ? "Show Issues" : "Hide Issues";
    });

    resultsContainer.appendChild(pageContainer);
  });
}

function createIssuesSection(container, sectionName, issues) {
  if (issues.length > 0) {
    const section = document.createElement("div");
    section.classList.add("issues-section");

    const sectionHeader = document.createElement("h3");
    sectionHeader.textContent = `${sectionName} (${issues.length})`;
    section.appendChild(sectionHeader);

    issues.forEach((issue) => {
      const issueDiv = document.createElement("div");
      issueDiv.classList.add("violation");

      const nodeHtml = issue.nodes?.[0]?.html || "";

      issueDiv.innerHTML = `
        <div class="violation-title">${issue.id}</div>
        <div class="violation-details">
          ${issue.description || "No description"}<br>
          <strong>Severity:</strong> ${issue.impact || "N/A"}<br>
          <strong>Help:</strong> <a href="${
            issue.helpUrl
          }" target="_blank">Learn More</a><br>
          <pre>${escapeHtml(nodeHtml)}</pre>
        </div>
      `;
      section.appendChild(issueDiv);
    });

    container.appendChild(section);
  }
}

// Helper function to escape HTML
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
