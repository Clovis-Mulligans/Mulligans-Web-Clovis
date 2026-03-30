import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@mulligans/ui';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            Revenue, orders, views, conversion rates, and period comparisons.
            Full implementation coming in Brief 5.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
