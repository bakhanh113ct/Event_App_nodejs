const { validationResult } = require("express-validator");
const date = require("date-and-time");

const db = require("../utils/database");

exports.getEvents = (req, res, next) => {
  const search = req.query.search || "";
  const currentPage = req.query.page || 0;
  const perPage = 10;
  let totalItems;

  console.log(search);
  db.query(
    search == ""
      ? "SELECT * FROM EVENT LIMIT ? OFFSET ?"
      : "SELECT * FROM EVENT, CATEGORYCONTAINED WHERE EVENT.eventId = CATEGORYCONTAINED.eventId AND CATEGORYCONTAINED.title like ?",
    search == ""
      ? [perPage, currentPage * perPage]
      : ["%" + search + "%", perPage, currentPage * perPage]
      
  )
    .then(([data, meta]) => {
      // console.log(data);
      return res.status(200).json(data);
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      console.log(err);
      err.message = "Can't load events";
      next(err);
    });
};

exports.getSinglePost = async (req, res, next) => {
  const eventId = req.params.eventId;
  // console.log(eventId);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    next(err);
  }
  try {
    const event = await db.query("SELECT * FROM event WHERE eventId = ?", [
      eventId,
    ]);

    const likes = await db.query("SELECT * FROM EventLiked WHERE eventId = ?", [
      eventId,
    ]);

    const participates = await db.query(
      "SELECT * FROM participate WHERE eventId = ?",
      [eventId]
    );

    const comments = await db.query(
      "SELECT * FROM EVENTCOMMENTED WHERE eventId = ?",
      [eventId]
    );

    const categories = await db.query(
      "SELECT * FROM categorycontained WHERE eventId = ?",
      [eventId]
    );
    // console.log(event[1]);
    if (event[0].length == 0) {
      console.log("no object");
      const error = new Error("Can't find event");
      error.statusCode = 422;
      throw error;
    }

    const result = {
      event: event[0][0],
      likes: likes[0],
      participate: participates[0],
      comments: comments[0],
      categories: categories[0],
    };

    res.status(200).json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    if (!err.message) {
      err.message = "Can't find event!!";
    }
    next(err);
  }
};

