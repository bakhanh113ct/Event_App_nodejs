const express = require("express");
const { body } = require("express-validator");

const isAuth = require("../middleware/is-auth");
const router = express.Router();

const eventController = require("../controllers/event");

router.get("/events", isAuth, eventController.getEvents);

router.get("/events", isAuth, eventController.searchEvents);

router.post(
  "/addEvent",
  isAuth,
  [
    body("date").isDate().withMessage("Please enter a valid date"),
    body("title").trim().isLength({ min: 1, max: 50 }),
    // body('creatorId').custom()
  ],
  eventController.addEvent
);

router.get("/getEvent/:eventId", isAuth, eventController.getSinglePost);

router.put(
  "/updateEvent/:eventId",
  isAuth,
  [
    body("date").isDate().withMessage("Please enter a valid date"),
    body("title").trim().isLength({ min: 1, max: 50 }),
  ],
  eventController.updateEvent
);

router.post("/likeEvent/:eventId", isAuth, [], eventController.likeEvent);

router.post(
  "/participateEvent/:eventId",
  isAuth,
  [],
  eventController.participateEvent
);

router.post(
  "/addComment/:eventId",
  isAuth,
  [body("comment").trim().isLength({ min: 1, max: 255 })],
  eventController.addComment
);

router.put(
  "/updateComment/:eventId",
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
