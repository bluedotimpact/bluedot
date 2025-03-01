# room

A server that manages remote control of meeting room displays running on Raspberry Pis.

For example: Each Pi is connected to a good webcam and conference microphone, and TV. On boot, it opens a web browser to like room.bluedot.org/display/room-name, which can be controlled remotely (e.g. to go to Google Meet/Zoom/Teams/whatever) by a user going to room.bluedot.org/room-name on their laptop.

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

### Server

This app is deployed onto the K8s cluster as a standard Next.js app in docker.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

### Meeting room devices

To set up a new device:

1. Add the room to [db.ts](./src/lib/api/db.ts)
2. Set up a Raspberry Pi with the default Raspberry Pi OS (64-bit)
3. In Chromium, login to meet.google.com as noreply@bluedot.org
4. On the Raspberry Pi, install:
   - [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?pli=1) in Chromium, including enabling developer mode in Chrome's extension settings
   - [the Tampermonkey scripts](./public/display/setup/tampermonkey/), including configuring BlueDot room bridge
   - [the systemd kiosk service](./public/display/setup/kiosk/)

You can access the scripts on the web service, e.g. `room.bluedot.org/display/setup/kiosk/kiosk.service`, to save you copying them across manually.

If we end up deploying many more of these devices / resetting them frequently, we should expose a signle script that sorts out everything.
