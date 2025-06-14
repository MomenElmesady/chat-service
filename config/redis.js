// const Redis = require("ioredis");
// const redis = new Redis({
//   host: process.env.REDIS_HOST,
//   port: 6379,
// });

// import { Redis } from '@upstash/redis'
const {Redis} = require("@upstash/redis")
const redis = new Redis({
  url: 'https://great-minnow-12205.upstash.io',
  token: 'AS-tAAIjcDFhNDk3ZDAwZGM5NzY0ODAzOGQ4YWExMjEyMjFmZDA1M3AxMA',
})

module.exports = redis;
