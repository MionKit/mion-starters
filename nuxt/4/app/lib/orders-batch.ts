import {batch, inputFrom} from '@mionjs/client';
import type {OrderEvent} from '../../api/src/models.ts';
import {routes} from './mion-client.ts';

/** Orders + their events in ONE http request: inputFrom's mapping runs on the server */
export async function fetchOrdersWithEvents() {
    const ordersReq = routes.orders.listOrders();
    const orderIds = inputFrom(ordersReq, (list) => list!.map((o) => o.id));
    const eventsReq = routes.orders.getOrdersEvents(orderIds.asArg());
    const [[orders, ordersError, response], [events, eventsError]] = await batch([ordersReq, eventsReq]).call();
    const apiErrors: string[] = [];
    if (ordersError) apiErrors.push(`listOrders: ${ordersError.publicMessage} (${ordersError.type})`);
    if (eventsError) apiErrors.push(`getOrdersEvents: ${eventsError.publicMessage} (${eventsError.type})`);
    for (const thrown of response?.['@thrownErrors'] ?? []) apiErrors.push(`batch: ${thrown.publicMessage} (${thrown.type})`);
    const eventsByOrder: Record<string, OrderEvent[]> = {};
    for (const event of events ?? []) (eventsByOrder[event.orderId] ??= []).push(event);
    return {orders: orders ?? [], eventsByOrder, apiErrors};
}
