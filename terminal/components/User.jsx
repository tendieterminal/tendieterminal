import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { timeAgo } from "../utils";

import Error from "./Error.jsx";

const User = () => {
  const { handle } = useParams();

  const sortDefault = "new";
  const sortOptions = ["New", "Top"];

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);

  const [about, setAbout] = useState(null);
  const [things, setThings] = useState(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(sortDefault);
  const [sortType, time] = sort.split(" ");

  // https://www.reddit.com/user/handle/about.json
  // https://www.reddit.com/user/handle/overview.json?sort=top
  // https://www.reddit.com/user/handle/comments.json?sort=top
  const endpoint = (endpoint) => {
    return new URL(`${global.REDDIT}/user/${handle}/${endpoint}.json`);
  };

  useEffect(() => {
    setLoading(true);
    fetch(endpoint("about").href)
      .then((response) => response.json())
      .then((json) => {
        setLoading(false);
        if (json.error && json.error === 404) {
          setError("This user does not exist");
        } else {
          console.log(json);
          setAbout(json.data);
          setError(null);
        }
      })
      .catch((e) => {
        setLoading(false);
        setAbout(null);
        setError("Failed to fetch user");
        console.error("Error:", e);
      });
  }, []);

  return (
    <div>
      {error && <Error message={error} />}
      {about !== null && (
        <div>
          {about.name}
          <br />
          Joined {timeAgo(about.created_utc)}
          <br />
          {about.comment_karma} Comment Karma
          <br />
          {about.link_karma} Post Karma
        </div>
      )}
    </div>
  );
};

export default User;
