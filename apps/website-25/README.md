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