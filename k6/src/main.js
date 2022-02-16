import { sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

const url = "http://crud:8000";

const submitFailRate = new Rate("failed form submits");

export const options = {
    vus: 5,
    duration: "5s",
};

const get = () => {
    const posts = http.get(url);
    return JSON.parse(posts.body).data.length;
};

const create = () => {
    const payload = {
        title: "load",
        body: "test",
    };

    const createPost = http.post(url, payload);

    submitFailRate.add(createPost.status !== 200);

    const response = JSON.parse(createPost.body);

    sleep(15);
    return response;
};

const test = (initcount, secondcount) => {
    submitFailRate.add(!(initcount + options.vus == secondcount));
};

export default () => {
    const initPostCount = get();
    create();
    sleep(10);
    const secondPostCount = get();

    test(initPostCount, secondPostCount);
};
