# Accessibility Testing Script

This project is a Node.js-based script designed to run accessibility tests on a list of URLs using [Pa11y](https://pa11y.org/) and Puppeteer. It supports authenticated tests, environment switching (production or development), and handles user-specific login flows.

---

## Features

- **Run Accessibility Tests**: Tests multiple URLs for WCAG compliance using Pa11y.
- **Authenticated Testing**: Supports login via user-specific URLs for pages requiring authentication.
- **Environment Switching**: Dynamically switches between production and development environments.
- **JSON Configuration**: URLs, page names, login details, and environment settings are stored in a `urls.json` file.

---

## Prerequisites

1. [Node.js](https://nodejs.org/) installed on your machine.
2. Install project dependencies by running:
   ```
   npm install
   ```

## Usage

Create a `urls.json` file with the list of URLs you want to test. Example:

```
[
   {
      "pageName": "Home",
      "url": "https://home.com",
      "requiresLogin": false,
      "environment": "prod"
   },
   {
      "pageName": "User Account",
      "url": "https://home.com/myaccount",
      "requiresLogin": true,
      "credentials": "18994340", // User ID for login URL
      "environment": "dev"
   },
   {
      "pageName": "About",
      "url": "https://home.com/about",
      "requiresLogin": false,
      "environment": "prod"
   }
]
```

## Run the script:

Running this script will generate results for all of the URLs in your `urls.json` file

```
node accessibility-tests.js
```

## View the results:

Results are saved in `accessibility-results.json`, and the `test-results.html` file will display the data from this JSON file as a web page with page names, URLs, and test results.

It's recommended you use the VS Code Live Server extension to view the `test-results.html` page, as CORS policies may prevent users from loading the required `results.js` script for the page. Using Live Server will bypass any CORS issues you may have.

If you'd like to customize the data that shows up the in HTML page report, you can update the `results.js` file to do so.

## Dependencies

- Pa11y: Automated accessibility testing tool.
- Puppeteer: Headless browser for handling authentication and rendering pages.
- dotenv: Loads environment variables from a `.env` file.

Install all dependencies by running:

```
npm install
```

## Customization

- Modify Login Behavior: The script assumes user-specific login URLs (e.g., `?login_as_user=...`). Adjust the `if (requiresLogin)` conditional logic in `accessibility-tests.js` if your login flow changes.
- Change Environments: Use the environment field in `urls.json` to toggle between production (prod) and development (dev) environments. For consistency, you should choose either dev or prod to test against.
- Additional Headers: Add custom headers for specific tests by extending the `pa11yOptions` object in the script. Currently, we ignore several tests that do not produce meaningful reports, and bypass testing certain elements that improperly report failures.
