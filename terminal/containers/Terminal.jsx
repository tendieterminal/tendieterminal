import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import Subreddit from "../components/Subreddit.jsx";
import Listing from "../components/Listing.jsx";
import Subscription from "../components/Subscription.jsx";

// const initialState = {
//   theme: localStorage.getItem("theme") || "bloomberg",
//   token: localStorage.getItem("token") || getAnonymousToken(),
// };

const Terminal = () => {
  return (
    <Router basename="/terminal">
      <Switch>
        <Route exact path="/" component={Subreddit} />
        <Route exact path="/comments/:sub/:id" component={Listing} />
        <Route exact path="/subscription" component={Subscription} />
      </Switch>
    </Router>
  );
};

export default Terminal;
