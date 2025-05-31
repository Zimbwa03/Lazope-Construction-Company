import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Bolt, File, Send, Eye, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ServicesTable from "./services-table";
import StatusModal from "./status-modal";
import { QuoteBuilderAgent, FormValidationAgent, WebhookCommunicatorAgent, StatusNotifierAgent } from "@/lib/quote-agents";
import { PDFGenerator } from "@/lib/pdf-generator";
import WebhookStatus from "./webhook-status";

const formSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Please enter a valid email address"),
  clientPhone: z.string().min(1, "Phone number is required"),
  clientAddress: z.string().min(1, "Address is required"),
  validityDays: z.number().min(1).max(365),
  terms: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Service {
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteFormProps {
  onQuoteNumberGenerated: (quoteNumber: string) => void;
}

export default function QuoteForm({ onQuoteNumberGenerated }: QuoteFormProps) {
  const [services, setServices] = useState<Service[]>([
    { description: "", unit: "", quantity: 0, unitPrice: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusModal, setStatusModal] = useState<{ show: boolean; type: 'success' | 'error' | 'info'; message: string; details?: string }>({
    show: false,
    type: 'info',
    message: '',
    details: ''
  });
  const [lastQuoteData, setLastQuoteData] = useState<any>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);

  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      validityDays: 14,
      terms: "50% upfront payment required before project commencement. Balance payable upon completion. All materials provided meet industry standards.",
    },
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/quotes", data);
      return response.json();
    },
    onSuccess: (data) => {
      setIsLoading(false);
      onQuoteNumberGenerated(data.quote_number);

      setLastQuoteData(data);

        if (data.webhook_error) {
          setWebhookError(data.webhook_error);
          setWebhookResponse(null);
        } else {
          setWebhookError(null);
          setWebhookResponse({ success: true, status: 200 });
        }

      StatusNotifierAgent.showSuccessMessage(
        setStatusModal,
        'Quote Sent Successfully!',
        `Quote ${data.quote_number} has been created and processed`
      );

      // Reset form after successful submission
      setTimeout(() => {
        form.reset();
        setServices([{ description: "", unit: "", quantity: 0, unitPrice: 0 }]);
      }, 2000);
    },
    onError: (error) => {
      setIsLoading(false);
      StatusNotifierAgent.showErrorMessage(
        setStatusModal,
        'Failed to Send Quote',
        'Please check your connection and try again.'
      );
      toast({
        title: "Error",
        description: "Failed to send quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    // Validate services using agent
    const serviceErrors = FormValidationAgent.validateServices(services);
    if (serviceErrors.length > 0) {
      StatusNotifierAgent.showErrorMessage(
        setStatusModal,
        'Please fix the following errors:',
        serviceErrors.join('<br>')
      );
      return;
    }

    setIsLoading(true);

    // Prepare data using Quote Builder Agent
    const quoteData = QuoteBuilderAgent.buildQuoteData(data, services);
    setLastQuoteData(quoteData); // Store for webhook status display

    // Submit using Webhook Communicator Agent
    submitQuoteMutation.mutate(quoteData);
  };

  const handlePreview = () => {
    const errors = FormValidationAgent.validateForm(form.getValues());
    const serviceErrors = FormValidationAgent.validateServices(services);

    if (errors.length > 0 || serviceErrors.length > 0) {
      StatusNotifierAgent.showErrorMessage(
        setStatusModal,
        'Please fix form errors before preview',
        [...errors, ...serviceErrors].join('<br>')
      );
      return;
    }

    try {
      const formData = form.getValues();
      const grandTotal = QuoteBuilderAgent.calculateGrandTotal(services);

      // Generate a temporary quote number for preview
      const previewQuoteNumber = `LZQ-PREVIEW-${Date.now()}`;

      const quoteData = {
        ...formData,
        quoteNumber: previewQuoteNumber,
        services: services.filter(s => s.description.trim() && s.quantity > 0 && s.unitPrice > 0),
        grandTotal
      };

      // Generate PDF
      const pdfGenerator = new PDFGenerator();
      pdfGenerator.generateQuotePDF(quoteData);

      // Open PDF in new window
      const pdfDataUrl = pdfGenerator.output();
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <iframe width='100%' height='100%' src='${pdfDataUrl}'></iframe>
        `);
        newWindow.document.title = `Quote Preview - ${previewQuoteNumber}`;
      } else {
        // Fallback: download the PDF
        pdfGenerator.save(`quote-preview-${Date.now()}.pdf`);
      }

    } catch (error) {
      StatusNotifierAgent.showErrorMessage(
        setStatusModal,
        'Preview Error',
        'Unable to generate PDF preview. Please try again.'
      );
    }
  };

  const grandTotal = QuoteBuilderAgent.calculateGrandTotal(services);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Client Information Section */}
          <Card className="overflow-hidden">
            <CardHeader className="construction-blue">
              <CardTitle className="text-lg font-semibold text-white flex items-center">
                <User className="mr-3" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Client Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter client full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email Address <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="client@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Phone Number <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+263771234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validityDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote Validity (Days)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue="14">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="14">14 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="60">60 Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>
                        Client Address <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter complete address including city and postal code" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Services Section */}
          <Card className="overflow-hidden">
            <CardHeader className="construction-orange">
              <CardTitle className="text-lg font-semibold text-white flex items-center">
                <Bolt className="mr-3" />
                Services & Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ServicesTable 
                services={services} 
                onServicesChange={setServices}
                grandTotal={grandTotal}
              />
            </CardContent>
          </Card>

          {/* Terms and Conditions Section */}
          <Card className="overflow-hidden">
            <CardHeader className="construction-gray">
              <CardTitle className="text-lg font-semibold text-white flex items-center">
                <File className="mr-3" />
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter payment terms, project conditions, and other relevant terms..."
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    <Shield className="inline text-construction-blue mr-1" size={16} />
                    Data encrypted and secure
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePreview}
                    disabled={isLoading}
                  >
                    <Eye className="mr-2" size={16} />
                    Preview Quote
                  </Button>
                  <Button 
                    type="submit" 
                    className="construction-blue hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Send className="mr-2" size={16} />
                    )}
                    {isLoading ? 'Sending...' : 'Send Quote'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <WebhookStatus 
        lastQuoteData={lastQuoteData}
        webhookError={webhookError}
        webhookResponse={webhookResponse}
      />

      <StatusModal 
        isOpen={statusModal.show}
        type={statusModal.type}
        message={statusModal.message}
        details={statusModal.details}
        onClose={() => setStatusModal({ ...statusModal, show: false })}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction-blue"></div>
              <div className="text-lg font-medium text-gray-900">Processing quote...</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}