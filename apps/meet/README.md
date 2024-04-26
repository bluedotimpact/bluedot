# meet

An app for hosting meetings, e.g. facilitated sessions on our courses.

## Developer setup

1. See [general setup instructions](../../README.md)
2. Set the environment variables in [`.env.local`](./.env.local)
3. Run the server with `npm start`

## Deployment

This app is deployed onto the K8s cluster as a standard Next.js app. It uses [an Airtable base](https://airtable.com/app6dkBHka8c4WaEj) as a database.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## How it works

The app presents a user interface where people can join via links like:

```
meet.bluedot.org/?cohortId=rec1234
```

Behind the scenes, we make API calls to Airtable to get information regarding that cohort, the cohort classes and the participants in that cohort. Once we find the nearest cohort class, we present the participants in it so people can choose to login as that participant. In case someone else is joining, we give users an escape hatch to enter a custom name.

We then render the Zoom meeting with the [Zoom Meeting SDK](https://developers.zoom.us/docs/meeting-sdk/web/).

Once in the meeting, the facilitator can claim host with the host key.

## Future potential changes

We may change from having a concept 'cohorts' / 'cohort classes' etc., and make another service responsible for that. Then this service would just be for hosting the actual meeting itself.
