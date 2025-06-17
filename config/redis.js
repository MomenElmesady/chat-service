// const Redis = require("ioredis");
// const redis = new Redis({
//   host: process.env.REDIS_HOST,
//   port: 6379,
// });

// import { Redis } from '@upstash/redis'
const {Redis} = require("@upstash/redis")
const redis = new Redis({
  url: 'https://causal-poodle-44170.upstash.io',
  token: 'AayKAAIjcDEzY2I5MmVjNzZkNjc0MzI5YTc1MTAwNDQxOGM4YTUxNnAxMA',
})

module.exports = redis;
