'use client';

import Header from '@/app/components/header/Header';
import Footer from '@/app/components/footer/Footer';
import ReposSection from '@/app/components/repos/ReposSection';
import { useAuth } from '@/app/contexts/AuthContext';

export default function RepositoriesPage() {
  const { githubUser } = useAuth();

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Repositories
          </h1>
          {githubUser && (
            <p className="text-[#A1A1AA]">
              Manage all your GitHub repositories in one place
            </p>
          )}
        </div>

        <ReposSection />
      </main>

      <Footer />
    </div>
  );
}
