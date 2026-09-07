module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start -- --hostname 127.0.0.1 --port 3200",
      startServerReadyPattern: "Ready in",
      startServerReadyTimeout: 120000,
      url: [
        "http://127.0.0.1:3200/",
        "http://127.0.0.1:3200/learn/cs101/fullstack-intro",
        "http://127.0.0.1:3200/roadmap",
        "http://127.0.0.1:3200/trust",
      ],
      numberOfRuns: 3,
      settings: {
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 640,
          deviceScaleFactor: 2,
        },
        throttlingMethod: "devtools",
        chromeFlags: "--headless --no-sandbox --disable-gpu",
        locale: "vi",
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.65 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
      },
    },
  },
};
