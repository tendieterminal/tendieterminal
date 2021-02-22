import { useEffect, useState } from "react";

export const speechSynthesis = () => {
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(false);

  const processVoices = (voiceOptions) => {
    setVoices(voiceOptions);
  };

  const getVoices = () => {
    let voiceOptions = window.speechSynthesis.getVoices();

    if (voiceOptions.length > 0) {
      processVoices(voiceOptions);
      return;
    }

    window.speechSynthesis.onvoiceschanged = (event) => {
      voiceOptions = event.target.getVoices();
      processVoices(voiceOptions);
    };
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSupported(true);
      getVoices();
    }
  }, []);

  const speak = (utterance) => {
    if (!supported || speaking) return;

    setSpeaking(true);

    if (utterance.onend !== null) {
      const onEnd = utterance.onend;
      utterance.onend = () => {
        onEnd();
        setSpeaking(false);
      };
    } else {
      utterance.onend = () => {
        setSpeaking(false);
      };
    }

    window.speechSynthesis.speak(utterance);
  };

  const cancel = () => {
    if (!supported) return;

    setSpeaking(false);

    window.speechSynthesis.cancel();
  };

  const pause = () => {
    if (!supported || !speaking) return;

    setPaused(true);

    window.speechSynthesis.pause();
  };

  const resume = () => {
    if (!supported || !speaking || !paused) return;

    setPaused(false);

    window.speechSynthesis.resume();
  };

  return {
    supported,
    speak,
    speaking,
    cancel,
    pause,
    resume,
    paused,
    voices,
  };
};
