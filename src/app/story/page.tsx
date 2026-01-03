import ConstitutionSection from '@/components/ConstitutionSection';

export const metadata = {
  title: 'Our Story - HASA',
  description: 'The history and mission of the Harvard African Students Association',
};

export default function StoryPage() {
  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Story</h1>
        </div>

        <div className="prose prose-lg mx-auto text-gray-600 mb-16">
          <p className="mb-6">
            The Harvard African Students Association (HASA) was founded with the mission of creating a supportive community for African students at Harvard University. Over the years, we have grown into a vibrant organization that celebrates the rich diversity of the African continent.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
          <p className="mb-6">
            Our mission is to foster a sense of belonging for African students, to promote awareness of African issues and culture within the Harvard community, and to provide a platform for intellectual engagement with the continent.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What We Do</h2>
          <p className="mb-6">
            We organize a wide range of events throughout the academic year, including:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Cultural showcases and performances</li>
            <li>Academic panels and discussions</li>
            <li>Social gatherings and networking events</li>
            <li>Community service initiatives</li>
          </ul>
        </div>
      </div>
      
      <ConstitutionSection />
    </div>
  );
}
