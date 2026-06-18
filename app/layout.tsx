import Link from "next/link";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            backgroundColor: "#111",
            padding: "15px",
            display: "flex",
            gap: "20px",
            borderBottom: "2px solid #333",
          }}
        >
          <Link
            href="/"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Home
          </Link>

          <Link
            href="/customer"
            style={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Customers
          </Link>

          <Link
            href="/entry"
            style={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Daily Entry
          </Link>

          <Link
            href="/dispatch"
            style={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Dispatch Matrix
          </Link>
        </nav>

        {children}
      </body>
    </html>
  );
}