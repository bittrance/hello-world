import http from "k6/http";
import { check } from "k6";

const ENDPOINT = __ENV.HELLO_REST_ENDPOINT || "http://localhost:8080";

export const options = {
  scenarios: {
    get_greeting: {
      executor: "constant-arrival-rate",
      rate: 20,
      duration: "20s",
      timeUnit: "1s",
      preAllocatedVUs: 100,
    }
  },
  summaryTrendStats: ['min', 'med','p(80)', 'p(99)', 'max', 'count'],
}

export default function() {
  let res = http.get(ENDPOINT);
  if(res.status != 200) {
    console.log(`Endpoint returned ${res.status}: ${res.body}`);
  }
  check(res, {
    "status is 200": (r) => r.status == 200,
  });
}
