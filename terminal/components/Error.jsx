import React, { useEffect, useState } from "react";

import { faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";

import { useAudio } from "../utils/react.jsx";

const Error = ({ message = "This page expired worthless" }) => {
  const autism = [
    {
      visual: "/terminal/autism/chika.gif",
      audio: "/terminal/autism/caramelldansen.mp3",
      speed: 2,
    },
    {
      visual: "/terminal/autism/polkka.gif",
      audio: "/terminal/autism/polkka.mp3",
      speed: 1,
    },
    {
      visual: "/terminal/autism/ber.webm",
      audio: "/terminal/autism/ber.mp3",
      speed: 1,
    },
    // {
    //   visual: "/terminal/autism/baby.gif",
    //   audio: "/terminal/autism/feeling.mp3",
    //   speed: 1,
    // },
    // {
    //   visual: "/terminal/autism/kid.gif",
    //   audio: "/terminal/autism/house_of_ill.mp3",
    //   speed: 2,
    // },
  ];

  const r = () => {
    return autism[Math.floor(Math.random() * autism.length)];
  };

  const [media, setMedia] = useState(r());
  const [audio, audioProps] = useAudio({ url: media.audio, autoplay: true });

  const print = () => {
    if (audioProps.playing) {
      audioProps.pause();
      const random = r();
      setMedia(random);
      audioProps.setSrc(random.audio);
    } else {
      audioProps.play();
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-evenly",
          width: "100vw",
          height: "100vh",
        }}
      >
        <p>{message}</p>
        <a onClick={() => history.back()} style={{ cursor: "pointer" }}>
          No refunds
        </a>
        <FAI
          style={{
            cursor: "pointer",
            color: audioProps.playing ? "red" : "inherit",
          }}
          icon={faPrint}
          onClick={print}
        />
      </div>
      {audio}
      {audioProps.playing && (
        <>
          <div className="printer">
            {media.visual.endsWith("webm") ? (
              <video
                autoPlay={true}
                src={media.visual}
                style={{ width: "75%" }}
              />
            ) : (
              <img src={media.visual} />
            )}
          </div>
          <div className="partying"></div>
        </>
      )}
    </>
  );
};

export default Error;
