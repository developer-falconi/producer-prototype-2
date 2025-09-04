import { ApiResponse, Client, ClientTypeEnum, EventDto, EventImageDto, InEventPurchasePayload, Participant, PreferenceData, Producer, Voucher } from "./types";

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

export async function submitTicketForm(formData: FormData, eventId: number, preventId: number | null, total: number): Promise<ApiResponse<Client[]>> {
  try {
    const clientType = total === 0
      ? ClientTypeEnum.FREE
      : ClientTypeEnum.REGULAR;

    let url = `${API_URL}/client/create/${eventId}?type=${clientType}`;

    if (preventId) {
      url += `&prevent=${preventId}`;
    }

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

export async function createPreference(
  preventId: number,
  clients: Participant[],
  products: { productId: number, quantity: number }[],
  combos: { comboId: number, quantity: number }[],
  total: number,
  promoter: string,
  couponId: number
): Promise<ApiResponse<PreferenceData>> {
  try {
    const payload = {
      clients,
      products,
      combos,
      total,
      promoter,
      coupon: couponId
    }

    const response = await fetch(`${API_URL}/mercadopago/create?prevent=${preventId}`, {
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


export async function submitLiveEventPurchase(payload: InEventPurchasePayload, eventId: number): Promise<ApiResponse<Voucher>> {
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

export async function createLiveEventPreference(
  eventId: number,
  data: InEventPurchasePayload
): Promise<ApiResponse<PreferenceData>> {
  try {
    const payload: InEventPurchasePayload = {
      client: data.client,
      products: data.products,
      combos: data.combos,
      total: data.total,
      coupon: data.coupon
    }
    
    const response = await fetch(`${API_URL}/mercadopago/create/live?event=${eventId}`, {
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