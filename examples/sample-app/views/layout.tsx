import type { FC, PropsWithChildren } from 'hono/jsx';

type LayoutProps = PropsWithChildren<{
  title: string;
  username?: string;
}>;

export const Layout: FC<LayoutProps> = ({ title, username, children }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title} | Demo Shop</title>
        <style>{`
          body { font-family: system-ui, sans-serif; max-width: 960px; margin: 0 auto; padding: 1rem; }
          header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; margin-bottom: 1rem; }
          nav a { margin-right: 1rem; }
          .product { border: 1px solid #ddd; padding: 1rem; margin-bottom: 0.5rem; border-radius: 4px; }
          .product h3 { margin: 0 0 0.5rem 0; }
          .price { color: #2a7; font-weight: bold; }
          form { display: flex; flex-direction: column; gap: 0.5rem; max-width: 320px; }
          label { display: flex; flex-direction: column; gap: 0.25rem; }
          input, button { padding: 0.5rem; font-size: 1rem; }
          button { background: #2a7; color: white; border: 0; border-radius: 4px; cursor: pointer; }
          button:hover { background: #1a5; }
          [role="alert"] { color: #c33; padding: 0.5rem; border: 1px solid #c33; border-radius: 4px; margin-bottom: 1rem; }
        `}</style>
      </head>
      <body>
        <header>
          <nav data-testid="main-nav">
            <a href="/products">Products</a>
            <a href="/cart">Cart</a>
            {username ? <a href="/admin">Admin</a> : null}
          </nav>
          {username ? (
            <span data-testid="current-user">
              Signed in as <strong>{username}</strong>
              <form method="post" action="/logout" style={{ display: 'inline', marginLeft: '0.5rem' }}>
                <button type="submit">Sign out</button>
              </form>
            </span>
          ) : (
            <a href="/login">Sign in</a>
          )}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
};
