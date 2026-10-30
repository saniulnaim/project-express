import type { Request, Response } from 'express';
import { parse, parseId } from '../lib/validate.js';
import * as categoryService from '../services/category.service.js';
import { categorySchema } from '../validations/category.validation.js';

const idOf = (req: Request) => parseId(req.params['id'], 'category');

export async function list(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await categoryService.listCategories());
}

export async function get(req: Request, res: Response): Promise<void> {
  res.status(200).json(await categoryService.getCategory(idOf(req)));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = parse(categorySchema, req.body);
  res.status(201).json(await categoryService.createCategory(input));
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = idOf(req);
  const input = parse(categorySchema, req.body);
  res.status(200).json(await categoryService.updateCategory(id, input));
}

export async function remove(req: Request, res: Response): Promise<void> {
  await categoryService.deleteCategory(idOf(req));
  res.status(204).send();
}
