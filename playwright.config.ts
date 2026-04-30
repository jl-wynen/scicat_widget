import { defineConfig, devices } from "@playwright/test";

const FIXTURE_PORT = 8000;
const JUPYTER_PORT = 8080;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testIgnore: "**/.ipynb_checkpoints/**",

    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,

    retries: process.env.CI ? 1 : 0,
    timeout: 10_000,

    fullyParallel: false,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,

    reporter: [["list"], ["html"]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        trace: "on-first-retry",
        video: "retain-on-failure",
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: "components chromium",
            testDir: "./tests/components",
            testMatch: /.*\.spec\.ts$/,
            use: {
                ...devices["Desktop Chrome"],
                baseURL: `http://localhost:${FIXTURE_PORT}`,
            },
        },
        {
            name: "components firefox",
            testDir: "./tests/components",
            testMatch: /.*\.spec\.ts$/,
            use: {
                ...devices["Desktop Firefox"],
                baseURL: `http://localhost:${FIXTURE_PORT}`,
            },
        },
        // TODO missing dependencies
        // {
        //     name: "components webkit",
        //     testDir: "./tests/components",
        //     testMatch: /.*\.spec\.ts$/,
        //     use: {
        //         ...devices["Desktop Safari"],
        //         baseURL: `http://localhost:${FIXTURE_PORT}`,
        //     },
        // },

        // TODO other browsers?
        {
            name: "e2e chromium",
            testDir: "./tests/e2e",
            testMatch: /.*\.spec\.ts$/,
            use: {
                ...devices["Desktop Chrome"],
                baseURL: `http://localhost:${JUPYTER_PORT}`,
            },
        },

        // {
        //     name: "jupyterlab-firefox",
        //     testMatch: "test/jupyterlab/**/*.test.ts",
        //     testIgnore: "**/.ipynb_checkpoints/**",
        //     use: {
        //         contextOptions: {
        //             // https://github.com/microsoft/playwright/issues/13037
        //             permissions: [],
        //         },
        //         browserName: "firefox",
        //     },
        //     // We do not want to match exactly on Firefox
        //     ignoreSnapshots: true,
        // },

        // {
        //     name: "firefox",
        //     use: { ...devices["Desktop Firefox"] },
        // },

        // {
        //     name: "webkit",
        //     use: { ...devices["Desktop Safari"] },
        // },

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
    ],

    /* Run your local dev server before starting the tests */
    webServer: [
        {
            command: `npm run fixture:serve -- --serve=${FIXTURE_PORT}`,
            url: `http://localhost:${FIXTURE_PORT}`,
            reuseExistingServer: !process.env.CI,
        },
        {
            // JupyterLab for Galata
            command:
                "npm run build && " +
                "uv run jupyter lab --config ./tests/e2e/jupyter_server_test_config.py " +
                `--port=${JUPYTER_PORT}`,
            url: `http://localhost:${JUPYTER_PORT}/lab`,
            timeout: 120_000,
            reuseExistingServer: !process.env.CI,
        },
    ],
});

// module.exports = require("@jupyterlab/galata/lib/playwright-config");
