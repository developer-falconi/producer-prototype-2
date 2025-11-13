import { useState, useEffect, useRef, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import supabase from "@/lib/supabase";
import { LiveOrderStatusDto } from "@/lib/types";

type OrderData = LiveOrderStatusDto;

export function useRealtimeOrder(purchaseCode: string | null) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<"connecting" | "open" | "closed">("connecting");

  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchOrder = useCallback(async (code: string) => {
    try {
      const { data, error } = await supabase
        .from("order_entity")
        .select("*")
        .eq("pickupCode", code)
        .maybeSingle();

      if (error) throw error;
      
      return data as OrderData | null;
    } catch (e: any) {
      console.error("Error fetching order:", e.message);
      setError("No se pudo cargar la orden.");
      return null;
    }
  }, []);

  useEffect(() => {
    if (!purchaseCode) {
      setLoading(false);
      setOrder(null);
      return;
    }

    let alive = true;
    const loadSnapshot = async () => {
      setLoading(true);
      setError(null);
      const orderData = await fetchOrder(purchaseCode);
      if (alive) {
        setOrder(orderData);
        setLoading(false);
      }
    };

    loadSnapshot();
    return () => {
      alive = false;
    };
  }, [purchaseCode, fetchOrder]);

  useEffect(() => {
    if (!purchaseCode || channelRef.current) {
      return;
    }

    const orderId = order?.id;

    setConnection("connecting");
    const topic = `order:${purchaseCode}`;
    const ch = supabase.channel(topic);

    const handleOrderChange = async (payload: any) => {
      console.log("[RT] Order change:", payload);
      if (payload.eventType === "DELETE") {
        setOrder(null);
        return;
      }
      const freshOrder = await fetchOrder(purchaseCode);
      if (freshOrder) setOrder(freshOrder);
    };

    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "order_entity",
        filter: `pickupCode=eq.${purchaseCode}`,
      },
      handleOrderChange
    );

    console.log("[RT] Subscribing to channel:", topic);
    channelRef.current = ch.subscribe((status) => {
      console.log("[RT] Status:", status);
      setConnection(status === "SUBSCRIBED" ? "open" : "closed");
    });

    return () => {
      if (channelRef.current) {
        console.log("[RT] Removing channel");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [purchaseCode, order?.id, fetchOrder]);

  return { order, loading, error, connection };
}