/**
 * EJEMPLO DE USO - Card y Button Components
 * 
 * Este archivo muestra cómo usar los componentes Card.tsx y Button.tsx
 * siguiendo los requisitos de Soft UI y tipografía Inter.
 */

import Card, { CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export function ExampleCardWithButton() {
  const handleButtonClick = () => {
    console.log('¡Botón presionado!');
  };

  return (
    <div className="min-h-screen bg-bg-light p-8">
      <div className="max-w-2xl mx-auto">
        {/* Ejemplo 1: Card simple con contenido */}
        <Card className="mb-6">
          <CardContent>
            <h1 className="text-2xl font-bold text-primary mb-4 font-sans">
              Bienvenido a Casa del Rey
            </h1>
            <p className="text-text-secondary font-sans">
              Este es un ejemplo de card con Soft UI. Observa la sombra sutil y los bordes redondeados.
            </p>
          </CardContent>
        </Card>

        {/* Ejemplo 2: Card completo con estructura */}
        <Card elevated className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-sans">Estructura Completa</h2>
          </CardHeader>
          
          <CardContent>
            <p className="text-text-secondary font-sans mb-4">
              Este card utiliza CardHeader, CardContent y CardFooter para una estructura limpia.
            </p>
            <p className="text-text-muted text-sm font-sans">
              Toda la tipografía utiliza la fuente Inter como se requiere en el blueprint.
            </p>
          </CardContent>
          
          <CardFooter>
            <Button variant="primary" size="md" onClick={handleButtonClick}>
              Acción Principal
            </Button>
            <Button variant="secondary" size="md">
              Cancelar
            </Button>
          </CardFooter>
        </Card>

        {/* Ejemplo 3: Botones con diferentes variantes */}
        <Card className="mb-6">
          <CardContent>
            <h3 className="text-lg font-bold text-primary mb-4 font-sans">
              Variantes de Botón
            </h3>
            
            <div className="grid grid-cols-2 gap-3 font-sans">
              <Button variant="primary" onClick={handleButtonClick}>
                Primary
              </Button>
              
              <Button variant="secondary" onClick={handleButtonClick}>
                Secondary
              </Button>
              
              <Button variant="accent" onClick={handleButtonClick}>
                Accent (Dorado)
              </Button>
              
              <Button variant="outline" onClick={handleButtonClick}>
                Outline
              </Button>
              
              <Button variant="ghost" onClick={handleButtonClick}>
                Ghost
              </Button>
              
              <Button variant="danger" onClick={handleButtonClick}>
                Danger
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplo 4: Tamaños de botón */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-bold text-primary mb-4 font-sans">
              Tamaños de Botón
            </h3>
            
            <div className="flex flex-wrap gap-2 font-sans">
              <Button size="xs" variant="primary">XS</Button>
              <Button size="sm" variant="primary">Small</Button>
              <Button size="md" variant="primary">Medium</Button>
              <Button size="lg" variant="primary">Large</Button>
              <Button size="xl" variant="primary">Extra Large</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ExampleCardWithButton;

/**
 * RESUMEN DE CARACTERÍSTICAS
 * 
 * ✅ Card Component:
 *   - Soft UI con sombra progresiva (shadow-soft)
 *   - Bordes redondeados (rounded-card = 12px)
 *   - Fondo blanco cálido (#FFFBF7)
 *   - Transiciones suaves (transition-soft)
 *   - Tipografía Inter obligatoria (font-sans)
 *   - Soporta propiedades elevated y hoverable
 *   - Componentes composables: CardHeader, CardContent, CardFooter
 * 
 * ✅ Button Component:
 *   - 6 variantes de estilo: primary, secondary, outline, ghost, accent, danger
 *   - 5 tamaños disponibles: xs, sm, md, lg, xl
 *   - Soft UI con shadow-soft y transiciones
 *   - Focus ring para accesibilidad
 *   - Completamente funcional con onClick handler
 *   - Tipografía Inter obligatoria (font-sans)
 *   - Soporta disabled state
 *   - Soporta custom className y props
 * 
 * ✅ Paleta Eclesial:
 *   - Primary (Caoba): #6B4423
 *   - Accent (Dorado): #D4AF37
 *   - Background (Crema): #F5E6D3
 *   - Card (Blanco Cálido): #FFFBF7
 * 
 * ✅ Soft UI Principles:
 *   - Sombras sutiles con elevation levels
 *   - Transiciones fluidas (cubic-bezier)
 *   - Border-radius armonizado
 *   - Hover states progresivos
 *   - Focus rings para accesibilidad
 */
