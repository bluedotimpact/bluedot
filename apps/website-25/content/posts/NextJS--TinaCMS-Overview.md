---
title: NextJS + TinaCMS Overview
author: content/authors/zain.md
date: 2025-01-20T19:00:00.000Z
mainImage: /uploads/gen-1735119779016-poster.png
excerpt: Hello World
category: Technology
readTime: 4
---

## [Installing dependencies](https://tina.io/docs/frameworks/next/overview?_gl=1*gu6786*_up*MQ..*_ga*MTg1NzQ5NjkyMi4xNzM3NDY2NTk0*_ga_9R1HHZC8HX*MTczNzQ2NjU5NC4xLjAuMTczNzQ2NjU5NC4wLjAuMTIwMzUxMDg1#installing-dependencies)

From within your site's directory, run:

npx @tinacms/cli\@latest init

This will ask you a few setup questions. When prompted for the public assets directory, enter: public.

## [Updating your build scripts](https://tina.io/docs/frameworks/next/overview#updating-your-build-scripts)

tina init should have updated your package.json scripts.

"scripts": {  "dev": "tinacms dev -c \\"next dev\\"",  "build": "tinacms build && next build",  "start": "tinacms build && next start"}

These should be applied manually if they haven't been set by the CLI.

## [Starting TinaCMS](https://tina.io/docs/frameworks/next/overview#starting-tinacms)

You can start TinaCMS with:

pnpm dev

We recommend using pnpm.

With TinaCMS running, navigate to http\://localhost:3000/admin/index.html.

> ❓ Hint: If you are getting errors when running this command, please see the [Common Errors](https://tina.io/docs/forestry/common-errors) page.

At this point, you should be able to see the Tina admin, select a post, save changes, and see the changes persisted to your local markdown files.

## [TinaCMS Config file](https://tina.io/docs/frameworks/next/overview#tinacms-config-file)

After running the tina init command a few files were created to get you started as quick as possible. One of these is the tina/config.ts file. This is the a required config file that defines all the tina schemas.

It looks like the following:

import { defineConfig } from 'tinacms'// Your hosting provider likely exposes this as an environment variableconst branch =  process.env.GITHUB\_BRANCH ||  process.env.VERCEL\_GIT\_COMMIT\_REF ||  process.env.HEAD ||  'main'export default defineConfig({  branch,  // Get this from tina.io  clientId: process.env.NEXT\_PUBLIC\_TINA\_CLIENT\_ID,  // Get this from tina.io  token: process.env.TINA\_TOKEN,  build: {    outputFolder: 'admin',    publicFolder: 'public',  },  media: {    tina: {      mediaRoot: '',      publicFolder: 'public',    },  },  schema: {    collections: \[      {        name: 'post',        label: 'Posts',        path: 'content/posts',        fields: \[          {            type: 'string',            name: 'title',            label: 'Title',            isTitle: true,            required: true,          },          {            type: 'rich-text',            name: 'body',            label: 'Body',            isBody: true,          },        ],      },    ],  },})

For a more detailed overview about the config see [Content Modeling with TinaCMS](https://tina.io/docs/extending-tina/overview/)

> 💡 If you've followed this guide using the tina init command, you might have noticed that a content and a pages folder got created:

 Adding file at content/posts/hello-world.md... ✅ Adding file at pages/demo/blog/\[filename].tsx... ✅

> These can be used as a quick reference but are safe to delete.

## [Creating a New Post](https://tina.io/docs/frameworks/next/overview#creating-a-new-post)

> 💡 As defined in the tina/config.ts file we have 1 collection called post which will be picked up by TinaCMS and mapped to what you see in the TinaCMS Admin page.

1.Head over to /admin/index.html

2.Click on Posts

3.Click on Create

4.Enter required fields

5.Save

Now, let's go back and check what was created. You will see a /content folder with your new post saved as a .md file. This path is defined in the tina/config.ts files post collection!

content    └── posts        └── hello-world.md

## [Rendering the Post Collection](https://tina.io/docs/frameworks/next/overview#rendering-the-post-collection)

Let's start by creating a /posts folder. The index here will list all our posts.

File: pages/posts/index.tsx

import Link from 'next/link'import { useTina } from 'tinacms/dist/react'import { client } from '../../tina/\_\_generated\_\_/client'export default function PostList(props) {  // data passes though in production mode and data is updated to the sidebar data in edit-mode  const { data } = useTina({    query: props.query,    variables: props.variables,    data: props.data,  })  const postsList = data.postConnection.edges  return (    \<>      \<h1>Posts\</h1>      \<div>        {postsList.map((post) => (          \<div key={post.node.id}>            \<Link href={\`/posts/${post.node.\_sys.filename}\`}>              {post.node.\_sys.filename}            \</Link>          \</div>        ))}      \</div>    \</>  )}export const getStaticProps = async () => {  const { data, query, variables } = await client.queries.postConnection()  return {    props: {      data,      query,      variables,    },  }}

## [Rendering a Single Post](https://tina.io/docs/frameworks/next/overview#rendering-a-single-post)

File: pages/posts/\[slug].tsx

import { useTina } from 'tinacms/dist/react'import { client } from '../../tina/\_\_generated\_\_/client'export default function Home(props) {  // data passes though in production mode and data is updated to the sidebar data in edit-mode  const { data } = useTina({    query: props.query,    variables: props.variables,    data: props.data,  })  return (    \<>      \<code>        \<pre          style={{            backgroundColor: 'lightgray',          }}        >          {JSON.stringify(data.post, null, 2)}        \</pre>      \</code>    \</>  )}export const getStaticPaths = async () => {  const { data } = await client.queries.postConnection()  const paths = data.postConnection.edges.map((x) => {    return { params: { slug: x.node.\_sys.filename } }  })  return {    paths,    fallback: 'blocking',  }}export const getStaticProps = async (ctx) => {  const { data, query, variables } = await client.queries.post({    relativePath: ctx.params.slug + '.md',  })  return {    props: {      data,      query,      variables,    },
