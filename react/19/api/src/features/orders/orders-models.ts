import type {UUIDv7} from '@mionjs/run-types/formats';

export interface Order {
    id: UUIDv7;
    customer: string;
    total: number;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: Date;
}

export type OrderEvent =
    | {type: 'placed'; orderId: UUIDv7; at: Date}
    | {type: 'paid'; orderId: UUIDv7; at: Date; method: string}
    | {type: 'shipped'; orderId: UUIDv7; at: Date; carrier: string; tracking: string}
    | {type: 'delivered'; orderId: UUIDv7; at: Date}
    | {type: 'cancelled'; orderId: UUIDv7; at: Date; reason: string};
