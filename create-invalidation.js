if (!process.env["CLOUDFRONT_DISTRIBUTION_ID"]) {
  throw new Error("CLOUDFRONT_DISTRIBUTION_ID env var must be set");
}

CLOUDFRONT_DISTRIBUTION_ID = process.env["CLOUDFRONT_DISTRIBUTION_ID"];

const AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({profile: '0xproject'});
AWS.config.credentials = credentials;

const cloudfront = new AWS.CloudFront();
const util = require("./lib/util");

function createCloudfrontInvalidation(items = []) {
  return cloudfront
    .createInvalidation({
      DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        Paths: { Quantity: items.length, Items: items },
        CallerReference: new Date().toISOString()
      }
    })
    .promise()
    .then(console.log);
}

function invalidatePaths(paths) {
  const cloudFrontUrls = paths.map(path => util.createUri(path, true));

  return createCloudfrontInvalidation(cloudFrontUrls);
}

function invalidateEverything() {
  return createCloudfrontInvalidation(["/*"]);
}

invalidateEverything();
