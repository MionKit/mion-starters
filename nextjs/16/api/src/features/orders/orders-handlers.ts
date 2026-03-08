import {query, mutation, Routes} from '@mionjs/router';
import {FormatUUIDv7} from '@mionjs/type-formats/StringFormats';
import {Order, OrderEvent} from './orders-models.ts';
import {findAllOrders, findOrderById, insertOrder, findEventsByOrderId, findEventsByOrderIds} from './orders-repository.ts';

export const ordersRoutes = {
    listOrders: query((): Order[] => {
        return findAllOrders();
    }),
    getOrder: query((ctx, id: FormatUUIDv7): Order | undefined => {
        return findOrderById(id);
    }),
    createOrder: mutation((ctx, customer: string, total: number, id?: FormatUUIDv7): Order => {
        return insertOrder(customer, total, id);
    }),

    getOrderEvents: query((ctx, orderId: FormatUUIDv7): OrderEvent[] => {
        return findEventsByOrderId(orderId);
    }),
    getOrdersEvents: query((ctx, orderIds: FormatUUIDv7[]): OrderEvent[] => {
        return findEventsByOrderIds(orderIds);
    }),
} satisfies Routes;
