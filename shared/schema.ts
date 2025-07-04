import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const userBalances = pgTable("user_balances", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull().unique(),
  balance: numeric("balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  category: text("category").notNull().default("general"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const ticketMessages = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticket_id: integer("ticket_id").notNull(),
  user_id: text("user_id").notNull(),
  message: text("message").notNull(),
  is_admin: boolean("is_admin").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const giftCardSubmissions = pgTable("gift_card_submissions", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  gift_card_code: text("gift_card_code").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertUserBalanceSchema = createInsertSchema(userBalances).pick({
  user_id: true,
  balance: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).pick({
  user_id: true,
  subject: true,
  message: true,
  status: true,
  category: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).pick({
  ticket_id: true,
  user_id: true,
  message: true,
  is_admin: true,
});

export const insertGiftCardSubmissionSchema = createInsertSchema(giftCardSubmissions).pick({
  user_id: true,
  gift_card_code: true,
  amount: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserBalance = z.infer<typeof insertUserBalanceSchema>;
export type UserBalance = typeof userBalances.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertGiftCardSubmission = z.infer<typeof insertGiftCardSubmissionSchema>;
export type GiftCardSubmission = typeof giftCardSubmissions.$inferSelect;
