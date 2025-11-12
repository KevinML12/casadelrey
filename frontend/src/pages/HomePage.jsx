import HeroSection from '../components/Home/HeroSection';
import HistorySection from '../components/Home/HistorySection';
import NewsSection from '../components/Home/NewsSection';
import MultimediaSection from '../components/Home/MultimediaSection';
import NewMembersSection from '../components/Home/NewMembersSection';
import ContactSection from '../components/Home/ContactSection';

const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <HistorySection />
      <NewsSection />
      <MultimediaSection />
      <NewMembersSection />
      <ContactSection />
    </div>
  );
};

export default HomePage;
