import React, { useRef, useEffect, useState } from "react";

import * as Comlink from "comlink";
import { asyncIterableTransferHandler } from "../utils/iterableTransferHandlers.js";

import { takeRight, randomInt } from "../utils.js";

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler);

export const Subscription = ({ subreddit, link_id, actions, dispatch }) => {
  const [subscribed, setSubscribed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [depth, setDepth] = useState(5);

  const [synthQ, updateSynthQ] = useState([]);

  const synth = useRef();
  const threadWorkerRef = useRef();
  const threadWorkerApiRef = useRef();

  // TODO: useMemo?
  useEffect(() => {
    synth.current = window.speechSynthesis;

    threadWorkerRef.current = new Worker("../workers/thread.worker.js", {
      type: "module",
    });

    threadWorkerApiRef.current = Comlink.wrap(threadWorkerRef.current);

    return () => {
      synth.current?.cancel();
      threadWorkerRef.current?.terminate();
      threadWorkerApiRef.current?.[Comlink.releaseProxy]();
    };
  }, []);

  useEffect(() => {
    if (synthQ && synthQ.length && !speaking && !muted) {
      setSpeaking(true);
      const posts = [...synthQ];
      const post = posts[posts.length - 1];

      const speech = new SpeechSynthesisUtterance(post.body);

      speech.onend = () => {
        updateSynthQ((q) => q.filter((p) => p.id != post.id));
        setSpeaking(false);
      };

      speech.voice = synth.current?.getVoices()[
        synth.current
          ?.getVoices()
          .findIndex((v) => v.lang === "en-GB" && v.name === "Daniel") || 0
      ];
      speech.rate = 1.4;
      speech.pitch = 1;

      synth.current?.speak(speech);
    }
  }, [speaking, muted, synthQ]);

  useEffect(() => {
    if (muted) {
      synth.current?.cancel();
    }
  }, [muted]);

  useEffect(() => {
    if (paused) {
      synth.current?.pause();
    } else {
      synth.current?.resume();
    }
  }, [paused]);

  // TODO: useMemo?
  const handleThreadWork = async () => {
    if (!subscribed) {
      setSubscribed(true);

      const iterator = await threadWorkerApiRef.current?.startSubscription(
        subreddit,
        link_id
      );

      for await (const comments of iterator) {
        dispatch(actions.batch(...comments.batch));
        updateSynthQ((q) => takeRight([...q, ...comments.speech], depth));
      }
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const togglePaused = () => {
    setPaused(!paused);
  };

  const randomSpeech = () => {
    updateSynthQ((q) =>
      takeRight([...q, { id: randomInt(9999), body: randomInt(99) }], depth)
    );
  };

  return (
    <nav className="subscription">
      <button onClick={handleThreadWork} disabled={subscribed}>
        Stream
      </button>

      <input type="button" onClick={randomSpeech} value="Random Speech" />

      {subscribed && (
        <>
          <button onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</button>

          <button onClick={togglePaused}>{paused ? "Play" : "Pause"}</button>
        </>
      )}

      {/* <ul className="queue">
        {synthQ.map((p, i) => (
          <li key={i}>{p.body}</li>
        ))}
      </ul> */}
    </nav>
  );
};

export default Subscription;
