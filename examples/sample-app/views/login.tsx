import type { FC } from 'hono/jsx';
import { Layout } from './layout';

type LoginProps = {
  error?: string;
};

export const LoginPage: FC<LoginProps> = ({ error }) => {
  return (
    <Layout title="Sign in">
      <h1>Sign in</h1>
      {error ? <div role="alert">{error}</div> : null}
      <form method="post" action="/login">
        <label>
          Username
          <input type="text" name="username" autoComplete="username" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </Layout>
  );
};
