import React, { useContext, useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";

import { CSSTransition } from "react-transition-group";

import {
  faArrowUp,
  faArrowDown,
  faEllipsisH,
  faPencilAlt,
  faThumbtack,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";

import { CommentsContext } from "./Comments.jsx";

import { actionCreators as actions } from "../reducers/comments.js";

import {
  hash,
  isInViewport,
  randomString,
  sanitize,
  timeAgo,
} from "../utils.js";
import { normalizeComments } from "../utils/reddit.js";

import { Awards } from "./Metadata.jsx";

const NewReply = ({ onSubmit, onCancel, showCancel, label, autoFocus }) => {
  const [value, setValue] = useState("");

  const cancel = () => {
    if (onCancel) {
      onCancel();
    }
    setValue("");
  };

  const submit = () => {
    const cleaned = value.trim();
    if (cleaned) {
      onSubmit(cleaned);
      setValue("");
    }
  };

  return (
    <div>
      <textarea
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        value={value}
      />

      <div>
        {showCancel && <button onClick={cancel}>Cancel</button>}
        <button onClick={submit}>{label}</button>
      </div>
    </div>
  );
};

const MoreReplies = ({ id, data }) => {
  const { threadState, streamState, permalink, link_id } = useContext(
    CommentsContext
  );
  const [state, dispatch] = threadState;
  const [streaming] = streamState;

  const [fetchMore, setFetchMore] = useState(false);
  const [fetching, setFetching] = useState(false);

  const api = new URL(
    data.parent
      ? `${permalink}/${data.parent.substring(3)}/.json?raw_json=1`
      : `${global.REDDIT}/api/morechildren.json` +
        "?api_type=json" +
        `&link_id=${link_id}` +
        `&children=${data.children.slice(0, 500).join(",")}` +
        "&limit_children=1" +
        "&raw_json=1"
  );

  useEffect(() => {
    if (fetchMore) {
      setFetching(true);
      fetch(api.href)
        .then((response) => response.json())
        .then((json) => {
          const normalized = normalizeComments(
            data.parent
              ? json[1]
              : {
                  data: { children: json["json"]["data"]["things"] },
                }
          );

          const relations = [];
          const attachments = [];

          const updates = Object.keys(normalized)
            .filter((name) => state["ids"]["comment"].includes(name))
            .reduce((updates, name) => {
              normalized[name].children?.forEach((cid) => {
                relations.push({ child: cid, parent: name });
              });
              updates.push(actions.create("comment", name, normalized[name]));
              return updates;
            }, []);

          const newIds = Object.keys(normalized).filter(
            (name) => !state["ids"]["comment"].includes(name)
          );

          const creations = newIds
            .filter((name) => !state["ids"]["comment"].includes(name))
            .reduce((creations, name) => {
              normalized[name].children?.forEach((cid) => {
                relations.push({ child: cid, parent: name });
              });
              creations.push(actions.create("comment", name, normalized[name]));
              return creations;
            }, []);

          relations.forEach((attachment) => {
            attachments.push(
              actions.attach(
                "comment",
                attachment.child,
                "parent",
                attachment.parent,
                { reciprocalIndex: 0 }
              )
            );
          });

          const cascade = () => ({ children: cascade });

          dispatch(
            actions.batch(
              actions.delete("comment", id, cascade),
              actions.batch(
                ...updates,
                ...creations,
                actions.batch(...attachments)
              )
            )
          );

          if (!data.parent) {
            dispatch({
              type: "normalized/CREATE",
              entityType: "comment",
              id: randomString(3),
              data: {
                kind: "more",
                children: data.children.filter(
                  (id) => !newIds.includes(`t1_${id}`)
                ),
                depth: 0,
              },
            });
          }
        });
    }
  }, [fetchMore]);

  const margin = data.depth
    ? {
        marginLeft: `${data.depth ? data.depth * 1.5 : 0.5}vw`,
      }
    : {
        margin: "0 auto",
        marginBottom: "1vw",
      };

  return (
    <article
      className="more"
      onClick={() => setFetchMore(true)}
      style={{
        ...margin,
      }}
    >
      <div className="children">
        {data.children.length} more replies{" "}
        {fetching && <FAI icon={faCog} spin />}
      </div>
    </article>
  );
};

const Comment = ({ id, data }) => {
  const { threadState, streamState, refs } = useContext(CommentsContext);
  const [state, dispatch] = threadState;
  const [streaming] = streamState;
  const [getRef, setRef] = refs;

  const [collapsed, setCollapsed] = useState(false);
  // const [parentVisible, setParentVisible] = useState(true);
  const [replying, setReplying] = useState(false);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const toggleReplying = () => setReplying(!replying);

  const cancelReply = () => {
    toggleReplying();
  };

  const submitReply = (value) => {
    if (value) {
      const childId = randomString();

      dispatch(
        actions.batch(
          actions.create("comment", childId, {
            kind: "t1",
            created: new Date(),
            depth: data.depth + 1,
            body: value,
          }),
          actions.attach("comment", childId, "parent", id, {
            reciprocalIndex: 0,
          })
        )
      );

      toggleReplying();

      (function waitUntil() {
        const newPost = getRef(childId);
        if (newPost) {
          newPost.current.scrollIntoView({
            behavior: "smooth",
          });
        } else {
          setTimeout(waitUntil, 500);
        }
      })();
    }
  };

  const classNames = ["comment", streaming && "streamed"]
    .filter(Boolean)
    .join(" ");

  const commentStyle = {
    marginLeft: `${streaming ? 0 : data.depth * 1.5}vw`,
  };

  const receivedAwards =
    data.all_awardings?.length || data.total_awards_received;

  return (
    <>
      {/* <article id={id} ref={ref} className={classNames} style={commentStyle}> */}
      <article
        id={id}
        ref={setRef(id)}
        className={classNames}
        style={commentStyle}
      >
        <div className={data.depth ? "child" : "parent"}>
          <header className="metadata">
            <ul>
              {data.stickied && (
                <li
                  className="stickied"
                  style={{ color: data.distinguished ? "green" : "white" }} // TODO: red/green moderator/admin
                >
                  <FAI icon={faThumbtack} />
                </li>
              )}
              <li
                className="author"
                style={{ color: data.distinguished ? "green" : "white" }}
              >
                {/* <Link
                  style={{ textDecoration: "none" }}
                  to={`/u/${data.author}`}
                > */}
                {data.author}
                {/* </Link> */}
              </li>
              <li className="score">
                {data.score_hidden ? "—" : data.score}{" "}
                <FAI icon={Math.sign(data.score) ? faArrowUp : faArrowDown} />
              </li>
              {data.edited && (
                <li className="edited">
                  <FAI icon={faPencilAlt} />
                </li>
              )}
              {receivedAwards && (
                <Awards
                  all_awardings={data.all_awardings}
                  total_awards_received={data.total_awards_received}
                />
              )}
              {data.author_flair_text !== null && data.author_flair_text && (
                <li
                  className="flair"
                  dangerouslySetInnerHTML={{
                    __html: `${data.author_flair_text}`,
                  }}
                />
              )}
            </ul>
            <ul>
              <li className="actions">
                <FAI icon={faEllipsisH} onClick={toggleReplying} />
              </li>
              <li className="created">{timeAgo(data.created, false)}</li>
            </ul>
          </header>
          {streaming && data.parent && (
            <>
              {/* <CSSTransition
                in={parentVisible}
                timeout={200}
                classNames="context"
                unmountOnExit
              >
                <div style={{ position: "relative", display: "inline-block" }}>
                  <div
                    style={{
                      position: "absolute",
                      width: "50%",
                      backgroundColor: "red",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: sanitize(
                        state["entities"]["comment"][data.parent].body
                      ),
                    }}
                  />
                </div>
              </CSSTransition> */}
              <section style={{ color: "blue" }}>
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    getRef(data.parent).current.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                  onMouseEnter={() => {
                    // if (isInViewport(parent)) {
                    if (data.parent) {
                      const parent = getRef(data.parent);
                      if (parent && parent.current)
                        parent.current.style.backgroundColor = "#383838";
                    }
                    // } else {
                    // setParentVisible(true);
                    // }
                  }}
                  onMouseLeave={() => {
                    // setParentVisible(false);
                    if (data.parent) {
                      const parent = getRef(data.parent);
                      if (parent && parent.current)
                        parent.current.style.backgroundColor = "black";
                    }
                  }}
                >
                  {">>"}
                  {hash(data.parent.substring(3))}
                </span>
              </section>
            </>
          )}
          <section
            className="body"
            dangerouslySetInnerHTML={{
              __html: sanitize(data.body),
            }}
          />
          {replying && (
            <NewReply
              autoFocus
              onSubmit={submitReply}
              onCancel={cancelReply}
              showCancel={true}
              label="Reply"
            />
          )}
        </div>
      </article>
    </>
  );
};

const Reply = ({ id }) => {
  const { threadState, streamState } = useContext(CommentsContext);
  const [state] = threadState;
  const [streaming] = streamState;

  const comment = state["entities"]["comment"][id];

  if (comment.kind === "t1") {
    return (
      <>
        <Comment key={id} id={id} data={comment} />
        {!streaming &&
          comment.children?.map((childId) => {
            return <Reply key={childId} id={childId} />;
          })}
      </>
    );
  } else if (!streaming) {
    return <MoreReplies key={id} id={id} data={comment} />;
  } else {
    return null;
  }
};

const Replies = ({ ids }) => {
  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      {ids.map((id, i) => {
        return <Reply key={i} id={id} />;
      })}
    </div>
    // <Virtuoso
    //   useWindowScroll
    //   data={ids}
    //   totalCount={ids.length}
    //   style={{ width: "100%", minHeight: "100vh" }}
    //   overscan={600}
    //   itemContent={(_, id) => <Reply id={id} />}
    // />
  );
};

export default Replies;
