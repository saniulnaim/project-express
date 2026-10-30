import type { Request, Response } from 'express';
import { parse } from '../lib/validate.js';
import { currentAuth } from '../middlewares/auth.js';
import * as authService from '../services/auth.service.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';

export async function register(req: Request, res: Response): Promise<void> {
  res.status(201).json(await authService.register(parse(registerSchema, req.body)));
}

export async function login(req: Request, res: Response): Promise<void> {
  res.status(200).json(await authService.login(parse(loginSchema, req.body)));
}

export async function me(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await authService.getProfile(currentAuth(res).id));
}
