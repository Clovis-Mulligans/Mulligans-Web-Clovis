import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@mulligans/ui';

export default function OffersPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            Review, accept, decline, and counter offers from buyers. Set
            auto-decline thresholds. Full implementation coming in Brief 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
