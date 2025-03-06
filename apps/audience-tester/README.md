# audience-tester

An app that helps test how different audiences respond to content. Users can paste in a document containing an argument or narrative, and the app simulates 25 different people reading and interacting with it. Each simulated reader provides their thoughts, feelings, and feedback throughout the argument, highlighting which parts resonate most with them.

## Developer setup

No special actions needed just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a standard Next.js app in docker.

To deploy a new version simply commit to the master branch. GitHub Actions automatically handles CD.

## How it works

The app presents a user interface where people can:

1. Paste in a document containing an argument or narrative they want to test
2. The app uses the Claude API to simulate different personas reading the content
3. Each simulated reader provides:
   - Their thoughts and feelings as they read through the argument
   - Which parts resonated most with them
   - Overall feedback and suggestions
4. The app aggregates and summarizes the feedback to help identify:
   - Most compelling parts of the argument
   - Common points of confusion or resistance
   - Suggestions for improvement
   - Different patterns in how various personas respond
