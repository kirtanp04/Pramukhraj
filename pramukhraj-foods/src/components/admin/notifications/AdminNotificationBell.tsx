import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Popover from "@radix-ui/react-popover";
import { Bell, CheckCheck, LoaderCircle, WifiOff } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import { useAdminNotificationsStore } from "@/store/adminNotificationsStore";

export function AdminNotificationBell() {
  const navigate = useNavigate();
  const {
    unread,
    unreadCount,
    isLoading,
    error,
    connectionState,
    acknowledge,
    acknowledgeAll,
  } = useAdminNotificationsStore();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  async function markOne(id: string) {
    setBusyId(id);
    try {
      await acknowledge(id);
    } catch {
      /* Store exposes the error in the popover. */
    } finally {
      setBusyId(null);
    }
  }

  async function openNotification(id: string, actionUrl: string | null) {
    await markOne(id);
    if (actionUrl) navigate(actionUrl);
  }

  async function markAll() {
    setIsClearing(true);
    try {
      await acknowledgeAll();
    } catch {
      /* Store exposes the error in the popover. */
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          aria-label={
            unreadCount
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-oxblood px-1 text-[9px]! font-bold leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-ink/10 bg-ivory shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <div>
              <p className="text-sm! font-semibold">Notifications</p>
              <p className="text-[10px]! text-ink-soft">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={isClearing}
                onClick={() => void markAll()}
                className="inline-flex items-center gap-1 text-xs! font-medium text-teal hover:underline disabled:opacity-50"
              >
                {isClearing ? (
                  <LoaderCircle size={13} className="animate-spin" />
                ) : (
                  <CheckCheck size={13} />
                )}{" "}
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[min(28rem,65vh)] divide-y divide-ink/10 overflow-y-auto">
            {error && (
              <div className="bg-red-50 px-4 py-2 text-xs! text-red-700">
                {error}
              </div>
            )}
            {isLoading && unread.length === 0 && (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs! text-ink-soft">
                <LoaderCircle size={15} className="animate-spin" /> Loading
                notifications...
              </div>
            )}
            {!isLoading && unread.length === 0 && (
              <div className="px-5 py-10 text-center">
                <Bell className="mx-auto text-ink-soft/50" size={25} />
                <p className="mt-2 text-sm! font-medium">You're all caught up</p>
                <p className="mt-1 text-xs! text-ink-soft">
                  New activity will appear here.
                </p>
              </div>
            )}
            {unread.map(item => (
              <NotificationItem
                key={item.id}
                notification={item}
                compact
                isAcknowledging={busyId === item.id}
                onAcknowledge={() => void markOne(item.id)}
                onOpen={() => void openNotification(item.id, item.actionUrl)}
              />
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-ink/10 px-4 py-2.5">
            <span className="inline-flex items-center gap-1 text-[10px]! text-ink-soft">
              {connectionState === "connected" ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                  Live
                </>
              ) : (
                <>
                  <WifiOff size={11} /> Reconnecting
                </>
              )}
            </span>
            <Popover.Close asChild>
              <button
                type="button"
                onClick={() => navigate("/admin/notifications")}
                className="text-xs! font-semibold text-oxblood hover:underline"
              >
                View all notifications
              </button>
            </Popover.Close>
          </div>
          <Popover.Arrow className="fill-ivory" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
