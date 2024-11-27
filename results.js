// Fetch JSON data
fetch("accessibility-results.json")
  .then((response) => response.json())
  .then((data) => {
    console.log(data); // Check the loaded data in the console
    displayResults(data);
  })
  .catch((error) => console.error("Error loading the data:", error));

function displayResults(data) {
  const resultsContainer = document.getElementById("results");

  data.forEach((page) => {
    const pageContainer = document.createElement("div");
    pageContainer.classList.add("page-container");

    // Page Title and URL
    const pageHeader = document.createElement("h2");
    pageHeader.textContent = `${page.pageName} - ${page.url}`;
    pageContainer.appendChild(pageHeader);

    // Issue Summary
    const issueSummary = document.createElement("p");
    issueSummary.innerHTML = `Total issues: ${page.result.issues.length}`;
    pageContainer.appendChild(issueSummary);

    // Expand/Collapse Button
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "Show/Hide Issues";
    pageContainer.appendChild(toggleButton);

    // Container for Issues
    const issuesContainer = document.createElement("div");
    issuesContainer.classList.add("issues-container");
    page.result.issues.forEach((issue) => {
      const issueDiv = document.createElement("div");
      issueDiv.classList.add("issue");
      issueDiv.innerHTML = `
        <strong>${issue.type}</strong> - ${issue.message}<br>
        <em>Code: ${issue.code}</em><br>
        <pre>${escapeHtml(issue.context)}</pre>
      `;
      issuesContainer.appendChild(issueDiv);
    });

    // Initially hide issues
    issuesContainer.style.display = "none";
    pageContainer.appendChild(issuesContainer);

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
