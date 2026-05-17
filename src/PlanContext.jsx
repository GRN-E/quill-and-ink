import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { DEFAULT_PLAN } from './planLimits';

const PlanContext = createContext({
  plan: DEFAULT_PLAN,
  planLoading: true,
  profile: null,
  refreshPlan: () => {},
});

export function PlanProvider({ session, children }) {
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [profile, setProfile] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!session?.user) {
      setPlan(DEFAULT_PLAN);
      setProfile(null);
      setPlanLoading(false);
      return;
    }
    setPlanLoading(true);
    const uid = session.user.id;

    const { data: existing, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) {
      setPlan(DEFAULT_PLAN);
      setProfile(null);
      setPlanLoading(false);
      return;
    }

    if (existing) {
      setProfile(existing);
      setPlan(existing.plan || DEFAULT_PLAN);
      setPlanLoading(false);
      return;
    }

    // No profile row yet — create one (defaults to Free).
    const { data: created } = await supabase
      .from('profiles')
      .insert({ user_id: uid, plan: DEFAULT_PLAN })
      .select()
      .single();

    setProfile(created || { user_id: uid, plan: DEFAULT_PLAN });
    setPlan(created?.plan || DEFAULT_PLAN);
    setPlanLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <PlanContext.Provider value={{ plan, planLoading, profile, refreshPlan: loadProfile }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}
