// const Redis = require("ioredis");
// const redis = new Redis({
//   host: process.env.REDIS_HOST,
//   port: 6379,
// });

// import { Redis } from '@upstash/redis'
const { Redis } = require("@upstash/redis")
const redis = new Redis({
  url: 'https://concrete-wasp-46392.upstash.io',
  token: 'AbU4AAIjcDE2ZDNkMGI1MTI0Yjc0NmNmODIzM2E0YzA2MjllY2JkNHAxMA',
})

module.exports = redis;