exports.addEvent = async (req, res, next) => {
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed.");
      error.statusCode = 422;
      error.data = errors.array();
      console.log("validation");
      throw error;
    }

    if (!req.isAdmin) {
      const error = new Error("You're not admin");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const creatorId = req.body.creatorId;
    const title = req.body.title;
    const description = req.body.description;
    const image = req.body.image;
    const date = req.body.date;
    const location = req.body.location;
    const categories = req.body.categories;

    console.log(categories);
    const insert_data = await db.query(
      "INSERT INTO EVENT (creatorId, title, description, image, date, location) value (?, ?, ?, ?, ?, ?)",
      [creatorId, title, description, image, date, location],
      function (err, result) {
        console.log(result.insertId);
        if (err) {
          throw err;
        }
      }
    );

    await categories.forEach(async (element) => {
      var temp = await db.query("SELECT * FROM CATEGORY WHERE name = ?", [
        element,
      ]);
      if (temp[0].length == 0) {
        const category = await db.query(
          "INSERT INTO CATEGORY (name, type) value (?, ?)",
          [element, "type"]
        );

        temp = await db.query("SELECT * FROM CATEGORY WHERE categoryId = ?", [
          category[0].insertId,
        ]);

        db.query(
          "INSERT INTO CATEGORYCONTAINED (title, categoryId, eventId) value (?, ?, ?)",
          [temp[0][0].name, temp[0][0].categoryId, insert_data[0].insertId]
        )
          .then((result) => {
            console.log("success");
            // res.status(200).json("add successful");
          })
          .catch((err) => {
            console.log(err);
            throw err;
          });
      } else {
        console.log(temp[0][0].name);
        db.query(
          "INSERT INTO CATEGORYCONTAINED (title, categoryId, eventId) value (?, ?, ?)",
          [temp[0][0].name, temp[0][0].categoryId, insert_data[0].insertId]
        )
          .then((result) => {
            console.log("success");
            // res.status(200).json("add successful");
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
    res.status(200).json("add successful");
  } catch (err) {
    next(err);
  }
};

exports.updateEvent = (req, res, next) => {
  const eventId = req.params.eventId;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    if (!req.isAdmin) {
      const error = new Error("You're not admin");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const title = req.body.title;
    const description = req.body.description;
    const image = req.body.image;
    const date = req.body.date;
    const location = req.body.location;

    db.query(
      "UPDATE EVENT SET title = ?, description = ?, image = ?, date = ?, location = ? WHERE eventId = ? ",
      [title, description, image, date, location, eventId]
    )
      .then((result) => {
        res.status(200).json({
          message: "update event successful",
        });
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        err.message = "Can't not update event!!";
        next(err);
      });
  } catch (err) {
    next(err);
  }
};

exports.likeEvent = (req, res, next) => {
  const eventId = req.params.eventId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const userId = req.body.userId;
  var now = new Date();
  now = date.format(now, "YYYY-MM-DD HH:mm:ss", true);

  db.query("SELECT * FROM EVENTLIKED WHERE eventId = ? AND userId = ?", [
    eventId,
    userId,
  ])
    .then(([data, meta]) => {
      if (data.length == 0) {
        db.query(
          "INSERT INTO EVENTLIKED (eventId, userId, createdAt, updatedAt) values (?, ?, ?, ?)",
          [eventId, userId, now, now]
        )
          .then((result) => {
            return res.json({ msg: "Liked" });
          })
          .catch((err) => {
            const error = new Error("Like Failed.");
            error.statusCode = 422;
            throw err;
          });
      } else {
        db.query("DELETE FROM EVENTLIKED WHERE eventId = ? AND userId = ?", [
          eventId,
          userId,
        ])
          .then((result) => {
            return res.json({ msg: "UnLiked" });
          })
          .catch((err) => {
            const error = new Error("UnLike Failed.");
            error.statusCode = 422;
            throw err;
          });
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      if (!err.message) {
        err.message = "Can't not update event!!";
      }
      next(err);
    });
};

exports.participateEvent = (req, res, next) => {
  const eventId = req.params.eventId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const userId = req.body.userId;
  var now = new Date();
  now = date.format(now, "YYYY-MM-DD HH:mm:ss", true);

  db.query("SELECT * FROM PARTICIPATE WHERE eventId = ? AND userId = ?", [
    eventId,
    userId,
  ])
    .then(([data, meta]) => {
      if (data.length == 0) {
        db.query(
          "INSERT INTO PARTICIPATE (eventId, userId, createdAt, updatedAt) values (?, ?, ?, ?)",
          [eventId, userId, now, now]
        )
          .then((result) => {
            return res.json({ msg: "Participated" });
          })
          .catch((err) => {
            const error = new Error("Participated Failed.");
            error.statusCode = 422;
            throw err;
          });
      } else {
        db.query("DELETE FROM PARTICIPATE WHERE eventId = ? AND userId = ?", [
          eventId,
          userId,
        ])
          .then((result) => {
            return res.json({ msg: "InPARTICIPATE" });
          })
          .catch((err) => {
            const error = new Error("InPARTICIPATE Failed.");
            error.statusCode = 422;
            throw err;
          });
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      if (!err.message) {
        err.message = "Can't not participate event!!";
      }
      next(err);
    });
};

exports.addComment = (req, res, next) => {
  const eventId = req.params.eventId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const userId = req.body.userId;
  const comment = req.body.comment;
  var now = new Date();
  now = date.format(now, "YYYY-MM-DD HH:mm:ss", true);

  db.query(
    "INSERT INTO EVENTCOMMENTED (eventId, userId, comment, createdAt, updatedAt) values (?, ?, ?, ?, ?)",
    [eventId, userId, comment, now, now]
  )
    .then(([data, meta]) => {
      res.status(200).json({
        msg: "Comment added",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      if (!err.message) {
        err.message = "Can't not add comment!!";
      }
      next(err);
    });
};

exports.updateComment = (req, res, next) => {
  const eventId = req.params.eventId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const userId = req.body.userId;
  const comment = req.body.comment;
  var now = new Date();
  now = date.format(now, "YYYY-MM-DD HH:mm:ss", true);

  db.query(
    "UPDATE EVENTCOMMENTED SET comment = ?, updatedAt = ? WHERE eventId = ? AND userId = ?",
    [comment, now, eventId, userId]
  )
    .then(([data, meta]) => {
      res.status(200).json({
        msg: "Comment updated",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      if (!err.message) {
        err.message = "Can't not update comment!!";
      }
      next(err);
    });
};

exports.searchEvents = (req, res, next) => {
  const searchKey = req.query;

  for (key in searchKey) {
    console.log(searchKey[key]);
  }

  // console.log(searchKey['city']);

  res.json("255");
};
