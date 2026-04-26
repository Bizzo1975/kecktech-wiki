import "./globals.css";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const metadata = {
  title: "Kecktech Help Center",
  description: "Kecktech knowledge base and support documentation."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
