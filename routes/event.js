const express = require("express");
const { body } = require("express-validator");

const isAuth = require("../middleware/is-auth");
const router = express.Router();

const eventController = require("../controllers/event");

//get all event
router.get("/events", isAuth, eventController.getEvents);

//Add event
router.post(
  "/events",
  isAuth,
  [
    body("title").trim().isLength({ min: 1, max: 50 }),
  ],
  eventController.addEvent
);

//get a event
router.get("/events/:eventId", isAuth, eventController.getSinglePost);

//update event
router.put(
  "/events/:eventId",
  isAuth,
  [
    body("title").trim().isLength({ min: 1, max: 50 }),
  ],
  eventController.updateEvent
);

router.post("/events/:eventId/likes", isAuth, [], eventController.likeEvent);

router.post(
  "/events/:eventId/participates",
  isAuth,
  [],
  eventController.participateEvent
);

router.post(
  "/events/:eventId/comments",
  isAuth,
  [body("comment").trim().isLength({ min: 1, max: 255 })],
  eventController.addComment
);

router.put(
  "/events/:eventId/comments",
  isAuth,
  [
    body("comment")
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("please type something"),
  ],
  eventController.updateComment
);


module.exports = router;
