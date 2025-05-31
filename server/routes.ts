import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { quoteSubmissionSchema, type QuoteSubmission } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate quote and send to n8n webhook
  app.post("/api/quotes", async (req, res) => {
    try {
      // Validate request body
      const validatedData = quoteSubmissionSchema.parse(req.body);
      
      // Generate quote number
      const quoteNumber = await storage.getNextQuoteNumber();
      
      // Calculate grand total
      const grandTotal = validatedData.services.reduce((sum, service) => {
        return sum + (service.quantity * service.unit_price);
      }, 0);
      
      // Store quote in memory
      const quote = await storage.createQuote({
        quoteNumber,
        clientName: validatedData.client_name,
        clientEmail: validatedData.client_email,
        clientPhone: validatedData.client_phone,
        clientAddress: validatedData.client_address,
        validityDays: validatedData.validity_days,
        terms: validatedData.terms || "",
        grandTotal,
        status: "draft"
      });
      
      // Store services
      for (const service of validatedData.services) {
        await storage.createQuoteService({
          quoteId: quote.id,
          description: service.description,
          unit: service.unit,
          quantity: service.quantity,
          unitPrice: service.unit_price,
          total: service.quantity * service.unit_price
        });
      }
      
      // Prepare payload for n8n webhook - flatten services array
      const webhookPayload: any = {
        client_name: validatedData.client_name,
        client_email: validatedData.client_email,
        client_phone: validatedData.client_phone,
        client_address: validatedData.client_address,
        validity_days: validatedData.validity_days.toString(),
        terms: validatedData.terms || "",
        quote_number: quoteNumber
      };

      // Flatten services array for n8n format
      validatedData.services.forEach((service, index) => {
        webhookPayload[`services[${index}].description`] = service.description;
        webhookPayload[`services[${index}].unit`] = service.unit;
        webhookPayload[`services[${index}].quantity`] = service.quantity.toString();
        webhookPayload[`services[${index}].unit_price`] = service.unit_price.toString();
      });
      
      // Send to n8n webhook
      const webhookUrl = process.env.N8N_WEBHOOK_URL || 
        process.env.WEBHOOK_URL || 
        "https://ngonidzashezimbwa.app.n8n.cloud/webhook-test/0b88fb69-a8a6-49d5-a160-a9aca0100ef9";
      
      try {
        console.log('Sending to webhook:', webhookUrl);
        console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Quote-Generator/1.0'
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text().catch(() => 'No response body');
          console.error(`Webhook failed with status: ${webhookResponse.status} ${webhookResponse.statusText}`);
          console.error('Response headers:', Object.fromEntries(webhookResponse.headers.entries()));
          console.error('Response body:', errorText);
          
          // Include webhook error in response for frontend
          res.json({ 
            success: true, 
            quote_number: quoteNumber,
            message: `Quote ${quoteNumber} created successfully`,
            webhook_error: `Status: ${webhookResponse.status} ${webhookResponse.statusText} - ${errorText}`,
            webhook_status: webhookResponse.status
          });
          return;
        } else {
          console.log('Webhook sent successfully');
        }
        
        // Update quote status to sent
        quote.status = "sent";
        
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        console.error('Error type:', webhookError instanceof Error ? webhookError.name : typeof webhookError);
        
        // Include webhook error in response for frontend
        res.json({ 
          success: true, 
          quote_number: quoteNumber,
          message: `Quote ${quoteNumber} created successfully`,
          webhook_error: webhookError instanceof Error ? webhookError.message : 'Unknown webhook error',
          webhook_status: 'timeout_or_network_error'
        });
        return;
      }
      
      res.json({ 
        success: true, 
        quote_number: quoteNumber,
        message: `Quote ${quoteNumber} created successfully`
      });
      
    } catch (error) {
      console.error('Quote creation error:', error);
      
      if (error instanceof Error && 'issues' in error) {
        // Zod validation error
        res.status(400).json({ 
          error: "Validation failed", 
          details: error.issues 
        });
      } else {
        res.status(500).json({ 
          error: "Failed to create quote", 
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // Get all quotes
  app.get("/api/quotes", async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Get quote by ID with services
  app.get("/api/quotes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuote(id);
      
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      const services = await storage.getQuoteServices(id);
      
      res.json({ ...quote, services });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
