import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceTableAgent } from "@/lib/quote-agents";

interface Service {
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface ServicesTableProps {
  services: Service[];
  onServicesChange: (services: Service[]) => void;
  grandTotal: number;
}

export default function ServicesTable({ services, onServicesChange, grandTotal }: ServicesTableProps) {
  const addService = () => {
    ServiceTableAgent.addServiceRow(services, onServicesChange);
  };

  const removeService = (index: number) => {
    ServiceTableAgent.removeServiceRow(index, services, onServicesChange);
  };

  const updateService = (index: number, field: keyof Service, value: string | number) => {
    ServiceTableAgent.updateService(index, field, value, services, onServicesChange);
  };

  const calculateRowTotal = (quantity: number, unitPrice: number) => {
    return (quantity || 0) * (unitPrice || 0);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium"></h3>
        <Button 
          type="button" 
          onClick={addService}
          className="bg-white/20 hover:bg-white/30 text-construction-orange border border-construction-orange"
          size="sm"
        >
          <Plus className="mr-1" size={16} />
          Add Service
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-700">Description</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700 w-20">Unit</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700 w-24">Quantity</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700 w-32">Unit Price ($)</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700 w-32">Total ($)</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 px-2">
                  <Input
                    placeholder="e.g., Bricklaying, Cement Supply"
                    value={service.description}
                    onChange={(e) => updateService(index, 'description', e.target.value)}
                    className="border-gray-300 focus:ring-1 focus:ring-construction-blue"
                  />
                </td>
                <td className="py-3 px-2">
                  <Input
                    placeholder="m², bags, hrs"
                    value={service.unit}
                    onChange={(e) => updateService(index, 'unit', e.target.value)}
                    className="border-gray-300 focus:ring-1 focus:ring-construction-blue"
                  />
                </td>
                <td className="py-3 px-2">
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={service.quantity || ''}
                    onChange={(e) => updateService(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="border-gray-300 focus:ring-1 focus:ring-construction-blue"
                  />
                </td>
                <td className="py-3 px-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={service.unitPrice || ''}
                    onChange={(e) => updateService(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="border-gray-300 focus:ring-1 focus:ring-construction-blue"
                  />
                </td>
                <td className="py-3 px-2">
                  <div className="font-semibold text-gray-900">
                    {calculateRowTotal(service.quantity, service.unitPrice).toFixed(2)}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td colSpan={4} className="py-4 px-2 text-right font-semibold text-lg">
                Grand Total:
              </td>
              <td className="py-4 px-2 font-bold text-xl text-construction-blue">
                ${grandTotal.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
