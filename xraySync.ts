import axios from 'axios';

interface XrayTestExecutionResult {
  testKey: string;
  start: string;
  status: string;
}

const jiraAPIAuth = {
  client_id: 'YOUR_CLIENT_ID',
  client_secret: 'YOUR_CLIENT_SECRET'
};

async function getXrayToken() {
  try {
    const res = await axios.post('https://xray.cloud.getxray.app/api/v1/authenticate', JSON.stringify(jiraAPIAuth), {
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  } catch (err) {
    console.log(err);
  }
}

function extractTestKey(title: string) {
  const regex = /KEY-\d+/;
  const match = title.match(regex);

  return match[1];
}

function convertReportToArray(): XrayTestExecutionResult[] {
  const testResults = [];
  const report = require('path/to/playwright-report/results.json');

  if (report) {
    report.suites.forEach((suite) => {
      suite.suites.forEach((subSuite) => {
        subSuite.specs.forEach((spec) => {
          spec.tests.forEach((test) => {
            const lastRun = test.results[test.results.length - 1];

            const testObject = {
              testKey: extractTestKey(spec.title),
              start: lastRun.startTime,
              status: lastRun.status
            };

            testResults.push(testObject);
          });
        });
      });
    });

    return testResults;
  } else {
    console.log('No JSON playwright report found');
  }
}

async function importExecutionResultsToXray(
  testExecutionKey: string,
  testsExecutionResults: XrayTestExecutionResult[],
  token: string
) {
  const xrayReport = {
    testExecutionKey,
    tests: testsExecutionResults
  };

  try {
    const apiUrl = 'https://xray.cloud.getxray.app/api/v1/import/execution';

    const response = await axios.post(apiUrl, JSON.stringify(xrayReport), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    });

  } catch (error) {
    console.error('Error sending JSON to Xray:', error.message);
  }
}

const testsExecutionResults = convertReportToArray();
const testExecutionKey = 'KEY-999';
getXrayToken().then((token) => importExecutionResultsToXray(testExecutionKey, testsExecutionResults, token));
