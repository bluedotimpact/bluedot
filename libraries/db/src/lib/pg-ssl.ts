import tls from 'node:tls';

/** The subset of node-postgres `PoolConfig` we produce (`pg` ships no types of its own). */
type PgPoolConfig = {
  connectionString: string;
  ssl?: { ca: string[] };
};

/**
 * CA certificate for our Vultr managed Postgres databases. Valid until 2036-05-19.
 *
 * This is public-key material (the server sends it to every client during the TLS handshake),
 * so it is safe to commit.
 *
 * To refresh (e.g. if the Vultr account is ever recreated): Vultr console → the database →
 * Connection Details → "Download Signed Certificate", or fetch it from the server itself:
 */
export const VULTR_PROJECT_CA = `-----BEGIN CERTIFICATE-----
MIIERDCCAqygAwIBAgIUF44kku5ijnmaMUps1a/9AlHKrNcwDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvMTFhNzQyODItNmIyYS00ZWVkLWE1OGItNWNlNmNkMjk5
YTY2IFByb2plY3QgQ0EwHhcNMjYwNTIyMTczMTU5WhcNMzYwNTE5MTczMTU5WjA6
MTgwNgYDVQQDDC8xMWE3NDI4Mi02YjJhLTRlZWQtYTU4Yi01Y2U2Y2QyOTlhNjYg
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBALITF+vO
sH98hcqX6W98aCDGebkg26c9wPy7ktws6Ravyn/YCdHEJn1HbsJJEzU5Lv5H2Z5a
KJkzVVsk7fNGARvNtuoxnTHF08xYfylksjl8PbSlcGCru+U8T7x0foIDj6WVIg/E
y2iQngUMBvk/4sEiaGm90Z046WlvPRGikiQM3U9yjLHm+SFNC8ibeXmhPtH4tJqp
Iy7zSq8Ja30hnvBFZEHXyWZloXmg++OPsCxty7fzsHuMusxsJXSvdZegtbjcW3QE
ADTGBnNcqb/dIGFpjZuzjRDkrShaxae4lCuRyAvMJVMYJEsIJq/KKqdmeDobW1lf
utSsPUTnOnyBdk/MTOQZ8jebvnEWstZPWjWGPM/Zpkr1VukIepDs1ntJ4MoGMc+V
/B9C347ggrwZKP/x4g75w6FH9pUlPHZKB2/S83QL0uvSd0cwZG7kOLJvfzTk/6+B
gPGFSgcQHvnUvdN1QF6/QCtvqlVyKuo8vE3K0vnuuVcU50AqF1i9Phk8JwIDAQAB
o0IwQDAdBgNVHQ4EFgQUUYRlGxyByLrJY/gW2/MUICpig8AwEgYDVR0TAQH/BAgw
BgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAJVd8Uy1bwMO
js5mLXC9nMAVYFhstecjRd2OFDsdb8iVWswOOu9x9dKVGjVPRKEjQME1VsXvT17J
sgIoqs5JKx6Bu3qWvP4XpPldwlSSK7kAHWH6JFKXGuSyiL9bg/m9BX9L5B6aplLx
YkR5pR1Us01IbqJ+18y3laV/eSPTCrM8GNn7iYgSI7svLc/b5td4+sHP0dhNe7lq
NaoPNtUs7rOu39b7IsmYXP8iuDcwJPpGhihDprmmaIct/UBoLAnBUvnljtB6ucuM
ssO0IcUd4cp3AsN+S33qT+cb7fugYdfkkKvoFa8G3RpGaUx1OOOCUh2Fu6T0O937
eOsTUbNrBCoPHo4huJjUTKwsuGoGA+8MytRAkqEPzGNvBgdd22qtkG8tpJm6u9Hk
Jem7Jywr1gPfr0AW7jY/jQNdivXecpBnWMobYpLFa4WPqBtA0JTkmr46Fz5z+D4a
sCZJJb8XeXOLXzB+kG5OwbbB2X4dKnYLJ+f+65KE7trhBE81GhRXfw==
-----END CERTIFICATE-----
`;

/**
 * Builds the node-postgres config for a connection string. For `sslmode`s that require
 * attaching the Vultr CA (alongside the system roots), patch in the VULTR_PROJECT_CA
 * but drop the `sslmode` parameter, to avoid SELF_SIGNED_CERT_IN_CHAIN. This still
 * achieves the security benefit of sending the cert (avoiding man-in-the-middle attacks).
 */
export const pgConnectionConfig = (connString: string): PgPoolConfig => {
  let url: URL;
  try {
    url = new URL(connString);
  } catch {
    // Not a URI-style connection string, let pg interpret it as-is.
    return { connectionString: connString };
  }

  const sslmode = url.searchParams.get('sslmode');
  if (sslmode === null || !['require', 'verify-ca', 'verify-full'].includes(sslmode)) {
    return { connectionString: connString };
  }

  url.searchParams.delete('sslmode');
  return {
    connectionString: url.toString(),
    ssl: { ca: [VULTR_PROJECT_CA, ...tls.rootCertificates] },
  };
};
