const express = require("express");

const bodyParser = require("body-parser");
const app = express();

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/event");

app.use(bodyParser.json()); // application/json

app.use("/auth", authRoutes);
app.use("/event", eventRoutes);

app.all("*", (req, res, next) => {
  const err = new Error("can't find route");
  err.statusCode = 404;
  err.status = "fail";

  next(err);
});

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

app.listen(6060);
