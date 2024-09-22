const Redis = require("ioredis");


const redis = new Redis({
  port: 14109, 
  host: 'redis-14109.c334.asia-southeast2-1.gce.redns.redis-cloud.com',
  username: "default", 
  password: "48z2jiFSpIw3CvqQTt6QApDpGZcYvDIq", 
  db: 0, 
});

module.exports = redis;
