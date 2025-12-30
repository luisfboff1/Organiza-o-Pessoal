import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

type WorkspaceData = {
  id: string;
};

export default async function HomePage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single<WorkspaceData>();

  if (workspace) {
    redirect(`/${workspace.id}`);
  }

  // If no workspace, redirect to login (shouldn't happen due to trigger)
  redirect('/login');
}
