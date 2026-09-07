"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createSecureId } from "@/lib/security/secureId";
import { useAuth } from "@/lib/auth/AuthContext";

const INITIAL_PRESENCE = Object.freeze({ connectedClients: null, studyPods: [] });
const INITIAL_RUNTIME = Object.freeze({
  transport: null,
  authoritative: null,
  activeConnections: null,
  replayWindowSize: null,
  lastEventAt: null,
  measuredAt: null,
});

const RealtimeContext = createContext({
  connectionStatus: "CONNECTING",
  latency: null,
  activeLearners: null,
  auditsCompleted: null,
  metrics: null,
  runtime: INITIAL_RUNTIME,
  presence: INITIAL_PRESENCE,
  recentEvents: [],
  notifications: [],
  dismissNotification: () => {},
  broadcastEvent: async () => ({ success: false, error: "Realtime is unavailable." }),
  subscribe: () => () => {},
});

function numericValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function RealtimeProvider({ children }) {
  const { session, authState } = useAuth();
  const principalId = session?.authority === "APPLICATION_SESSION" ? session.user?.id || null : null;
  const hasApplicationSession = Boolean(
    principalId
      && authState === "SIGNED_IN"
  );
  const [connectionStatus, setConnectionStatus] = useState("CONNECTING");
  const [latency, setLatency] = useState(null);
  const [activeLearners, setActiveLearners] = useState(null);
  const [auditsCompleted, setAuditsCompleted] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [runtime, setRuntime] = useState(INITIAL_RUNTIME);
  const [presence, setPresence] = useState(INITIAL_PRESENCE);
  const [recentEvents, setRecentEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const eventSourceRef = useRef(null);
  const subscribersRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const clientIdRef = useRef(null);
  const lastSequenceRef = useRef(0);
  const connectSSERef = useRef(null);
  const previousPrincipalIdRef = useRef(null);

  const dispatchToSubscribers = useCallback((channel, eventType, data) => {
    const key = `${channel}:${eventType}`;
    const anyKey = `${channel}:*`;
    const allKey = "*:*";
    [key, anyKey, allKey].forEach((subscriberKey) => {
      subscribersRef.current.get(subscriberKey)?.forEach((callback) => {
        try { callback(data); } catch (error) { console.error("[Realtime] Subscriber callback error:", error); }
      });
    });
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const rememberEvent = useCallback((record) => {
    if (!record || typeof record !== "object") return;
    const sequence = numericValue(record.sequence);
    if (sequence !== null && Number.isSafeInteger(sequence) && sequence > lastSequenceRef.current) {
      lastSequenceRef.current = sequence;
    }
    setRecentEvents((current) => [record, ...current.filter((item) => item.id !== record.id).slice(0, 49)]);
    if (record.channel && record.eventType) dispatchToSubscribers(record.channel, record.eventType, record);
  }, [dispatchToSubscribers]);

  const handleAuditEvent = useCallback((record) => {
    const data = record.data || {};
    if (!data.claim && !data.title && !data.message) return;
    const notification = {
      id: record.id || createSecureId("notif"),
      title: data.verdict === "FRAUD_DETECTED" ? "Cảnh báo gian lận học thuật" : "Thẩm định bằng chứng mới",
      message: data.claim || data.title || data.message,
      score: numericValue(data.score),
      verdict: data.verdict || null,
      domain: data.domain || null,
      timestamp: record.timestamp || Date.now(),
    };
    setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id).slice(0, 4)]);
    window.setTimeout(() => dismissNotification(notification.id), 6000);
  }, [dismissNotification]);

  const connectSSE = useCallback(() => {
    if (typeof window === "undefined") return;
    eventSourceRef.current?.close();
    clientIdRef.current ||= createSecureId("client");

    // Anonymous visitors may only subscribe to the public system channel. The
    // stream endpoint intentionally rejects private scopes with 403; waiting
    // for the server-owned application session prevents an EventSource page
    // error and reconnect loop during the auth bootstrap window.
    const requestedChannels = hasApplicationSession
      ? ["system", "presence", "trust", "audit", "telemetry", "community", "expert"].join(",")
      : "system";
    const cursor = lastSequenceRef.current > 0 ? `&cursor=${encodeURIComponent(lastSequenceRef.current)}` : "";
    const url = `/api/realtime/stream?clientId=${encodeURIComponent(clientIdRef.current)}&channels=${encodeURIComponent(requestedChannels)}${cursor}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => setConnectionStatus("CONNECTED");
    eventSource.onerror = () => {
      setConnectionStatus("RECONNECTING");
      eventSource.close();
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = window.setTimeout(() => connectSSERef.current?.(), 3500);
    };

    eventSource.addEventListener("system:connected", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.runtime) setRuntime((current) => ({ ...current, ...data.runtime }));
        if (Array.isArray(data.recentEvents)) data.recentEvents.forEach(rememberEvent);
      } catch (error) { console.error("[Realtime] Error parsing handshake:", error); }
    });

    eventSource.addEventListener("telemetry:tick", (event) => {
      try {
        const record = JSON.parse(event.data);
        const data = record.data || record;
        if (data.metrics && typeof data.metrics === "object") {
          setMetrics(data.metrics);
          setActiveLearners(numericValue(data.metrics.activeLearners));
          setAuditsCompleted(numericValue(data.metrics.auditsCompleted));
          if (numericValue(data.metrics.avgLatencyMs) !== null) setLatency(data.metrics.avgLatencyMs);
        }
        rememberEvent(record);
      } catch (error) { console.error("[Realtime] Error parsing telemetry:", error); }
    });

    eventSource.addEventListener("presence:update", (event) => {
      try {
        const record = JSON.parse(event.data);
        const data = record.data || record;
        setPresence((current) => ({ ...current, ...data, studyPods: Array.isArray(data.studyPods) ? data.studyPods : current.studyPods }));
        rememberEvent(record);
      } catch (error) { console.error("[Realtime] Error parsing presence:", error); }
    });

    eventSource.addEventListener("audit:claim_evaluated", (event) => {
      try {
        const record = JSON.parse(event.data);
        handleAuditEvent(record);
        rememberEvent(record);
      } catch (error) { console.error("[Realtime] Error parsing audit event:", error); }
    });

    eventSource.addEventListener("system:ping", (event) => {
      try {
        const record = JSON.parse(event.data);
        const data = record.data || record;
        const sentAt = numericValue(data.ping);
        if (sentAt !== null) setLatency(Math.max(0, Date.now() - sentAt));
        if (numericValue(data.connectedClients) !== null) setRuntime((current) => ({ ...current, activeConnections: data.connectedClients, measuredAt: data.measuredAt || current.measuredAt }));
        rememberEvent(record);
      } catch (error) { console.error("[Realtime] Error parsing ping:", error); }
    });
  }, [handleAuditEvent, rememberEvent, hasApplicationSession]);

  useEffect(() => { connectSSERef.current = connectSSE; }, [connectSSE]);

  useEffect(() => {
    if (previousPrincipalIdRef.current !== principalId) {
      // Never retain private events/notifications across account changes or
      // logout. The next stream is authorized from the new cookie only.
      setRecentEvents([]);
      setNotifications([]);
      setMetrics(null);
      setActiveLearners(null);
      setAuditsCompleted(null);
      setPresence(INITIAL_PRESENCE);
      setRuntime(INITIAL_RUNTIME);
      lastSequenceRef.current = 0;
      previousPrincipalIdRef.current = principalId;
    }

    if (!hasApplicationSession) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      window.clearTimeout(reconnectTimeoutRef.current);
      const statusTimer = window.setTimeout(() => {
        const pending = ["INITIALIZING", "AUTHENTICATING", "REFRESHING", "SIGNING_OUT"].includes(authState);
        setConnectionStatus(pending ? "CONNECTING" : "DISCONNECTED");
      }, 0);
      return () => window.clearTimeout(statusTimer);
    }

    connectSSE();
    return () => {
      eventSourceRef.current?.close();
      window.clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connectSSE, hasApplicationSession, principalId, authState]);

  const broadcastEvent = useCallback(async (channel, eventType, data) => {
    try {
      const response = await fetch("/api/realtime/broadcast", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "Idempotency-Key": createSecureId("realtime") },
        body: JSON.stringify({ channel, eventType, data }),
      });
      return await response.json();
    } catch (error) {
      console.error("[Realtime] Broadcast failed:", error);
      return { success: false, error: error.message };
    }
  }, []);

  const subscribe = useCallback((channel, eventType = "*", callback) => {
    const key = `${channel}:${eventType}`;
    if (!subscribersRef.current.has(key)) subscribersRef.current.set(key, new Set());
    subscribersRef.current.get(key).add(callback);
    return () => {
      const callbacks = subscribersRef.current.get(key);
      callbacks?.delete(callback);
      if (callbacks?.size === 0) subscribersRef.current.delete(key);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ connectionStatus, latency, activeLearners, auditsCompleted, metrics, runtime, presence, recentEvents, notifications, dismissNotification, broadcastEvent, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext);
