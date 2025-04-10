const puppeteer = require("puppeteer");
const fs = require("fs").promises;
require("dotenv").config();

// Load URLs to test
const urls = require("./urls.json");

// Max number of concurrent tests
const MAX_CONCURRENT_TESTS = 2;
const queue = [];
let runningTests = 0;

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

// Function to safely navigate to a URL with a timeout, avoiding puppeteers internal overloads
async function safeGoto(page, url, timeout = 100000) {
  return await Promise.race([
    (async () => {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout });

      // Example: wait for document to be fully ready
      await page.waitForFunction(() => document.readyState === "complete", {
        timeout: 10000,
      });

      return true;
    })(),

    // Manual timeout fallback
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Manual timeout hit")), timeout + 10000)
    ),
  ]);
}

// Function to retrieve cookies via a login URL
async function getCookiesForUser(loginUrl) {
  console.log(`Logging in via ${loginUrl}...`);
  const page = await browser.newPage();

  const shouldIgnore = (url) =>
    url.includes("google-analytics") ||
    url.includes("doubleclick") ||
    url.includes("facebookConversion") ||
    url.includes("pinterestConversion") ||
    url.includes("stash.dev.webstaurantstore.com");

  page.on("response", async (response) => {
    const url = response.url();
    const status = response.status();
    if (status >= 400 && !shouldIgnore(url)) {
      const body = await response.text();
      console.error(`[ERROR RESPONSE] ${status} from ${url}\nBody:\n${body}\n`);
    }
  });

  page.on("requestfailed", (request) => {
    const url = request.url();
    if (!shouldIgnore(url)) {
      console.error(
        `[REQUEST FAILED] ${request.failure()?.errorText} at ${url}`
      );
    }
  });

  page.on("console", (msg) => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`[BROWSER LOG] ${i}: ${msg.args()[i]}`);
  });

  // Navigate to the user-specific login URL
  await safeGoto(page, loginUrl, 100000);
  await page
    .waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 })
    .catch(() => {});

  // Wait for navigation to ensure login is complete
  await page.waitForNavigation({
    timeout: 100000,
    waitUntil: "networkidle2",
  });

  // Retrieve cookies
  const cookies = await page.cookies();

  console.log("Login successful, cookies retrieved.");
  return cookies;
}

// Function to run Axe tests on a given URL
async function runAxeTests(url, browser, cookie) {
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });
  if (cookie) {
    await page.setCookie({ SESSION_ID: cookie });
  }

  // Inject axe-core into the page
  await page.addScriptTag({ path: require.resolve("axe-core") });

  // Run axe inside the page context
  const results = await page.evaluate(async () => {
    console.log(window.axe);
    const results = await window.axe.run({
      runOnly: {
        type: "tag",
        values: [
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
          "wcag22a",
          "wcag22aa",
        ], // Only include WCAG 2.2 rules
      },
      resultTypes: ["violations", "incomplete"], // Include violations and incomplete results
    });
    console.log(results);
    return results;
  });

  await page.close();
  return results;
}

// Function to manage the queue and run tests concurrently
async function runTestInQueue() {
  if (queue.length > 0 && runningTests < MAX_CONCURRENT_TESTS) {
    const {
      url,
      adjustedUrl,
      requiresLogin,
      credentials,
      environment,
      resolve,
      reject,
    } = queue.shift();

    runningTests++;
    console.log(`Testing ${adjustedUrl}...`);
    try {
      if (requiresLogin) {
        const loginUrl = adjustEnvironment(
          `https://webstaurantstore.com/myaccount/?login_as_user=${credentials}`,
          environment
        );
        const cookies = await getCookiesForUser(loginUrl);
        // Add cookies to request headers if needed
        const cookieHeader = cookies.reduce((headers, cookie) => {
          headers[cookie.name] = cookie.value;
          return headers;
        }, {});
      }

      // Run the axe-core accessibility test
      const axeResults = await runAxeTests(adjustedUrl);

      // Resolve the promise with the test results
      resolve({
        pageName: url.pageName,
        url,
        environment,
        axeResults,
      });

      console.log(`Test completed for ${adjustedUrl}.`);
    } catch (error) {
      console.error(`Error testing ${adjustedUrl}:`, error.message);
      reject(error);
    } finally {
      runningTests--;
      startNextTest(); // Start the next test
    }
  }
}

// Function to add pages to the queue
function addTestToQueue(urlObject) {
  return new Promise((resolve, reject) => {
    const adjustedUrl = adjustEnvironment(urlObject.url, urlObject.environment);
    queue.push({
      url: urlObject,
      adjustedUrl,
      requiresLogin: urlObject.requiresLogin,
      credentials: urlObject.credentials,
      environment: urlObject.environment,
      resolve,
      reject,
    });
    startNextTest(); // Ensure the next test starts if possible
  });
}

// Function to start the next test in the queue
function startNextTest() {
  if (queue.length > 0 && runningTests < MAX_CONCURRENT_TESTS) {
    runTestInQueue(); // Start running tests concurrently
  }
}

// Function to run accessibility tests
async function runAccessibilityTests() {
  console.log("Running accessibility tests...");
  const results = [];

  // Iterate through each URL and add to the queue

  const testPromises = urls.map((urlObject) =>
    addTestToQueue(urlObject)
      .then((result) => {
        results.push(result);
      })
      .catch((error) => console.error(`Test error: ${error.message}`))
  );

  // Wait for all tests to finish
  await Promise.all(testPromises);

  console.log("Accessibility tests completed.");
  return results;
}

// Main function to coordinate tasks
async function main() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log(urls.length);
    const results = [];
    for (const url of urls) {
      const env =
        url.environment === "dev"
          ? "https://www.dev.webstaurantstore.com"
          : "https://www.webstaurantstore.com";
      let cookies;
      if (url.credentials) {
        const href = new URL("/myaccount", env);
        href.searchParams.append("login_as_user", url.credentials);
        const page = await browser.newPage();
        console.log(href.href);
        await page.goto(href.href);
        await page.waitForNetworkIdle();
        const cookies = await page.cookies();
        const sessionId = cookies.find(
          (cookie) => cookie.name === "SESSION_ID"
        );
        if (sessionId) {
          cookie = sessionId;
        }
        await page.close();
      }
      const href = new URL(url.url, env);
      console.log(href.href);
      const axeResults = await runAxeTests(href, browser, cookies);
      results.push(axeResults);
    }
    await browser.close();

    // Save results to a JSON file
    await fs.writeFile("axe-results.json", JSON.stringify(results, null, 2));
    console.log("Results saved to axe-results.json");
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}

main();
