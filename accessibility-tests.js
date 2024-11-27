const pa11y = require("pa11y");
const puppeteer = require("puppeteer");
const fs = require("fs").promises;
require("dotenv").config();

// Load URLs to test
const urls = require("./urls.json");

// Helper to switch environments (e.g., prod or dev)
function adjustEnvironment(url, environment) {
  if (environment === "dev") {
    return url.replace(
      "https://webstaurantstore.com",
      "https://www.dev.webstaurantstore.com"
    );
  }
  return url;
}

// Function to retrieve cookies via a login URL
async function getCookiesForUser(loginUrl) {
  console.log(`Logging in via ${loginUrl}...`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to the user-specific login URL
  await page.goto(loginUrl);

  // Wait for navigation to ensure login is complete
  await page.waitForNavigation();

  // Retrieve cookies
  const cookies = await page.cookies();
  await browser.close();

  console.log("Login successful, cookies retrieved.");
  return cookies;
}

// Function to run Pa11y tests
async function runAccessibilityTests() {
  console.log("Running accessibility tests...");
  const results = [];

  // Ensure Puppeteer browser instance is initialized
  const browser = await puppeteer.launch();

  for (const [index, item] of urls.entries()) {
    const { pageName, url, requiresLogin, credentials, environment } = item;
    const adjustedUrl = adjustEnvironment(url, environment);
    console.log(`Testing ${adjustedUrl}...`);

    try {
      let pa11yOptions = {
        ignore: [
          "WCAG2AA.Principle4.Guideline4_1.4_1_1.F77",
          "WCAG2AA.Principle2.Guideline2_4.2_4_1.G1,G123,G124.NoSuchID",
          "WCAG2AA.Principle1.Guideline1_1.1_1_1.H30.2",
        ],
        browser,
      };

      // Delay to ensure stability before the first test
      if (index === 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Handle login if required
      if (requiresLogin) {
        const loginUrl = adjustEnvironment(
          `https://webstaurantstore.com/myaccount/?login_as_user=${credentials}`,
          environment
        );

        const page = await browser.newPage();

        console.log(`Logging in at ${loginUrl}...`);
        await page.goto(loginUrl, {
          waitUntil: "networkidle2",
          timeout: 80000,
        });

        const cookies = await page.cookies();
        const loginCookie = cookies.find(
          (cookie) => cookie.name === "LOGGED_IN_AS_USER"
        );

        if (!loginCookie || loginCookie.value !== "true") {
          throw new Error(
            "Login failed: LOGGED_IN_AS_USER cookie not found or not true."
          );
        }

        console.log("Login successful!");
        pa11yOptions.headers = cookies.reduce((headers, cookie) => {
          headers[cookie.name] = cookie.value;
          return headers;
        }, {});

        await page.close();
      }

      const page = await browser.newPage();
      console.log(`Opening page ${adjustedUrl}...`);
      await page.goto(adjustedUrl, {
        waitUntil: "networkidle2",
        timeout: 80000,
      });

      // Run Pa11y test
      console.log(`Running tests for ${adjustedUrl}...`);
      const result = await pa11y(adjustedUrl, {
        ...pa11yOptions,
        hideElements:
          'a[href="/plus/"] span, span.ribbon__text-plus--cart span',
      });

      // Include the page name in the result
      results.push({
        pageName,
        url,
        environment,
        result,
      });

      console.log(`Test completed for ${adjustedUrl}.`);
    } catch (error) {
      console.error(`Error testing ${adjustedUrl}:`, error.message);
    }
  }

  console.log("Accessibility tests completed.");
  await browser.close();
  return results;
}

// Main function to coordinate tasks
async function main() {
  try {
    const results = await runAccessibilityTests();

    // Save results to a JSON file
    await fs.writeFile(
      "accessibility-results.json",
      JSON.stringify(results, null, 2)
    );
    console.log("Results saved to accessibility-results.json");
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}

main();
