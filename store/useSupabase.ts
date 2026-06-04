import { useAuth } from "@clerk/expo";
import { useRef } from "react";
import { createClerkSupabaseClient } from "../utils/supabase";

export function useSupabase() {
  const { getToken } = useAuth();
  const clientRef = useRef<any>(null);

  if (!clientRef.current) {
    clientRef.current = createClerkSupabaseClient(() => getToken());
  }

  return clientRef.current;
}
