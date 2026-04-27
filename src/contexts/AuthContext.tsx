import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface MasterProfile {
  id: string;
  email: string;
  nome: string;
  tipo: 'master';
}

interface LojaUser {
  id: string;
  email: string;
  nome: string;
  loja_id: string;
  tipo: 'loja';
}

interface AuthContextType {
  user: User | null;
  masterProfile: MasterProfile | null;
  lojaUser: LojaUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInLoja: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(null);
  const [lojaUser, setLojaUser] = useState<LojaUser | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase
      .from('delivery_master')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !data) {
      return { error: new Error('Credenciais inválidas') };
    }

    setMasterProfile(data);
    setUser({ id: data.id, email: data.email } as User);
    return { error: null };
  };

  const signInLoja = async (email: string, password: string) => {
    const { data, error } = await supabase
      .from('delivery_usuarios')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .eq('ativo', true)
      .single();

    if (error || !data) {
      return { error: new Error('Credenciais inválidas') };
    }

    setLojaUser(data);
    setUser({ id: data.id, email: data.email } as User);
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
    setMasterProfile(null);
    setLojaUser(null);
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, masterProfile, lojaUser, loading, signIn, signInLoja, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}