import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Webhook } from "lucide-react";

interface WebhookStatusProps {
  lastQuoteData?: any;
  webhookResponse?: any;
  webhookError?: string;
}

export default function WebhookStatus({ lastQuoteData, webhookResponse, webhookError }: WebhookStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    if (webhookResponse && !webhookError) {
      return <CheckCircle className="text-green-500 w-5 h-5" />;
    } else if (webhookError) {
      return <XCircle className="text-red-500 w-5 h-5" />;
    } else {
      return <AlertTriangle className="text-yellow-500 w-5 h-5" />;
    }
  };

  const getStatusBadge = () => {
    if (webhookResponse && !webhookError) {
      return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
    } else if (webhookError) {
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Waiting</Badge>;
    }
  };

  const getStatusMessage = () => {
    if (webhookResponse && !webhookError) {
      return "n8n workflow is receiving data successfully";
    } else if (webhookError) {
      return "n8n workflow needs to be activated";
    } else {
      return "Ready to send to n8n workflow";
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader 
        className="cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Webhook className="text-construction-blue w-5 h-5" />
            <span>n8n Workflow Status</span>
            {getStatusIcon()}
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <RefreshCw 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            {getStatusMessage()}
          </div>

          {webhookError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Webhook Error:</h4>
              <p className="text-red-700 text-sm mb-3">{webhookError}</p>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h5 className="font-medium text-blue-800 mb-1">To fix this:</h5>
                <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                  <li>Go to your n8n workflow at ngonidzashezimbwa.app.n8n.cloud</li>
                  <li>Click the "Execute workflow" button to activate the webhook</li>
                  <li>Make sure your workflow is saved and published</li>
                  <li>Try sending another quote</li>
                </ol>
              </div>
            </div>
          )}

          {lastQuoteData && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Last Sent Data:</h4>
              <div className="text-sm space-y-2">
                <div><span className="font-medium">Quote:</span> {lastQuoteData.quote_number}</div>
                <div><span className="font-medium">Client:</span> {lastQuoteData.client_name}</div>
                <div><span className="font-medium">Email:</span> {lastQuoteData.client_email}</div>
                <div><span className="font-medium">Services:</span> {lastQuoteData.services?.length || 0} items</div>
                <div><span className="font-medium">Total:</span> ${lastQuoteData.services?.reduce((sum: number, service: any) => sum + (service.quantity * service.unit_price), 0).toFixed(2) || '0.00'}</div>
              </div>
              
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                  View JSON Payload
                </summary>
                <pre className="mt-2 text-xs bg-white border rounded p-2 overflow-x-auto">
                  {JSON.stringify(lastQuoteData, null, 2)}
                </pre>
              </details>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">What n8n Will Receive:</h4>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Complete client information (name, email, phone, address)</li>
              <li>• Unique quote number (LZQ-001, LZQ-002, etc.)</li>
              <li>• Detailed services list with quantities and pricing</li>
              <li>• Quote validity period and terms</li>
              <li>• All data formatted and ready for processing</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">n8n Workflow Capabilities:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Store quote data in Supabase database</li>
              <li>• Generate professional PDF quotes</li>
              <li>• Send email notifications to clients</li>
              <li>• Log all activity to Google Sheets</li>
              <li>• Track quote status and responses</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}