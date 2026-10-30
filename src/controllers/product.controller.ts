import type { Request, Response } from 'express';
import { parse, parseId } from '../lib/validate.js';
import * as productService from '../services/product.service.js';
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from '../validations/product.validation.js';

const idOf = (req: Request) => parseId(req.params['id'], 'product');

export async function list(req: Request, res: Response): Promise<void> {
  const query = parse(listProductsQuerySchema, req.query);
  res.status(200).json(await productService.listProducts(query));
}

export async function get(req: Request, res: Response): Promise<void> {
  res.status(200).json(await productService.getProduct(idOf(req)));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = parse(createProductSchema, req.body);
  res.status(201).json(await productService.createProduct(input));
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = idOf(req);
  const input = parse(updateProductSchema, req.body);
  res.status(200).json(await productService.updateProduct(id, input));
}

export async function remove(req: Request, res: Response): Promise<void> {
  await productService.deleteProduct(idOf(req));
  res.status(204).send();
}
