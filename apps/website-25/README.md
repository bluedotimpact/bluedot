# Website 2025

Quick links:
- [Latest live version](https://website-25.k8s.bluedot.org/)
- [GitHub Project tasks](https://github.com/orgs/bluedotimpact/projects/2/)
- [Figma mocks](https://www.figma.com/proto/tDmNmBclyDSKa0WYUMSPEr/Bluedot?node-id=52-723&t=pCyhhcqvCCeUqPCn-0&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1)

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

```
npm run start

npm run test

## Deployment

This app is deployed onto the K8s cluster as a standard Next.js app in docker.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.
```

# Project Setup Guide

Follow these steps to run the project locally:

## 1. Install Dependencies
Run the following command to install all necessary packages:
```bash
npm install
```

## 2. Add Environment Variables
```bash
NEXT_PUBLIC_TINA_CLIENT_ID=your_client_id
TINA_TOKEN=your_tina_token
NEXT_PUBLIC_ORGANIZATION_NAME=your_organization_name
```

## 3. Start the Development Server
```bash
npm run dev
```

## 4. Adding Tina CMS Content

 - Navigate to /admin/index.html to access Tina CMS.
 - Add a new blog post and note the filename generated for the blog.

## 5. View the Blog Content
 To view your newly added blog post:
  - Navigate to /blog/{filename} (replace {filename} with the actual filename of the blog you added).
  - This page will display the blog content along with other related posts.

  You're all set! If you encounter any issues, feel free to reach out.