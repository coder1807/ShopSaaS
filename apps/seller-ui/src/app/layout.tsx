import './global.css';
import Providers from './providers';

export const metadata = {
  title: 'Welcome to ShopSaaS',
  description:
    "I'm learning everything about every technology i'm using in this project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
