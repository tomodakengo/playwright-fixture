import type { FC } from 'hono/jsx';
import { Layout } from './layout';

export const AdminPage: FC<{ username: string }> = ({ username }) => {
  return (
    <Layout title="Admin" username={username}>
      <h1>Admin dashboard</h1>
      <p data-testid="admin-welcome">Welcome, administrator {username}.</p>
      <p>Only users with the admin role can see this page.</p>
    </Layout>
  );
};
