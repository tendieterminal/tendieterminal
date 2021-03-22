import React, { useEffect, useReducer, useState, createContext } from "react";
import { useParams } from "react-router-dom";
import useDynamicRefs from "use-dynamic-refs";

import {
  reducer,
  emptyState,
  selectors,
  actionCreators,
} from "../reducers/comments.js";

import { normalizeComments } from "../utils/reddit.js";

import SortButton from "./SortButton.jsx";
import Post from "./Post.jsx";
import Replies from "./Replies.jsx";
import Subscription from "./Subscription.jsx";
import Error from "./Error.jsx";

export const CommentsContext = createContext();

const Comments = () => {
  const { sub, id, slug } = useParams();

  const sortDefault = "new";
  const sortOptions = ["New", "Best", "Top", "Controversial", "Old"];

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);

  const [post, setPost] = useState(null);
  const [state, dispatch] = useReducer(reducer, emptyState);

  const [sort, setSort] = useState(sortDefault);
  const [sortType, time] = sort.split(" ");

  const [streaming, setStreaming] = useState(false);

  const permalink = `${global.REDDIT}/r/${sub}/comments/${id}/${slug}`;
  const listing = `${global.REDDIT}/r/${sub}/comments/${id}`;

  const api = new URL(
    `${listing}/.json?sort=${streaming ? "new" : sortType}` +
      (time ? `&t=${time}&raw_json=1` : `&raw_json=1`)
  );

  const getCommentIds = (state) => {
    const ids = selectors.getIds(state, { type: "comment" });
    return ids.filter((id) => {
      const comment = selectors.getEntity(state, { type: "comment", id });
      return streaming ? !!comment : !!comment && !comment.parent;
    });
  };

  const mapChildren = (json) => json.data.children.map((l) => l.data);

  useEffect(() => {
    setLoading(true);

    fetch(api.href)
      .then((response) => response.json())
      .then((json) => {
        setLoading(false);

        setLastRequest(json);

        setPost(mapChildren(json[0]));

        const normalized = normalizeComments(json[1]);

        dispatch(
          actionCreators.setState({
            entities: {
              comment: normalized,
            },
            ids: {
              comment: streaming
                ? Object.keys(normalized).sort((a, b) =>
                    normalized[a].created > normalized[b].created ? 1 : -1
                  )
                : Object.keys(normalized),
            },
          })
        );

        window.scrollTo(0, streaming ? document.body.scrollHeight : 0);

        setError(null);
      })
      .catch((error) => {
        setLoading(false);
        setError("Failed to load comments");
        setPost(null);
        console.error("Error:", error);
      });
  }, [sort, streaming]);

  return (
    <>
      {error && <Error message={error} />}
      {post !== null && (
        <CommentsContext.Provider
          value={{
            threadState: [state, dispatch],
            streamState: [streaming, setStreaming],
            refs: useDynamicRefs(),
            permalink: permalink,
            link_id: `t3_${id}`,
          }}
        >
          <>
            {!streaming && (
              <nav className="comments">
                <section className="show-on-mobile">
                  <button
                    id="stream"
                    onClick={() => setStreaming(streaming ? false : true)}
                  >
                    {streaming ? "Stop" : "Stream"}
                  </button>
                </section>
                <section>
                  {sortOptions.map((option, idx) => (
                    <SortButton
                      key={idx}
                      label={option}
                      option={option.toLowerCase()}
                      setState={setSort}
                      selected={sort === option.toLowerCase()}
                    />
                  ))}
                </section>
              </nav>
            )}
            <div className="comments">
              <section className="replies" style={{ overflow: "hidden" }}>
                {post.map((p) => (
                  <Post key={p.id} data={p} />
                ))}
                <Replies ids={getCommentIds(state)} />
              </section>
              <Subscription
                subreddit={sub}
                link_id={id}
                dispatch={dispatch}
                actions={actionCreators}
              />
            </div>
          </>
        </CommentsContext.Provider>
      )}
    </>
  );
};

export default Comments;
