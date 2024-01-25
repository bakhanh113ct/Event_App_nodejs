const redis = require("redis");
require("dotenv").config();

const redisClient = redis.createClient({ url: process.env.REDIS_URL });

// export default redisClient

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
