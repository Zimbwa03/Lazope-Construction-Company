// Modular Agentic AI structure for quote generation

interface Service {
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface FormData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  validityDays: number;
  terms?: string;
}

// Quote Builder Agent - Formats and calculates totals
export const QuoteBuilderAgent = {
  buildQuoteData(formData: FormData, services: Service[]) {
    return {
      client_name: formData.clientName,
      client_email: formData.clientEmail,
      client_phone: formData.clientPhone,
      client_address: formData.clientAddress,
      validity_days: formData.validityDays,
      terms: formData.terms || "",
      services: services
        .filter(service => 
          service.description.trim() && 
          service.quantity > 0 && 
          service.unitPrice > 0
        )
        .map(service => ({
          description: service.description,
          unit: service.unit,
          quantity: service.quantity,
          unit_price: service.unitPrice
        }))
    };
  },

  calculateGrandTotal(services: Service[]): number {
    return services.reduce((total, service) => {
      return total + ((service.quantity || 0) * (service.unitPrice || 0));
    }, 0);
  },

  calculateRowTotal(quantity: number, unitPrice: number): number {
    return (quantity || 0) * (unitPrice || 0);
  }
};

// Form Validation Agent - Validates form inputs
export const FormValidationAgent = {
  validateForm(formData: FormData): string[] {
    const errors: string[] = [];

    if (!formData.clientName?.trim()) {
      errors.push("Client name is required");
    }

    if (!formData.clientEmail?.trim()) {
      errors.push("Email address is required");
    } else if (!this.isValidEmail(formData.clientEmail)) {
      errors.push("Please enter a valid email address");
    }

    if (!formData.clientPhone?.trim()) {
      errors.push("Phone number is required");
    }

    if (!formData.clientAddress?.trim()) {
      errors.push("Client address is required");
    }

    return errors;
  },

  validateServices(services: Service[]): string[] {
    const errors: string[] = [];
    
    const validServices = services.filter(service => 
      service.description.trim() && 
      service.quantity > 0 && 
      service.unitPrice > 0
    );

    if (validServices.length === 0) {
      errors.push("Please add at least one valid service with description, quantity, and unit price");
    }

    return errors;
  },

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

// Service Table Agent - Manages service rows
export const ServiceTableAgent = {
  addServiceRow(services: Service[], onServicesChange: (services: Service[]) => void) {
    if (services.length >= 20) {
      return; // Maximum services limit
    }

    const newServices = [...services, { 
      description: "", 
      unit: "", 
      quantity: 0, 
      unitPrice: 0 
    }];
    onServicesChange(newServices);
  },

  removeServiceRow(index: number, services: Service[], onServicesChange: (services: Service[]) => void) {
    const newServices = services.filter((_, i) => i !== index);
    onServicesChange(newServices);
  },

  updateService(
    index: number, 
    field: keyof Service, 
    value: string | number, 
    services: Service[], 
    onServicesChange: (services: Service[]) => void
  ) {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    onServicesChange(newServices);
  }
};

// Webhook Communicator Agent - Handles API communication
export const WebhookCommunicatorAgent = {
  async sendQuoteData(quoteData: any): Promise<any> {
    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quoteData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

// Status Notifier Agent - Manages UI notifications
export const StatusNotifierAgent = {
  showSuccessMessage(
    setStatusModal: (modal: any) => void, 
    message: string, 
    details?: string
  ) {
    setStatusModal({
      show: true,
      type: 'success' as const,
      message,
      details
    });
  },

  showErrorMessage(
    setStatusModal: (modal: any) => void, 
    message: string, 
    details?: string
  ) {
    setStatusModal({
      show: true,
      type: 'error' as const,
      message,
      details
    });
  },

  showInfoMessage(
    setStatusModal: (modal: any) => void, 
    message: string, 
    details?: string
  ) {
    setStatusModal({
      show: true,
      type: 'info' as const,
      message,
      details
    });
  }
};
