import { defineEventHandler } from 'h3';

export default defineEventHandler((event) => ({ data: { admin: event.context.admin } }));
