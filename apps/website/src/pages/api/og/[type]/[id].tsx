import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export default async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const type = pathSegments[3];
  const id = pathSegments[4];

  // Load different weights of Inter
  const interRegular = fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff',
  ).then((res) => res.arrayBuffer());

  const interLight = fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfAZ9hjp-Ek-_EeA.woff',
  ).then((res) => res.arrayBuffer());

  const interBold = fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff',
  ).then((res) => res.arrayBuffer());

  // Then in your handler:
  const [fontRegular, fontLight, fontBold] = await Promise.all([
    interRegular,
    interLight,
    interBold,
  ]);

  let data = null;

  if (type === 'course' && id) {
    try {
      const response = await fetch(`https://bluedot.org/api/courses/${id}`);
      data = await response.json();
    } catch (error) {
      return new Response('Failed to fetch course data', { status: 500 });
    }
  }
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#FCFBF9',
          fontFamily: 'Inter',
          letterSpacing: '0.01em',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          padding: '50px 100px',
          flex: 1,
        }}
        >
          <div style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
          }}
          >
            <p style={{
              fontSize: 20,
              fontWeight: 400,
              color: '#808080',
            }}
            >BlueDot Impact / {type ? type.charAt(0).toUpperCase() + type.slice(1) : ''}
            </p>
            <h1 style={{
              fontSize: 64,
              fontWeight: 700,
              color: 'black',
            }}
            >{data?.course?.title}
            </h1>
            <p style={{
              fontSize: 32,
              fontWeight: 400,
              color: '#808080',
              lineHeight: 1.1,
            }}
            >{data?.course?.shortDescription}
            </p>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
          >
            <img
              src="data:image/svg+xml;base64, PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAwIiBoZWlnaHQ9IjEwMDAiPjxwYXRoIGQ9Ik0wIDBoMTAwMHYxMDAwSDB6IiBzdHlsZT0iZmlsbDojMDAzN2ZmO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDo0LjkwNzM4O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZCIvPjxnIGNsaXAtcGF0aD0idXJsKCNhKSIgdHJhbnNmb3JtPSJtYXRyaXgoNS42IDAgMCA1LjYgMTUwIDE1MCkiPjxzdmcgd2lkdGg9IjEyNSIgaGVpZ2h0PSIxMjUiPjxzdmcgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjEyNSIgaGVpZ2h0PSIxMjUiIHN0eWxlPSJjbGlwLXJ1bGU6ZXZlbm9kZDtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MiIgdmlld0JveD0iMCAwIDEyNSAxMjUiPjxwYXRoIGQ9Ik0wLTQ4LjYyYTE0Ljg5IDE0Ljg5IDAgMCAxLTExLjI2IDUuMTkgMTQuODggMTQuODggMCAwIDEtMTQuODMtMTQuODYgMTQuODUgMTQuODUgMCAwIDEgMTQuODMtMTQuOGguNTNBMTQuOTUgMTQuOTUgMCAwIDEgMy42My01OC43N3YuNDdjMCAzLjUzLTEuMyA2Ljk2LTMuNTggOS42N3ptLTM0LjkxLTIzLjljLjYyIDEuMDkuNjIgMi4zOC4xIDMuNTJhMjUuODggMjUuODggMCAwIDAgMjAuNjUgMzYuMzhBMjUuOCAyNS44IDAgMCAwLS42My0zNC43NmE0IDQgMCAwIDEgMy41My4xIDMuOTUgMy45NSAwIDAgMSAyIDIuOGMuNzIgNC41Ny43NyA5LjM0LjIgMTMuOTVDMi4yOCA1LjU3LTE2Ljg1IDI0LjMtNDAuMyAyNi42N0E1MSA1MSAwIDAgMS04MS41NiAxMmE1MS4xMiA1MS4xMiAwIDAgMS0xNC43My00MS4yNEE1MS4yNSA1MS4yNSAwIDAgMS00NS41LTc1LjE5YzIuNTggMCA1LjIuMTkgNy43Ny42MiAxLjIuMTkgMi4yNS45IDIuODIgMnptNDkuNjUgMzMuN2EzOS42MiAzOS42MiAwIDAgMS0uNDgtMTUuNjEgMjUuODIgMjUuODIgMCAwIDAtMjkuMzgtMjkuNDNjLTUuNTguODYtMTAuODMuNjctMTUuNjQtLjQ4YTYwLjM5IDYwLjM5IDAgMCAwLTIxLjctMS40MiA2MiA2MiAwIDAgMC01NC44IDU2LjE5IDYyLjEzIDYyLjEzIDAgMCAwIDE3LjkzIDQ5LjMzQTYyLjAzIDYyLjAzIDAgMCAwIDE2LjE3LTE3LjFjLjgtNy4zMy4zMy0xNC42Ni0xLjM5LTIxLjcxeiIgc3R5bGU9ImZpbGw6I2ZmZjtmaWxsLXJ1bGU6bm9uemVybyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTA3LjUgODYuMTYpIi8+PC9zdmc+PC9zdmc+PC9nPjxkZWZzPjxjbGlwUGF0aCBpZD0iYSIgY2xpcFBhdGhVbml0cz0idXNlclNwYWNlT25Vc2UiPjxyZWN0IHdpZHRoPSIxNzguNTciIGhlaWdodD0iMTc4LjU3IiB4PSItMjYuNzkiIHk9Ii0yNi43OSIgcng9IjYyLjUiIHJ5PSI2Mi41IiBzdHlsZT0ic3Ryb2tlLXdpZHRoOi4xNzg1NzEiLz48L2NsaXBQYXRoPjwvZGVmcz48L3N2Zz4=
"
              alt="BlueDot Impact Logo"
              width="240"
              height="240"
              style={{
                borderRadius: '48px',
              }}
            />
          </div>
        </div>
        {/* CTA */}
        <div style={{
          display: 'flex',
          backgroundColor: '#002199',
          height: '100px',
          padding: '50px 100px',
          alignItems: 'center',
          width: '100%',
        }}
        >
          <div style={{
            backgroundColor: '#0037ff',
            color: 'white',
            borderRadius: 50,
            fontSize: 24,
            fontWeight: 700,
            padding: '10px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '300px',
          }}
          >
            Start learning for free
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontLight,
          weight: 200,
        },
        {
          name: 'Inter',
          data: fontRegular,
          weight: 400,
        },
        {
          name: 'Inter',
          data: fontBold,
          weight: 700,
        },
      ],
    },
  );
}
