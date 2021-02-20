import { pi } from "../utils.js";

addEventListener("message", (event) => {
  console.log("worker event message", event.target, event.type);
  postMessage(pi(event.data));
});
