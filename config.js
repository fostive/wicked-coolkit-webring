module.exports = {
  salesforce: {
    loginUrl: process.env.SF_URL || "https://login.salesforce.com",
    username: process.env.SF_USERNAME,
    password: process.env.SF_PASSWORD,
    authToken: process.env.SF_AUTH_TOKEN || "",
  },
};
