import React from 'react';

export function WatchWorkspaceShell({ main, sidebar, isCollapsed = false }) {
  return (
    <div data-testid="watch-shell" className="flex min-h-screen xl:h-full w-full flex-col bg-background xl:flex-row overflow-x-hidden xl:overflow-hidden">
      <main data-testid="watch-main" className="flex min-w-0 flex-1 flex-col bg-background pb-20 xl:pb-6 xl:h-full xl:overflow-y-auto">
        {main}
      </main>
      {!isCollapsed && sidebar}
    </div>
  );
}
