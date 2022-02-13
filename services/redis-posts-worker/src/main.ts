import rabbitmq, { RMQFunctions, Queue } from "./rabbitmq/rabbitmq";
import redis from "./redis/client";
import { addToCache, deleteFromCache, updateCache } from "./redis/redis";

enum CacheAction {
    ADD = "ADD",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
}

const processMessage = (message: any) => {
    const parsedMessage = JSON.parse(message.content.toString());
    console.log(parsedMessage);

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

let rmq: RMQFunctions;
let timeout = process.env.ENV == "DEV" ? 1000 : 15000;
(async () => {
    await redis.connect();
    setTimeout(async () => {
        rmq = await rabbitmq("amqp://rabbitmq", Queue.Posts);
        rmq.receiveMessages(processMessage, true);
    }, timeout);
})();
