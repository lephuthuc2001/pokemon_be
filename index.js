const express = require("express");
const app = express();

require("dotenv").config();

const bodyParser = require("body-parser");
const cors = require("cors");
const homeController = require("./routes/home");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json());

app.use(cors());
app.use(express.static("./public"));

app.use("/pokemons", homeController);

app.use("/", (req, res, next) => {
  res.status(200).send("hello from express baby");
});

app.listen(process.env.PORT || 8000, function () {
  console.log("Express server listening on port 5000");
});
