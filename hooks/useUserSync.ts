import { useUser } from "@clerk/expo";
import { useEffect, useRef } from "react";
import { useUserStore } from "../store/useStore";
import { useSupabase } from "../store/useSupabase";

export const useUserSync = () => {
  const { user } = useUser();
  const setIsAdmin = useUserStore((state) => state.setIsAdmin);
  const authSupabase = useSupabase();
  const syncedUserIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      syncedUserIds.current.clear();
      return;
    }

    // Skip if we've already synced this user
    if (syncedUserIds.current.has(user.id)) return;

    const syncUser = async () => {
      try {
        const { data } = await authSupabase
          .from("users")
          .select("clerk_id, is_admin")
          .eq("clerk_id", user.id)
          .single();

        if (data) {
          // user exists
          setIsAdmin(data.is_admin ?? false);
          syncedUserIds.current.add(user.id);
          return;
        }

        const { data: newUser } = await authSupabase
          .from("users")
          .insert({
            clerk_id: user.id,
            email: user.emailAddresses[0].emailAddress,
            first_name: user.firstName,
            last_name: user.lastName,
            avatar_url: user.imageUrl,
          })
          .select("is_admin")
          .single();

        setIsAdmin(newUser?.is_admin ?? false);
        syncedUserIds.current.add(user.id);
      } catch (error) {
        console.error("Error syncing user:", error);
      }
    };

    syncUser();
  }, [user, authSupabase, setIsAdmin]);
};
