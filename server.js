const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");
const salesforce = require("./lib/salesforce");

const port = process.env.PORT || 3030;
const app = express();
const server = http.createServer(app);
const sf = salesforce.init();

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

app.get("/sticker/:stickerName", async (req, res) => {
  try {
    const stickerName = req.params.stickerName;
    if (stickerName == null) {
      res.status(400).send("Error: please specify a sticker name");
      return;
    }

    const website = await sf.getRandomWebringForSticker(req.params.stickerName);
    if (website) {
      res.redirect(website);
      return;
    }

    res.status(404).send("No website found");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/add", async (req, res) => {
  const { orgId, webrings, website } = req.body;
  try {
    // Cleanup
    await sf.deleteWebsites(orgId);

    // Add new
    const tasks = webrings
      .split(",")
      .map((webring) => sf.addWebsite(orgId, webring, website));
    Promise.all(tasks).then(() => {
      res.status(201).send({ message: "Card added to webrings" });
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.message });
  }
});

app.post("/delete", async (req, res) => {
  const { orgId } = req.body;
  try {
    await sf.deleteWebsites(orgId);
    res.status(200).send({ message: "Card deleted from webrings" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
