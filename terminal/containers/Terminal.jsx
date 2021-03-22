import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import Subreddit from "../components/Subreddit.jsx";
import Comments from "../components/Comments.jsx";
import User from "../components/User.jsx";
import Error from "../components/Error.jsx";

// const initialState = {
//   theme: localStorage.getItem("theme") || "bloomberg",
//   token: localStorage.getItem("token") || getAnonymousToken(),
// };

const Terminal = () => {
  return (
    <Router basename="/terminal">
      <Switch>
        <Route exact path="/" component={Subreddit} />
        <Route exact path="/r/:sub?" component={Subreddit} />
        <Route exact path="/r/:sub/comments/:id/:slug" component={Comments} />
        <Route exact path="/(u|user)/:handle" component={User} />
        <Route component={Error} />
      </Switch>
    </Router>
  );
};

export default Terminal;
