import React, { useState } from "react";

import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";

import { useAudio } from "../utils/react.jsx";

const NotFound = () => {
  const memes = [
    { image: "chika.gif", audio: "caramelldansen.m4a", speed: 2 },
    { image: "polkka.gif", audio: "polkka.m4a", speed: 1 },
    // { image: "baby.gif", audio: "feeling.m4a", speed: 1 },
    // { image: "kid.gif", audio: "house_of_ill.m4a", speed: 2 },
  ];

  const autistic = memes[Math.floor(Math.random() * memes.length)];

  const [playing, toggle] = useAudio({
    url: `/terminal/autism/${autistic.audio}`,
    autoplay: true,
    onplay: () => setTimeout(() => {}, 500),
  });
  const [image, setImage] = useState(`/terminal/autism/${autistic.image}`);

  return (
    <>
      <div className="printer">
        <FAI icon={faPlay} onClick={toggle} />
        <img src={image} onClick={toggle} />
      </div>
      {playing && <div className="partying"></div>}
    </>
  );
};

export default NotFound;
