import { getOrCreateDeviceId } from "./notifications";
import { ApiResponse, Client, ClientTypeEnum, CourtesyDto, EventDto, EventImageDto, InEventPurchasePayload, LiveOrderStateEnum, LiveOrderStatusDto, LiveOrderSummary, Participant, PreferenceData, Producer, PushSubscriptionPayload, Voucher } from "./types";

const API_URL = import.meta.env.VITE_APP_API_BE;

export async function fetchProducerData(): Promise<ApiResponse<Producer>> {
  try {
    const response = await fetch(`${API_URL}/producer/domain`);
    if (!response.ok) {
      throw new Error("Failed to fetch producer data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching producer data:", error);
    throw error;
  }
}

export async function fetchProducerEventsData(): Promise<ApiResponse<EventDto[]>> {
  try {
    const response = await fetch(`${API_URL}/producer/domain/events`);
    if (!response.ok) {
      throw new Error("Failed to fetch producer data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching producer data:", error);
    throw error;
  }
}

export async function fetchProducerEventDetailData(eventId: number): Promise<ApiResponse<EventDto>> {
  try {
    const response = await fetch(`${API_URL}/producer/domain/event/${eventId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch producer data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching producer data:", error);
    throw error;
  }
}

export async function fetchProducerGalleryData(): Promise<ApiResponse<EventImageDto[]>> {
  try {
    const response = await fetch(`${API_URL}/producer/domain/gallery`);
    if (!response.ok) {
      throw new Error("Failed to fetch producer data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching producer data:", error);
    throw error;
  }
}

export async function submitTicketForm(formData: FormData, eventId: number, total: number): Promise<ApiResponse<Voucher[]>> {
  try {
    const clientType = total === 0
      ? ClientTypeEnum.FREE
      : ClientTypeEnum.REGULAR;

    const url = `${API_URL}/client/create/${eventId}?type=${clientType}`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to submit ticket form");
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting ticket form: ", error);
    return { success: false };
  }
}

type PreferenceRequestPayload = {
  clients: Participant[];
  products: { productId: number; quantity: number }[];
  combos: { comboId: number; quantity: number }[];
  experiences: { experienceId: number; quantity: number }[];
  total: number;
  promoter: string | null;
  coupon: number | null;
  ticketRequests: { preventId: number; clientIndex: number; bundles: number }[];
};

export async function createPreference(
  eventId: number,
  payload: PreferenceRequestPayload
): Promise<ApiResponse<PreferenceData>> {
  try {
    const response = await fetch(`${API_URL}/mercadopago/create?event=${eventId}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Failed to submit ticket form");
    }
    return await response.json();
  } catch (error) {
    console.error("Error submitting ticket form:", error);
    return { success: false };
  }
}


export async function submitLiveEventPurchase(payload: InEventPurchasePayload, eventId: number): Promise<ApiResponse<{ voucher: Voucher; order: LiveOrderSummary }>> {
  try {
    const url = `${API_URL}/client/purchase/live/${eventId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Failed to submit ticket form");
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting ticket form: ", error);
    return { success: false };
  }
}

export async function markDeliveredOrder(orderId: number, status: LiveOrderStateEnum): Promise<ApiResponse<LiveOrderStatusDto>> {
  try {
    const payload = { status };
    const response = await fetch(`${API_URL}/orders/status?order=${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch live order status");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching live order status: ", error);
    return { success: false };
  }
}

export async function createLiveEventPreference(
  eventId: number,
  data: InEventPurchasePayload
): Promise<ApiResponse<PreferenceData>> {
  try {
    const payload: InEventPurchasePayload = {
      client: data.client,
      products: data.products,
      combos: data.combos,
      experiences: data.experiences,
      total: data.total,
      coupon: data.coupon
    }

    const response = await fetch(`${API_URL}/mercadopago/create/live?event=${eventId}`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Failed to submit ticket form");
    }
    return await response.json();
  } catch (error) {
    console.error("Error submitting ticket form:", error);
    return { success: false };
  }
}

export async function registerLiveOrderPushSubscription(
  token: string,
  subscription: PushSubscriptionJSON
): Promise<ApiResponse<any>> {
  try {
    const deviceId = getOrCreateDeviceId();
    const existing = localStorage.getItem(`subscription_${token}_${deviceId}`);

    const payload = JSON.stringify({ ...subscription, deviceId });
    if (existing === payload) return { success: true, data: null };

    const response = await fetch(`${API_URL}/orders/track/${token}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...subscription, deviceId }),
    });

    if (!response.ok) throw new Error("Failed to register notification subscription");
    localStorage.setItem(`subscription_${token}_${deviceId}`, payload);
    
    return await response.json();
  } catch (error) {
    console.error("Error registering notification subscription:", error);
    return { success: false };
  }
}

export async function unregisterLiveOrderPushSubscription(
  token: string,
  endpoint: string
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_URL}/orders/track/${token}/notifications`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    if (!response.ok) {
      throw new Error("Failed to unregister notification subscription");
    }
    return await response.json();
  } catch (error) {
    console.error("Error unregistering notification subscription:", error);
    return { success: false };
  }
}

export async function validateCoupon(eventId: number, code: string) {
  try {
    const response = await fetch(`${API_URL}/producer/domain/event/${eventId}/coupon?coupon=${encodeURIComponent(code)}`);
    if (!response.ok) {
      throw new Error("Failed to fetch producer data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching producer data:", error);
    throw error;
  }
}

export async function getCourtesyInvite(token: string): Promise<ApiResponse<CourtesyDto>> {
  const res = await fetch(`${API_URL}/courtesy/invite?token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error("No se pudo cargar la cortesía");
  return await res.json();
}

export async function claimCourtesyInvite(token: string, eventId: number, payload) {
  const res = await fetch(`${API_URL}/courtesy/claim?token=${encodeURIComponent(token)}&event=${eventId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("No se pudo reclamar la cortesía");
  return await res.json();
}
