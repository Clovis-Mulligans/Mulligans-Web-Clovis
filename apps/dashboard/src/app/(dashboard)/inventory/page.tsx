import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@mulligans/ui';

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            Manage your listings — create, edit, pause, and organise your
            inventory. Full implementation coming in Brief 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
