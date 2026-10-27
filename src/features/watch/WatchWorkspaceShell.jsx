import React from 'react';

export function WatchWorkspaceShell({ main, sidebar, isCollapsed = false }) {
  return (
    <div data-testid="watch-shell" className="flex h-full w-full flex-col bg-background xl:flex-row overflow-hidden">
      <main data-testid="watch-main" className="flex min-w-0 flex-1 flex-col bg-background pb-8 xl:pb-6 h-full overflow-y-auto">
        {main}
      </main>
      {!isCollapsed && sidebar}
    </div>
  );
}
