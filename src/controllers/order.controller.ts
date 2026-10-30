import type { Request, Response } from 'express';
import { parse, parseId } from '../lib/validate.js';
import { currentAuth } from '../middlewares/auth.js';
import * as orderService from '../services/order.service.js';
import {
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from '../validations/order.validation.js';

const idOf = (req: Request) => parseId(req.params['id'], 'order');

export async function checkout(_req: Request, res: Response): Promise<void> {
  res.status(201).json(await orderService.checkout(currentAuth(res).id));
}

export async function list(req: Request, res: Response): Promise<void> {
  const query = parse(listOrdersQuerySchema, req.query);
  res.status(200).json(await orderService.listOrders(currentAuth(res), query));
}

export async function get(req: Request, res: Response): Promise<void> {
  res.status(200).json(await orderService.getOrder(currentAuth(res), idOf(req)));
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const id = idOf(req);
  const { status } = parse(updateOrderStatusSchema, req.body);
  res.status(200).json(await orderService.updateStatus(id, status));
}

export async function cancel(req: Request, res: Response): Promise<void> {
  res
    .status(200)
    .json(await orderService.cancelOwnOrder(currentAuth(res).id, idOf(req)));
}
