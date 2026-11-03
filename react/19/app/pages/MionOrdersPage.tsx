import {useEffect, useState} from 'react';
import type {Order, OrderEvent} from '../../api/src/models.ts';
import {fetchOrdersWithEvents} from '../orders-batch.ts';
import styles from './MionOrdersPage.module.css';

const eventStyles: Record<OrderEvent['type'], {color: string; icon: string; label: string}> = {
    placed: {color: '#3b82f6', icon: '\u{1F4E6}', label: 'Order Placed'},
    paid: {color: '#10b981', icon: '\u{1F4B3}', label: 'Payment Received'},
    shipped: {color: '#f59e0b', icon: '\u{1F69A}', label: 'Shipped'},
    delivered: {color: '#22c55e', icon: '✅', label: 'Delivered'},
    cancelled: {color: '#ef4444', icon: '❌', label: 'Cancelled'},
};

const statusColors: Record<Order['status'], string> = {
    pending: '#f59e0b',
    paid: '#10b981',
    shipped: '#3b82f6',
    delivered: '#22c55e',
    cancelled: '#ef4444',
};

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

interface OrdersState {
    orders: Order[];
    eventsByOrder: Record<string, OrderEvent[]>;
    apiErrors: string[];
}

async function loadOrders(): Promise<OrdersState> {
    const state: OrdersState = {orders: [], eventsByOrder: {}, apiErrors: []};
    try {
        const [[ordersData, ordersError, response], [allEvents, eventsError]] = await fetchOrdersWithEvents();
        if (ordersError) state.apiErrors.push(`listOrders: ${ordersError.publicMessage} (${ordersError.type})`);
        if (eventsError) state.apiErrors.push(`getOrdersEvents: ${eventsError.publicMessage} (${eventsError.type})`);
        const thrown = response?.['@thrownErrors'];
        if (thrown?.length) state.apiErrors.push(...thrown.map((e) => `batch: ${e.publicMessage} (${e.type})`));
        if (ordersData) state.orders = ordersData;
        for (const event of allEvents ?? []) (state.eventsByOrder[event.orderId] ??= []).push(event);
    } catch (e: unknown) {
        state.apiErrors.push(`Unexpected error: ${e instanceof Error ? e.message : e}`);
    }
    return state;
}

export default function MionOrdersPage() {
    const [state, setState] = useState<OrdersState | null>(null);

    useEffect(() => {
        let active = true;
        loadOrders().then((loaded) => {
            if (active) setState(loaded);
        });
        return () => {
            active = false;
        };
    }, []);

    return (
        <div className={styles.pageWrapper}>
            <main className={styles.pageMain}>
                <picture className={styles.logo}>
                    <source srcSet="/mion-logo-dark.svg" media="(prefers-color-scheme: dark)" />
                    <img src="/mion-logo.svg" alt="Mion logo" width="300" height="80" />
                </picture>

                <div className={styles.contentSection}>
                    <h1>Mion Orders Showcase</h1>
                    <p>
                        <a href="https://mion.io" target="_blank" rel="noopener noreferrer">
                            Mion
                        </a>{' '}
                        is a lightweight TypeScript API framework with end-to-end type safety, automatic serialization,
                        and built-in validation. This showcase demonstrates how <code>batch</code> +{' '}
                        <code>inputFrom</code> resolves related data across multiple routes in a single HTTP request.{' '}
                        <strong className={styles.hl}>A fully typed lightweight alternative to GraphQL.</strong>
                    </p>
                </div>

                {!state && <div className={styles.loading}>Loading orders...</div>}

                {state && state.apiErrors.length > 0 && (
                    <div className={styles.ordersList}>
                        {state.apiErrors.map((err, i) => (
                            <div key={i} className={styles.errorBox}>
                                API Error: {err}
                            </div>
                        ))}
                    </div>
                )}

                {state && state.apiErrors.length === 0 && (
                    <div className={styles.ordersList}>
                        {state.orders.map((order) => (
                            <OrderCard key={order.id} order={order} events={state.eventsByOrder[order.id] ?? []} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function OrderCard({order, events}: {order: Order; events: OrderEvent[]}) {
    return (
        <div className={styles.orderCard}>
            <div className={styles.orderHeader}>
                <div>
                    <h2 className={styles.orderCustomer}>{order.customer}</h2>
                    <span className={styles.orderId}>{order.id}</span>
                </div>
                <div className={styles.orderMeta}>
                    <span className={styles.statusBadge} style={{backgroundColor: statusColors[order.status]}}>
                        {order.status}
                    </span>
                    <div className={styles.orderTotal}>${order.total.toFixed(2)}</div>
                    <div className={styles.orderDate}>{order.createdAt.toLocaleDateString()}</div>
                </div>
            </div>

            {events.length > 0 && (
                <>
                    <h3 className={styles.timelineTitle}>Event Timeline</h3>
                    <div className={styles.timeline}>
                        <div className={styles.timelineLine} />
                        {events.map((event, i) => {
                            const details = getEventDetails(event);
                            return (
                                <div key={i} className={styles.timelineEvent}>
                                    <div
                                        className={styles.timelineDot}
                                        style={{backgroundColor: eventStyles[event.type].color}}
                                    >
                                        {eventStyles[event.type].icon}
                                    </div>
                                    <div>
                                        <div className={styles.eventLabel}>{eventStyles[event.type].label}</div>
                                        <div className={styles.eventDate}>{event.at.toLocaleString()}</div>
                                        {details && (
                                            <div className={styles.eventDetails}>
                                                <span style={{color: event.type === 'cancelled' ? '#ef4444' : '#6b7280'}}>
                                                    {details}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
