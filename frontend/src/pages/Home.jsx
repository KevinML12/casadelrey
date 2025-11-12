// frontend/src/pages/Home.jsx
import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroBanner from '../components/Home/HeroBanner';
import HistorySection from '../components/Home/HistorySection';
import FaithDeclaration from '../components/Home/FaithDeclaration';
import EventosNoticias from '../components/Home/EventosNoticias';
import Galeria from '../components/Home/Galeria';
import Multimedia from '../components/Home/Multimedia';
import PrayerForm from '../components/Forms/PrayerForm';
import DonationForm from '../components/Forms/DonationForm';

const Home = () => {
  return (
    <div className="w-full overflow-x-hidden">
      <Header />
      <HeroBanner />
      <HistorySection />
      <FaithDeclaration />
      <EventosNoticias />
      <Galeria />
      <Multimedia />
      
      {/* SECCIÓN: Formulario de Peticiones */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PrayerForm />
        </div>
      </section>

      {/* SECCIÓN: Formulario de Donaciones */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DonationForm />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
