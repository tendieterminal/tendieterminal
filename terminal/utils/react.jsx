import { useState, useEffect } from "react";

export const stickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

export const useAudio = ({
  url,
  autoplay = false,
  onplay = () => {},
  onplaying = () => {},
  onended = () => {},
  onpause = () => {},
}) => {
  const [audio] = useState(new Audio(url));
  const [playing, setPlaying] = useState(false);

  const toggle = () => setPlaying(!playing);

  const play = async () => {
    await audio.play();
  };

  const pause = () => {
    audio.pause();
  };

  useEffect(() => {
    try {
      if (autoplay) {
        play();
      }
    } catch (e) {
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    playing ? play() : pause();
  }, [playing]);

  useEffect(() => {
    audio.onplaying = () => {
      onplaying();
    };

    audio.onplay = () => {
      onplay();
      setPlaying(true);
    };

    audio.onended = () => {
      onended();
      setPlaying(false);
    };

    audio.onpause = () => {
      onpause();
      setPlaying(false);
    };

    return () => {
      audio.onplay = () => {};
      audio.onended = () => {};
      audio.onpause = () => {};
    };
  }, []);

  return [playing, toggle];
};
