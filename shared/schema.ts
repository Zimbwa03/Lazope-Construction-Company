import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: text("quote_number").notNull().unique(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone").notNull(),
  clientAddress: text("client_address").notNull(),
  validityDays: integer("validity_days").notNull().default(14),
  terms: text("terms"),
  grandTotal: real("grand_total").notNull().default(0),
  status: text("status").notNull().default("draft"), // draft, sent, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const quoteServices = pgTable("quote_services", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull(),
  description: text("description").notNull(),
  unit: text("unit").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export const insertQuoteServiceSchema = createInsertSchema(quoteServices).omit({
  id: true,
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuoteService = z.infer<typeof insertQuoteServiceSchema>;
export type QuoteService = typeof quoteServices.$inferSelect;

// Client-side quote submission schema
export const quoteSubmissionSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  client_email: z.string().email("Please enter a valid email address"),
  client_phone: z.string().min(1, "Phone number is required"),
  client_address: z.string().min(1, "Address is required"),
  validity_days: z.number().min(1).max(365),
  terms: z.string().optional(),
  services: z.array(z.object({
    description: z.string().min(1, "Service description is required"),
    unit: z.string().min(1, "Unit is required"),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unit_price: z.number().min(0.01, "Unit price must be greater than 0"),
  })).min(1, "At least one service is required"),
});

export type QuoteSubmission = z.infer<typeof quoteSubmissionSchema>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
