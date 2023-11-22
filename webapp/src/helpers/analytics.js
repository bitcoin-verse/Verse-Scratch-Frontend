import * as amplitude from "@amplitude/analytics-browser";

import globals from "../globals";

export const initAmplitude = () => {
  try {
    const AMPLITUDE_API_KEY = globals.AMPLITUDE_API

    if (!AMPLITUDE_API_KEY) throw new Error("AMPLITUDE_API_KEY not found");
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("sessionId");
    const deviceId = urlParams.get("deviceId");

    const options= {
        defaultTracking: true
    };

    if (sessionId) {
      options.sessionId = Number(sessionId);
    }
    if (deviceId) {
      options.deviceId = deviceId;
    }

    amplitude.init(AMPLITUDE_API_KEY, options);

    console.log("Amplitude initialized");
  } catch (error) {
    console.log("Amplitude init error", error);
  }
};

const breakpoints = {
  sm: 768,
  md: 1024,
  lg: 1440,
  xl: 1920,
};

const getDeviceSize = () => {
  const width = window.innerWidth;

  let size = "xl";

  Object.keys(breakpoints)
    .reverse()
    .forEach((key) => {
      if (width <= breakpoints[key]) {
        size = key;
      }
    });

  return size;
};

// type Event =
//   | { name: "connect wallet clicked"; blockchain?: string }
//   | {
//       name: "connect wallet option selected";
//       blockchain?: string;
//       connectOption: string;
//     }
//   | {
//       name: "connect wallet result";
//       blockchain?: string;
//       connectOption?: string;
//       success: boolean;
//     }
//   | {
//       name: "verse clicker cta tapped";
//       cta: string;
//       to: string;
//     }
//   | {
//       name: "verse clicker burn";
//       blockchain?: string;
//       result: number;
//       txId: string;
//       "blockchain address": string;
//     };

export const logAmplitudeEvent = (event) => {
  try {
    const { name, ...options } = event;
    const eventOptions = {
      entrypoint: "scratcher",
      "current page": window.location,
      "screen size": getDeviceSize(),

      ...options,
    };

    console.log(name)
    console.log(eventOptions)
    amplitude.logEvent(name, eventOptions);
  } catch (error) {
    console.log("Error logging event", error);
  }
};

