import React, { useRef, useEffect, useState } from "react";

import * as Comlink from "comlink";
import { asyncIterableTransferHandler } from "../utils/iterableTransferHandlers.js";

import { takeRight, randomInt } from "../utils.js";
import { speechSynthesis } from "./speechSynth.jsx";

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler);

const voiceDefaults = [
  (v) => v.lang === "en-GB" && v.name === "Daniel",
  (v) => v.lang === "en-GB" && v.name === "Google English UK Male",
  (v) => v.default,
];

const stickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

export const Subscription = ({ subreddit, link_id, actions, dispatch }) => {
  const synth = speechSynthesis();

  const [subscribed, setSubscribed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);

  const [voice, setVoice] = stickyState("", "voiceURI");
  const [depth, setDepth] = stickyState(5, "speechDepth");
  const [rate, setRate] = stickyState(1.4, "voiceRate");
  const [pitch, setPitch] = stickyState(1, "voicePitch");
  const [synthQ, updateSynthQ] = useState([]);

  const threadWorkerRef = useRef();
  const threadWorkerApiRef = useRef();

  // TODO: useMemo?
  useEffect(() => {
    threadWorkerRef.current = new Worker("../workers/thread.worker.js", {
      type: "module",
    });

    threadWorkerApiRef.current = Comlink.wrap(threadWorkerRef.current);

    return () => {
      threadWorkerRef.current?.terminate();
      threadWorkerApiRef.current?.[Comlink.releaseProxy]();
    };
  }, []);

  const getVoice = (conditions) => {
    for (let i = 0; i < conditions.length; i++) {
      const match = synth.voices.find(conditions[i]);
      if (match) {
        return match;
      }
    }
    return synth.voices[0];
  };

  useEffect(() => {
    if (synth.supported && synthQ.length && !synth.speaking && !paused) {
      const posts = [...synthQ];
      const post = posts[posts.length - 1];

      if (muted) {
        updateSynthQ((q) => q.filter((p) => p.id != post.id));
      } else {
        const speech = new SpeechSynthesisUtterance(post.body);

        speech.onend = () => {
          updateSynthQ((q) => q.filter((p) => p.id != post.id));
        };

        speech.voice = getVoice(
          voice
            ? [(v) => v.voiceURI === voice, ...voiceDefaults]
            : voiceDefaults
        );

        speech.rate = rate;
        speech.pitch = pitch;

        synth.speak(speech);
      }
    }
  }, [synth.speaking, muted, synthQ]);

  useEffect(() => {
    if (muted) {
      synth.cancel();
    }
  }, [muted]);

  useEffect(() => {
    if (paused) {
      synth.pause();
    } else {
      synth.resume();
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
      {synth.supported ? (
        <>
          {synth.voices.length ? (
            <ul className="controls">
              <li>
                <button
                  id="stream"
                  onClick={handleThreadWork}
                  disabled={subscribed}
                >
                  Stream
                </button>
              </li>
              <li>
                <input
                  type="button"
                  onClick={randomSpeech}
                  value="Random Speech"
                />
              </li>
              <li>
                <span>Voice</span>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.currentTarget.value)}
                >
                  <option value="">Default Voice</option>
                  {synth.voices.map((voice) => (
                    <option value={voice.voiceURI} key={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </li>
              <li>
                <span>Rate</span>
                <label className="range">
                  <input
                    id="rate"
                    className="range"
                    type="range"
                    min="0.5"
                    max="2"
                    value={rate}
                    onChange={(e) => setRate(e.currentTarget.value)}
                    step=".1"
                  />
                  {rate}
                </label>
              </li>
              <li>
                <span>Pitch</span>
                <label className="range">
                  <input
                    id="pitch"
                    className="range"
                    type="range"
                    min="0"
                    max="2"
                    value={pitch}
                    onChange={(e) => setPitch(e.currentTarget.value)}
                    step=".1"
                  />
                  {pitch}
                </label>
              </li>
              {subscribed && (
                <ul className="voice">
                  <li>
                    <button onClick={toggleMute}>
                      {muted ? "Unmute" : "Mute"}
                    </button>
                  </li>
                  <li>
                    <button onClick={togglePaused}>
                      {paused ? "Play" : "Pause"}
                    </button>
                  </li>
                </ul>
              )}
              {/* <ul className="queue">
                {synthQ.map((p, i) => (
                  <li key={i}>{p.body}</li>
                ))}
              </ul> */}
            </ul>
          ) : (
            <div className="unsupported">
              No TTS Voices Were Found - Cannot Stream Thread
            </div>
          )}
        </>
      ) : (
        <div className="unsupported">Your Browser Doesn't Support TTS</div>
      )}
    </nav>
  );
};

export default Subscription;
