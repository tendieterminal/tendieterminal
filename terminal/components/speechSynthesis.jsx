import { useEffect, useState, useRef } from "react";

const useSpeechSynthesis = () => {
  const synth = useRef();
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState([]);

  const updateVoices = () => {
    setVoices(getLanguageVoices("en"));
  };

  const getLanguageVoices = (language) => {
    return synth.current.getVoices().filter((v) => {
      return (
        v.lang.replace("_", "-").substring(0, language.length) === language
      );
    });
  };

  useEffect(() => {
    if (typeof window !== "object" || !window.speechSynthesis) return;

    synth.current = window.speechSynthesis;
    synth.current.onvoiceschanged = updateVoices;

    setSupported(true);
    updateVoices();

    return () => {
      synth.current.onvoiceschanged = null;
    };
  }, []);

  const speak = (utterance) => {
    if (!supported || speaking) return;

    setSpeaking(true);

    if (utterance.onend) {
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

    synth.current.speak(utterance);
  };

  const cancel = () => {
    if (!supported) return;

    setSpeaking(false);

    synth.current.cancel();
  };

  const pause = () => {
    if (!supported || !speaking) return;

    setPaused(true);

    synth.current.pause();
  };

  const resume = () => {
    if (!supported || !speaking || !paused) return;

    setPaused(false);

    synth.current.resume();
  };

  return {
    supported,
    speak,
    speaking,
    cancel,
    pause,
    paused,
    resume,
    voices,
  };
};

export default useSpeechSynthesis;
