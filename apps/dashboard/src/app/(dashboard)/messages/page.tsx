import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@mulligans/ui';

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            Respond to buyer enquiries, threaded by listing. Quick reply
            templates available. Full implementation coming in Brief 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
