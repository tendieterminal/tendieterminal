import React, { useRef, useEffect, useState } from "react";

import * as Comlink from "comlink";
import { asyncIterableTransferHandler } from "../utils/iterableTransferHandlers.js";

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler);

const Sidebar = ({ dispatch }) => {
  const [subscribed, setSubscribed] = useState(false);

  const threadWorkerRef = useRef();
  const threadWorkerApiRef = useRef();

  useEffect(() => {
    threadWorkerRef.current = new Worker("../workers/shitpost.worker.js", {
      name: "shitpost",
      type: "module",
    });

    threadWorkerApiRef.current = Comlink.wrap(threadWorkerRef.current);

    return () => {
      threadWorkerRef.current?.terminate();
      threadWorkerApiRef.current?.[Comlink.releaseProxy]();
    };
  }, []);

  const handleThreadWork = async () => {
    if (!subscribed) {
      setSubscribed(true);

      const iterator = await threadWorkerApiRef.current?.startShitposting();

      for await (const comments of iterator) {
        dispatch(...comments);
      }
    }
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        backgroundColor: "#FFFFFF",
        width: "300px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          display: "flex",
          height: "50px",
          marginTop: "50px",
          padding: "0px 24px",
        }}
      >
        <button onClick={handleThreadWork}>Start Shitposting</button>
      </div>
    </div>
  );
};

export default Sidebar;
