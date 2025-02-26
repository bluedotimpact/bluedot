/* eslint-disable */
// ==UserScript==
// @name         Google Meet Handsfree
// @description  Automatically starts, manages (hide details dialog, admit participants), leaves, and redirects onwards from Google Meet. Two main flows: (1) Open a meeting page e.g. meet.google.com/abc-defg-hij and it'll join the meeting or (2) Open meet.google.com/?instantMeeting=true and it'll start a new meeting. After your meeting once everyone else leaves it'll leave the meeting, and redirect to the chosen END_REDIRECT_URL.
// @version      1.0
// @match        *://meet.google.com/*
// @icon         https://meet.google.com/favicon.ico
// @grant        window.close
// ==/UserScript==

// URL to redirect to after meeting ends
const END_REDIRECT_URL = 'https://room.bluedot.org/display/auto';

// How long to wait after everyone else has left before leaving ourselves
const ALONE_THRESHOLD_MS = 1000; // 1 second

(function () {
  'use strict';

  // Shared variables
  const intervals = {};

  // Feature: Instant Meeting Starter
  const startInstantMeeting = () => {
    const startMeetingButton = document.querySelector('[aria-label="Start an instant meeting"]');
    if (startMeetingButton) {
      console.log('Starting instant meeting');
      const replacedUrl = new URL(window.location.href);
      replacedUrl.searchParams.delete('instantMeeting');
      window.history.replaceState(null, document.title, replacedUrl.href);
      startMeetingButton.click();
      clearInterval(intervals.startMeeting);
      delete intervals.startMeeting;
    }
  };

  // Feature: Dialog Closer
  const closeDialogs = () => {
    const buttons = document.querySelectorAll('[role="dialog"] button[aria-label="Close"]');
    for (const button of buttons) {
      if (button.parentElement.children[0].innerText === 'Your meeting\'s ready') {
        button.click();
        clearInterval(intervals.closeDialog);
        delete intervals.closeDialog;
      }
    }
  };

  // Feature: Leave the call if everyone else has left
  let othersHaveJoined = false;
  let aloneStartTime = null;
  const autoLeave = () => {
    const participantElement = document.querySelector('[aria-label=People]');
    if (!participantElement) return;

    const participantCountElement = participantElement.parentElement.parentElement.children[1];
    if (!participantCountElement) return;

    const participantCount = parseInt(participantCountElement.textContent);

    if (participantCount > 1) {
      othersHaveJoined = true;
      aloneStartTime = null;
    } else if (participantCount === 1 && othersHaveJoined) {
      if (aloneStartTime === null) {
        aloneStartTime = Date.now();
      } else if (Date.now() - aloneStartTime >= ALONE_THRESHOLD_MS) {
        const leaveButton = document.querySelector('[aria-label="Leave call"]');
        if (leaveButton) leaveButton.click();
        clearInterval(intervals.autoLeave);
        delete intervals.autoLeave;
      }
    }
  };

  // Feature: Check if call ended and redirect
  const redirectAtEndOfCall = () => {
    if (document.querySelector('[data-call-ended="true"]')) {
      window.location.href = END_REDIRECT_URL;
      clearInterval(intervals.redirectAtEndOfCall);
      delete intervals.redirectAtEndOfCall;
    }
  };

  // Feature: Auto Joiner
  const autoJoin = () => {
    const buttons = document.getElementsByTagName('button');
    for (const button of buttons) {
      if (button.innerText === 'Join now') {
        button.click();
        clearInterval(intervals.autoJoin);
        delete intervals.autoJoin;
      }
    }
  };

  // Feature: Auto Admitter
  const autoAdmit = () => {
    const spans = document.getElementsByTagName('span');
    for (const span of spans) {
      if (span.innerText === 'Admit' || span.innerText === 'View all') {
        span.click();
      }
    }
  };

  // Main execution
  window.addEventListener('load', () => {
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/landing';
    const isInstantMeeting = new URLSearchParams(window.location.search).get('instantMeeting') === 'true';

    if (isHomePage && isInstantMeeting) {
      startInstantMeeting();
      intervals.startMeeting = setInterval(startInstantMeeting, 1000);
    } else if (!isHomePage) {
      intervals.autoJoin = setInterval(autoJoin, 1000);
      intervals.closeDialog = setInterval(closeDialogs, 1000);
      intervals.autoAdmit = setInterval(autoAdmit, 1000);
      intervals.autoLeave = setInterval(autoLeave, 1000);
      intervals.redirectAtEndOfCall = setInterval(redirectAtEndOfCall, 1000);
    }
  });
}());
