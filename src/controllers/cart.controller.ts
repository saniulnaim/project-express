import type { Request, Response } from 'express';
import { parse, parseId } from '../lib/validate.js';
import { currentAuth } from '../middlewares/auth.js';
import * as cartService from '../services/cart.service.js';
import {
  addCartItemSchema,
  updateCartItemSchema,
} from '../validations/cart.validation.js';

export async function get(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await cartService.getCart(currentAuth(res).id));
}

export async function addItem(req: Request, res: Response): Promise<void> {
  const { productId, quantity } = parse(addCartItemSchema, req.body);
  res
    .status(201)
    .json(await cartService.addItem(currentAuth(res).id, productId, quantity));
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  const itemId = parseId(req.params['itemId'], 'cart item');
  const { quantity } = parse(updateCartItemSchema, req.body);
  res
    .status(200)
    .json(await cartService.setQuantity(currentAuth(res).id, itemId, quantity));
}

export async function removeItem(req: Request, res: Response): Promise<void> {
  const itemId = parseId(req.params['itemId'], 'cart item');
  await cartService.removeItem(currentAuth(res).id, itemId);
  res.status(204).send();
}

export async function clear(_req: Request, res: Response): Promise<void> {
  await cartService.clearCart(currentAuth(res).id);
  res.status(204).send();
}
