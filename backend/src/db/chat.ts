
import { Router } from "express";
import { z } from "zod";
import {
  addReceptionMessage,
  findChat,
  findChatsByBranch,
  upsertCustomerMessage,
} from "../db/chats.repo";

export const chatRouter = Router();

const branchParam = z.object({ branchId: z.string().min(1) });
const chatParam = branchParam.extend({ customerId: z.string().min(1) });

const customerMessageBody = z.object({
  customerId: z.string().min(1),
  customerName: z.string().min(1).max(80),
  text: z.string().min(1).max(2000),
});

const receptionMessageBody = z.object({
  text: z.string().min(1).max(2000),
});

// GET all conversations in a branch (reception inbox)
chatRouter.get("/:branchId", async (req, res, next) => {
  try {
    const { branchId } = branchParam.parse(req.params);
    const list = await findChatsByBranch(branchId);
    res.json({ ok: true, chats: list });
  } catch (err) {
    next(err);
  }
});

// GET one conversation (customer resume, or reception open)
chatRouter.get("/:branchId/:customerId", async (req, res, next) => {
  try {
    const { branchId, customerId } = chatParam.parse(req.params);
    const chat = await findChat(branchId, customerId);
    res.json({ ok: true, chat });
  } catch (err) {
    next(err);
  }
});

// POST customer message (REST fallback; socket is preferred)
chatRouter.post("/:branchId/customer-message", async (req, res, next) => {
  try {
    const { branchId } = branchParam.parse(req.params);
    const body = customerMessageBody.parse(req.body);
    const chat = await upsertCustomerMessage({ branchId, ...body });
    res.json({ ok: true, chat });
  } catch (err) {
    next(err);
  }
});

// POST reception reply (REST fallback)
chatRouter.post("/:branchId/:customerId/reply", async (req, res, next) => {
  try {
    const { branchId, customerId } = chatParam.parse(req.params);
    const { text } = receptionMessageBody.parse(req.body);
    const chat = await addReceptionMessage({ branchId, customerId, text });
    res.json({ ok: true, chat });
  } catch (err) {
    next(err);
  }
});