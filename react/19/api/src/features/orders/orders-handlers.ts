import {Routes} from '@mionjs/router';
import type {UUIDv7} from '@mionjs/run-types/formats';
import {mion} from '../../router.ts';
import type {Order, OrderEvent} from './orders-models.ts';
import {findAllOrders, findOrderById, insertOrder, findEventsByOrderId, findEventsByOrderIds} from './orders-repository.ts';

export const ordersRoutes = {
    listOrders: mion.query((): Order[] => {
        return findAllOrders();
    }),
    getOrder: mion.query((ctx, id: UUIDv7): Order | undefined => {
        return findOrderById(id);
    }),
    createOrder: mion.mutation((ctx, customer: string, total: number): Order => {
        return insertOrder(customer, total);
    }),
    getOrderEvents: mion.query((ctx, orderId: UUIDv7): OrderEvent[] => {
        return findEventsByOrderId(orderId);
    }),
    getOrdersEvents: mion.query((ctx, orderIds: UUIDv7[]): OrderEvent[] => {
        return findEventsByOrderIds(orderIds);
    }),
} satisfies Routes;
