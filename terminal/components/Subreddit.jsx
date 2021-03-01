import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { uniqBy as uniqueBy } from "lodash";

import { sanitize } from "../utils.js";

import Select from "./Select.jsx";
import SortButton from "./SortButton.jsx";

import { Author, Metadata } from "./Metadata.jsx";
import { Thumbnail } from "./Content.jsx";

const Listing = ({ listing }) => {
  return (
    <Link to={listing.permalink}>
      <article className="listing">
        <Thumbnail post={listing} />
        <div className="info">
          {/* <div style={{ display: "flex", alignItems: "center" }}> */}
          <div
            className="title"
            dangerouslySetInnerHTML={{
              __html: sanitize(listing.title),
            }}
          />
          {/* <span
              className="flair"
              style={{
                backgroundColor: listing.link_flair_background_color,
                padding: "1vh",
              }}
            >
              {listing.link_flair_text}
            </span>
          </div> */}
          <Author post={listing} />
          <Metadata post={listing} />
        </div>
      </article>
    </Link>
  );
};

const Subreddit = () => {
  const { sub = "wallstreetbetsOGs" } = useParams();

  const sortDefault = "hot";
  const sortOptions = ["Hot", "New", "Top", "Rising"];

  // Why the fuck would you put link_flair_templates
  // behind an *authenticated* API?
  const flairOptions = [
    "DD",
    "Shitpost",
    "Gain",
    "Discussion",
    "Meme",
    "YOLO",
    "News",
    "Pleas Fly",
    "Technicals",
    "Earnings",
  ];

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);

  const [listings, setListings] = useState(null);

  const [subreddit] = useState(sub);

  const [flair, setFlair] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(sortDefault);
  const [sortType, time] = sort.split(" ");

  const api = new URL(
    `${global.REDDIT}/${subreddit}/` +
      `${
        search || flair ? `search/.json?sort=${sortType}` : `${sortType}.json`
      }`
  );

  useEffect(() => {
    if (search && flair) {
      api.searchParams.set(
        "q",
        `subreddit:${subreddit} flair: ${flair} ${search}`
      );
    } else if (flair) {
      api.searchParams.set("q", `subreddit:${subreddit} flair:${flair}`);
    } else if (search) {
      api.searchParams.set("q", `subreddit:${subreddit} ${search}`);
    } else {
      api.searchParams.delete("q");
    }
  }, [sort, search, flair, loadingMore]);

  useEffect(() => {
    if (time) {
      api.searchParams.set("t", time);
    } else {
      api.searchParams.delete("t");
    }
  }, [sort, time, loadingMore]);

  // Listing Fetch Handler
  useEffect(() => {
    setLoading(true);
    fetch(api.href)
      .then((response) => response.json())
      .then((json) => {
        setLoading(false);
        if (json.error && json.error === 404) {
          setError("This subreddit does not exist");
        } else {
          setLastRequest(json.data);
          setUniqueListings(mapListings(json));
          setError(null);
        }
      })
      .catch((e) => {
        setLoading(false);
        setError(e);
        setListings(null);
        console.error("Error:", e);
      });
  }, [sort, time, search, flair]);

  // Infinite Scroll Fetch Handler
  useEffect(() => {
    if (loadingMore && !loading && lastRequest && lastRequest.after) {
      setLoading(true);

      api.searchParams.set("after", lastRequest.after);

      fetch(api.href)
        .then((response) => response.json())
        .then((more) => {
          const moreListings = mapListings(more);
          setUniqueListings(listings && listings.concat(moreListings));
          setLastRequest(more.data);
          setLoading(false);
          setLoadingMore(false);
        })
        .catch((e) => {
          setLoading(false);
          setLoadingMore(false);
          setError(e);
          console.error("Error:", e);
        });
    } else {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, lastRequest, api, listings]);

  // Infinite Scroll Boundary Handler
  useEffect(() => {
    const handleScroll = () => {
      const root = document.getElementById("root");

      if (
        !loadingMore &&
        Math.round(root.getBoundingClientRect().bottom) <= window.innerHeight
      ) {
        setLoadingMore(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, lastRequest]);

  const mapListings = (json) => json.data.children.map((l) => l.data);

  const setUniqueListings = (listings) => setListings(uniqueBy(listings, "id"));

  return (
    <div>
      {error && <section className="error">{error}</section>}
      {listings !== null && (
        <>
          <nav className="subreddit">
            <div className="name">{subreddit}</div>
            <div>
              {sortOptions.map((option, idx) => (
                <SortButton
                  key={idx}
                  label={option}
                  option={option.toLowerCase()}
                  setState={setSort}
                  selected={sort === option.toLowerCase()}
                />
              ))}
              <Select
                options={flairOptions}
                placeholder={"Flair"}
                selected={flair}
                setState={setFlair}
              />
            </div>
          </nav>
          {listings.map((listing) => (
            <Listing key={listing.id} listing={listing} />
          ))}
        </>
      )}
    </div>
  );
};

export default Subreddit;
