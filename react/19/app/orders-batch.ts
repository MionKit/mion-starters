import {batch, inputFrom} from '@mionjs/client';
import {routes} from './mion-client.ts';

/** Orders + their events in ONE http request: inputFrom maps listOrders' result into getOrdersEvents on the server */
export function fetchOrdersWithEvents() {
    const ordersReq = routes.orders.listOrders();
    const orderIds = inputFrom(ordersReq, (list) => list!.map((o) => o.id));
    const eventsReq = routes.orders.getOrdersEvents(orderIds.asArg());
    return batch([ordersReq, eventsReq]).call();
}
