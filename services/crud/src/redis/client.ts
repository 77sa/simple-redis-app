import * as redis from "redis";

const url = "redis://:redis@redis:6379";

const client = redis.createClient({ url });

export default client;
