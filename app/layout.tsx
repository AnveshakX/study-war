import "./globals.css";
import Navbar from "@/components/Navbar";
import LiveNotifications from "@/components/LiveNotifications";

export const metadata = {
  title: "Study War",
  description: "Compete. Study. Win.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <LiveNotifications />
        {children}
      </body>
    </html>
  );
}