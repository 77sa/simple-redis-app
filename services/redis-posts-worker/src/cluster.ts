import cluster from "cluster";
import { cpus } from "os";

const CPUs = cpus().length;

if (cluster.isPrimary) {
    console.log(`Leader ${process.pid} started`);

    for (let i = 0; i < CPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, _code, _signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
} else {
    require("./main.ts");

    console.log(`Worker ${process.pid} started`);
}
