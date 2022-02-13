import redis, { RedisKeys } from "./client";

const getParsedCache = async () => {
    const cache = await redis.get(RedisKeys.Posts);
    if (!cache) return [];

    return JSON.parse(cache);
};

export const addToCache = async (item: any) => {
    const posts = await getParsedCache();

    posts.push(item);
    await redis.set(RedisKeys.Posts, JSON.stringify(posts));
};

export const updateCache = async (item: any) => {
    const posts = await getParsedCache();

    for (let i = 0; i < posts.length; i++) {
        if (posts[i].id == item.id) {
            posts[i] = item;
        }
    }
    await redis.set(RedisKeys.Posts, JSON.stringify(posts));
};

export const deleteFromCache = async (item: any) => {
    let posts = await getParsedCache();

    posts = posts.filter((post: any) => post.id != item.id);
    await redis.set(RedisKeys.Posts, JSON.stringify(posts));
};
