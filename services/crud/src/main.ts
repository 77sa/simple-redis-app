import express, { Request, Response } from "express";
import { errorHandler } from "./middleware/error";
import db, { PG } from "./db/pool";
import redis, { RedisKeys } from "./redis/client";

import rabbitmq, { RMQFunctions, Queue } from "./rabbitmq/rabbitmq";

enum CacheAction {
    ADD = "ADD",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
}

let rmq: RMQFunctions;
let timeout = process.env.ENV == "DEV" ? 1000 : 15000;
(async () => {
    await redis.connect();
    setTimeout(async () => {
        rmq = await rabbitmq("amqp://rabbitmq", Queue.Posts);
    }, timeout);
})();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", async (_req: Request, res: Response) => {
    const posts = await redis.get(RedisKeys.Posts);
    if (posts) return res.json({ data: JSON.parse(posts) });

    const items = await db.getAll(PG.PostsTable);
    await redis.set(RedisKeys.Posts, JSON.stringify(items.rows));

    return res.json({ data: items.rows });
});

app.get("/:id", async (req: Request, res: Response) => {
    const { id } = req.params;

    const post = await redis.get(RedisKeys.Post + id);
    if (post) return res.json({ data: JSON.parse(post) });

    const item = await db.getItem(PG.PostsTable, {
        id,
    });
    redis.set(RedisKeys.Post + id, JSON.stringify(item.rows[0]));

    return res.json({ data: item.rows[0] });
});

app.post("/", async (req: Request, res: Response) => {
    const { title, body } = req.body;

    const item = await db.putItem(
        PG.PostsTable,
        {
            title,
            body,
        },
        {
            id: 4,
            returning: ["*"],
        }
    );

    const message = JSON.stringify({
        item: item.rows[0],
        action: CacheAction.ADD,
    });
    rmq.sendMessage(message);

    return res.json({ message: "Success" });
});

app.patch("/", async (req: Request, res: Response) => {
    const { id, title, body } = req.body;
    if (!title && !body)
        return res.status(400).json({ message: "No title or body" });

    let update = {};
    if (title) Object.assign(update, { title });
    if (body) Object.assign(update, { body });

    const item = await db.updateItem(
        PG.PostsTable,
        update,
        { id },
        { returning: ["*"] }
    );
    if (!item.rowCount)
        return res.status(404).json({ message: "Post not found" });

    const message = JSON.stringify({
        item: item.rows[0],
        action: CacheAction.UPDATE,
    });
    rmq.sendMessage(message);

    return res.json({ message: "Success" });
});

app.delete("/:id", async (req: Request, res: Response) => {
    const { id } = req.params;

    const item = await db.deleteItem(
        PG.PostsTable,
        { id },
        { returning: ["*"] }
    );
    if (!item.rowCount)
        return res.status(404).json({ message: "Post not found" });

    const message = JSON.stringify({
        item: item.rows[0],
        action: CacheAction.DELETE,
    });
    rmq.sendMessage(message);

    return res.json({ message: "Success" });
});

app.use(errorHandler);
app.listen(8000, () => console.log("Server started"));
