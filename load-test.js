import http from "k6/http";
import { check } from "k6";

const ENDPOINT = "http://localhost:8080";

export const options = {
  scenarios: {
    random_journeys: {
      executor: "constant-arrival-rate",
      rate: 20,
      duration: "20s",
      timeUnit: "1s",
      preAllocatedVUs: 100,
    }
  },
  summaryTrendStats: ['min', 'med','p(80)', 'p(95)', 'p(99)', 'max', 'count'],
}

export default function calc_it() {
  let res = http.get(ENDPOINT);
  check(res, {
    "status is 200": (r) => r.status == 200,
  });
}
