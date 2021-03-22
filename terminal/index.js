import React from "react";
import ReactDOM from "react-dom";
import Terminal from "./containers/Terminal.jsx";

import "./assets/styles/bloomberg.css";

global.REDDIT = "https://www.reddit.com";

ReactDOM.render(<Terminal />, document.getElementById("root"));
