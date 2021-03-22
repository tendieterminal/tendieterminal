import React, { useState, useEffect, useRef } from "react";

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

export const useAudio = ({ url, autoplay = false }) => {
  const audioRef = useRef(null);

  const [audioSrc, setSrc] = useState(url);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [isSeeking, setSeeking] = useState(false);
  const [autoplayed, setAutoplayed] = useState(false);

  useEffect(() => {
    setLoading(true);
  }, [audioSrc]);

  const playAudio = async () => {
    try {
      await audioRef.current.play();
    } catch (e) {
      setPlaying(false);
    }
  };

  return [
    <audio
      src={audioSrc}
      hidden
      ref={audioRef}
      onLoadedData={() => {
        setLoading(false);
        setDuration(audioRef.current.duration);
        if (playing || (autoplay && !autoplayed)) {
          if (autoplay && !autoplayed) {
            setAutoplayed(true);
          }
          playAudio();
        }
      }}
      onSeeking={() => setSeeking(true)}
      onSeeked={() => setSeeking(false)}
      onTimeUpdate={() => {
        setCurrentTime(audioRef.current.currentTime);
      }}
      onPlay={() => {
        setPlaying(true);
      }}
    />,
    {
      currentTime,
      duration,
      playing,
      isSeeking,
      isLoading,
      progress: (currentTime / duration) * 100,
      setTime: (seconds) => {
        audioRef.current.currentTime = seconds;
      },
      setSrc: (src) => {
        setPlaying(false);
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setSrc(src);
      },
      pause: () => {
        audioRef.current.pause();
      },
      play: () => {
        playAudio();
      },
      toggle: () => {
        if (playing) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
      },
    },
  ];
};
