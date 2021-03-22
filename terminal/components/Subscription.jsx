import React, { useContext, useRef, useEffect, useState } from "react";

import * as Comlink from "comlink";
import { asyncIterableTransferHandler } from "../utils/iterableTransferHandlers.js";

import { actionCreators } from "../reducers/comments.js";
import { takeRight, randomInt, percentageScrolled } from "../utils.js";
import { stickyState } from "../utils/react.jsx";

import { CommentsContext } from "./Comments.jsx";

import Select from "./Select.jsx";
import useSpeechSynthesis from "./speechSynthesis.jsx";

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler);

const preferredVoices = [
  // (v) => v.lang === "en-GB" && v.name === "Daniel",
  (v) => v.lang === "en-GB" && v.name === "Google UK English Male",
  (v) => v.default,
];

export const Subscription = ({ subreddit, link_id }) => {
  const { threadState, streamState } = useContext(CommentsContext);

  const [state, dispatch] = threadState;
  const [streaming, setStreaming] = streamState;

  const synth = useSpeechSynthesis();

  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);

  const [depth, setDepth] = stickyState(1, "speechDepth");
  const [synthQ, updateSynthQ] = useState([]);

  const [voice, setVoice] = useState(0);
  const [voiceURI, setVoiceURI] = stickyState("", "voiceURI");
  const [rate, setRate] = stickyState(1.4, "voiceRate");
  const [pitch, setPitch] = stickyState(1, "voicePitch");

  const threadWorkerRef = useRef();
  const threadWorkerApiRef = useRef();

  const findVoice = (voiceOptions, conditions) => {
    for (let i = 0; i < conditions.length; i++) {
      const match = voiceOptions.findIndex(conditions[i]);
      if (match !== -1) return match;
    }
    return 0;
  };

  const setVoiceIndex = () => {
    setVoice(
      findVoice(
        synth.voices,
        voiceURI
          ? [(v) => v.voiceURI === voiceURI, ...preferredVoices]
          : preferredVoices
      )
    );
  };

  // TODO: useMemo?
  useEffect(() => {
    threadWorkerRef.current = new Worker("../workers/thread.worker.js", {
      name: "thread",
      type: "module",
    });

    threadWorkerApiRef.current = Comlink.wrap(threadWorkerRef.current);

    if (streaming) {
      handleSubscription(state);
      window.scrollTo(0, document.body.scrollHeight);
    } else {
      window.scrollTo(0, 0);
    }

    return () => {
      synth.cancel();
      threadWorkerRef.current?.terminate();
      threadWorkerApiRef.current?.[Comlink.releaseProxy]();
      updateSynthQ([]);
    };
  }, [streaming]);

  const handleSubscription = async () => {
    const iterator = await threadWorkerApiRef.current?.startSubscription(
      subreddit,
      link_id,
      Object.keys(state["entities"]["comment"])
    );

    // const iterator = await threadWorkerApiRef.current?.startShitposting();

    for await (const incoming of iterator) {
      let scroll = percentageScrolled() >= 99;
      dispatch(actionCreators.batch(...incoming.batch));
      updateSynthQ((q) => takeRight([...q, ...incoming.speech], depth));
      if (scroll) {
        window.scrollTo(0, document.body.scrollHeight);
      }
    }
  };

  useEffect(() => {
    setVoiceIndex();
  }, [synth.voices, voiceURI]);

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

        speech.voice = synth.voices[voice];
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
                  onClick={() => setStreaming(streaming ? false : true)}
                >
                  {streaming ? "Stop" : "Stream"}
                </button>
              </li>
              <li>
                <input
                  type="button"
                  onClick={randomSpeech}
                  value="Random Speech"
                />
              </li>
              {streaming && (
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
              <li className="hide-on-mobile">
                <span>Voice</span>
                <Select
                  options={synth.voices}
                  placeholder={"Default Voice"}
                  selected={voiceURI}
                  setState={setVoiceURI}
                  value={(o) => o.voiceURI}
                  label={(o) => `${o.name} (${o.lang})`}
                />
              </li>
              <li className="hide-on-mobile">
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
              <li className="hide-on-mobile">
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
              <li className="hide-on-mobile">
                <span>Depth</span>
                <label className="range">
                  <input
                    id="depth"
                    className="range"
                    type="range"
                    min="5"
                    max="20"
                    value={depth}
                    onChange={(e) => setDepth(e.currentTarget.value)}
                    step="1"
                  />
                  {depth}
                </label>
              </li>

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
