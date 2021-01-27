const jsforce = require("jsforce");
const config = require("../config");

// Utils
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const _getWebringWebsites = (sf, webringId) => {
  return sf
    .query(
      `SELECT Id, Name, URL__c, Webring__c
       FROM Website__c
       WHERE Webring__c  = '${webringId}'
       ORDER BY Name`
      // TODO: order by a different field? Or remove this and it will be the default order?
      // https://github.com/crcastle/weirdos-salesforce-app/issues/24
    )
    .then(({ records }) => records)
    .then((websites) => {
      if (!websites.length) {
        return [];
      }
      return websites.map((w) => w.URL__c);
    });
};

const addWebsite = async (sf, orgId, webring, website) => {
  const webringId = await _getWebringByName(sf, webring);
  if (webringId) {
    await sf
      .sobject("Website__c")
      .create({ Name: orgId, URL__c: website, Webring__c: webringId });
  }
};

const deleteWebsites = async (sf, orgId) => {
  const websiteIds = await sf
    .query(`SELECT Id FROM Website__c WHERE Name = '${orgId}'`)
    .then(({ records }) => records)
    .then((websiteIds) => websiteIds.map((w) => w.Id));
  await sf.sobject("Website__c").destroy(websiteIds);
};

const _getWebringByName = async (sf, webringName) => {
  return sf
    .query(
      `SELECT Id
            FROM Webring__c
            WHERE Name = '${webringName}'`
    )
    .then(({ records }) => records[0])
    .then((webring) => webring && webring.Id);
};

const getRandomWebringForSticker = async (sf, stickerName) => {
  const webringId = await _getWebringByName(sf, stickerName);

  if (!webringId) {
    return null;
  }

  const websites = await _getWebringWebsites(sf, webringId);

  return random(websites);
};

// All query methods that will be exposed to the server
const methods = {
  getRandomWebringForSticker,
  deleteWebsites,
  addWebsite,
};

module.exports.init = () => {
  let sf = null;

  const connect = () => {
    sf = new jsforce.Connection({
      loginUrl: config.salesforce.loginUrl,
    });

    return sf.login(
      config.salesforce.username,
      config.salesforce.password + config.salesforce.authToken
    );
  };

  const login = async () => connect();

  const wrapApiMethod = (rawMethod) => async (...args) => {
    // try to login first
    if (sf === null) {
      await login();
    }

    // Check if sf instance has been created, if not throw an error
    if (sf === null) {
      throw new Error();
    }

    return rawMethod(sf, ...args);
  };

  return {
    ...Object.keys(methods).reduce((acc, key) => {
      acc[key] = wrapApiMethod(methods[key]);
      return acc;
    }, {}),
    login,
    connect,
    get connection() {
      return sf;
    },
  };
};
