import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const toggleLang = () => setLanguage(language === 'en' ? 'ar' : 'en');

  return (
    <nav className="no-print sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-bold text-lg">P</div>
          <span className="font-heading text-xl font-bold text-foreground">PathFinder<span className="text-secondary">AI</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {user && (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/dashboard">{t.nav.dashboard}</Link></Button>
              <Button variant="ghost" size="sm" asChild><Link to="/opportunities">{t.nav.opportunities}</Link></Button>
              <Button variant="ghost" size="sm" asChild><Link to="/cv">{t.nav.cv}</Link></Button>
              <Button variant="ghost" size="sm" asChild><Link to="/profile">{t.nav.profile}</Link></Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1">
            <Globe className="h-4 w-4" />{t.nav.language}
          </Button>
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-destructive">
              <LogOut className="h-4 w-4" />{t.nav.logout}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/login">{t.nav.login}</Link></Button>
              <Button size="sm" asChild><Link to="/signup">{t.nav.signup}</Link></Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {user && (
              <>
                <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}><Link to="/dashboard">{t.nav.dashboard}</Link></Button>
                <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}><Link to="/opportunities">{t.nav.opportunities}</Link></Button>
                <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}><Link to="/cv">{t.nav.cv}</Link></Button>
                <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}><Link to="/profile">{t.nav.profile}</Link></Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={toggleLang}><Globe className="h-4 w-4 me-1" />{t.nav.language}</Button>
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive"><LogOut className="h-4 w-4 me-1" />{t.nav.logout}</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}><Link to="/login">{t.nav.login}</Link></Button>
                <Button size="sm" asChild onClick={() => setMobileOpen(false)}><Link to="/signup">{t.nav.signup}</Link></Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
