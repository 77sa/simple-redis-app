import rabbitmq, { RMQ, Queue } from "./rabbitmq/rabbitmq";
import redis from "./redis/client";
import { addToCache, deleteFromCache, updateCache } from "./redis/redis";

enum CacheAction {
    ADD = "ADD",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
}

const processMessage = (message: any) => {
    const parsedMessage = JSON.parse(message.content.toString());

    switch (parsedMessage.action) {
        case CacheAction.ADD:
            addToCache(parsedMessage.item);
            break;
        case CacheAction.UPDATE:
            updateCache(parsedMessage.item);
            break;
        case CacheAction.DELETE:
            deleteFromCache(parsedMessage.item);
            break;
        default:
            console.log("?");
            break;
    }
};

let rmq: RMQ;
(async () => {
    await redis.connect();

    let retries = 5;
    while (retries) {
        try {
            rmq = await rabbitmq("amqp://rabbitmq", Queue.Posts);
            rmq.receiveMessages(processMessage, true);
            break;
        } catch (err) {
            retries -= 1;
            await new Promise((res) => setTimeout(res, 5000));
        }
    }
})();
