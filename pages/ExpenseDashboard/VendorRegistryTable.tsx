import React from 'react';
import type { ExpenseVendor } from '../../services/expenseLedgerService';

function tierClass(tier: string): string {
  if (tier === 'automated') return 'ex-badge ex-badge--auto';
  if (tier === 'semi_automated') return 'ex-badge ex-badge--semi';
  return 'ex-badge ex-badge--manual';
}

function tierLabel(tier: string): string {
  if (tier === 'automated') return 'Automated';
  if (tier === 'semi_automated') return 'Semi';
  return 'Manual';
}

interface Props {
  vendors: ExpenseVendor[];
}

const VendorRegistryTable: React.FC<Props> = ({ vendors }) => {
  return (
    <table className="ex-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Category</th>
          <th>Status</th>
          <th>Tracking</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {vendors.map((vendor) => (
          <tr key={vendor.id}>
            <td>
              <strong>{vendor.vendor_name}</strong>
            </td>
            <td>{vendor.category.replace('_', ' ')}</td>
            <td>{vendor.status}</td>
            <td>
              <span className={tierClass(vendor.automation_tier)}>
                {tierLabel(vendor.automation_tier)}
              </span>
            </td>
            <td>{vendor.plan_notes || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default VendorRegistryTable;
