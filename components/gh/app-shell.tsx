"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Onboarding } from "./onboarding";
import { BottomNav, type Tab } from "./bottom-nav";
import { DiscoveryView } from "./discovery-view";
import { MatchesView } from "./matches-view";
import { MessagesView } from "./messages-view";
import { NotificationsView } from "./notifications-view";
import { ProfileView } from "./profile-view";

export function AppShell() {
  const { state, ready } = useStore();
  const [tab, setTab] = useState<Tab>("discovery");
  const [chatId, setChatId] = useState<string | null>(null);

  const badges = useMemo<Partial<Record<Tab, number>>>(() => {
    const unreadNotifs = state.notifications.filter(
      (n) => !n.read && !state.blocked.includes(n.profileId),
    ).length;
    const unreadMsgs = state.conversations.filter((c) => {
      const last = c.messages[c.messages.length - 1];
      return last && !last.fromMe && !last.read && !state.blocked.includes(c.profileId);
    }).length;
    const pendingReqs = state.connections.filter(
      (c) =>
        (c.state === "friend_request" || c.state === "connection_invite") &&
        !c.initiatedByMe,
    ).length;
    return { notifications: unreadNotifs, messages: unreadMsgs, matches: pendingReqs };
  }, [state.notifications, state.conversations, state.connections, state.blocked]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!state.onboarded) {
    return <Onboarding />;
  }

  const goToChat = (id: string) => {
    setChatId(id);
    setTab("messages");
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <main className="flex flex-1 flex-col pb-1">
        {tab === "discovery" && <DiscoveryView onGoToChat={goToChat} />}
        {tab === "matches" && <MatchesView onGoToChat={goToChat} />}
        {tab === "messages" && (
          <MessagesView
            activeId={chatId}
            onOpenChat={setChatId}
            onCloseChat={() => setChatId(null)}
          />
        )}
        {tab === "notifications" && (
          <NotificationsView onGoToChat={goToChat} onGoToProfile={(id) => console.log("View profile:", id)} />
        )}
        {tab === "profile" && <ProfileView />}
      </main>
      <BottomNav
        active={tab}
        onChange={(next) => {
          if (next !== "messages") setChatId(null);
          setTab(next);
        }}
        badges={badges}
      />
    </div>
  );
}
