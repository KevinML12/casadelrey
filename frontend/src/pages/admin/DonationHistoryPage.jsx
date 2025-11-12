// src/pages/admin/DonationHistoryPage.jsx
import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// Datos de ejemplo para la tabla
const donations = [
  { id: 1004, date: '2025-11-01', amount: 50.00, method: 'Tarjeta VISA', receipt: 'recibo-1004.pdf' },
  { id: 1003, date: '2025-10-25', amount: 100.00, method: 'PayPal', receipt: 'recibo-1003.pdf' },
  { id: 1002, date: '2025-09-01', amount: 25.00, method: 'Efectivo (Iglesia)', receipt: 'recibo-1002.pdf' },
  { id: 1001, date: '2025-08-15', amount: 75.00, method: 'Tarjeta Mastercard', receipt: 'recibo-1001.pdf' },
];

const DonationHistoryPage = () => {
  const handleDownload = (receiptFile) => {
    console.log(`Descargando recibo: ${receiptFile}`);
    // Lógica para iniciar la descarga del archivo (API GO Endpoint)
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Historial de Donaciones
      </h1>

      <Card className="overflow-x-auto"> {/* Asegura el scroll horizontal en móvil */}
        <table className="min-w-full divide-y divide-gray-200">
          {/* Encabezado (thead) - bg-gray-50 */}
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recibo
              </th>
            </tr>
          </thead>
          {/* Cuerpo (tbody) */}
          <tbody className="bg-white divide-y divide-gray-200">
            {donations.map((donation, index) => (
              <tr key={donation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {donation.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${donation.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {donation.method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="secondary"
                    className="py-1 px-3 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                    onClick={() => handleDownload(donation.receipt)}
                  >
                    Descargar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      
      <div className="mt-4 text-sm text-gray-600">
          * Para donaciones en efectivo, el recibo físico se provee en la oficina.
      </div>
    </div>
  );
};

export default DonationHistoryPage;
