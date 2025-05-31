import { quotes, quoteServices, type Quote, type InsertQuote, type QuoteService, type InsertQuoteService, users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quote operations
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuote(id: number): Promise<Quote | undefined>;
  getQuoteByNumber(quoteNumber: string): Promise<Quote | undefined>;
  getQuotes(): Promise<Quote[]>;
  
  // Quote services operations
  createQuoteService(service: InsertQuoteService): Promise<QuoteService>;
  getQuoteServices(quoteId: number): Promise<QuoteService[]>;
  
  // Get next quote number
  getNextQuoteNumber(): Promise<string>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quotes: Map<number, Quote>;
  private quoteServices: Map<number, QuoteService>;
  private currentUserId: number;
  private currentQuoteId: number;
  private currentServiceId: number;
  private quoteCounter: number;

  constructor() {
    this.users = new Map();
    this.quotes = new Map();
    this.quoteServices = new Map();
    this.currentUserId = 1;
    this.currentQuoteId = 1;
    this.currentServiceId = 1;
    this.quoteCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const id = this.currentQuoteId++;
    const quote: Quote = { 
      id,
      quoteNumber: insertQuote.quoteNumber,
      clientName: insertQuote.clientName,
      clientEmail: insertQuote.clientEmail,
      clientPhone: insertQuote.clientPhone,
      clientAddress: insertQuote.clientAddress,
      validityDays: insertQuote.validityDays ?? 14,
      terms: insertQuote.terms ?? null,
      grandTotal: insertQuote.grandTotal ?? 0,
      status: insertQuote.status ?? "draft",
      createdAt: new Date()
    };
    this.quotes.set(id, quote);
    return quote;
  }

  async getQuote(id: number): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }

  async getQuoteByNumber(quoteNumber: string): Promise<Quote | undefined> {
    return Array.from(this.quotes.values()).find(
      (quote) => quote.quoteNumber === quoteNumber,
    );
  }

  async getQuotes(): Promise<Quote[]> {
    return Array.from(this.quotes.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async createQuoteService(insertService: InsertQuoteService): Promise<QuoteService> {
    const id = this.currentServiceId++;
    const service: QuoteService = { ...insertService, id };
    this.quoteServices.set(id, service);
    return service;
  }

  async getQuoteServices(quoteId: number): Promise<QuoteService[]> {
    return Array.from(this.quoteServices.values()).filter(
      (service) => service.quoteId === quoteId,
    );
  }

  async getNextQuoteNumber(): Promise<string> {
    const number = String(this.quoteCounter).padStart(3, '0');
    this.quoteCounter++;
    return `LZQ-${number}`;
  }
}

export const storage = new MemStorage();
