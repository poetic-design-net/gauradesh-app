'use client';

interface ServicesLayoutProps {
  children: React.ReactNode;
}

export default function ServicesLayout({ children }: ServicesLayoutProps) {
  return (
    <div className="min-h-screen relative">
      {/* Background Image - consistent across all states */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-fixed bg-no-repeat"
        style={{ 
          backgroundImage: 'url("https://s3-ap-southeast-1.amazonaws.com/images.brajrasik.org/66407fbea13f2d00091c9a30.jpeg")',
          zIndex: -1
        }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      </div>
      
      {/* Content */}
      {children}
    </div>
  );
}
