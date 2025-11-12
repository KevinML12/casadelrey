import { useState } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const DonationPage = () => {
  const [amount, setAmount] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handleCardSubmit = (e) => {
    e.preventDefault();
    console.log('Card donation:', { amount, cardName, expiryDate, cvv });
    // Lógica de donación con tarjeta
  };

  const handlePayPalSubmit = (e) => {
    e.preventDefault();
    console.log('PayPal donation:', { amount });
    // Lógica de donación con PayPal
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Columna Izquierda - Imagen */}
        <div className="w-full h-full bg-gray-300 rounded-lg shadow-lg min-h-[400px]"></div>

        {/* Columna Derecha - Formulario */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Realiza tu Donación
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Tu generosidad nos ayuda a continuar con nuestra misión de servir a la comunidad
            y compartir el amor de Cristo.
          </p>

          <form onSubmit={handleCardSubmit} className="space-y-6">
            <Input
              id="amount"
              label="Monto a donar"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              required
            />

            <Input
              id="cardName"
              label="Nombre en la tarjeta"
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Juan Pérez"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="expiryDate"
                label="Fecha de expiración (MM/AA)"
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="12/25"
                required
              />

              <Input
                id="cvv"
                label="CVV"
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                required
              />
            </div>

            <Button type="submit" variant="primary">
              Donar con Tarjeta
            </Button>
          </form>

          <div className="text-center text-gray-500 my-4">o</div>

          <form onSubmit={handlePayPalSubmit}>
            <Button type="submit" variant="secondary">
              Donar con PayPal
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DonationPage;
