import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export default async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const type = pathParts[3];
  const id = pathParts[4];

  let data = null;

  if (type === 'course' && id) {
    try {
      const response = await fetch(`https://bluedot.org/api/courses/${id}`);
      data = await response.json();
    } catch (error) {
      console.error('Failed to fetch course data:', error);
    }
  }
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '50px 200px',
          width: '100%',
          height: '100%',
          backgroundColor: '#FCFBF9',
        }}
      >
        <div style={{
          display: 'flex',
          flex: 1,
        }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', color: '#00114D' }}>
            <h1>BlueDot / {data?.course?.title}</h1>
            <p>{data?.course?.shortDescription}</p>
          </div>
        </div>
        <div style={{
          display: 'flex',
        }}
        >
          <p style={{ color: '#FCFBF9' }}>Apply now</p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
