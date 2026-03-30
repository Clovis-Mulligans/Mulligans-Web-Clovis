import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@mulligans/ui';

export default function PayoutsPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            View your available and pending balance, payout history, and
            configure withdrawal schedules. Full implementation coming in
            Brief 5.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
