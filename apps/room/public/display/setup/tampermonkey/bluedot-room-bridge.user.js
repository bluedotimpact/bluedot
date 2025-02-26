/* eslint-disable */
// ==UserScript==
// @name         BlueDot room bridge
// @description  Passes URL information to and from BlueDot room app
// @version      1.0
// @match        *://*/*
// @icon         https://bluedot.org/images/logo/favicon/favicon.svg
// @grant        window.onurlchange
// @noframes
// ==/UserScript==

const ROOM_ID = 'tv';
const BEARER_TOKEN = 'GET_FROM_1PASSWORD';
const SERVER_HOST = 'https://room.bluedot.org';
// const SERVER_HOST = 'http://localhost:8000';

(function () {
  'use strict';

  let lastSentUpdate = 0;

  const checkForNewInstructions = async () => {
    // get url from server
    const res = await fetch(`${SERVER_HOST}/api/display/rooms/${ROOM_ID}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
    });
    const data = await res.json();

    // ignore server updates if we sent a more recent update
    if (lastSentUpdate > data.status.lastUpdatedAt) {
      return;
    }

    const targetUrl = data.status.currentUrl;
    if (window.location.href !== targetUrl) {
      window.location.href = targetUrl;
    }
  };

  const debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback(...args);
      }, wait);
    };
  };

  const debouncedServerUpdate = debounce(() => {
    fetch(`${SERVER_HOST}/api/display/rooms/${ROOM_ID}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentUrl: window.location.href,
        lastUpdatedAt: Date.now() / 1000,
      }),
    });
  }, 0);

  const updateServer = () => {
    lastSentUpdate = Date.now() / 1000;
    debouncedServerUpdate();
  };

  window.addEventListener('load', () => {
    if (window.location.href === 'https://room.bluedot.org/display/auto') {
      window.location.href = `${SERVER_HOST}/display/${ROOM_ID}`;
    }

    setInterval(checkForNewInstructions, 5000);
    checkForNewInstructions();
  });

  window.addEventListener('urlchange', () => {
    if (window.location.href === 'https://room.bluedot.org/display/auto') {
      window.location.href = `${SERVER_HOST}/display/${ROOM_ID}`;
    }

    updateServer();
  });
  updateServer();
}());
