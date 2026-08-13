import fs from 'fs/promises';
import path from 'path';

// Mapeo de archivos de origen a los destinos en public/images
const seedPlan = [
  // Inicio -> Una foto general y potente
  {
    src: '../../fotos/WILD YOUTH FOTOGRAFRÍAS /CONFERENCIA/8R1A7291.jpg', // Asumiendo que hay fotos aquí, usaremos un fallback si no existe
    fallback: '../../fotos/DOMINGOS 2026/ALABANZA/DSC07905.jpg',
    dest: '../public/images/public_bg_home.jpg'
  },
  // Células -> Foto de grupo o comunidad
  {
    src: '../../fotos/DOMINGOS 2026/LIDER de JOVENES/IMG_7934.jpg',
    fallback: '../../fotos/DOMINGOS 2026/LÍDERES/DSC08048.jpg',
    dest: '../public/images/public_bg_celulas.jpg'
  },
  // Eventos -> Foto masiva o de campamento
  {
    src: '../../fotos/WILD YOUTH FOTOGRAFRÍAS /MASIVA/masiva.jpg',
    fallback: '../../fotos/DOMINGOS 2026/ALABANZA/DSC07883.jpg',
    dest: '../public/images/public_bg_eventos.jpg'
  },
  // Voluntariado -> Foto de servidores
  {
    src: '../../fotos/DOMINGOS 2026/SERVIDORES/DSC08030.jpg',
    fallback: '../../fotos/DOMINGOS 2026/SERVIDORES/DSC07564.JPG',
    dest: '../public/images/public_bg_voluntariado.jpg'
  },
  // Dar -> Algo neutral o de ofrenda (alabanza en su defecto)
  {
    src: '../../fotos/DOMINGOS 2026/ALABANZA/DSC07391.jpg',
    fallback: '../../fotos/DOMINGOS 2026/ALABANZA/DSC07444.jpg',
    dest: '../public/images/public_bg_donaciones.jpg'
  },
  // Nosotros -> Foto pastoral o logo
  {
    src: '../../fotos/DOMINGOS 2026/PASTORES/pastores.jpg',
    fallback: '../../fotos/DOMINGOS 2026/ALABANZA/DSC07388.jpg',
    dest: '../public/images/public_bg_nosotros.jpg'
  }
];

async function seed() {
  console.log('🌱 Iniciando la siembra de fondos públicos...');
  
  for (const item of seedPlan) {
    const destPath = path.resolve(import.meta.dirname, item.dest);
    const srcPath = path.resolve(import.meta.dirname, item.src);
    const fallbackPath = path.resolve(import.meta.dirname, item.fallback);
    
    try {
      try {
        await fs.access(srcPath);
        await fs.copyFile(srcPath, destPath);
        console.log(`✅ Foto sembrada: ${path.basename(destPath)} (desde src original)`);
      } catch (err) {
        // Fallback
        await fs.copyFile(fallbackPath, destPath);
        console.log(`✅ Foto sembrada: ${path.basename(destPath)} (desde fallback)`);
      }
    } catch (finalErr) {
      console.log(`❌ Error al sembrar ${path.basename(destPath)}: No se encontró el archivo origen ni el fallback.`);
    }
  }
  
  console.log('✨ Siembra completada. Si quieres sobreescribir estos fondos, hazlo desde el panel /admin/settings. El backend ya está configurado para servirlos en /images/... por defecto.');
}

seed();
