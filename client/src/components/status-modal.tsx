import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Info } from "lucide-react";

interface StatusModalProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
  onClose: () => void;
}

export default function StatusModal({ isOpen, type, message, details, onClose }: StatusModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500 w-16 h-16" />;
      case 'error':
        return <XCircle className="text-red-500 w-16 h-16" />;
      case 'info':
        return <Info className="text-blue-500 w-16 h-16" />;
      default:
        return <Info className="text-blue-500 w-16 h-16" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby="status-description">
        <DialogHeader>
          <DialogTitle className="sr-only">Status</DialogTitle>
        </DialogHeader>
        <div className="text-center p-6">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">{message}</h3>
          {details && (
            <div 
              className="text-gray-600 mb-6"
              dangerouslySetInnerHTML={{ __html: details }}
            />
          )}
          <Button onClick={onClose} className="bg-gray-100 text-gray-700 hover:bg-gray-200">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
