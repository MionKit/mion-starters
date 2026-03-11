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
  <div class="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
    <main class="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-16 px-16 bg-white dark:bg-black">
      <img src="/mion-logo-dark.svg" alt="Mion logo" width="300" height="80" />

      <div class="flex flex-col items-center gap-6 text-center py-8">
        <h1 class="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          Mion Orders Showcase
        </h1>
        <p class="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          <a href="https://mion.io" target="_blank" rel="noopener noreferrer" class="font-medium text-zinc-950 dark:text-zinc-50">Mion</a>
          is a lightweight TypeScript API framework with end-to-end type safety, automatic serialization, and built-in validation.
          This showcase demonstrates how
          <code class="rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-800">routesFlow</code>
          resolves related data across multiple routes in a single HTTP request — a lightweight alternative to GraphQL, but fully typed and without a schema layer.
        </p>
      </div>

      <div v-if="status === 'pending'" style="padding: 40px; text-align: center">Loading orders...</div>

      <div v-if="asyncError || apiErrors.length > 0" class="w-full max-w-3xl" style="margin-bottom: 16px">
        <div v-if="asyncError"
          style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; color: #991b1b; font-size: 14px">
          Error: {{ asyncError.message }}
        </div>
        <div v-for="(err, i) in apiErrors" :key="i"
          style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; color: #991b1b; font-size: 14px">
          API Error: {{ err }}
        </div>
      </div>

      <div v-if="status !== 'pending' && !asyncError && apiErrors.length === 0" class="w-full max-w-3xl" style="font-family: system-ui, sans-serif">
        <div
          v-for="order in orders"
          :key="order.id"
          style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 16px"
        >
          <!-- Order header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
            <div>
              <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 4px">{{ order.customer }}</h2>
              <span style="font-family: monospace; font-size: 13px; color: #6b7280">{{ order.id }}</span>
            </div>
            <div style="text-align: right">
              <span
                style="padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; color: white"
                :style="{backgroundColor: statusColors[order.status] || '#6b7280'}"
              >
                {{ order.status }}
              </span>
              <div style="font-size: 14px; font-weight: 600; margin-top: 8px">${{ order.total.toFixed(2) }}</div>
              <div style="font-size: 13px; color: #6b7280">{{ order.createdAt.toLocaleDateString() }}</div>
            </div>
          </div>

          <!-- Event timeline -->
          <template v-if="(eventsByOrder[order.id] || []).length > 0">
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 16px; color: #374151">Event Timeline</h3>
            <div style="position: relative; padding-left: 32px">
              <div style="position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background-color: #e5e7eb" />
              <div v-for="(event, i) in eventsByOrder[order.id]" :key="i" style="position: relative; padding-bottom: 24px">
                <div
                  style="position: absolute; left: -25px; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px"
                  :style="{backgroundColor: eventStyles[event.type].color}"
                >
                  {{ eventStyles[event.type].icon }}
                </div>
                <div>
                  <div style="font-weight: 600">{{ eventStyles[event.type].label }}</div>
                  <div style="font-size: 13px; color: #6b7280">{{ event.at.toLocaleString() }}</div>
                  <div v-if="getEventDetails(event)" style="font-size: 13px; margin-top: 2px">
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
