import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Workout, listWorkouts } from '@/db/workouts';

export function useWorkouts() {
  const db = useSQLiteContext();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listWorkouts(db).then((rows) => {
      setWorkouts(rows);
      setLoaded(true);
    });
  }, [db]);

  return { workouts, loaded };
}
