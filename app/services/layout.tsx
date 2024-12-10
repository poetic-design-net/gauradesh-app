'use client';

interface ServicesLayoutProps {
  children: React.ReactNode;
}

export default function ServicesLayout({ children }: ServicesLayoutProps) {
  return (
    <div className="relative container mx-auto flex-1">
      {/* Background Image - consistent across all states */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-fixed bg-no-repeat pointer-events-none"
        style={{ 
          backgroundImage: 'url("https://firebasestorage.googleapis.com/v0/b/isckon-a55f5.firebasestorage.app/o/background.webp?alt=media&token=e21bac62-a791-4b92-8f50-ff28535b924c")',
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
