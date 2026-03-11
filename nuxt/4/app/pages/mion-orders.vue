<script setup lang="ts">
import {routesFlow, mapFrom} from '@mionjs/client';
import {Order, OrderEvent} from '../../api/src/features/orders/orders-models';

const {$mionClient} = useNuxtApp();
const {routes} = $mionClient;

const eventStyles: Record<string, {color: string; icon: string; label: string}> = {
  placed: {color: '#3b82f6', icon: '📦', label: 'Order Placed'},
  paid: {color: '#10b981', icon: '💳', label: 'Payment Received'},
  shipped: {color: '#f59e0b', icon: '🚚', label: 'Shipped'},
  delivered: {color: '#22c55e', icon: '✅', label: 'Delivered'},
  cancelled: {color: '#ef4444', icon: '❌', label: 'Cancelled'},
};

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  paid: '#10b981',
  shipped: '#3b82f6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const orders = ref<Order[]>([]);
const eventsByOrder = ref<Record<string, OrderEvent[]>>({});
const apiErrors = ref<string[]>([]);

const {status, error: asyncError} = useAsyncData('orders', async () => {
  apiErrors.value = [];
  try {
    const ordersList = routes.orders.listOrders();
    const orderIds = mapFrom(
      ordersList,
      (orders) => orders!.map((o) => o.id),
      'mapFromOrdersToOrderEvents',
    ).type();

    const [[ordersData, allEvents], [ordersError, eventsError]] = await routesFlow([ordersList, routes.orders.getOrdersEvents(orderIds)]);

    if (ordersError) apiErrors.value.push(`listOrders: ${ordersError.publicMessage} (${ordersError.type})`);
    if (eventsError) apiErrors.value.push(`getOrdersEvents: ${eventsError.publicMessage} (${eventsError.type})`);

    if (ordersData) orders.value = ordersData;
    if (allEvents) {
      const eventsMap: Record<string, OrderEvent[]> = {};
      for (const event of allEvents) {
        (eventsMap[event.orderId] ??= []).push(event);
      }
      eventsByOrder.value = eventsMap;
    }

    return {orders: ordersData, events: allEvents};
  } catch (e: any) {
    apiErrors.value.push(`Unexpected error: ${e?.message || e}`);
    throw e;
  }
}, {server: false});

function getEventDetails(event: OrderEvent): string | null {
  switch (event.type) {
    case 'paid':
      return `via ${event.method}`;
    case 'shipped':
      return `${event.carrier} · ${event.tracking}`;
    case 'cancelled':
      return event.reason;
    default:
      return null;
  }
}
</script>

<template>
  <div class="page-wrapper">
    <main class="page-main">
      <img src="/mion-logo-dark.svg" alt="Mion logo" width="300" height="80" class="logo" />

      <div class="content-section">
        <h1>Mion Orders Showcase</h1>
        <p>
          <a href="https://mion.io" target="_blank" rel="noopener noreferrer">Mion</a>
          is a lightweight TypeScript API framework with end-to-end type safety, automatic serialization, and built-in validation.
          This showcase demonstrates how
          <code>routesFlow</code>
          resolves related data across multiple routes in a single HTTP request — a lightweight alternative to GraphQL, but fully typed and without a schema layer.
        </p>
      </div>

      <div v-if="status === 'pending'" class="loading">Loading orders...</div>

      <div v-if="asyncError || apiErrors.length > 0" class="orders-list">
        <div v-if="asyncError" class="error-box">
          Error: {{ asyncError.message }}
        </div>
        <div v-for="(err, i) in apiErrors" :key="i" class="error-box">
          API Error: {{ err }}
        </div>
      </div>

      <div v-if="status !== 'pending' && !asyncError && apiErrors.length === 0" class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <!-- Order header -->
          <div class="order-header">
            <div>
              <h2 class="order-customer">{{ order.customer }}</h2>
              <span class="order-id">{{ order.id }}</span>
            </div>
            <div class="order-meta">
              <span class="status-badge" :style="{backgroundColor: statusColors[order.status] || '#6b7280'}">
                {{ order.status }}
              </span>
              <div class="order-total">${{ order.total.toFixed(2) }}</div>
              <div class="order-date">{{ order.createdAt.toLocaleDateString() }}</div>
            </div>
          </div>

          <!-- Event timeline -->
          <template v-if="(eventsByOrder[order.id] || []).length > 0">
            <h3 class="timeline-title">Event Timeline</h3>
            <div class="timeline">
              <div class="timeline-line" />
              <div v-for="(event, i) in eventsByOrder[order.id]" :key="i" class="timeline-event">
                <div class="timeline-dot" :style="{backgroundColor: eventStyles[event.type]?.color}">
                  {{ eventStyles[event.type]?.icon }}
                </div>
                <div>
                  <div class="event-label">{{ eventStyles[event.type]?.label }}</div>
                  <div class="event-date">{{ event.at.toLocaleString() }}</div>
                  <div v-if="getEventDetails(event)" class="event-details">
                    <span :style="{color: event.type === 'cancelled' ? '#ef4444' : '#6b7280'}">
                      {{ getEventDetails(event) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page-wrapper {
  display: flex;
  min-height: 100vh;
  justify-content: center;
  background-color: #fafafa;
  font-family: system-ui, -apple-system, sans-serif;
}

.page-main {
  display: flex;
  width: 100%;
  max-width: 48rem;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 4rem;
  background-color: #ffffff;
}

.logo {
  align-self: center;
}

.content-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
  padding: 2rem 0;
}

.content-section h1 {
  font-size: 1.875rem;
  font-weight: 600;
  line-height: 2.5rem;
  letter-spacing: -0.025em;
  color: #000000;
  margin: 0;
}

.content-section p {
  font-size: 1.125rem;
  line-height: 2rem;
  color: #52525b;
  margin: 0;
}

.content-section a {
  font-weight: 500;
  color: #09090b;
  text-decoration: none;
}

.content-section a:hover {
  text-decoration: underline;
}

.content-section code {
  background-color: #f4f4f5;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.loading {
  padding: 2.5rem;
  text-align: center;
}

.orders-list {
  width: 100%;
}

.error-box {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  color: #991b1b;
  font-size: 14px;
}

.order-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.order-customer {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.order-id {
  font-family: monospace;
  font-size: 13px;
  color: #6b7280;
}

.order-meta {
  text-align: right;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.order-total {
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
}

.order-date {
  font-size: 13px;
  color: #6b7280;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #374151;
}

.timeline {
  position: relative;
  padding-left: 32px;
}

.timeline-line {
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e5e7eb;
}

.timeline-event {
  position: relative;
  padding-bottom: 24px;
}

.timeline-dot {
  position: absolute;
  left: -25px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.event-label {
  font-weight: 600;
}

.event-date {
  font-size: 13px;
  color: #6b7280;
}

.event-details {
  font-size: 13px;
  margin-top: 2px;
}

@media (prefers-color-scheme: dark) {
  .page-wrapper {
    background-color: #000000;
  }

  .page-main {
    background-color: #000000;
  }

  .content-section h1 {
    color: #fafafa;
  }

  .content-section p {
    color: #a1a1aa;
  }

  .content-section a {
    color: #fafafa;
  }

  .content-section code {
    background-color: #27272a;
  }

  .order-card {
    border-color: #374151;
  }

  .order-customer {
    color: #fafafa;
  }

  .timeline-title {
    color: #d1d5db;
  }

  .timeline-line {
    background-color: #374151;
  }

  .event-label {
    color: #fafafa;
  }
}
</style>
