# Accessibility Testing Script

TODO: Update this file to use markdown structure properly!

This project is a Node.js-based script designed to run accessibility tests on a list of URLs using [Pa11y](https://pa11y.org/) and Puppeteer. It supports authenticated tests, environment switching (production or development), and handles user-specific login flows.

---

## Features

- **Run Accessibility Tests**: Tests multiple URLs for WCAG compliance using Pa11y.
- **Authenticated Testing**: Supports login via user-specific URLs for pages requiring authentication.
- **Environment Switching**: Dynamically switches between production and development environments.
- **JSON Configuration**: URLs, login details, and environment settings are stored in a `urls.json` file.

---

## Prerequisites

1. [Node.js](https://nodejs.org/) installed on your machine.
2. Install project dependencies by running:
   ```bash
   npm install
   ```
3. Create a .env file in the root directory to store credentials:
   ```
   ACCOUNT1_USERNAME=your_username
   ACCOUNT1_PASSWORD=your_password
   ACCOUNT2_USERNAME=another_username
   ACCOUNT2_PASSWORD=another_password
   ```

## Usage

Add URLs to the urls.json file:

```
[
{
"url": "https://webstaurantstore.com/cart/",
"requiresLogin": true,
"credentials": "18994339",
"environment": "dev"
},
{
"url": "https://webstaurantstore.com/myaccount/orders/",
"requiresLogin": true,
"credentials": "18994340",
"environment": "prod"
},
{
"url": "https://webstaurantstore.com/",
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

Results are saved in `accessibility-results.json` in the root directory.

```
├── accessibility-test.js # Main script for running accessibility tests
├── urls.json # Configuration file for URLs and settings
├── .env # Environment variables (credentials)
├── package.json # Project dependencies and metadata
└── accessibility-results.json # Generated file with test results
```

## Dependencies

- Pa11y: Automated accessibility testing tool.
- Puppeteer: Headless browser for handling authentication and rendering pages.
- dotenv: Loads environment variables from a `.env` file.

Install all dependencies by running:

```
npm install
```

## Customization

- Modify Login Behavior: The script assumes user-specific login URLs (e.g., `?login_as_user=...`). Adjust the `getCookiesForUser` function in `accessibility-tests.js` if your login flow changes.
- Change Environments: Use the environment field in `urls.json` to toggle between production (prod) and development (dev) environments.
- Additional Headers: Add custom headers for specific tests by extending the `pa11yOptions` object in the script.
