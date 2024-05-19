# availability

Form to collect time availabilities from people on BlueDot Impact courses. It offers an interface similar to when2meet but integrates with Airtable webhooks so the data can be later used e.g. with the [Cohort scheduling extension](https://github.com/bluedot-impact-software/cohort-scheduling-extension).

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a standard Next.js app in docker. It uses [an Airtable base](https://airtable.com/app6dkBHka8c4WaEj/tblvsaRl69XV8azGZ) as a database.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## How it works

The app presents a user interface where people can submit their availability via links like:

```
availability.bluedot.org/form/bluedot-course?email=test@example.com
```

We load details about the form from the configuration Airtable base.

We then display the form, and collect their availability with a when2meet-like component. Availability data uses the [weekly-availabilities](https://github.com/domdomegg/weekly-availabilities) library format. For example, `M16:00 M18:00, W20:00 R08:00` means the person is available on Monday from 4pm to 6pm UTC, and from Wednesday at 8pm through to Thursday at 8am UTC.

We then send this data to the webhook determined by the form configuration. This usually triggers an Airtable automation which does something with it, like updating records in another Airtable base.
