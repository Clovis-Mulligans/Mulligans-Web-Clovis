import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@mulligans/ui';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            Track and fulfil your orders, print shipping labels, and manage
            returns. Full implementation coming in Brief 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
